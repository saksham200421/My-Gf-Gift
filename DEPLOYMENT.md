# Deployment Checklist

## 1) Backend (Render)
- Create a Render Web Service from your GitHub repo.
- Root directory: backend
- Build command: npm install
- Start command: npm run start
- Set env vars:
  - PORT=5000
  - FRONTEND_ORIGIN=https://your-frontend.vercel.app
  - MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
- Deploy and copy the Render URL.

### If Render asks for Dockerfile
- Keep service type as **Web Service**.
- Set Root Directory to `backend` so Render uses `backend/Dockerfile`.
- If Render still asks for Docker settings, choose Docker runtime and set Dockerfile path to `backend/Dockerfile`.

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
