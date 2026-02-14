import { useEffect, useMemo, useRef, useState } from "react";
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
  const [readyMap, setReadyMap] = useState({});
  const videoReadyRef = useRef({});

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
    mediaItems.forEach((item) => {
      if (item.type !== "image") {
        return;
      }

      const image = new Image();
      image.onload = () => {
        setReadyMap((prev) => {
          if (prev[item.id]) {
            return prev;
          }
          return { ...prev, [item.id]: true };
        });
      };
      image.src = item.src;
    });
  }, [mediaItems]);

  useEffect(() => {
    const nextInitialIndexes = slidesByPanel.map((slides) => {
      const imageIndex = slides.findIndex((item) => item.type === "image");
      return imageIndex >= 0 ? imageIndex : 0;
    });

    setActiveIndexes(nextInitialIndexes);
  }, [slidesByPanel]);

  useEffect(() => {
    const timers = slidesByPanel.map((bucket, bucketIndex) => {
      const intervalMs = 4000;
      return window.setInterval(() => {
        setActiveIndexes((prev) => {
          const next = [...prev];
          const currentIndex = next[bucketIndex] ?? 0;
          const readyIndexes = bucket
            .map((item, itemIndex) => {
              if (item.type === "image" && readyMap[item.id]) {
                return itemIndex;
              }
              return videoReadyRef.current[`${bucketIndex}-${itemIndex}`] ? itemIndex : -1;
            })
            .filter((itemIndex) => itemIndex >= 0);

          if (!readyIndexes.length) {
            return next;
          }

          if (readyIndexes.length === 1) {
            next[bucketIndex] = readyIndexes[0];
            return next;
          }

          const candidates = readyIndexes.filter((itemIndex) => itemIndex !== currentIndex);
          if (!candidates.length) {
            return next;
          }
          const randomIndex = candidates[Math.floor(Math.random() * candidates.length)];
          next[bucketIndex] = randomIndex;
          return next;
        });
      }, intervalMs);
    });

    return () => {
      timers.forEach((timer) => window.clearInterval(timer));
    };
  }, [readyMap, slidesByPanel]);

  return (
    <main className="gallery-page">
      <section className="gallery-grid" aria-label="Mixed media gallery slideshow">
        {slidesByPanel.map((slides, panelIndex) => (
          <div className="gallery-panel" key={`panel-${panelIndex}`}>
            <div
              className="gallery-panel-fallback"
              style={{ backgroundImage: `url(${fallbackImage})` }}
            />
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
                    preload="auto"
                    poster={fallbackImage}
                    onLoadedData={() => {
                      videoReadyRef.current[`${panelIndex}-${itemIndex}`] = true;
                      setReadyMap((prev) => {
                        if (prev[item.id]) {
                          return prev;
                        }
                        return { ...prev, [item.id]: true };
                      });
                    }}
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
    </main>
  );
}

export default Gallery;