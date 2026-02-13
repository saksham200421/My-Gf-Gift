import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchHealth } from "../utils/api";

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

function Home() {
  const [apiStatus, setApiStatus] = useState("checking");
  const valentineUrl = `${(
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "")}/valentine`;

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
      <header className="hero">
        <div className="hero-content">
          <span className="badge">Valentine 2026</span>
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
