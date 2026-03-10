import os
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler

from route_junction_mapper import get_route_junctions


BASE_DIR = Path(__file__).resolve().parent
DATA_CSV_PATH = BASE_DIR / "datasets" / "mumbai_traffic_lstm_ready.csv"
MODEL_PATH = BASE_DIR / "lstm_traffic_model.keras"

# These should match the training script
SEQ_LEN = 16
TARGET = "congestion_index"


class PredictRequest(BaseModel):
    origin: str
    destination: str
    departureTime: str  # HH:MM
    mode: Optional[str] = None
    arrivalBuffer: Optional[int] = 10


class PredictResponse(BaseModel):
    confidence: int
    trafficLevel: int
    eta: int
    departureAdvice: str
    optimalDeparture: str
    parkingEstimate: int
    bestRoute: str
    congestionLabel: str
    congestionColor: str


app = FastAPI(title="UrbanAI Traffic Inference API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


_model = None
_scaler_X = None
_scaler_y = None
_features = None
_df_model = None


def _load_assets():
    """
    Lazy-load model and data needed for simple demo inference.
    For production you may want to load real-time features instead.
    """
    global _model, _scaler_X, _scaler_y, _features, _df_model

    if _model is not None:
        return

    if not MODEL_PATH.exists():
        raise RuntimeError(
            f"Model file not found at '{MODEL_PATH}'. "
            "Run train_lstm_traffic.py once to generate lstm_traffic_model.keras."
        )

    if not DATA_CSV_PATH.exists():
        raise RuntimeError(
            f"Dataset CSV not found at '{DATA_CSV_PATH}'. "
            "Ensure the preprocessed dataset is present on the server."
        )

    # Load model
    _model = load_model(MODEL_PATH)

    # Minimal, aligned re-implementation of the feature selection and scaling
    df = pd.read_csv(DATA_CSV_PATH, parse_dates=["datetime"])
    df = df.sort_values("datetime").reset_index(drop=True)

    if "junction_name" in df.columns:
        df["junction_id"] = pd.factorize(df["junction_name"])[0]

    FEATURES = [
        "hour_sin",
        "hour_cos",
        "dow_sin",
        "dow_cos",
        "month_sin",
        "month_cos",
        "is_weekend",
        "is_holiday",
        "is_peak_hour",
        "is_morning_peak",
        "is_evening_peak",
        "school_in_session",
        "weather_code",
        "rainfall_mm",
        "visibility_km",
        "CarCount",
        "BikeCount",
        "BusCount",
        "TruckCount",
        "Total",
        "speed_lag_1",
        "speed_lag_2",
        "speed_lag_4",
        "speed_lag_8",
        "congestion_lag_1",
        "congestion_lag_2",
        "congestion_lag_4",
        "congestion_lag_8",
        "total_lag_1",
        "total_lag_2",
        "total_lag_4",
        "total_lag_8",
        "speed_roll_mean_4",
        "speed_roll_mean_12",
        "total_roll_mean_4",
        "total_roll_mean_12",
        "congestion_roll_std_4",
        "congestion_roll_std_12",
        "speed_same_slot_weekly_avg",
    ]

    if "junction_id" in df.columns:
        FEATURES.append("junction_id")

    FEATURES = [f for f in FEATURES if f in df.columns]
    _features = FEATURES

    df_model = df[FEATURES + [TARGET]].dropna().reset_index(drop=True)
    _df_model = df_model

    # Temporal split as in training; we fit scalers on train portion
    n = len(df_model)
    train_end = int(n * 0.70)
    val_end = int(n * (0.70 + 0.15))

    train_df = df_model.iloc[:train_end]
    val_df = df_model.iloc[train_end:val_end]
    test_df = df_model.iloc[val_end:]

    scaler_X = MinMaxScaler()
    scaler_y = MinMaxScaler()

    X_train_raw = train_df[FEATURES].values
    y_train_raw = train_df[[TARGET]].values

    X_val_raw = val_df[FEATURES].values
    y_val_raw = val_df[[TARGET]].values

    X_test_raw = test_df[FEATURES].values
    y_test_raw = test_df[[TARGET]].values

    scaler_X.fit(X_train_raw)
    scaler_y.fit(y_train_raw)

    _scaler_X = scaler_X
    _scaler_y = scaler_y


def _make_sequences(X: np.ndarray, seq_len: int):
    Xs = []
    for i in range(len(X) - seq_len, len(X)):
        window = X[i - seq_len : i]
        Xs.append(window)
    return np.array(Xs)


def _predict_for_junction_id(junction_id: Optional[int] = None) -> float:
    """
    Demo-style prediction: take the most recent SEQ_LEN rows for a
    given junction_id (or all junctions) and predict the next step
    congestion_index.
    """
    _load_assets()

    df = _df_model.copy()
    if junction_id is not None and "junction_id" in df.columns:
        df = df[df["junction_id"] == junction_id].reset_index(drop=True)

    if len(df) <= SEQ_LEN:
        raise RuntimeError("Not enough historical rows for the selected junction.")

    X_raw = df[_features].values
    X_scaled = _scaler_X.transform(X_raw)

    X_seq = _make_sequences(X_scaled, SEQ_LEN)
    # Use only the last window
    input_seq = X_seq[-1].reshape(1, SEQ_LEN, len(_features))

    pred_scaled = _model.predict(input_seq, verbose=0)
    pred = _scaler_y.inverse_transform(pred_scaled)[0][0]
    return float(pred)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        google_api_key = os.getenv("GOOGLE_ROUTES_API_KEY") or None

        # Map route to dataset junctions
        try:
            junctions = get_route_junctions(
                source=req.origin,
                destination=req.destination,
                google_api_key=google_api_key,
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        junction_id = None
        junction_label = ""
        if junctions:
            first = junctions[0]
            junction_id = first.get("junction_id")
            junction_label = first.get("junction_name", "")

        # Run LSTM prediction (demo based on historical CSV)
        try:
            congestion_value = _predict_for_junction_id(junction_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Inference error: {e}")

        # Map congestion to 0–100 trafficLevel
        traffic_level = max(0, min(100, int(round(congestion_value * 100))))

        if traffic_level > 80:
            congestion_label = "HIGH"
            congestion_color = "#ff5c2b"
        elif traffic_level > 55:
            congestion_label = "MODERATE"
            congestion_color = "#f5c842"
        else:
            congestion_label = "LOW"
            congestion_color = "#00ffe7"

        # Simple ETA heuristic (in minutes)
        base_eta = 25
        eta = base_eta + int((traffic_level / 100) * 40)

        # Confidence: we treat mid-range congestion as slightly lower confidence
        confidence = 90
        if congestion_label == "HIGH":
            confidence = 88
        elif congestion_label == "MODERATE":
            confidence = 84

        # Use departure time directly and suggest adjustment based on traffic
        departure_time = req.departureTime or "08:00"
        try:
            hour_str, minute_str = departure_time.split(":")
            hour = int(hour_str)
        except Exception:
            hour = 8
            departure_time = "08:00"

        if congestion_label == "HIGH":
            departure_advice = (
                f"High congestion expected near {junction_label or 'your route'}. "
                "We recommend departing 45–60 minutes earlier than planned."
            )
            optimal_hour = max(0, hour - 1)
            optimal_departure = f"{optimal_hour:02d}:{minute_str}"
        elif congestion_label == "MODERATE":
            departure_advice = (
                f"Moderate congestion predicted. Consider leaving 20–30 minutes earlier "
                "to stay within your buffer."
            )
            optimal_hour = max(0, hour - 0)
            optimal_departure = f"{optimal_hour:02d}:{minute_str}"
        else:
            departure_advice = "Traffic conditions look favorable. You can proceed as planned."
            optimal_departure = departure_time

        # Rough parking estimate in minutes to find a spot
        if congestion_label == "HIGH":
            parking_estimate = 35
        elif congestion_label == "MODERATE":
            parking_estimate = 20
        else:
            parking_estimate = 10

        best_route = f"{req.origin} → {req.destination}"
        if junction_label:
            best_route += f" via {junction_label}"

        return PredictResponse(
            confidence=confidence,
            trafficLevel=traffic_level,
            eta=eta,
            departureAdvice=departure_advice,
            optimalDeparture=optimal_departure,
            parkingEstimate=parking_estimate,
            bestRoute=best_route,
            congestionLabel=congestion_label,
            congestionColor=congestion_color,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )

