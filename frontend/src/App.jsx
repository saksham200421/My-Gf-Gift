import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { useMemo, useState } from "react";
import CoupleMain from "./pages/CoupleMain";
import Gallery from "./pages/Gallery";
import Hub from "./pages/Hub";
import Letters from "./pages/Letters";
import Login from "./pages/Login";
import MarryMe from "./pages/MarryMe";
import ProtectedRoute from "./components/ProtectedRoute";
import {
  clearAuthSession,
  getAuthToken,
  getAuthUser,
  saveAuthSession,
} from "./utils/auth";

function App() {
  const [authToken, setAuthToken] = useState(() => getAuthToken());
  const [authUser, setAuthUser] = useState(() => getAuthUser());

  const isAuthenticated = useMemo(() => Boolean(authToken), [authToken]);

  const handleAuthenticated = (token, user) => {
    saveAuthSession(token, user);
    setAuthToken(token);
    setAuthUser(user);
  };

  const handleLogout = () => {
    clearAuthSession();
    setAuthToken(null);
    setAuthUser(null);
  };

  return (
    <div className="app">
      <Routes>
        <Route
          path="/login"
          element={
            <Login
              onAuthenticated={handleAuthenticated}
              isAuthenticated={isAuthenticated}
            />
          }
        />

        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route
            path="/"
            element={
              <CoupleMain
                authToken={authToken}
                authUser={authUser}
                onLogout={handleLogout}
              />
            }
          />
          <Route path="/hub" element={<Hub />} />
          <Route path="/letters" element={<Letters authToken={authToken} />} />
          <Route path="/marry-me" element={<MarryMe />} />
          <Route path="/gallery" element={<Gallery />} />
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>
    </div>
  );
}

export default App;
