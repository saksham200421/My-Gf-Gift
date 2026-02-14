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
  const chimeControllerRef = useRef(null);

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

    const setupWeddingMarch = async () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        setSongError("Your browser does not support wedding march audio.");
        return;
      }

      const audioContext = new AudioContextClass();
      const activeNodes = new Set();
      let patternTimer = null;

      const weddingMarchPattern = [
        { melody: 392.0, chord: [261.63, 329.63], duration: 0.55 },
        { melody: 523.25, chord: [261.63, 392.0], duration: 0.55 },
        { melody: 659.25, chord: [329.63, 523.25], duration: 0.8 },
        { melody: 587.33, chord: [293.66, 440.0], duration: 0.6 },
        { melody: 523.25, chord: [261.63, 392.0], duration: 0.9 },
        { melody: 392.0, chord: [246.94, 392.0], duration: 0.55 },
        { melody: 493.88, chord: [246.94, 369.99], duration: 0.55 },
        { melody: 587.33, chord: [293.66, 440.0], duration: 0.8 },
        { melody: 523.25, chord: [261.63, 392.0], duration: 0.65 },
        { melody: 493.88, chord: [246.94, 369.99], duration: 0.65 },
        { melody: 440.0, chord: [220.0, 329.63], duration: 1.1 },
      ];

      const patternDuration =
        weddingMarchPattern.reduce((sum, note) => sum + note.duration, 0) + 0.9;

      const playOrganTone = (frequency, startTime, duration, gainValue) => {
        const mainOscillator = audioContext.createOscillator();
        const octaveOscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filterNode = audioContext.createBiquadFilter();

        mainOscillator.type = "triangle";
        octaveOscillator.type = "sine";
        filterNode.type = "lowpass";
        filterNode.frequency.setValueAtTime(1900, startTime);

        mainOscillator.frequency.setValueAtTime(frequency, startTime);
        octaveOscillator.frequency.setValueAtTime(frequency * 2, startTime);

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        mainOscillator.connect(filterNode);
        octaveOscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(audioContext.destination);

        mainOscillator.start(startTime);
        octaveOscillator.start(startTime);
        mainOscillator.stop(startTime + duration + 0.03);
        octaveOscillator.stop(startTime + duration + 0.03);

        activeNodes.add(mainOscillator);
        activeNodes.add(octaveOscillator);

        mainOscillator.onended = () => activeNodes.delete(mainOscillator);
        octaveOscillator.onended = () => activeNodes.delete(octaveOscillator);
      };

      const playPattern = () => {
        let cursor = audioContext.currentTime + 0.08;

        weddingMarchPattern.forEach((note) => {
          playOrganTone(note.melody, cursor, note.duration * 0.95, 0.16);
          note.chord.forEach((chordNote) => {
            playOrganTone(chordNote, cursor, note.duration * 0.95, 0.08);
          });
          playOrganTone(note.chord[0] / 2, cursor, note.duration * 0.95, 0.05);
          cursor += note.duration;
        });
      };

      const start = async () => {
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }
        if (patternTimer) {
          return;
        }
        playPattern();
        patternTimer = window.setInterval(playPattern, patternDuration * 1000);
      };

      const stop = () => {
        if (patternTimer) {
          window.clearInterval(patternTimer);
          patternTimer = null;
        }
        activeNodes.forEach((node) => {
          try {
            node.stop();
          } catch {
            return;
          }
        });
        activeNodes.clear();
      };

      chimeControllerRef.current = {
        start,
        stop,
        context: audioContext,
      };

      try {
        await start();
        if (!cancelled) {
          setMusicPlaying(true);
          setAutoplayBlocked(false);
          setSongError("");
        }
      } catch {
        if (!cancelled) {
          setMusicPlaying(false);
          setAutoplayBlocked(true);
        }
      }
    };

    setupWeddingMarch();

    return () => {
      cancelled = true;
      setMusicPlaying(false);
      if (chimeControllerRef.current) {
        chimeControllerRef.current.stop();
        if (chimeControllerRef.current.context?.state !== "closed") {
          chimeControllerRef.current.context.close().catch(() => {});
        }
      }
      chimeControllerRef.current = null;
    };
  }, []);

  const toggleMusic = async () => {
    if (!chimeControllerRef.current) {
      return;
    }

    if (musicPlaying) {
      chimeControllerRef.current.stop();
      setMusicPlaying(false);
      return;
    }

    try {
      await chimeControllerRef.current.start();
      setMusicPlaying(true);
      setAutoplayBlocked(false);
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
            {musicPlaying ? "Pause Wedding March" : "Play Wedding March"}
          </button>
          {autoplayBlocked ? <p>Tap Play once if your browser blocked autoplay.</p> : null}
          {songError ? <p>{songError}</p> : null}
        </div>
      </section>
    </main>
  );
}

export default MarryMe;