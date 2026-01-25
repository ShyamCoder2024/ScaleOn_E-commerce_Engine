# Changelog

All notable changes to the ScaleOn Commerce Engine will be documented in this file.

## [2026-01-25] - Scalability & UI Fixes

### Critical Fixes
- **Fixed "Zero Products" / App Crash Issue:**
    - **Root Cause:** Global Rate Limiter in `server.js` was too aggressive (100 reqs/15min), causing `429 Too Many Requests` errors for normal users.
    - **Fix:** Increased global rate limit to **2000 requests per 15 minutes**.
    - **UI:** Added error boundary and "Retry" button to `Home.jsx` to prevent silent failures.

- **Fixed Mobile Profile Menu:**
    - Changed from "Bottom Sheet" to "Top-Right Dropdown" for better UX on mobile devices.
    - Added backdrop blur and scale animation.

- **Fixed Product Detail Image:**
    - Changed mobile aspect ratio from 4:3 to 1:1 (Square) for better product visibility.
    - Enabled "Click to Zoom" lightbox functionality.

### Features & Improvements
- **Multi-Device Login Support:**
    - Refactored `User` model and `authService` to use an array of `refreshTokens`.
    - **Benefit:** Admins and customers can now stay logged in on multiple devices (Laptop, Phone, Tablet) simultaneously.
    - **Limit:** Max 10 active sessions per user.

- **Performance Visualization:**
    - Added `compression` middleware to `server.js` (Gzip) to reduce API response size by ~70%.

### Files Modified
- `backend/server.js` (Rate Limit, Compression)
- `backend/models/User.js` (Refresh Tokens schema)
- `backend/services/authService.js` (Login/Logout logic)
- `frontend/src/pages/Home.jsx` (Error Handling)
- `frontend/src/components/Header.jsx` (Mobile Menu)
- `frontend/src/pages/ProductDetail.jsx` (Image Ratio)
