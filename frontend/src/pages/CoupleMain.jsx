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

const moodQuickPicks = ["Happy", "Calm", "Chaotic", "Sleepy", "Romantic"];
const foodQuickPicks = ["Pizza", "Pasta", "Biryani", "Sushi", "Maggi"];
const songQuickPicks = [
  "Perfect - Ed Sheeran",
  "Until I Found You",
  "A Thousand Years",
  "I Like Me Better",
];

const dashboardThemes = {
  roseSky: [
    ["#f7d4df", "#d8e0ff", "#cfe1ff", "#d3749d"],
    ["#efbccd", "#c1cdf7", "#b8d0f8", "#c8628d"],
    ["#e59fb6", "#aebeea", "#a1c0ef", "#b95580"],
    ["#d984a1", "#9cacde", "#8eb2e6", "#a94972"],
    ["#c66e90", "#8b9bd3", "#7ba5dd", "#963f66"],
  ],
  sunsetLilac: [
    ["#f8d6cf", "#ead5f8", "#d5dffd", "#c67788"],
    ["#f0b8ac", "#d9bcf2", "#bdcdf8", "#b9677c"],
    ["#e39e90", "#c8a9ea", "#a9bdf0", "#aa5a73"],
    ["#d08979", "#b594df", "#95ade8", "#994f6a"],
    ["#bb7565", "#a27fd3", "#829de0", "#88455f"],
  ],
  berryTwilight: [
    ["#ecc5dd", "#d5c8f6", "#c5d9ff", "#9f5ea2"],
    ["#dfa9cb", "#c2b4ec", "#b0c8f8", "#915196"],
    ["#cf8cb7", "#b09fe0", "#9ab6ef", "#82458a"],
    ["#bd75a4", "#9d8bd3", "#86a5e6", "#743b7d"],
    ["#ab6291", "#8b79c6", "#7396dc", "#653372"],
  ],
  oceanDusk: [
    ["#c8d9f2", "#c2d5ec", "#bcd0e6", "#456e9d"],
    ["#adc6e5", "#a8c1de", "#a2bad8", "#3e638f"],
    ["#92b3d8", "#8daed0", "#88a8ca", "#375781"],
    ["#7aa1cb", "#769bc3", "#7196bd", "#304c73"],
    ["#678fbc", "#6389b3", "#5f84ad", "#2a4266"],
  ],
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
  const [themeOption, setThemeOption] = useState("roseSky");
  const [themeShade, setThemeShade] = useState(3);
  const [dateIdea, setDateIdea] = useState("");

  const [themeStart, themeMiddle, themeEnd, themeAccent] =
    dashboardThemes[themeOption][themeShade - 1];

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

  const completedTodos = dashboard.todos.filter((todo) => todo.done).length;
  const todoProgress = dashboard.todos.length
    ? Math.round((completedTodos / dashboard.todos.length) * 100)
    : 0;

  const clearCompletedTodos = async () => {
    const completed = dashboard.todos.filter((todo) => todo.done);
    for (const todo of completed) {
      await deleteDashboardTodo(authToken, todo.id);
    }
    const payload = await fetchDashboard(authToken);
    setDashboard(payload.dashboard || emptyDashboard);
  };

  return (
    <main
      className="couple-page"
      style={{
        "--couple-bg-start": themeStart,
        "--couple-bg-middle": themeMiddle,
        "--couple-bg-end": themeEnd,
        "--couple-accent": themeAccent,
      }}
    >
      <section className="couple-col couple-col-left">
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
          <h3>Wanna eat this ___ today?</h3>
          <input
            value={dashboard.eatToday}
            onChange={(event) =>
              setDashboard((prev) => ({ ...prev, eatToday: event.target.value }))
            }
            onBlur={() => patchDashboard({ eatToday: dashboard.eatToday })}
            placeholder="Sushi / Pasta / Chaat"
          />
          <div className="chip-row">
            {foodQuickPicks.map((food) => (
              <button
                key={food}
                type="button"
                onClick={() => {
                  setDashboard((prev) => ({ ...prev, eatToday: food }));
                  patchDashboard({ eatToday: food });
                }}
              >
                {food}
              </button>
            ))}
          </div>
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
          <div className="chip-row">
            {moodQuickPicks.map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => {
                  setDashboard((prev) => ({ ...prev, moodToday: mood }));
                  patchDashboard({ moodToday: mood });
                }}
              >
                {mood}
              </button>
            ))}
          </div>
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
          <div className="chip-row">
            {songQuickPicks.map((song) => (
              <button
                key={song}
                type="button"
                onClick={() => {
                  setDashboard((prev) => ({ ...prev, songPick: song }));
                  patchDashboard({ songPick: song });
                }}
              >
                {song}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="couple-col couple-col-main">
        <div className="couple-card">
          <h2>To-do list system</h2>
          <p>
            Progress: {completedTodos}/{dashboard.todos.length} ({todoProgress}%)
          </p>
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
          <button type="button" onClick={clearCompletedTodos} disabled={!completedTodos}>
            Clear completed
          </button>
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
          <p>Word count: {dashboard.thoughtToday.trim() ? dashboard.thoughtToday.trim().split(/\s+/).length : 0}</p>
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
          <button
            type="button"
            onClick={() => {
              const calmLine = "I still care, I just need a hug and 5 minutes.";
              setDashboard((prev) => ({ ...prev, madReason: calmLine }));
              patchDashboard({ madReason: calmLine });
            }}
          >
            Replace with calm version
          </button>
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
          <button
            type="button"
            onClick={() => {
              const prompt = "You made today lighter just by being you.";
              setDashboard((prev) => ({ ...prev, gratitudeNote: prompt }));
              patchDashboard({ gratitudeNote: prompt });
            }}
          >
            Use sweet prompt
          </button>
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
          <button
            type="button"
            onClick={() => {
              setDateIdea("Walk + coffee + sunset photos");
              setDashboard((prev) => ({ ...prev, datePlan: "Walk + coffee + sunset photos" }));
              patchDashboard({ datePlan: "Walk + coffee + sunset photos" });
            }}
          >
            Generate quick idea
          </button>
          {dateIdea ? <p>Idea picked: {dateIdea}</p> : null}
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
          <button
            type="button"
            onClick={() => {
              const win = "We showed up for each other today.";
              setDashboard((prev) => ({ ...prev, smallWin: win }));
              patchDashboard({ smallWin: win });
            }}
          >
            Suggest a win
          </button>
        </div>
      </section>

      <section className="couple-col couple-col-right">
        <div className="couple-card">
          <h3>Theme option</h3>
          <div className="theme-controls">
            <select value={themeOption} onChange={(event) => setThemeOption(event.target.value)}>
              <option value="roseSky">Option 1: Rose Sky</option>
              <option value="sunsetLilac">Option 2: Sunset Lilac</option>
              <option value="berryTwilight">Option 3: Berry Twilight</option>
              <option value="oceanDusk">Option 4: Ocean Dusk</option>
            </select>
            <select
              value={themeShade}
              onChange={(event) => setThemeShade(Number(event.target.value))}
            >
              <option value={1}>Shade 1 (light)</option>
              <option value={2}>Shade 2</option>
              <option value={3}>Shade 3</option>
              <option value={4}>Shade 4</option>
              <option value={5}>Shade 5 (dark)</option>
            </select>
          </div>
        </div>

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