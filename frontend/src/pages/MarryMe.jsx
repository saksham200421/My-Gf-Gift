import { useEffect, useMemo, useRef, useState } from "react";
import fallbackImage from "../assets/Omegle_(2).png";

const galleryModules = import.meta.glob(
  "../assets/marriage-photos/*.{png,jpg,jpeg,webp,avif,gif}",
  {
    eager: true,
    import: "default",
  }
);

const GRID_SLOTS = 6;

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
  const audioRef = useRef(null);

  const galleryImages = useMemo(() => {
    const collected = Object.values(galleryModules).filter(Boolean);
    return collected.length ? collected : [fallbackImage];
  }, []);

  const slidesByPanel = useMemo(() => {
    const shuffled = shuffleList(galleryImages);
    const buckets = Array.from({ length: GRID_SLOTS }, () => []);

    shuffled.forEach((image, imageIndex) => {
      buckets[imageIndex % GRID_SLOTS].push(image);
    });

    return buckets.map((bucket, bucketIndex) =>
      bucket.length ? bucket : [galleryImages[bucketIndex % galleryImages.length]]
    );
  }, [galleryImages]);

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
    const audio = new Audio("/wedding-song.mp3");
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;

    audio
      .play()
      .then(() => {
        setMusicPlaying(true);
        setAutoplayBlocked(false);
      })
      .catch(() => {
        setMusicPlaying(false);
        setAutoplayBlocked(true);
      });

    return () => {
      audio.pause();
      audio.currentTime = 0;
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
    } catch {
      setAutoplayBlocked(true);
    }
  };

  return (
    <main className="marry-page">
      <section className="marry-slideshow-grid" aria-hidden="true">
        {slidesByPanel.map((slides, panelIndex) => (
          <div className="marry-slide-panel" key={`panel-${panelIndex}`}>
            {slides.map((slide, slideIndex) => (
              <div
                className={`marry-slide${activeIndexes[panelIndex] === slideIndex ? " is-active" : ""}`}
                key={`${panelIndex}-${slideIndex}`}
                style={{ backgroundImage: `url(${slide})` }}
              />
            ))}
          </div>
        ))}
      </section>

      <div className="marry-overlay" />

      <section className="marry-certificate" role="region" aria-label="Marriage certificate">
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
            This certifies that <strong>{partnerOne || "Your Name"}</strong> and{" "}
            <strong>{partnerTwo || "Her Name"}</strong> are bound by laughter, loyalty, and love.
          </p>
          <p>Signed on {new Date(ceremonyDate).toLocaleDateString("en-US", { dateStyle: "long" })}.</p>
        </div>

        <div className="marry-signatures">
          <span>{partnerOne || "Your Name"}</span>
          <span>{partnerTwo || "Her Name"}</span>
        </div>

        <div className="marry-audio-row">
          <button type="button" onClick={toggleMusic}>
            {musicPlaying ? "Pause Wedding Song" : "Play Wedding Song"}
          </button>
          {autoplayBlocked ? <p>Tap Play once if your browser blocked autoplay.</p> : null}
        </div>
      </section>
    </main>
  );
}

export default MarryMe;