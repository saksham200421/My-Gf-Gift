# Deployment Checklist

## 1) Backend (Render)
- Create a Render Web Service from your GitHub repo.
- Root directory: backend
- Build command: npm install
- Start command: npm run start
- Set env vars:
  - PORT=5000
  - FRONTEND_ORIGIN=https://your-frontend.vercel.app
- Deploy and copy the Render URL.

## 2) Frontend (Vercel)
- Import your GitHub repo in Vercel.
- Root directory: frontend
- Framework: Vite
- Set env vars:
  - VITE_API_URL=https://your-backend.onrender.com
- Deploy and copy the Vercel URL.

## 3) Verify
- Open your Vercel URL in the browser.
- Check API status on the home page.
- Hit the API directly: https://your-backend.onrender.com/api/health

## Notes
- Update FRONTEND_ORIGIN if your frontend domain changes.
- Update VITE_API_URL if your backend domain changes.
