import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDashboardTodo,
  deleteDashboardTodo,
  fetchDashboard,
  resolveYouTubeSong,
  searchSongs,
  searchPlace,
  toggleDashboardDate,
  updateDashboardFields,
  updateDashboardTodo,
} from "../utils/api";
import LoveRunnerGame from "../components/LoveRunnerGame";

const dashboardGalleryModules = import.meta.glob(
  "../assets/gallery-media/*.{png,jpg,jpeg,webp,avif,gif}",
  {
    eager: true,
    import: "default",
  }
);

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
const gameFallbackPrompts = [
  "Whisper your favorite memory of us in 20 seconds.",
  "Eye contact challenge: no blinking for 20 seconds.",
  "Give 5 flirty compliments, one at a time.",
  "Plan a surprise mini-date for tonight in 60 seconds.",
  "Recreate our first chat energy in one line each.",
  "Slow dance for one full song with no phone.",
  "Write one teasing love note and read it dramatically.",
  "Take turns describing your ideal cuddle plan.",
];

const isLikelyYouTubeUrl = (value) =>
  /^https?:\/\//i.test(value) &&
  /(youtube\.com|youtu\.be|music\.youtube\.com)/i.test(value);

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
  const [songsLoading, setSongsLoading] = useState(false);
  const [songsError, setSongsError] = useState("");
  const [activePreviewId, setActivePreviewId] = useState(null);
  const [previewLoadingId, setPreviewLoadingId] = useState(null);
  const [youtubeInput, setYoutubeInput] = useState("");
  const [youtubeData, setYoutubeData] = useState(null);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeError, setYoutubeError] = useState("");
  const [activePlayback, setActivePlayback] = useState({
    type: "none",
    label: "Nothing playing",
    isPlaying: false,
  });
  const [youtubePlaybackUrl, setYoutubePlaybackUrl] = useState("");
  const [miniGalleryIndex, setMiniGalleryIndex] = useState(0);
  const audioRef = useRef(null);

  const dashboardGalleryPreview = useMemo(() => {
    const images = Object.values(dashboardGalleryModules).filter(Boolean);
    return images;
  }, []);

  const activeDashboardMedia =
    dashboardGalleryPreview[miniGalleryIndex % Math.max(dashboardGalleryPreview.length, 1)] || "";

  useEffect(() => {
    fetchDashboard(authToken)
      .then((payload) => {
        const nextDashboard = payload.dashboard || emptyDashboard;
        setDashboard(nextDashboard);
        setYoutubeInput(nextDashboard.songPick || "");
      })
      .catch(() => setDashboard(emptyDashboard));
  }, [authToken]);

  useEffect(() => {
    const pick = gameFallbackPrompts[Math.floor(Math.random() * gameFallbackPrompts.length)];
    setGamePrompt(`Spicy Challenge: ${pick}`);
  }, []);

  useEffect(() => {
    if (!dashboardGalleryPreview.length) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setMiniGalleryIndex((prev) => (prev + 1) % dashboardGalleryPreview.length);
    }, 2500);

    return () => {
      window.clearInterval(interval);
    };
  }, [dashboardGalleryPreview]);

  useEffect(
    () => () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setYoutubePlaybackUrl("");
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
    const pick = gameFallbackPrompts[Math.floor(Math.random() * gameFallbackPrompts.length)];
    setGamePrompt(`Spicy Challenge: ${pick}`);
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
    setYoutubePlaybackUrl("");
    setActivePreviewId(null);
    setActivePlayback({
      type: "none",
      label: "Nothing playing",
      isPlaying: false,
    });
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
        setActivePlayback((prev) => ({
          ...prev,
          isPlaying: false,
        }));
      };
      await audio.play();
      setActivePreviewId(song.id);
      setActivePlayback({
        type: "preview",
        label: `${song.name} - ${song.artist}`,
        isPlaying: true,
      });
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

  const handleApplyYouTubeSong = async () => {
    const rawUrl = youtubeInput.trim();
    if (!rawUrl) {
      setYoutubeError("Paste a YouTube link first.");
      return;
    }

    if (!isLikelyYouTubeUrl(rawUrl)) {
      setYoutubeError("Use a valid YouTube video URL.");
      return;
    }

    setYoutubeLoading(true);
    setYoutubeError("");
    try {
      const payload = await resolveYouTubeSong(authToken, rawUrl);
      const nextData = {
        videoId: payload.videoId,
        watchUrl: payload.watchUrl,
        embedUrl: payload.embedUrl,
      };
      setYoutubeData(nextData);
      setDashboard((prev) => ({ ...prev, songPick: nextData.watchUrl }));
      await patchDashboard({ songPick: nextData.watchUrl });
      stopCurrentPreview();
      setYoutubePlaybackUrl(`${nextData.embedUrl}&autoplay=1`);
      setActivePlayback({
        type: "youtube",
        label: nextData.watchUrl,
        isPlaying: true,
      });
    } catch (error) {
      setYoutubeData(null);
      setYoutubeError(error.message || "Could not resolve this YouTube link.");
    } finally {
      setYoutubeLoading(false);
    }
  };

  useEffect(() => {
    const savedSong = dashboard.songPick?.trim();
    if (!savedSong || !isLikelyYouTubeUrl(savedSong)) {
      setYoutubeData(null);
      return;
    }

    let active = true;
    resolveYouTubeSong(authToken, savedSong)
      .then((payload) => {
        if (!active) {
          return;
        }
        setYoutubeData({
          videoId: payload.videoId,
          watchUrl: payload.watchUrl,
          embedUrl: payload.embedUrl,
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setYoutubeData(null);
      });

    return () => {
      active = false;
    };
  }, [authToken, dashboard.songPick]);

  const toggleNowPlaying = async () => {
    if (activePlayback.type === "preview" && audioRef.current) {
      if (activePlayback.isPlaying) {
        audioRef.current.pause();
        setActivePlayback((prev) => ({ ...prev, isPlaying: false }));
      } else {
        try {
          await audioRef.current.play();
          setActivePlayback((prev) => ({ ...prev, isPlaying: true }));
        } catch {
          setSongsError("Could not resume playback.");
        }
      }
      return;
    }

    if (activePlayback.type === "youtube" && youtubeData) {
      if (activePlayback.isPlaying) {
        setYoutubePlaybackUrl("");
        setActivePlayback((prev) => ({ ...prev, isPlaying: false }));
      } else {
        setYoutubePlaybackUrl(`${youtubeData.embedUrl}&autoplay=1`);
        setActivePlayback((prev) => ({ ...prev, isPlaying: true }));
      }
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
          <div className="todo-input-row">
            <input
              value={youtubeInput}
              onChange={(event) => setYoutubeInput(event.target.value)}
              placeholder="Paste YouTube link to stream"
            />
            <button type="button" onClick={handleApplyYouTubeSong} disabled={youtubeLoading}>
              {youtubeLoading ? "Linking..." : "Play from YouTube"}
            </button>
          </div>
          {youtubeError ? <p>{youtubeError}</p> : null}
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

          <div className="now-playing-box">
            <p>Active playing rn</p>
            <strong>{activePlayback.label}</strong>
            <div className="song-actions">
              <button
                type="button"
                onClick={toggleNowPlaying}
                disabled={activePlayback.type === "none"}
              >
                {activePlayback.isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={stopCurrentPreview}
                disabled={activePlayback.type === "none"}
              >
                Stop
              </button>
            </div>
          </div>

          {youtubePlaybackUrl ? (
            <iframe
              title="Hidden YouTube player"
              src={youtubePlaybackUrl}
              width="1"
              height="1"
              style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
              allow="autoplay; encrypted-media"
            />
          ) : null}
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
          <h3>Mini Gallery</h3>
          {activeDashboardMedia ? (
            <div className="dash-mini-gallery-single">
              <img
                key={activeDashboardMedia}
                className="dash-mini-gallery-media"
                src={activeDashboardMedia}
                alt="Gallery slideshow preview"
              />
            </div>
          ) : (
            <p>Add images to gallery to show slideshow preview here.</p>
          )}
          <button type="button" onClick={() => navigate("/gallery")}>
            Open Full Gallery
          </button>
        </div>

        <div className="couple-card">
          <h3>Explore App</h3>
          <p>Jump to every section quickly.</p>
          <div className="dash-links-grid">
            <button type="button" onClick={() => navigate("/")}>Dashboard</button>
            <button type="button" onClick={() => navigate("/hub")}>Hub</button>
            <button type="button" onClick={() => navigate("/letters")}>Letters</button>
            <button type="button" onClick={() => navigate("/gallery")}>Gallery</button>
            <button type="button" onClick={() => navigate("/marry-me")}>Marriage Certificate</button>
            <button type="button" onClick={onLogout}>Logout</button>
          </div>
        </div>

        <div className="couple-card">
          <h3>Game Zone</h3>
          <p>{gamePrompt}</p>
          <button type="button" onClick={refreshGamePrompt}>
            New challenge
          </button>
          <LoveRunnerGame />
        </div>
      </section>
    </main>
  );
}

export default CoupleMain;