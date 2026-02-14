import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDashboardChatMessage,
  addDashboardTodo,
  deleteDashboardOccasion,
  deleteDashboardTodo,
  fetchDashboard,
  performDashboardVirtualPetAction,
  resolveYouTubeSong,
  searchSongs,
  searchPlace,
  sendDashboardPing,
  toggleDashboardDate,
  updateDashboardVirtualPetName,
  upsertDashboardOccasion,
  updateDashboardFields,
  updateDashboardTodo,
} from "../utils/api";
import LoveRunnerGame from "../components/LoveRunnerGame";

const dashboardGalleryImageModules = import.meta.glob(
  "../assets/gallery-media/*.{png,jpg,jpeg,webp,avif,gif}",
  {
    eager: true,
    import: "default",
  }
);

const dashboardGalleryVideoModules = import.meta.glob(
  "../assets/gallery-media/*.{mp4,webm,ogg,mov,m4v}",
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
  specialOccasions: [],
  messageHistory: [],
  virtualPet: {
    name: "Mochi",
    species: "Love Cat",
    mood: "happy",
    fullness: 70,
    energy: 72,
    happiness: 78,
    level: 1,
    xp: 0,
    xpToNext: 100,
  },
  thoughtToday: "",
  madReason: "",
  gratitudeNote: "",
  datePlan: "",
  smallWin: "",
  dashboardTheme: "soft-blush",
  dashboardBackgroundTheme: "rose-glow",
  wannaGoTo: "",
  todos: [],
};

const foodQuickPicks = ["Pizza", "Pasta", "Biryani", "Sushi", "Burger", "Chaat"];
const moodQuickPicks = ["Happy", "Calm", "Romantic", "Chaotic", "Tired", "Goofy"];
const gameFallbackPrompts = [
  "Maintain eye contact for 30 seconds and say one thing you desire more in this relationship.",
  "Give your partner 5 slow compliments, one every 5 seconds.",
  "Whisper your favorite memory in their ear without breaking eye contact.",
  "Recreate your first date in 60 seconds with dramatic acting.",
  "One partner closes eyes; the other gives 3 soft forehead kisses.",
  "Do a 45-second slow dance with no talking.",
  "Say 3 things that instantly make your heart race about them.",
  "Take turns saying one flirty line each for 60 seconds.",
  "Share your favorite tiny habit of theirs and why it melts you.",
  "Hold hands and describe your dream weekend together in detail.",
  "Give your partner a 20-second shoulder massage swap.",
  "Compliment challenge: no repeating adjectives for 8 compliments.",
  "Describe your partner as if they are a character in a romance movie.",
  "Hug challenge: 40-second hug, no phones, no distractions.",
  "Say your top 3 favorite moments from this month together.",
  "Tell them one fantasy date idea you have never shared.",
  "Play stare game: loser gives winner a sweet peck.",
  "Take turns saying one thing you are grateful for right now.",
  "Do a mini runway walk and let your partner hype you up.",
  "Write one-line love dares for each other and pick one.",
  "Describe your partner in 5 words, then explain each word.",
  "One partner leads a 30-second dance move, the other copies.",
  "Say one playful thing you want to do together tonight.",
  "Close-distance challenge: talk softly for 45 seconds face-to-face.",
  "Share one cute insecurity and let your partner reassure you.",
  "Say one memory that still gives you butterflies.",
  "Give your partner a nickname challenge: invent 3 new cute names.",
  "One partner sits; the other gives a dramatic love confession speech.",
  "Take turns feeding each other one bite of snack or dessert.",
  "Flirty question round: ask 5 rapid-fire questions.",
  "Describe what you noticed first when you met them.",
  "Do a synchronized heartbeat check: hand on chest for 20 seconds.",
  "Say one thing your partner does that instantly calms you.",
  "Hug from behind for 30 seconds and say something sweet.",
  "Plan your next cafe date in exact detail in under 1 minute.",
  "Take turns giving each other 3 cheek kisses.",
  "Create a secret code word for I miss you.",
  "Say one playful promise for this weekend.",
  "Compliment their eyes, smile, and voice in one sentence each.",
  "Pretend you are in a rain scene and deliver a movie-style line.",
  "Do a hand-kiss challenge: one kiss on each finger.",
  "Take turns saying I choose you in different funny voices.",
  "Say one thing you want to improve as a partner.",
  "Mirror challenge: mimic each other’s expression for 30 seconds.",
  "Give each other a soft forehead touch and breathe together.",
  "Pick a song and share why it reminds you of your partner.",
  "Do a countdown: 3 things you love, 2 things you admire, 1 wish.",
  "Share your favorite photo memory and recreate the pose.",
  "Say one message you needed to hear today from your partner.",
  "Make a 2-step bedtime ritual you both promise to follow.",
  "Take turns narrating each other like a celebrity introduction.",
  "One partner gives 5-second compliments; other can only smile.",
  "Say one reason you feel lucky in this relationship.",
  "Do a 20-second nose-to-nose closeness challenge.",
  "Ask your partner one bold but respectful romantic question.",
  "Give each other a 30-second hand massage.",
  "Complete this line: With you, I feel... three different ways.",
  "Create a mini bucket list with 3 couple adventures.",
  "Choose one memory and retell it with exaggerated drama.",
  "Say one cute thing you noticed about them today.",
  "Do a laugh challenge: make each other laugh in 20 seconds.",
  "Take turns saying your favorite us moment from last year.",
  "Plan a no-phone date for 45 minutes this week.",
  "Give your partner a 10-word poem right now.",
  "One partner closes eyes, other gives voice-only compliments.",
  "Say one thing you admire about their emotional strength.",
  "Do a synchronized deep-breathing moment for 25 seconds.",
  "Create one shared affirmation and repeat it together.",
  "Tell your partner the exact moment you knew you liked them.",
  "Take turns saying a playful marry me style line.",
  "Whisper one future plan involving just the two of you.",
  "Give each other a 3-line appreciation speech.",
  "Challenge: no thank you phrase — express gratitude differently 3 times.",
  "Choose one song and do a 30-second close dance.",
  "Take turns sharing one random thing that turns your mood better.",
  "Say one reason you trust your partner deeply.",
  "Do a mini red-carpet walk and crown each other most lovable.",
  "Create a private inside joke in under 1 minute.",
  "One partner says 5 wishes; other chooses one to fulfill soon.",
  "Say one tiny non-physical gesture that makes you feel loved.",
  "Give your partner 3 playful dares; they pick one.",
  "Take a selfie challenge with your best in-love expression.",
  "Describe your perfect Sunday together from morning to night.",
  "Say one thing that made you miss them recently.",
  "Do a gratitude relay: alternate 6 reasons you appreciate each other.",
  "Give your partner a dramatic title and explain why they deserve it.",
  "Talk only in compliments for the next 40 seconds.",
  "Take turns giving one-sentence pep talks to each other.",
  "Say your top 2 comfort activities to do together after a hard day.",
  "Plan a dessert-only date right now: place, time, and outfit vibe.",
  "Give one genuine apology for a small thing and one warm hug.",
  "Name one couple habit you want to protect forever.",
  "Do a cheek-to-cheek 20-second calm moment.",
  "Pick a romantic scene from a movie and recreate one line.",
  "Say one thing you love about their mind and one about their heart.",
  "Take turns saying You look amazing in 5 different styles.",
  "Choose one challenge for tomorrow morning and commit to it.",
  "Do a quick trust check: share one fear and one comfort statement.",
  "Say one thing your partner does better than anyone else.",
  "Write and read a one-line vow for this month.",
  "End with a 30-second silent cuddle and closed eyes.",
];

const thoughtPrompts = [
  "Today I want us to be softer with each other.",
  "No ego day: hug first, argue later.",
  "I want more laughter with you tonight.",
  "Let’s protect our peace and talk with love.",
  "You are my calm place, even on messy days.",
  "Today I choose us, no matter how busy life gets.",
];

const calmRewritePrompts = [
  "I need 5 mins and then a hug.",
  "I felt hurt; can we talk gently for 10 mins?",
  "I need reassurance right now, not distance.",
  "Let’s reset this with one honest conversation.",
  "I’m upset, but I still want us on the same team.",
  "Can we pause and start again with softer words?",
];

const gratitudeTemplates = [
  "Thank you for being patient with me today.",
  "I love how you make ordinary moments feel special.",
  "Thank you for listening even when I’m complicated.",
  "You make me feel chosen every single day.",
  "I appreciate how you show up for us consistently.",
  "Thank you for being my comfort and my chaos partner.",
];

const datePlanSuggestionsByBudget = {
  low: [
    "budget date: roadside chai + long walk + one candid photo.",
    "budget date: home snacks + playlist swap + balcony talk.",
    "budget date: sunset walk + ice cream + one voice note each.",
  ],
  mid: [
    "budget date: cafe hop + photo challenge + cozy chat.",
    "budget date: movie + dessert + memory quiz.",
    "budget date: bowling/arcade + street food + random gift under ₹300.",
  ],
  high: [
    "budget date: fine dinner + handwritten note exchange.",
    "budget date: spa + dinner + moonlight drive.",
    "budget date: staycation evening + room decor surprise.",
  ],
};

const smallWinTemplates = [
  "Our day rating: {stars}/5 because we still showed up for each other.",
  "Win {stars}/5: we listened first and reacted later.",
  "{stars}/5 today — tiny efforts, big love.",
  "We earned {stars}/5 for choosing kindness in small moments.",
  "{stars}/5 because we stayed connected even when busy.",
  "{stars}/5: imperfect day, perfect team.",
];

const petMoodFaces = {
  excited: "😻",
  happy: "😺",
  calm: "🐾",
  sleepy: "😴",
  hungry: "🥺",
  sad: "😿",
};

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

const dashboardThemeOptions = [
  { id: "soft-blush", label: "Soft Blush" },
  { id: "sweet-lilac", label: "Sweet Lilac" },
  { id: "dreamy-sky", label: "Dreamy Sky" },
  { id: "midnight-rose", label: "Midnight Rose" },
  { id: "plum-night", label: "Plum Night" },
  { id: "berry-mist", label: "Berry Mist" },
  { id: "moonlit-ocean", label: "Moonlit Ocean" },
  { id: "dusky-lavender", label: "Dusky Lavender" },
  { id: "velvet-indigo", label: "Velvet Indigo" },
  { id: "cocoa-petal", label: "Cocoa Petal" },
  { id: "noir-romance", label: "Noir Romance" },
];

const dashboardBackgroundOptions = [
  { id: "rose-glow", label: "Rose Glow" },
  { id: "lavender-night", label: "Lavender Night" },
  { id: "moon-blue", label: "Moon Blue" },
  { id: "plum-haze", label: "Plum Haze" },
  { id: "cocoa-dusk", label: "Cocoa Dusk" },
  { id: "starlit-indigo", label: "Starlit Indigo" },
];

const dashboardBodyBackgrounds = {
  "rose-glow": "linear-gradient(135deg, #f5e8f1 0%, #e8ecf8 100%)",
  "lavender-night": "linear-gradient(135deg, #d8d2ea 0%, #cfd8ed 100%)",
  "moon-blue": "linear-gradient(135deg, #d3dced 0%, #cad9f0 100%)",
  "plum-haze": "linear-gradient(135deg, #ddd2e6 0%, #d5d9eb 100%)",
  "cocoa-dusk": "linear-gradient(135deg, #d7ccc9 0%, #d6d3e3 100%)",
  "starlit-indigo": "linear-gradient(135deg, #c8cfe3 0%, #cdd2e7 100%)",
};

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
  const [occasionDate, setOccasionDate] = useState("");
  const [occasionText, setOccasionText] = useState("");
  const [pingStatus, setPingStatus] = useState("");
  const [todoFilter, setTodoFilter] = useState("all");
  const [isSaving, setIsSaving] = useState(false);
  const [gamePrompt, setGamePrompt] = useState("Loading a couple mini-game...");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [moodScale, setMoodScale] = useState(3);
  const [datePlanBudget, setDatePlanBudget] = useState("low");
  const [datePlanTime, setDatePlanTime] = useState("evening");
  const [winStars, setWinStars] = useState(3);
  const [messageDraft, setMessageDraft] = useState("");
  const [chatStatus, setChatStatus] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [petNameDraft, setPetNameDraft] = useState("Mochi");
  const [petStatus, setPetStatus] = useState("");
  const [petLoading, setPetLoading] = useState(false);
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
  const [miniGalleryVideoDurations, setMiniGalleryVideoDurations] = useState({});
  const [dashboardTheme, setDashboardTheme] = useState("soft-blush");
  const [dashboardBackgroundTheme, setDashboardBackgroundTheme] = useState("rose-glow");
  const audioRef = useRef(null);

  const dashboardGalleryPreview = useMemo(() => {
    const images = Object.values(dashboardGalleryImageModules)
      .filter(Boolean)
      .map((src) => ({ type: "image", src }));
    const videos = Object.values(dashboardGalleryVideoModules)
      .filter(Boolean)
      .map((src) => ({ type: "video", src }));

    return [...images, ...videos];
  }, []);

  const activeDashboardMedia =
    dashboardGalleryPreview[miniGalleryIndex % Math.max(dashboardGalleryPreview.length, 1)] || null;

  useEffect(() => {
    fetchDashboard(authToken)
      .then((payload) => {
        const nextDashboard = payload.dashboard || emptyDashboard;
        setDashboard(nextDashboard);
        setPetNameDraft(nextDashboard.virtualPet?.name || "Mochi");
        setYoutubeInput(nextDashboard.songPick || "");
        setDashboardTheme(nextDashboard.dashboardTheme || "soft-blush");
        setDashboardBackgroundTheme(nextDashboard.dashboardBackgroundTheme || "rose-glow");
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

    const activeMedia =
      dashboardGalleryPreview[miniGalleryIndex % Math.max(dashboardGalleryPreview.length, 1)] ||
      null;

    const delay =
      activeMedia?.type === "video"
        ? miniGalleryVideoDurations[activeMedia.src] || 9000
        : 5200;

    const timeout = window.setTimeout(() => {
      setMiniGalleryIndex((prev) => (prev + 1) % dashboardGalleryPreview.length);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [dashboardGalleryPreview, miniGalleryIndex, miniGalleryVideoDurations]);

  const handleMiniGalleryVideoMetadata = (event, src) => {
    const durationSeconds = Number(event.currentTarget?.duration || 0);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      return;
    }

    const durationMs = Math.max(2500, Math.round(durationSeconds * 1000) + 250);
    setMiniGalleryVideoDurations((prev) => {
      if (prev[src] === durationMs) {
        return prev;
      }
      return {
        ...prev,
        [src]: durationMs,
      };
    });
  };

  useEffect(() => {
    const previousBodyBackground = document.body.style.background;
    const nextBackground =
      dashboardBodyBackgrounds[dashboardBackgroundTheme] || dashboardBodyBackgrounds["rose-glow"];

    document.body.style.background = nextBackground;

    return () => {
      document.body.style.background = previousBodyBackground;
    };
  }, [dashboardBackgroundTheme]);

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
        hasOccasion: dashboard.specialOccasions.some((occasion) => occasion.dateKey === key),
      });
    }

    return cells;
  }, [monthDate, dashboard.highlightedDates, dashboard.specialOccasions]);

  const monthOccasions = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = String(monthDate.getMonth() + 1).padStart(2, "0");
    const prefix = `${year}-${month}-`;

    return (dashboard.specialOccasions || [])
      .filter((item) => item.dateKey.startsWith(prefix))
      .sort((first, second) => first.dateKey.localeCompare(second.dateKey));
  }, [dashboard.specialOccasions, monthDate]);

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

  const handleSaveOccasion = async () => {
    const dateKey = occasionDate.trim();
    const text = occasionText.trim();

    if (!dateKey || !text) {
      return;
    }

    try {
      const payload = await upsertDashboardOccasion(authToken, dateKey, text);
      setDashboard(payload.dashboard || emptyDashboard);
      setLastSavedAt(new Date());
    } catch {
      return;
    }
  };

  const handleDeleteOccasion = async (dateKey) => {
    try {
      const payload = await deleteDashboardOccasion(authToken, dateKey);
      setDashboard(payload.dashboard || emptyDashboard);
      if (occasionDate === dateKey) {
        setOccasionText("");
      }
      setLastSavedAt(new Date());
    } catch {
      return;
    }
  };

  const handlePing = async () => {
    try {
      const payload = await sendDashboardPing(authToken);
      setPingStatus(payload.message || "Ping sent.");
    } catch (error) {
      setPingStatus(error.message || "Could not send ping.");
    }
  };

  const handleSendMessage = async () => {
    const text = messageDraft.trim();
    if (!text) {
      setChatStatus("Type a message first.");
      return;
    }

    setChatSending(true);
    setChatStatus("");
    try {
      const payload = await addDashboardChatMessage(authToken, text);
      setDashboard(payload.dashboard || emptyDashboard);
      setMessageDraft("");
      setLastSavedAt(new Date());
    } catch (error) {
      setChatStatus(error.message || "Could not send message.");
    } finally {
      setChatSending(false);
    }
  };

  const handlePetAction = async (action) => {
    setPetLoading(true);
    setPetStatus("");
    try {
      const payload = await performDashboardVirtualPetAction(authToken, action);
      const nextDashboard = payload.dashboard || emptyDashboard;
      setDashboard(nextDashboard);
      setPetNameDraft(nextDashboard.virtualPet?.name || "Mochi");
      setPetStatus("Your pet loved that ✨");
      setLastSavedAt(new Date());
    } catch (error) {
      setPetStatus(error.message || "Could not update pet right now.");
    } finally {
      setPetLoading(false);
    }
  };

  const handleSavePetName = async () => {
    const nextName = petNameDraft.trim();
    if (!nextName) {
      setPetStatus("Give your pet a name first.");
      return;
    }

    setPetLoading(true);
    setPetStatus("");
    try {
      const payload = await updateDashboardVirtualPetName(authToken, nextName);
      const nextDashboard = payload.dashboard || emptyDashboard;
      setDashboard(nextDashboard);
      setPetNameDraft(nextDashboard.virtualPet?.name || nextName);
      setPetStatus("Pet name saved 💖");
      setLastSavedAt(new Date());
    } catch (error) {
      setPetStatus(error.message || "Could not save pet name.");
    } finally {
      setPetLoading(false);
    }
  };

  const virtualPet = dashboard.virtualPet || emptyDashboard.virtualPet;
  const petFace = petMoodFaces[virtualPet.mood] || "🐾";
  const petMoodClass = `pet-mood-${String(virtualPet.mood || "calm").toLowerCase()}`;
  const petXpProgress = Math.max(
    0,
    Math.min(
      100,
      Math.round(((virtualPet.xp || 0) / Math.max(1, virtualPet.xpToNext || 100)) * 100)
    )
  );

  const applyThoughtPrompt = async () => {
    const nextThought = pickRandom(thoughtPrompts);
    setDashboard((prev) => ({ ...prev, thoughtToday: nextThought }));
    await patchDashboard({ thoughtToday: nextThought });
  };

  const applyCalmRewrite = async () => {
    const nextReason = pickRandom(calmRewritePrompts);
    setDashboard((prev) => ({ ...prev, madReason: nextReason }));
    await patchDashboard({ madReason: nextReason });
  };

  const applyGratitudeTemplate = async () => {
    const nextTemplate = pickRandom(gratitudeTemplates);
    setDashboard((prev) => ({ ...prev, gratitudeNote: nextTemplate }));
    await patchDashboard({ gratitudeNote: nextTemplate });
  };

  const applyDatePlanSuggestion = async () => {
    const pool = datePlanSuggestionsByBudget[datePlanBudget] || datePlanSuggestionsByBudget.low;
    const nextPlan = `${datePlanTime} ${pickRandom(pool)}`;
    setDashboard((prev) => ({ ...prev, datePlan: nextPlan }));
    await patchDashboard({ datePlan: nextPlan });
  };

  const applySmallWinSuggestion = async () => {
    const template = pickRandom(smallWinTemplates);
    const nextSmallWin = template.replace("{stars}", String(winStars));
    setDashboard((prev) => ({ ...prev, smallWin: nextSmallWin }));
    await patchDashboard({ smallWin: nextSmallWin });
  };

  return (
    <main
      className={`couple-page couple-theme-${dashboardTheme} couple-bg-${dashboardBackgroundTheme}`}
    >
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
          <div className="calendar-occasion-row">
            <input
              type="date"
              value={occasionDate}
              onChange={(event) => setOccasionDate(event.target.value)}
            />
            <input
              type="text"
              value={occasionText}
              onChange={(event) => setOccasionText(event.target.value)}
              placeholder="Add special occasion"
            />
            <button type="button" onClick={handleSaveOccasion}>
              Save
            </button>
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
                  className={`calendar-cell ${cell.highlighted ? "highlighted" : ""}${cell.hasOccasion ? " has-occasion" : ""}`}
                  onClick={() => {
                    handleToggleDate(cell.key);
                    setOccasionDate(cell.key);
                    const match = dashboard.specialOccasions.find(
                      (occasion) => occasion.dateKey === cell.key
                    );
                    setOccasionText(match?.text || "");
                  }}
                >
                  {cell.day}
                </button>
              )
            )}
          </div>
          {monthOccasions.length ? (
            <div className="calendar-occasion-list">
              {monthOccasions.map((occasion) => (
                <div key={occasion.dateKey} className="calendar-occasion-item">
                  <span className="calendar-occasion-meta">{occasion.dateKey}</span>
                  <span>{occasion.text}</span>
                  <button type="button" onClick={() => handleDeleteOccasion(occasion.dateKey)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : null}
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
              onClick={applyThoughtPrompt}
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
              onClick={applyCalmRewrite}
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
            onClick={applyGratitudeTemplate}
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
              onClick={applyDatePlanSuggestion}
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
              onClick={applySmallWinSuggestion}
            >
              Generate win note
            </button>
          </div>
        </div>

        <div className="couple-card">
          <h2>Love Snapshot</h2>
          <div className="love-snapshot-grid">
            <div>
              <strong>{dashboard.highlightedDates.length}</strong>
              <span>Highlighted Days</span>
            </div>
            <div>
              <strong>{dashboard.specialOccasions.length}</strong>
              <span>Special Occasions</span>
            </div>
            <div>
              <strong>{dashboard.todos.filter((todo) => todo.done).length}</strong>
              <span>Tasks Completed</span>
            </div>
            <div>
              <strong>{Math.min(100, dashboard.gratitudeNote.trim().length + dashboard.thoughtToday.trim().length)}</strong>
              <span>Connection Score</span>
            </div>
          </div>
        </div>

        <div className="couple-card message-card">
          <h2>Message Box</h2>
          <div className="message-history" role="log" aria-live="polite">
            {(dashboard.messageHistory || []).length ? (
              (dashboard.messageHistory || []).map((item, index) => (
                <div key={`${item.createdAt || "msg"}-${index}`} className="message-item">
                  <p>{item.text}</p>
                  <span>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : "Just now"}
                  </span>
                </div>
              ))
            ) : (
              <p className="message-empty">No messages yet. Start chatting.</p>
            )}
          </div>
          <div className="todo-input-row">
            <input
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
              placeholder="Type message"
              maxLength={500}
            />
            <button type="button" onClick={handleSendMessage} disabled={chatSending}>
              {chatSending ? "Sending..." : "Send"}
            </button>
          </div>
          {chatStatus ? <p>{chatStatus}</p> : null}
        </div>
      </section>

      <section className="couple-col couple-col-right">
        <div className="couple-card">
          <h3>Mini Gallery</h3>
          {activeDashboardMedia ? (
            <div className="dash-mini-gallery-single">
              {activeDashboardMedia.type === "video" ? (
                <video
                  key={activeDashboardMedia.src}
                  className="dash-mini-gallery-media dash-mini-gallery-video"
                  src={activeDashboardMedia.src}
                  autoPlay
                  muted
                  playsInline
                  controls
                  onLoadedMetadata={(event) =>
                    handleMiniGalleryVideoMetadata(event, activeDashboardMedia.src)
                  }
                  onEnded={() => {
                    setMiniGalleryIndex((prev) => (prev + 1) % dashboardGalleryPreview.length);
                  }}
                />
              ) : (
                <img
                  key={activeDashboardMedia.src}
                  className="dash-mini-gallery-media"
                  src={activeDashboardMedia.src}
                  alt="Gallery slideshow preview"
                />
              )}
            </div>
          ) : (
            <p>Add images/videos to gallery to show slideshow preview here.</p>
          )}
          <button type="button" onClick={() => navigate("/gallery")}>
            Open Full Gallery
          </button>
        </div>

        <div className="couple-card">
          <h3>Explore App</h3>
          <p>Jump to every section quickly.</p>
          <button type="button" onClick={handlePing}>Ping</button>
          {pingStatus ? <p>{pingStatus}</p> : null}
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

        <div className={`couple-card pet-card ${petMoodClass}`}>
          <div className="pet-header">
            <h3>Virtual Pet</h3>
            <span className="pet-face" aria-hidden="true">{petFace}</span>
          </div>
          <p>
            {virtualPet.name || "Mochi"} · {virtualPet.species || "Love Cat"} · Mood: {virtualPet.mood || "happy"}
          </p>
          {virtualPet.lastActionAt ? (
            <p className="pet-last-action">
              Last action: {new Date(virtualPet.lastActionAt).toLocaleTimeString()}
            </p>
          ) : null}

          <div className="todo-input-row">
            <input
              value={petNameDraft}
              onChange={(event) => setPetNameDraft(event.target.value)}
              maxLength={40}
              placeholder="Pet name"
            />
            <button type="button" onClick={handleSavePetName} disabled={petLoading}>
              Save
            </button>
          </div>

          <div className="pet-metrics">
            <div className="pet-metric">
              <span>Fullness</span>
              <div className="pet-meter"><i style={{ width: `${virtualPet.fullness || 0}%` }} /></div>
            </div>
            <div className="pet-metric">
              <span>Energy</span>
              <div className="pet-meter"><i style={{ width: `${virtualPet.energy || 0}%` }} /></div>
            </div>
            <div className="pet-metric">
              <span>Happiness</span>
              <div className="pet-meter"><i style={{ width: `${virtualPet.happiness || 0}%` }} /></div>
            </div>
            <div className="pet-metric">
              <span>Level {virtualPet.level || 1} · XP {virtualPet.xp || 0}/{virtualPet.xpToNext || 100}</span>
              <div className="pet-meter pet-meter-xp"><i style={{ width: `${petXpProgress}%` }} /></div>
            </div>
          </div>

          <div className="pet-actions">
            <button type="button" onClick={() => handlePetAction("feed")} disabled={petLoading}>Feed</button>
            <button type="button" onClick={() => handlePetAction("play")} disabled={petLoading}>Play</button>
            <button type="button" onClick={() => handlePetAction("rest")} disabled={petLoading}>Rest</button>
            <button type="button" onClick={() => handlePetAction("cuddle")} disabled={petLoading}>Cuddle</button>
          </div>
          {petStatus ? <p>{petStatus}</p> : null}
        </div>

        <div className="couple-card">
          <h3>Style Mood</h3>
          <p>Pick a soft dashboard vibe.</p>
          <div className="dash-style-grid">
            {dashboardThemeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`dash-style-btn${dashboardTheme === option.id ? " is-active" : ""}`}
                onClick={() => {
                  setDashboardTheme(option.id);
                  setDashboard((prev) => ({ ...prev, dashboardTheme: option.id }));
                  patchDashboard({ dashboardTheme: option.id });
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p>Mix with main background.</p>
          <div className="dash-style-grid">
            {dashboardBackgroundOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`dash-style-btn${dashboardBackgroundTheme === option.id ? " is-active" : ""}`}
                onClick={() => {
                  setDashboardBackgroundTheme(option.id);
                  setDashboard((prev) => ({ ...prev, dashboardBackgroundTheme: option.id }));
                  patchDashboard({ dashboardBackgroundTheme: option.id });
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default CoupleMain;