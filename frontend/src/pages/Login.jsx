import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { buildValentineUrl, loginUser, registerUser } from "../utils/api";

const initialForm = {
  name: "",
  username: "",
  email: "",
  password: "",
};

const loginGradientOptions = {
  roseSky: [
    ["#f7d4df", "#d8e0ff", "#cfe1ff"],
    ["#efbccd", "#c1cdf7", "#b8d0f8"],
    ["#e59fb6", "#aebeea", "#a1c0ef"],
    ["#d984a1", "#9cacde", "#8eb2e6"],
    ["#c66e90", "#8b9bd3", "#7ba5dd"],
  ],
  sunsetLilac: [
    ["#f8d6cf", "#ead5f8", "#d5dffd"],
    ["#f0b8ac", "#d9bcf2", "#bdcdf8"],
    ["#e39e90", "#c8a9ea", "#a9bdf0"],
    ["#d08979", "#b594df", "#95ade8"],
    ["#bb7565", "#a27fd3", "#829de0"],
  ],
  berryTwilight: [
    ["#ecc5dd", "#d5c8f6", "#c5d9ff"],
    ["#dfa9cb", "#c2b4ec", "#b0c8f8"],
    ["#cf8cb7", "#b09fe0", "#9ab6ef"],
    ["#bd75a4", "#9d8bd3", "#86a5e6"],
    ["#ab6291", "#8b79c6", "#7396dc"],
  ],
  oceanDusk: [
    ["#c8d9f2", "#c2d5ec", "#bcd0e6"],
    ["#adc6e5", "#a8c1de", "#a2bad8"],
    ["#92b3d8", "#8daed0", "#88a8ca"],
    ["#7aa1cb", "#769bc3", "#7196bd"],
    ["#678fbc", "#6389b3", "#5f84ad"],
  ],
};

function Login({ onAuthenticated, isAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bursts, setBursts] = useState([]);
  const [gradientOption, setGradientOption] = useState("roseSky");
  const [gradientShade, setGradientShade] = useState(3);

  const [gradientStart, gradientMiddle, gradientEnd] =
    loginGradientOptions[gradientOption][gradientShade - 1];

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
          ? await loginUser({ username: form.username, password: form.password })
          : await registerUser(form);

      onAuthenticated(payload.token, payload.user);
      window.location.assign(buildValentineUrl(payload.token));
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
    <main
      className="login-page"
      style={{
        "--login-bg-start": gradientStart,
        "--login-bg-middle": gradientMiddle,
        "--login-bg-end": gradientEnd,
      }}
    >
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

      <div className="login-gradient-tester">
        <span className="login-gradient-tester-label">Temporary Gradient Tester</span>
        <div className="login-gradient-tester-controls">
          <select
            value={gradientOption}
            onChange={(event) => setGradientOption(event.target.value)}
            className="login-gradient-select"
          >
            <option value="roseSky">Option 1: Rose Sky</option>
            <option value="sunsetLilac">Option 2: Sunset Lilac</option>
            <option value="berryTwilight">Option 3: Berry Twilight</option>
            <option value="oceanDusk">Option 4: Ocean Dusk</option>
          </select>

          <select
            value={gradientShade}
            onChange={(event) => setGradientShade(Number(event.target.value))}
            className="login-gradient-select"
          >
            <option value={1}>Shade 1 (light)</option>
            <option value={2}>Shade 2</option>
            <option value={3}>Shade 3</option>
            <option value={4}>Shade 4</option>
            <option value={5}>Shade 5 (dark)</option>
          </select>
        </div>
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

          {mode === "login" ? (
            <label>
              Username
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="SAM Sam"
                required
              />
            </label>
          ) : (
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
          )}

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
