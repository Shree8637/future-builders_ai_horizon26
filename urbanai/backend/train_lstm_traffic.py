"""
LSTM Traffic Forecasting — Mumbai Urban Navigation Project
==========================================================
Dataset : mumbai_traffic_lstm_ready.csv
Target  : congestion_index  (primary)
           speed_kmph        (secondary — swap TARGET to use)
Task    : Predict the NEXT time step (15 min ahead) given
          a sliding window of past observations.

Run:
    pip install pandas numpy scikit-learn tensorflow matplotlib --quiet
    python train_lstm_traffic.py
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import warnings
warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────
# 0.  CONFIG  (change these as needed)
# ─────────────────────────────────────────────
CSV_PATH    = r"D:\urbanai-project\urbanai\backend\datasets\mumbai_traffic_lstm_ready.csv"   # path to your CSV
TARGET      = "congestion_index"                # what to predict
JUNCTION    = None   # None = use all junctions; or e.g. "Andheri Junction (E)"
SEQ_LEN     = 16      # how many past steps to look at (16 × 15 min = 4 hours)
BATCH_SIZE  = 64
EPOCHS      = 50
LSTM_UNITS  = 64     # neurons in each LSTM layer
DROPOUT     = 0.2
TRAIN_RATIO = 0.70
VAL_RATIO   = 0.15
# remainder = TEST

# ─────────────────────────────────────────────
# 1.  LOAD & FILTER
# ─────────────────────────────────────────────
print("=" * 55)
print("STEP 1 — Loading data")
df = pd.read_csv(CSV_PATH, parse_dates=["datetime"])
df = df.sort_values("datetime").reset_index(drop=True)

if JUNCTION:
    df = df[df["junction_name"] == JUNCTION].reset_index(drop=True)
    print(f"  Filtered to junction: {JUNCTION}")
else:
    # Encode junction as an integer so LSTM can use it
    df["junction_id"] = pd.factorize(df["junction_name"])[0]
    print(f"  Using all {df['junction_name'].nunique()} junctions")

print(f"  Rows: {len(df):,}   |   Date range: {df['datetime'].min().date()} → {df['datetime'].max().date()}")

# ─────────────────────────────────────────────
# 2.  FEATURE SELECTION
# ─────────────────────────────────────────────
print("\nSTEP 2 — Selecting features")

FEATURES = [
    # --- temporal (already sine/cosine encoded) ---
    "hour_sin", "hour_cos",
    "dow_sin",  "dow_cos",
    "month_sin", "month_cos",

    # --- calendar flags ---
    "is_weekend", "is_holiday", "is_peak_hour",
    "is_morning_peak", "is_evening_peak", "school_in_session",

    # --- weather ---
    "weather_code", "rainfall_mm", "visibility_km",

    # --- vehicle counts ---
    "CarCount", "BikeCount", "BusCount", "TruckCount", "Total",

    # --- lag features (already in CSV) ---
    "speed_lag_1", "speed_lag_2", "speed_lag_4", "speed_lag_8",
    "congestion_lag_1", "congestion_lag_2", "congestion_lag_4", "congestion_lag_8",
    "total_lag_1", "total_lag_2", "total_lag_4", "total_lag_8",

    # --- rolling stats ---
    "speed_roll_mean_4", "speed_roll_mean_12",
    "total_roll_mean_4", "total_roll_mean_12",
    "congestion_roll_std_4", "congestion_roll_std_12",

    # --- weekly average (same slot last week) ---
    "speed_same_slot_weekly_avg",
]

# Add junction id if using all junctions
if "junction_id" in df.columns:
    FEATURES.append("junction_id")

# Keep only columns that exist
FEATURES = [f for f in FEATURES if f in df.columns]

# Drop rows with NaN in selected features or target
df_model = df[FEATURES + [TARGET]].dropna().reset_index(drop=True)
print(f"  Features used : {len(FEATURES)}")
print(f"  Rows after dropna: {len(df_model):,}")

# ─────────────────────────────────────────────
# 3.  TEMPORAL TRAIN / VAL / TEST SPLIT
#     (never shuffle time-series data!)
# ─────────────────────────────────────────────
print("\nSTEP 3 — Splitting data (temporal, no shuffle)")
n = len(df_model)
train_end = int(n * TRAIN_RATIO)
val_end   = int(n * (TRAIN_RATIO + VAL_RATIO))

train_df = df_model.iloc[:train_end]
val_df   = df_model.iloc[train_end:val_end]
test_df  = df_model.iloc[val_end:]

print(f"  Train : {len(train_df):,} rows")
print(f"  Val   : {len(val_df):,} rows")
print(f"  Test  : {len(test_df):,} rows")

# ─────────────────────────────────────────────
# 4.  SCALE FEATURES  (fit ONLY on train set)
# ─────────────────────────────────────────────
print("\nSTEP 4 — Scaling features")
scaler_X = MinMaxScaler()
scaler_y = MinMaxScaler()

X_train_raw = train_df[FEATURES].values
y_train_raw = train_df[[TARGET]].values

X_val_raw  = val_df[FEATURES].values
y_val_raw  = val_df[[TARGET]].values

X_test_raw = test_df[FEATURES].values
y_test_raw = test_df[[TARGET]].values

X_train_scaled = scaler_X.fit_transform(X_train_raw)
y_train_scaled = scaler_y.fit_transform(y_train_raw)

X_val_scaled  = scaler_X.transform(X_val_raw)
y_val_scaled  = scaler_y.transform(y_val_raw)

X_test_scaled = scaler_X.transform(X_test_raw)
y_test_scaled = scaler_y.transform(y_test_raw)

# ─────────────────────────────────────────────
# 5.  CREATE SEQUENCES
#     shape: (samples, SEQ_LEN, features)
# ─────────────────────────────────────────────
def make_sequences(X, y, seq_len):
    """Sliding-window sequence builder."""
    Xs, ys = [], []
    for i in range(len(X) - seq_len):
        Xs.append(X[i : i + seq_len])    # past seq_len steps
        ys.append(y[i + seq_len])         # next step target
    return np.array(Xs), np.array(ys)

print(f"\nSTEP 5 — Building sequences (window = {SEQ_LEN} × 15 min = {SEQ_LEN*15} min)")

X_tr, y_tr = make_sequences(X_train_scaled, y_train_scaled, SEQ_LEN)
X_vl, y_vl = make_sequences(X_val_scaled,  y_val_scaled,   SEQ_LEN)
X_te, y_te = make_sequences(X_test_scaled, y_test_scaled,  SEQ_LEN)

print(f"  X_train : {X_tr.shape}   y_train : {y_tr.shape}")
print(f"  X_val   : {X_vl.shape}   y_val   : {y_vl.shape}")
print(f"  X_test  : {X_te.shape}   y_test  : {y_te.shape}")

# ─────────────────────────────────────────────
# 6.  BUILD LSTM MODEL
# ─────────────────────────────────────────────
print("\nSTEP 6 — Building LSTM model")

model = Sequential([
    # Layer 1: LSTM — return sequences so next LSTM layer gets full output
    LSTM(LSTM_UNITS, return_sequences=True,
         input_shape=(SEQ_LEN, len(FEATURES))),
    BatchNormalization(),
    Dropout(DROPOUT),

    # Layer 2: LSTM — only return last output
    LSTM(LSTM_UNITS // 2, return_sequences=False),
    BatchNormalization(),
    Dropout(DROPOUT),

    # Output
    Dense(16, activation="relu"),
    Dense(1)   # single value: next-step congestion_index
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss="mse",
    metrics=["mae"]
)

model.summary()

# ─────────────────────────────────────────────
# 7.  TRAIN
# ─────────────────────────────────────────────
print("\nSTEP 7 — Training...")

callbacks = [
    # Stop if val_loss doesn't improve for 7 epochs
    EarlyStopping(monitor="val_loss", patience=7, restore_best_weights=True, verbose=1),
    # Reduce LR if val_loss plateaus
    ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=4, verbose=1, min_lr=1e-6),
]

history = model.fit(
    X_tr, y_tr,
    validation_data=(X_vl, y_vl),
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
    callbacks=callbacks,
    verbose=1
)

# ─────────────────────────────────────────────
# 8.  EVALUATE ON TEST SET
# ─────────────────────────────────────────────
print("\nSTEP 8 — Evaluating on test set")

y_pred_scaled = model.predict(X_te)
y_pred = scaler_y.inverse_transform(y_pred_scaled)
y_true = scaler_y.inverse_transform(y_te)

mae  = mean_absolute_error(y_true, y_pred)
rmse = np.sqrt(mean_squared_error(y_true, y_pred))
# Mean Absolute Percentage Error
mape = np.mean(np.abs((y_true - y_pred) / (y_true + 1e-8))) * 100

print(f"\n  ✅ Test MAE  : {mae:.4f}")
print(f"  ✅ Test RMSE : {rmse:.4f}")
print(f"  ✅ Test MAPE : {mape:.2f}%")

# ─────────────────────────────────────────────
# 9.  SAVE MODEL
# ─────────────────────────────────────────────
model.save("lstm_traffic_model.keras")
print("\n  Model saved → lstm_traffic_model.keras")

# ─────────────────────────────────────────────
# 10. PLOT RESULTS
# ─────────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# (a) Training curves
axes[0].plot(history.history["loss"],     label="Train Loss")
axes[0].plot(history.history["val_loss"], label="Val Loss")
axes[0].set_title("Loss (MSE) Over Epochs")
axes[0].set_xlabel("Epoch")
axes[0].set_ylabel("MSE")
axes[0].legend()
axes[0].grid(True, alpha=0.3)

# (b) Predicted vs Actual (first 200 test points)
n_show = 200
axes[1].plot(y_true[:n_show],  label="Actual",    color="steelblue")
axes[1].plot(y_pred[:n_show],  label="Predicted", color="coral", linestyle="--")
axes[1].set_title(f"Predicted vs Actual — {TARGET} (first {n_show} test steps)")
axes[1].set_xlabel("Time Step (15 min each)")
axes[1].set_ylabel(TARGET)
axes[1].legend()
axes[1].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig("lstm_results.png", dpi=150)
plt.show()
print("  Plot saved → lstm_results.png")

# ─────────────────────────────────────────────
# 11. INFERENCE EXAMPLE
#     How to use the model on new data
# ─────────────────────────────────────────────
print("\nSTEP 9 — Inference example")
print("  To predict congestion for the NEXT 15 minutes:")
print("""
  # 1. Take the last SEQ_LEN rows of new real-time data
  new_data = df_new[FEATURES].values[-SEQ_LEN:]
  new_data_scaled = scaler_X.transform(new_data)
  input_seq = new_data_scaled.reshape(1, SEQ_LEN, len(FEATURES))

  # 2. Predict
  pred_scaled = model.predict(input_seq)
  pred = scaler_y.inverse_transform(pred_scaled)
  print(f"Predicted congestion_index: {pred[0][0]:.3f}")
""")

print("=" * 55)
print("DONE ✅")
