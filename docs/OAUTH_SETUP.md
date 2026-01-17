# OAuth Setup Guide (Google & Apple Sign-In)

> **REMINDER**: Complete this setup when deploying the store for a client.

## Social Authentication Credentials Required

This application supports Google and Apple Sign-In. Before deploying to production, you or your client need to configure these credentials.

---

## 1. Google Sign-In Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Select **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://your-store-domain.com` (production)
7. Copy the **Client ID**

**Add to frontend environment:**
```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## 2. Apple Sign-In Setup

1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create a new **Services ID** for your web app
4. Enable **Sign in with Apple**
5. Configure the domain and redirect URL
6. Copy the **Service ID**

**Add to frontend environment:**
```env
VITE_APPLE_CLIENT_ID=com.yourclient.webapp
```

---

## Quick Checklist

- [ ] Create Google OAuth credentials
- [ ] Add `VITE_GOOGLE_CLIENT_ID` to frontend `.env`
- [ ] Create Apple Services ID
- [ ] Add `VITE_APPLE_CLIENT_ID` to frontend `.env`
- [ ] Test sign-in flow on staging
- [ ] Verify user creation in database

---

## Current Status

The social login buttons are already implemented and will show on:
- `/login` page
- `/register` page

Without credentials configured, clicking the buttons shows a helpful message asking users to contact support.
