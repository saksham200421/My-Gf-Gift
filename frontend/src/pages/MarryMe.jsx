import { useEffect, useMemo, useRef, useState } from "react";
import fallbackImage from "../assets/Omegle_(2).png";

const marriageImageModules = import.meta.glob(
  "../assets/marriage-photos/*.{png,jpg,jpeg,webp,avif,gif}",
  {
    eager: true,
    import: "default",
  }
);

const galleryImageModules = import.meta.glob("../assets/gallery-media/*.{png,jpg,jpeg,webp,avif,gif}", {
  eager: true,
  import: "default",
});

const galleryVideoModules = import.meta.glob("../assets/gallery-media/*.{mp4,webm,ogg,mov,m4v}", {
  eager: true,
  import: "default",
});

const GRID_SLOTS = 6;
const WEDDING_SONG_URL = "/wedding-song/wedding.mp3";

const shuffleList = (list) => {
  const clone = [...list];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
};

function MarryMe() {
  const [partnerOne, setPartnerOne] = useState("Your Name");
  const [partnerTwo, setPartnerTwo] = useState("Her Name");
  const [ceremonyDate, setCeremonyDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [activeIndexes, setActiveIndexes] = useState(() =>
    Array.from({ length: GRID_SLOTS }, () => 0)
  );
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [songError, setSongError] = useState("");
  const [responseLabel, setResponseLabel] = useState("");
  const [showStamp, setShowStamp] = useState(false);
  const [noChaosTick, setNoChaosTick] = useState(0);
  const audioRef = useRef(null);

  const galleryMedia = useMemo(() => {
    const marriageImages = Object.values(marriageImageModules)
      .filter(Boolean)
      .map((src, index) => ({
        id: `marriage-image-${index}`,
        type: "image",
        src,
      }));

    const galleryImages = Object.values(galleryImageModules)
      .filter(Boolean)
      .map((src, index) => ({
        id: `gallery-image-${index}`,
        type: "image",
        src,
      }));

    const galleryVideos = Object.values(galleryVideoModules)
      .filter(Boolean)
      .map((src, index) => ({
        id: `gallery-video-${index}`,
        type: "video",
        src,
      }));

    const merged = [...marriageImages, ...galleryImages, ...galleryVideos];
    if (!merged.length) {
      return [
        {
          id: "fallback-image",
          type: "image",
          src: fallbackImage,
        },
      ];
    }

    return merged;
  }, []);

  const slidesByPanel = useMemo(() => {
    const shuffled = shuffleList(galleryMedia);
    const buckets = Array.from({ length: GRID_SLOTS }, () => []);

    shuffled.forEach((item, itemIndex) => {
      buckets[itemIndex % GRID_SLOTS].push(item);
    });

    return buckets.map((bucket, bucketIndex) => {
      if (bucket.length) {
        return bucket;
      }

      return [galleryMedia[bucketIndex % galleryMedia.length]];
    });
  }, [galleryMedia]);

  useEffect(() => {
    const timers = slidesByPanel.map((bucket, bucketIndex) => {
      const intervalMs = 2600 + Math.floor(Math.random() * 2200);
      return window.setInterval(() => {
        setActiveIndexes((prev) => {
          const next = [...prev];
          next[bucketIndex] = (next[bucketIndex] + 1) % bucket.length;
          return next;
        });
      }, intervalMs);
    });

    return () => {
      timers.forEach((timer) => window.clearInterval(timer));
    };
  }, [slidesByPanel]);

  useEffect(() => {
    let cancelled = false;

    const setupWeddingSong = async () => {
      const audio = new Audio(WEDDING_SONG_URL);
      audio.loop = true;
      audio.volume = 0.5;
      audio.preload = "auto";
      audioRef.current = audio;

      audio.addEventListener("error", () => {
        if (!cancelled) {
          setSongError("Add your MP3 at /public/wedding-song/wedding.mp3");
          setMusicPlaying(false);
        }
      });

      try {
        await audio.play();
        if (!cancelled) {
          setMusicPlaying(true);
          setAutoplayBlocked(false);
          setSongError("");
        }
      } catch {
        if (!cancelled) {
          setAutoplayBlocked(true);
          setMusicPlaying(false);
        }
      }
    };

    setupWeddingSong();

    return () => {
      cancelled = true;
      setMusicPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      audioRef.current = null;
    };
  }, []);

  const toggleMusic = async () => {
    if (!audioRef.current) {
      return;
    }

    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
      return;
    }

    try {
      await audioRef.current.play();
      setMusicPlaying(true);
      setAutoplayBlocked(false);
      setSongError("");
    } catch {
      setAutoplayBlocked(true);
    }
  };

  const triggerYesStamp = () => {
    setResponseLabel("It is ALWAYS a YES 💍");
    setShowStamp(false);
    window.setTimeout(() => setShowStamp(true), 10);
  };

  const handleYesClick = () => {
    triggerYesStamp();
  };

  const handleNoClick = () => {
    setNoChaosTick((prev) => prev + 1);
    triggerYesStamp();
  };

  return (
    <main className="marry-page">
      <section className="marry-slideshow-grid" aria-hidden="true">
        {slidesByPanel.map((slides, panelIndex) => (
          <div className="marry-slide-panel" key={`panel-${panelIndex}`}>
            {slides.map((slide, slideIndex) => (
              slide.type === "video" ? (
                <video
                  className={`marry-slide${activeIndexes[panelIndex] === slideIndex ? " is-active" : ""}`}
                  key={`${panelIndex}-${slide.id}`}
                  src={slide.src}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="auto"
                />
              ) : (
                <div
                  className={`marry-slide${activeIndexes[panelIndex] === slideIndex ? " is-active" : ""}`}
                  key={`${panelIndex}-${slide.id}`}
                  style={{ backgroundImage: `url(${slide.src})` }}
                />
              )
            ))}
          </div>
        ))}
      </section>

      <div className="marry-overlay" />

      <section className="marry-certificate" role="region" aria-label="Marriage certificate">
        {showStamp ? <div className="marry-stamp">APPROVED · YES</div> : null}
        <p className="marry-kicker">For a Lifetime of Love</p>
        <h1>Will You Marry Me?</h1>
        <p className="marry-subtitle">Officially unofficial, but emotionally very real.</p>

        <div className="marry-form-grid">
          <label>
            Groom
            <input value={partnerOne} onChange={(event) => setPartnerOne(event.target.value)} />
          </label>
          <label>
            Bride
            <input value={partnerTwo} onChange={(event) => setPartnerTwo(event.target.value)} />
          </label>
          <label className="marry-date-field">
            Ceremony Date
            <input
              type="date"
              value={ceremonyDate}
              onChange={(event) => setCeremonyDate(event.target.value)}
            />
          </label>
        </div>

        <div className="marry-declaration">
          <p>
            Do you <strong>{partnerOne || "Your Name"}</strong> take <strong>{partnerTwo || "Her Name"}</strong> to be your lawful wedded spouse, and do <strong>{partnerTwo || "Her Name"}</strong> take <strong>{partnerOne || "Your Name"}</strong> to be your lawful wedded Husband, to have and to hold from this day forward, for better or for worse, for richer or for poorer, in sickness and in health, until death do you part?
          </p>
          <p>Signed on {new Date(ceremonyDate).toLocaleDateString("en-US", { dateStyle: "long" })}.</p>
        </div>

        <div className="marry-signatures">
          <span>{partnerOne || "Your Name"}</span>
          <span>{partnerTwo || "Her Name"}</span>
        </div>

        <div className="marry-choice-row">
          <button type="button" className="marry-choice-yes" onClick={handleYesClick}>Yes</button>
          <button
            key={`no-${noChaosTick}`}
            type="button"
            className="marry-choice-no is-chaos"
            onClick={handleNoClick}
          >
            No
          </button>
        </div>
        {responseLabel ? <p className="marry-response">{responseLabel}</p> : null}

        <div className="marry-audio-row">
          <button type="button" onClick={toggleMusic}>
            {musicPlaying ? "Pause Wedding Song" : "Play Wedding Song"}
          </button>
          {autoplayBlocked ? <p>Tap Play once if your browser blocked autoplay.</p> : null}
          {songError ? <p>{songError}</p> : null}
        </div>
      </section>
    </main>
  );
}

export default MarryMe;