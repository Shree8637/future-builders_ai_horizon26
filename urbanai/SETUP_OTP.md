# UrbanAI — OTP Setup Guide

## How OTP Works

UrbanAI uses a **custom OTP system** (not Firebase phone auth):
- A 6-digit OTP is generated in the browser
- Sent as SMS via **Fast2SMS** (free Indian SMS API)
- Verified locally — no backend needed
- Session stored securely in localStorage

---

## Step 1: Get your FREE Fast2SMS API key

1. Go to **https://www.fast2sms.com**
2. Sign up (free) — takes 2 minutes
3. Verify your mobile number
4. Go to **Dev API** in the dashboard
5. Copy your **API Key**

**Free tier:** 50 SMS/day to ANY Indian mobile number. No DLT registration needed for dev/testing.

---

## Step 2: Add your API key

Open `src/pages/Auth/Auth.jsx` and find line 14:

```js
const FAST2SMS_API_KEY = 'YOUR_FAST2SMS_API_KEY'
```

Replace with your actual key:

```js
const FAST2SMS_API_KEY = 'abc123yourkeyhere'
```

---

## Step 3 (Optional): CORS fix

Fast2SMS API requires a server-side call in production (CORS policy blocks direct browser requests on some hosts). For **local dev** (`localhost:5173`), it works directly.

For production, create a simple Netlify/Vercel function:

```js
// netlify/functions/send-otp.js
export async function handler(event) {
  const { phone, otp } = JSON.parse(event.body)
  const res = await fetch(
    `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_KEY}&route=q&message=Your UrbanAI OTP is ${otp}. Valid 10 mins.&flash=0&numbers=${phone}`,
    { headers: { 'cache-control': 'no-cache' } }
  )
  const data = await res.json()
  return { statusCode: 200, body: JSON.stringify(data) }
}
```

---

## Dev Mode (No API key)

Without an API key, the app runs in **dev mode**:
- OTP is shown in a browser alert + printed to console
- Everything else works the same
- Perfect for testing the full flow locally

---

## Auth Flow

```
Open website → /auth (sign-in page)
    ↓
Choose: Google Sign-In  OR  Phone Number
    ↓
Phone: Enter number → OTP sent via SMS → Enter OTP → ✅
Google: Click button → popup → ✅
    ↓
Profile page: Enter First Name, Last Name, DOB
    ↓
Home page → greeting "Good Morning, {FirstName} 👋"
          → First letter initial in top-right circle (navbar)
```
