import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildValentineUrl, fetchHealth } from "../utils/api";

const reasons = [
  {
    title: "Your Calm",
    text: "You make everything feel steady, even the loud days.",
  },
  {
    title: "Your Laugh",
    text: "It makes any place feel like home in seconds.",
  },
  {
    title: "Your Heart",
    text: "Kind, brave, and always open in the best ways.",
  },
];

const moments = [
  {
    title: "The first hello",
    text: "The moment everything shifted to bright and new.",
  },
  {
    title: "Our favorite place",
    text: "Every corner feels softer when we are there together.",
  },
  {
    title: "Quiet nights",
    text: "Simple, warm, and exactly the kind of forever I want.",
  },
];

const gradientOptions = {
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

function Home({ authToken, authUser, onLogout }) {
  const [apiStatus, setApiStatus] = useState("checking");
  const [gradientOption, setGradientOption] = useState("roseSky");
  const [gradientShade, setGradientShade] = useState(3);
  const valentineUrl = buildValentineUrl(authToken);

  const [start, middle, end] = gradientOptions[gradientOption][gradientShade - 1];

  useEffect(() => {
    let isMounted = true;

    fetchHealth()
      .then(() => {
        if (isMounted) {
          setApiStatus("online");
        }
      })
      .catch(() => {
        if (isMounted) {
          setApiStatus("offline");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="page">
      <header
        className="hero"
        style={{
          "--hero-start": start,
          "--hero-middle": middle,
          "--hero-end": end,
        }}
      >
        <div className="gradient-tester">
          <span className="gradient-tester-label">Temporary Gradient Tester</span>
          <div className="gradient-tester-controls">
            <select
              value={gradientOption}
              onChange={(event) => setGradientOption(event.target.value)}
              className="gradient-select"
            >
              <option value="roseSky">Option 1: Rose Sky</option>
              <option value="sunsetLilac">Option 2: Sunset Lilac</option>
              <option value="berryTwilight">Option 3: Berry Twilight</option>
              <option value="oceanDusk">Option 4: Ocean Dusk</option>
            </select>

            <select
              value={gradientShade}
              onChange={(event) => setGradientShade(Number(event.target.value))}
              className="gradient-select"
            >
              <option value={1}>Shade 1 (light)</option>
              <option value={2}>Shade 2</option>
              <option value={3}>Shade 3</option>
              <option value={4}>Shade 4</option>
              <option value={5}>Shade 5 (dark)</option>
            </select>
          </div>
        </div>
        <div className="hero-content">
          <span className="badge">Valentine 2026</span>
          {authUser?.name ? <span className="badge">Hi, {authUser.name}</span> : null}
          <h1>A soft place for our story.</h1>
          <p className="lead">
            A small corner of the internet that feels like us, warm, bright,
            and always honest.
          </p>
          <div className="actions">
            <Link className="btn btn-primary" to="/letters">
              Open the letter
            </Link>
            <button className="btn btn-soft">Play our song</button>
            <Link className="btn btn-soft" to="/hub">
              Open the hub
            </Link>
            <a className="btn btn-soft" href={valentineUrl}>
              Open Valentine page
            </a>
            <button className="btn btn-soft" onClick={onLogout} type="button">
              Logout
            </button>
          </div>
          <div className={`status status-${apiStatus}`}>
            API status: {apiStatus}
          </div>
        </div>
        <div className="hero-card">
          <p className="hero-card-title">For you</p>
          <p className="hero-card-text">
            Every day with you is a reminder that love can be gentle and strong
            at the same time.
          </p>
          <div className="hero-card-footer">- Always yours</div>
        </div>
      </header>

      <section className="section">
        <div className="section-header">
          <h2>Little reasons I smile</h2>
          <p>Small things, big feelings.</p>
        </div>
        <div className="grid">
          {reasons.map((reason) => (
            <article className="card" key={reason.title}>
              <h3>{reason.title}</h3>
              <p>{reason.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Moments I keep close</h2>
          <p>A tiny timeline of us.</p>
        </div>
        <div className="timeline">
          {moments.map((moment) => (
            <div className="timeline-item" key={moment.title}>
              <div className="timeline-dot" />
              <div>
                <h3>{moment.title}</h3>
                <p>{moment.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="note">
        <h2>One more thing</h2>
        <p>
          No matter where we are, you are my favorite place. Happy Valentine,
          today and always.
        </p>
      </section>
    </main>
  );
}

export default Home;
