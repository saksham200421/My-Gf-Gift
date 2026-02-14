import { useEffect, useMemo, useState } from "react";
import fallbackImage from "../assets/Omegle_(2).png";

const imageModules = import.meta.glob("../assets/gallery-media/*.{png,jpg,jpeg,webp,avif,gif}", {
  eager: true,
  import: "default",
});

const videoModules = import.meta.glob("../assets/gallery-media/*.{mp4,webm,ogg,mov,m4v}", {
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

function Gallery() {
  const [activeIndexes, setActiveIndexes] = useState(() =>
    Array.from({ length: GRID_SLOTS }, () => 0)
  );

  const mediaItems = useMemo(() => {
    const images = Object.entries(imageModules).map(([path, src]) => ({
      id: `img-${path}`,
      type: "image",
      src,
    }));

    const videos = Object.entries(videoModules).map(([path, src]) => ({
      id: `vid-${path}`,
      type: "video",
      src,
    }));

    const merged = [...images, ...videos];

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
    const shuffled = shuffleList(mediaItems);
    const buckets = Array.from({ length: GRID_SLOTS }, () => []);

    shuffled.forEach((item, itemIndex) => {
      buckets[itemIndex % GRID_SLOTS].push(item);
    });

    return buckets.map((bucket, bucketIndex) =>
      bucket.length ? bucket : [mediaItems[bucketIndex % mediaItems.length]]
    );
  }, [mediaItems]);

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

  return (
    <main className="gallery-page">
      <section className="gallery-grid" aria-label="Mixed media gallery slideshow">
        {slidesByPanel.map((slides, panelIndex) => (
          <div className="gallery-panel" key={`panel-${panelIndex}`}>
            {slides.map((item, itemIndex) => {
              const isActive = activeIndexes[panelIndex] === itemIndex;
              if (item.type === "video") {
                return (
                  <video
                    key={item.id}
                    className={`gallery-media${isActive ? " is-active" : ""}`}
                    src={item.src}
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                  />
                );
              }

              return (
                <div
                  key={item.id}
                  className={`gallery-media gallery-media--image${isActive ? " is-active" : ""}`}
                  style={{ backgroundImage: `url(${item.src})` }}
                />
              );
            })}
          </div>
        ))}
      </section>

      <section className="gallery-overlay-content">
        <h1>Our Random Memory Gallery</h1>
        <p>Add any number of photos and videos to make this wall alive.</p>
      </section>
    </main>
  );
}

export default Gallery;