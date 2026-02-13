import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { loginUser, registerUser } from "../utils/api";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

function Login({ onAuthenticated, isAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bursts, setBursts] = useState([]);

  const heading = useMemo(
    () =>
      mode === "login" ? "Welcome back, my love 💖" : "Create our love-space ✨",
    [mode]
  );

  const triggerMegaHeart = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const burst = {
      id: Date.now() + Math.random(),
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    setBursts((prev) => [...prev, burst]);
    window.setTimeout(() => {
      setBursts((prev) => prev.filter((item) => item.id !== burst.id));
    }, 2100);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload =
        mode === "login"
          ? await loginUser({ email: form.email, password: form.password })
          : await registerUser(form);

      onAuthenticated(payload.token, payload.user);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="login-page">
      <div className="login-bg-hearts" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} className="login-floating-heart" />
        ))}
        {bursts.map((burst) => (
          <span
            key={burst.id}
            className="mega-heart"
            style={{ left: `${burst.x}px`, top: `${burst.y}px` }}
          />
        ))}
      </div>

      <section className="login-card">
        <p className="login-badge">Private Love Entry</p>
        <h1>{heading}</h1>
        <p className="login-subtitle">
          This space is just for us. Sign in to continue the story.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              Name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your sweet name"
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
            onMouseEnter={triggerMegaHeart}
            onFocus={triggerMegaHeart}
            onClick={triggerMegaHeart}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Enter our world"
              : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="login-switch"
          onClick={() => {
            setMode((prev) => (prev === "login" ? "register" : "login"));
            setError("");
          }}
          onMouseEnter={triggerMegaHeart}
          onFocus={triggerMegaHeart}
        >
          {mode === "login"
            ? "Need an account? Create one"
            : "Already registered? Login now"}
        </button>
      </section>
    </main>
  );
}

export default Login;
