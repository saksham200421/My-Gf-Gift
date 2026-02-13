import { useEffect, useMemo, useState } from "react";
import {
  addDashboardTodo,
  deleteDashboardTodo,
  fetchDashboard,
  toggleDashboardDate,
  updateDashboardFields,
  updateDashboardTodo,
} from "../utils/api";

const emptyDashboard = {
  eatToday: "",
  moodToday: "",
  songPick: "",
  highlightedDates: [],
  thoughtToday: "",
  madReason: "",
  gratitudeNote: "",
  datePlan: "",
  smallWin: "",
  todos: [],
};

function CoupleMain({ authToken, authUser, onLogout }) {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [newTodo, setNewTodo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [gamePrompt, setGamePrompt] = useState("Loading a couple mini-game...");

  useEffect(() => {
    fetchDashboard(authToken)
      .then((payload) => setDashboard(payload.dashboard || emptyDashboard))
      .catch(() => setDashboard(emptyDashboard));
  }, [authToken]);

  useEffect(() => {
    fetch("https://api.adviceslip.com/advice?ts=" + Date.now())
      .then((response) => response.json())
      .then((payload) => {
        const advice = payload?.slip?.advice;
        if (advice) {
          setGamePrompt(`Game: You both must act on this now → ${advice}`);
        }
      })
      .catch(() => {
        setGamePrompt("Game: Take turns saying one thing you appreciate about each other.");
      });
  }, []);

  const monthCells = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let emptyIndex = 0; emptyIndex < firstDay; emptyIndex += 1) {
      cells.push({ type: "empty", key: `empty-${emptyIndex}` });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({
        type: "day",
        day,
        key,
        highlighted: dashboard.highlightedDates.includes(key),
      });
    }

    return cells;
  }, [monthDate, dashboard.highlightedDates]);

  const patchDashboard = async (fields) => {
    setIsSaving(true);
    try {
      const payload = await updateDashboardFields(authToken, fields);
      setDashboard(payload.dashboard || emptyDashboard);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDate = async (dateKey) => {
    const payload = await toggleDashboardDate(authToken, dateKey);
    setDashboard(payload.dashboard || emptyDashboard);
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) {
      return;
    }
    const payload = await addDashboardTodo(authToken, newTodo.trim());
    setDashboard(payload.dashboard || emptyDashboard);
    setNewTodo("");
  };

  const handleToggleTodo = async (todo) => {
    const payload = await updateDashboardTodo(authToken, todo.id, { done: !todo.done });
    setDashboard(payload.dashboard || emptyDashboard);
  };

  const handleDeleteTodo = async (todoId) => {
    const payload = await deleteDashboardTodo(authToken, todoId);
    setDashboard(payload.dashboard || emptyDashboard);
  };

  return (
    <main className="couple-page">
      <section className="couple-col couple-col-left">
        <div className="couple-card">
          <h3>Wanna eat this ___ today?</h3>
          <input
            value={dashboard.eatToday}
            onChange={(event) =>
              setDashboard((prev) => ({ ...prev, eatToday: event.target.value }))
            }
            onBlur={() => patchDashboard({ eatToday: dashboard.eatToday })}
            placeholder="Sushi / Pasta / Chaat"
          />
        </div>

        <div className="couple-card">
          <h3>Today’s mood</h3>
          <input
            value={dashboard.moodToday}
            onChange={(event) =>
              setDashboard((prev) => ({ ...prev, moodToday: event.target.value }))
            }
            onBlur={() => patchDashboard({ moodToday: dashboard.moodToday })}
            placeholder="Soft / Silly / Moody"
          />
        </div>

        <div className="couple-card">
          <h3>Song selection area</h3>
          <input
            value={dashboard.songPick}
            onChange={(event) =>
              setDashboard((prev) => ({ ...prev, songPick: event.target.value }))
            }
            onBlur={() => patchDashboard({ songPick: dashboard.songPick })}
            placeholder="Song title or link"
          />
        </div>
      </section>

      <section className="couple-col couple-col-main">
        <div className="couple-card">
          <div className="calendar-head">
            <h2>
              {monthDate.toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div className="calendar-actions">
              <button
                type="button"
                onClick={() =>
                  setMonthDate(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                  )
                }
              >
                ←
              </button>
              <button
                type="button"
                onClick={() =>
                  setMonthDate(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                  )
                }
              >
                →
              </button>
            </div>
          </div>
          <div className="calendar-grid">
            {["S", "M", "T", "W", "T", "F", "S"].map((label) => (
              <span key={label} className="calendar-label">
                {label}
              </span>
            ))}
            {monthCells.map((cell) =>
              cell.type === "empty" ? (
                <span key={cell.key} className="calendar-cell empty" />
              ) : (
                <button
                  type="button"
                  key={cell.key}
                  className={`calendar-cell ${cell.highlighted ? "highlighted" : ""}`}
                  onClick={() => handleToggleDate(cell.key)}
                >
                  {cell.day}
                </button>
              )
            )}
          </div>
        </div>

        <div className="couple-card">
          <h2>To-do list system</h2>
          <div className="todo-input-row">
            <input
              value={newTodo}
              onChange={(event) => setNewTodo(event.target.value)}
              placeholder="Add a couple task"
            />
            <button type="button" onClick={handleAddTodo}>
              Add
            </button>
          </div>
          <div className="todo-list">
            {dashboard.todos.map((todo) => (
              <div key={todo.id} className="todo-item">
                <label>
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => handleToggleTodo(todo)}
                  />
                  <span className={todo.done ? "todo-done" : ""}>{todo.text}</span>
                </label>
                <button type="button" onClick={() => handleDeleteTodo(todo.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="couple-card">
          <h2>Today’s thought</h2>
          <textarea
            value={dashboard.thoughtToday}
            onChange={(event) =>
              setDashboard((prev) => ({ ...prev, thoughtToday: event.target.value }))
            }
            onBlur={() => patchDashboard({ thoughtToday: dashboard.thoughtToday })}
            placeholder="What are you thinking today?"
          />
        </div>

        <div className="couple-card">
          <h2>Why am I mad at you today ___</h2>
          <textarea
            value={dashboard.madReason}
            onChange={(event) =>
              setDashboard((prev) => ({ ...prev, madReason: event.target.value }))
            }
            onBlur={() => patchDashboard({ madReason: dashboard.madReason })}
            placeholder="Tiny rant space"
          />
        </div>

        <div className="couple-card">
          <h2>One thing I appreciate about you</h2>
          <textarea
            value={dashboard.gratitudeNote}
            onChange={(event) =>
              setDashboard((prev) => ({ ...prev, gratitudeNote: event.target.value }))
            }
            onBlur={() => patchDashboard({ gratitudeNote: dashboard.gratitudeNote })}
            placeholder="Write something sweet"
          />
        </div>

        <div className="couple-card">
          <h2>Mini date plan</h2>
          <textarea
            value={dashboard.datePlan}
            onChange={(event) =>
              setDashboard((prev) => ({ ...prev, datePlan: event.target.value }))
            }
            onBlur={() => patchDashboard({ datePlan: dashboard.datePlan })}
            placeholder="What shall we do next?"
          />
        </div>

        <div className="couple-card">
          <h2>Small win today</h2>
          <textarea
            value={dashboard.smallWin}
            onChange={(event) =>
              setDashboard((prev) => ({ ...prev, smallWin: event.target.value }))
            }
            onBlur={() => patchDashboard({ smallWin: dashboard.smallWin })}
            placeholder="Celebrate something little"
          />
        </div>
      </section>

      <section className="couple-col couple-col-right">
        <div className="couple-card">
          <h3>Couple Game</h3>
          <p>{gamePrompt}</p>
          <button
            type="button"
            onClick={() => {
              setGamePrompt("Fetching a fresh challenge...");
              fetch("https://api.adviceslip.com/advice?ts=" + Date.now())
                .then((response) => response.json())
                .then((payload) => {
                  const advice = payload?.slip?.advice;
                  if (advice) {
                    setGamePrompt(`Game: You both must act on this now → ${advice}`);
                  }
                })
                .catch(() => {
                  setGamePrompt(
                    "Game: Say one memory each and guess the exact date of it."
                  );
                });
            }}
          >
            New challenge
          </button>
        </div>

        <div className="couple-card">
          <h3>Session</h3>
          <p>Logged in as {authUser?.name || "Love"}</p>
          <p className="saving-text">{isSaving ? "Saving..." : "All changes synced"}</p>
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}

export default CoupleMain;