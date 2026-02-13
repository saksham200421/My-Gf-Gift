import { useEffect, useRef, useState } from "react";

function LoveRunnerGame() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("Press Start and catch hearts 💖");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    const state = {
      playerX: canvas.width / 2,
      playerY: canvas.height - 36,
      playerSize: 16,
      velocity: 3.6,
      hearts: [],
      keys: { left: false, right: false },
      frame: 0,
      localScore: 0,
      misses: 0,
      active: false,
    };

    const spawnHeart = () => {
      state.hearts.push({
        x: 16 + Math.random() * (canvas.width - 32),
        y: -10,
        speed: 1.3 + Math.random() * 2.2,
        size: 11 + Math.random() * 6,
      });
    };

    const drawHeart = (x, y, size) => {
      context.save();
      context.translate(x, y);
      context.rotate(Math.PI / 4);
      context.fillStyle = "#e76095";
      context.fillRect(-size / 2, -size / 2, size, size);
      context.beginPath();
      context.arc(0, -size / 2, size / 2, 0, Math.PI * 2);
      context.arc(-size / 2, 0, size / 2, 0, Math.PI * 2);
      context.fill();
      context.restore();
    };

    const drawPlayer = () => {
      context.save();
      context.translate(state.playerX, state.playerY);
      context.fillStyle = "#6d7fd8";
      context.fillRect(-state.playerSize, -state.playerSize / 2, state.playerSize * 2, state.playerSize);
      context.restore();
    };

    const tick = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(250, 244, 252, 0.9)";
      context.fillRect(0, 0, canvas.width, canvas.height);

      state.frame += 1;
      if (state.frame % 35 === 0 && state.active) {
        spawnHeart();
      }

      if (state.keys.left) {
        state.playerX -= state.velocity;
      }
      if (state.keys.right) {
        state.playerX += state.velocity;
      }
      state.playerX = Math.max(18, Math.min(canvas.width - 18, state.playerX));

      const nextHearts = [];
      for (const heart of state.hearts) {
        heart.y += heart.speed;

        const caughtX = Math.abs(heart.x - state.playerX) < state.playerSize + heart.size * 0.4;
        const caughtY = Math.abs(heart.y - state.playerY) < state.playerSize;
        if (caughtX && caughtY) {
          state.localScore += 1;
          setScore(state.localScore);
          continue;
        }

        if (heart.y > canvas.height + 20) {
          state.misses += 1;
          continue;
        }

        drawHeart(heart.x, heart.y, heart.size);
        nextHearts.push(heart);
      }
      state.hearts = nextHearts;

      drawPlayer();

      context.fillStyle = "#3f4966";
      context.font = "bold 14px Inter, sans-serif";
      context.fillText(`Score: ${state.localScore}`, 10, 18);
      context.fillText(`Misses: ${state.misses}/6`, 10, 36);

      if (state.misses >= 6 && state.active) {
        state.active = false;
        setRunning(false);
        setMessage(`Game over! Score ${state.localScore}. Reset and retry ✨`);
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    const onKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        state.keys.left = true;
      }
      if (event.key === "ArrowRight") {
        state.keys.right = true;
      }
    };

    const onKeyUp = (event) => {
      if (event.key === "ArrowLeft") {
        state.keys.left = false;
      }
      if (event.key === "ArrowRight") {
        state.keys.right = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    tick();

    const unsub = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };

    canvas.startGame = () => {
      state.active = true;
      state.localScore = 0;
      state.misses = 0;
      state.hearts = [];
      setScore(0);
      setRunning(true);
      setMessage("Use ← / → keys to move and catch hearts");
    };

    canvas.resetGame = () => {
      state.active = false;
      state.localScore = 0;
      state.misses = 0;
      state.hearts = [];
      setScore(0);
      setRunning(false);
      setMessage("Reset done. Press Start again 💫");
    };

    return unsub;
  }, []);

  return (
    <div className="love-game-wrap">
      <p className="love-game-msg">{message}</p>
      <canvas ref={canvasRef} width={280} height={190} className="love-game-canvas" />
      <div className="love-game-controls">
        <button type="button" onClick={() => canvasRef.current?.startGame()}>
          {running ? "Restart" : "Start"}
        </button>
        <button type="button" onClick={() => canvasRef.current?.resetGame()}>
          Reset
        </button>
        <span>Score: {score}</span>
      </div>
    </div>
  );
}

export default LoveRunnerGame;
