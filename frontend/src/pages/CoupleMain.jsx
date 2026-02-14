import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDashboardTodo,
  deleteDashboardTodo,
  fetchLatestSongs,
  fetchDashboard,
  searchSongs,
  searchPlace,
  toggleDashboardDate,
  updateDashboardFields,
  updateDashboardTodo,
} from "../utils/api";
import LoveRunnerGame from "../components/LoveRunnerGame";

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
  wannaGoTo: "",
  todos: [],
};

const foodQuickPicks = ["Pizza", "Pasta", "Biryani", "Sushi", "Burger", "Chaat"];
const moodQuickPicks = ["Happy", "Calm", "Romantic", "Chaotic", "Tired", "Goofy"];
const songQuickPicks = [
  "Perfect - Ed Sheeran",
  "Until I Found You",
  "A Thousand Years",
  "Tum Se Hi",
];
const gameFallbackPrompts = [
  "Share one hidden fear and one comfort wish.",
  "Take turns: 3 compliments in 30 seconds.",
  "One person plans a 20-min date now.",
  "Guess each other’s mood from one emoji only.",
];

function CoupleMain({ authToken, authUser, onLogout }) {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [newTodo, setNewTodo] = useState("");
  const [todoFilter, setTodoFilter] = useState("all");
  const [isSaving, setIsSaving] = useState(false);
  const [gamePrompt, setGamePrompt] = useState("Loading a couple mini-game...");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [moodScale, setMoodScale] = useState(3);
  const [datePlanBudget, setDatePlanBudget] = useState("low");
  const [datePlanTime, setDatePlanTime] = useState("evening");
  const [winStars, setWinStars] = useState(3);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeData, setPlaceData] = useState(null);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [songSearchQuery, setSongSearchQuery] = useState("");
  const [songResults, setSongResults] = useState([]);
  const [latestSongs, setLatestSongs] = useState([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [songsError, setSongsError] = useState("");
  const [activePreviewId, setActivePreviewId] = useState(null);
  const [previewLoadingId, setPreviewLoadingId] = useState(null);
  const audioRef = useRef(null);

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

  useEffect(() => {
    fetchLatestSongs(authToken)
      .then((payload) => setLatestSongs(Array.isArray(payload.songs) ? payload.songs : []))
      .catch(() => setLatestSongs([]));
  }, [authToken]);

  useEffect(
    () => () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    },
    []
  );

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
      setLastSavedAt(new Date());
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDate = async (dateKey) => {
    const payload = await toggleDashboardDate(authToken, dateKey);
    setDashboard(payload.dashboard || emptyDashboard);
    setLastSavedAt(new Date());
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) {
      return;
    }
    const payload = await addDashboardTodo(authToken, newTodo.trim());
    setDashboard(payload.dashboard || emptyDashboard);
    setNewTodo("");
    setLastSavedAt(new Date());
  };

  const handleToggleTodo = async (todo) => {
    const payload = await updateDashboardTodo(authToken, todo.id, { done: !todo.done });
    setDashboard(payload.dashboard || emptyDashboard);
    setLastSavedAt(new Date());
  };

  const handleDeleteTodo = async (todoId) => {
    const payload = await deleteDashboardTodo(authToken, todoId);
    setDashboard(payload.dashboard || emptyDashboard);
    setLastSavedAt(new Date());
  };

  const filteredTodos = dashboard.todos.filter((todo) => {
    if (todoFilter === "active") {
      return !todo.done;
    }
    if (todoFilter === "done") {
      return todo.done;
    }
    return true;
  });

  const completedCount = dashboard.todos.filter((todo) => todo.done).length;

  const clearCompleted = async () => {
    const doneTodos = dashboard.todos.filter((todo) => todo.done);
    for (const todo of doneTodos) {
      await deleteDashboardTodo(authToken, todo.id);
    }
    const payload = await fetchDashboard(authToken);
    setDashboard(payload.dashboard || emptyDashboard);
    setLastSavedAt(new Date());
  };

  const highlightToday = async () => {
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    await handleToggleDate(dateKey);
  };

  const refreshGamePrompt = () => {
    setGamePrompt("Fetching a fresh challenge...");
    fetch("https://api.adviceslip.com/advice?ts=" + Date.now())
      .then((response) => response.json())
      .then((payload) => {
        const advice = payload?.slip?.advice;
        if (advice) {
          setGamePrompt(`Game: You both must act on this now → ${advice}`);
          return;
        }
        setGamePrompt(
          `Game: ${gameFallbackPrompts[Math.floor(Math.random() * gameFallbackPrompts.length)]}`
        );
      })
      .catch(() => {
        setGamePrompt(
          `Game: ${gameFallbackPrompts[Math.floor(Math.random() * gameFallbackPrompts.length)]}`
        );
      });
  };

  const applySongPick = async (song) => {
    const value = `${song.name} - ${song.artist}`;
    setDashboard((prev) => ({ ...prev, songPick: value }));
    await patchDashboard({ songPick: value });
  };

  const stopCurrentPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setActivePreviewId(null);
  };

  const togglePreview = async (song) => {
    if (activePreviewId === song.id) {
      stopCurrentPreview();
      return;
    }

    const previewUrl = song.previewUrl;
    if (!previewUrl) {
      setSongsError("Preview unavailable for this track.");
      return;
    }

    setSongsError("");
    setPreviewLoadingId(song.id);
    stopCurrentPreview();

    try {
      const audio = new Audio(previewUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setActivePreviewId(null);
      };
      await audio.play();
      setActivePreviewId(song.id);
    } catch {
      setSongsError("Could not play preview on this browser/session.");
      setActivePreviewId(null);
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const handleSongSearch = async () => {
    const query = songSearchQuery.trim();
    if (!query) {
      setSongsError("Type a song or artist name.");
      return;
    }

    setSongsLoading(true);
    setSongsError("");
    try {
      const payload = await searchSongs(authToken, query);
      setSongResults(Array.isArray(payload.songs) ? payload.songs : []);
    } catch {
      setSongResults([]);
      setSongsError("Could not fetch songs right now.");
    } finally {
      setSongsLoading(false);
    }
  };

  const handleSearchPlace = async () => {
    const query = placeQuery.trim() || dashboard.wannaGoTo?.trim();
    if (!query) {
      setPlaceError("Type a place first.");
      return;
    }

    setPlaceLoading(true);
    setPlaceError("");
    try {
      const payload = await searchPlace(authToken, query);
      setPlaceData(payload.place || null);
      if (dashboard.wannaGoTo !== query) {
        setDashboard((prev) => ({ ...prev, wannaGoTo: query }));
        await patchDashboard({ wannaGoTo: query });
      }
    } catch {
      setPlaceData(null);
      setPlaceError("Could not find this place right now.");
    } finally {
      setPlaceLoading(false);
    }
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
            <button
              type="button"
              onClick={() => {
                const pick = foodQuickPicks[Math.floor(Math.random() * foodQuickPicks.length)];
                setDashboard((prev) => ({ ...prev, eatToday: pick }));
                patchDashboard({ eatToday: pick });
              }}
            >
              Surprise me
            </button>
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
          <label className="inline-label">
            Mood intensity: {moodScale}/5
            <input
              type="range"
              min="1"
              max="5"
              value={moodScale}
              onChange={(event) => setMoodScale(Number(event.target.value))}
            />
          </label>
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
          <div className="todo-input-row">
            <input
              value={songSearchQuery}
              onChange={(event) => setSongSearchQuery(event.target.value)}
              placeholder="Search latest songs or artist"
            />
            <button type="button" onClick={handleSongSearch} disabled={songsLoading}>
              {songsLoading ? "Searching..." : "Search"}
            </button>
          </div>
          {songsError ? <p>{songsError}</p> : null}

          {songResults.length ? (
            <div className="song-results">
              {songResults.map((song) => (
                <div className="song-item" key={`search-${song.id}`}>
                  <span>{song.name} - {song.artist}</span>
                  <div className="song-actions">
                    <button type="button" onClick={() => applySongPick(song)}>
                      Add
                    </button>
                    <button type="button" onClick={() => togglePreview(song)}>
                      {previewLoadingId === song.id
                        ? "Loading..."
                        : activePreviewId === song.id
                          ? "Pause"
                          : "Preview"}
                    </button>
                    {song.url ? (
                      <a className="chip-link" href={song.url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {latestSongs.length ? (
            <div>
              <p>Latest picks</p>
              <div className="song-results">
                {latestSongs.slice(0, 8).map((song) => (
                  <div className="song-item" key={`latest-${song.id}`}>
                    <span>{song.name} - {song.artist}</span>
                    <div className="song-actions">
                      <button type="button" onClick={() => applySongPick(song)}>
                        Add
                      </button>
                      <button type="button" onClick={() => togglePreview(song)}>
                        {previewLoadingId === song.id
                          ? "Loading..."
                          : activePreviewId === song.id
                            ? "Pause"
                            : "Preview"}
                      </button>
                      {song.url ? (
                        <a className="chip-link" href={song.url} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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
            {dashboard.songPick ? (
              <a
                className="chip-link"
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(dashboard.songPick)}`}
                target="_blank"
                rel="noreferrer"
              >
                Open on YouTube
              </a>
            ) : null}
          </div>
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
          <div className="inline-actions">
            <button type="button" onClick={() => setMonthDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
              Jump to current month
            </button>
            <button type="button" onClick={highlightToday}>Toggle today</button>
            <span>Highlighted: {dashboard.highlightedDates.length}</span>
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
          <div className="inline-actions">
            <span>
              Progress: {completedCount}/{dashboard.todos.length}
            </span>
            <select value={todoFilter} onChange={(event) => setTodoFilter(event.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="done">Done</option>
            </select>
            <button type="button" onClick={clearCompleted} disabled={!completedCount}>
              Clear done
            </button>
          </div>
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
            {filteredTodos.map((todo) => (
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
          <div className="inline-actions">
            <span>
              Words: {dashboard.thoughtToday.trim() ? dashboard.thoughtToday.trim().split(/\s+/).length : 0}
            </span>
            <button
              type="button"
              onClick={() => {
                const starter = "Today I want us to be softer with each other.";
                setDashboard((prev) => ({ ...prev, thoughtToday: starter }));
                patchDashboard({ thoughtToday: starter });
              }}
            >
              Use prompt
            </button>
          </div>
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
          <div className="inline-actions">
            <button
              type="button"
              onClick={() => {
                const calmVersion = "I need 5 mins and then a hug.";
                setDashboard((prev) => ({ ...prev, madReason: calmVersion }));
                patchDashboard({ madReason: calmVersion });
              }}
            >
              Calm rewrite
            </button>
            <button
              type="button"
              onClick={() => {
                setDashboard((prev) => ({ ...prev, madReason: "" }));
                patchDashboard({ madReason: "" });
              }}
            >
              Clear
            </button>
          </div>
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
              const template = "Thank you for being patient with me today.";
              setDashboard((prev) => ({ ...prev, gratitudeNote: template }));
              patchDashboard({ gratitudeNote: template });
            }}
          >
            Insert template
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
          <div className="inline-actions">
            <label className="inline-label small">
              Budget
              <select
                value={datePlanBudget}
                onChange={(event) => setDatePlanBudget(event.target.value)}
              >
                <option value="low">Low</option>
                <option value="mid">Mid</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="inline-label small">
              Time
              <select
                value={datePlanTime}
                onChange={(event) => setDatePlanTime(event.target.value)}
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                const suggestion = `${datePlanTime} ${datePlanBudget}-budget date: coffee + walk + photos.`;
                setDashboard((prev) => ({ ...prev, datePlan: suggestion }));
                patchDashboard({ datePlan: suggestion });
              }}
            >
              Suggest plan
            </button>
          </div>
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
          <div className="inline-actions">
            <label className="inline-label">
              Win stars: {winStars}/5
              <input
                type="range"
                min="1"
                max="5"
                value={winStars}
                onChange={(event) => setWinStars(Number(event.target.value))}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                const line = `Our day rating: ${winStars}/5 because we still showed up for each other.`;
                setDashboard((prev) => ({ ...prev, smallWin: line }));
                patchDashboard({ smallWin: line });
              }}
            >
              Generate win note
            </button>
          </div>
        </div>
      </section>

      <section className="couple-col couple-col-right">
        <div className="couple-card">
          <h3>Couple Game</h3>
          <p>{gamePrompt}</p>
          <button
            type="button"
            onClick={refreshGamePrompt}
          >
            New challenge
          </button>
        </div>

        <div className="couple-card">
          <h3>2D Love Runner</h3>
          <LoveRunnerGame />
        </div>

        <div className="couple-card">
          <h3>Wanna go to</h3>
          <div className="todo-input-row">
            <input
              value={placeQuery}
              onChange={(event) => setPlaceQuery(event.target.value)}
              onBlur={() => {
                if (placeQuery.trim() && placeQuery.trim() !== dashboard.wannaGoTo) {
                  setDashboard((prev) => ({ ...prev, wannaGoTo: placeQuery.trim() }));
                  patchDashboard({ wannaGoTo: placeQuery.trim() });
                }
              }}
              placeholder={dashboard.wannaGoTo || "Paris, Goa, Tokyo, Manali..."}
            />
            <button type="button" onClick={handleSearchPlace} disabled={placeLoading}>
              {placeLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {placeError ? <p>{placeError}</p> : null}

          {placeData ? (
            <div className="place-result">
              <p>
                <strong>{placeData.name}</strong>
              </p>
              <p>{placeData.displayName}</p>
              {placeData.description ? <p>{placeData.description}</p> : null}

              {placeData.imageUrl ? (
                <img src={placeData.imageUrl} alt={placeData.name} className="place-image" />
              ) : null}

              {placeData.mapEmbedUrl ? (
                <iframe
                  className="place-map"
                  src={placeData.mapEmbedUrl}
                  title={`Map for ${placeData.name}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : null}

              <div className="chip-row">
                {placeData.wikipediaUrl ? (
                  <a className="chip-link" href={placeData.wikipediaUrl} target="_blank" rel="noreferrer">
                    Learn more
                  </a>
                ) : null}
                {placeData.mapStaticUrl ? (
                  <a className="chip-link" href={placeData.mapStaticUrl} target="_blank" rel="noreferrer">
                    Open static map
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <p>Search a destination to preview map + recognized place image.</p>
          )}
        </div>

        <div className="couple-card">
          <h3>Session</h3>
          <p>Logged in as {authUser?.name || "Love"}</p>
          <p className="saving-text">{isSaving ? "Saving..." : "All changes synced"}</p>
          <p className="saving-text">
            Last save: {lastSavedAt ? lastSavedAt.toLocaleTimeString() : "No local save timestamp"}
          </p>
          <button type="button" onClick={() => navigate("/marry-me")}>
            Wedding Certificate
          </button>
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}

export default CoupleMain;