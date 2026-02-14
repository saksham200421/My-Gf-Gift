import { useNavigate } from "react-router-dom";

function ValentineGate({ authUser }) {
  const navigate = useNavigate();

  return (
    <main className="valentine-gate-page">
      <section className="valentine-gate-card">
        <p className="valentine-gate-kicker">One tiny question</p>
        <h1>Will You Be My Valentine?</h1>
        <p>
          {authUser?.name ? `${authUser.name}, ` : ""}
          this page is the official checkpoint before entering our dashboard.
        </p>

        <div className="valentine-gate-actions">
          <button type="button" onClick={() => navigate("/")}>Yes 💘</button>
        </div>
      </section>
    </main>
  );
}

export default ValentineGate;
