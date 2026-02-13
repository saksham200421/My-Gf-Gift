function normalizeItunesTrack(track) {
  return {
    id: track.trackId || `${track.artistName}-${track.trackName}`,
    name: track.trackName || "Unknown Song",
    artist: track.artistName || "Unknown Artist",
    artwork: track.artworkUrl100 || "",
    url: track.trackViewUrl || "",
    previewUrl: track.previewUrl || "",
  };
}

function normalizeAppleSong(song) {
  return {
    id: song.id || `${song.artistName}-${song.name}`,
    name: song.name || "Unknown Song",
    artist: song.artistName || "Unknown Artist",
    artwork: song.artworkUrl100 || "",
    url: song.url || "",
    previewUrl: "",
  };
}

async function fetchItunesPreviewByName(name, artist) {
  const query = `${name} ${artist}`.trim();
  const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(
    query
  )}&entity=song&limit=1`;

  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "CoupleApp/1.0",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const first = Array.isArray(data.results) && data.results.length ? data.results[0] : null;
  if (!first) {
    return null;
  }

  return {
    previewUrl: first.previewUrl || "",
    trackViewUrl: first.trackViewUrl || "",
    artworkUrl100: first.artworkUrl100 || "",
    trackId: first.trackId || null,
  };
}

async function searchSongs(req, res) {
  try {
    const query = String(req.query.query || "").trim();
    const limit = Math.min(Number(req.query.limit || 10) || 10, 25);

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(
      query
    )}&entity=song&limit=${limit}`;

    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "CoupleApp/1.0",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ message: "Music provider unavailable" });
    }

    const data = await response.json();
    const songs = Array.isArray(data.results)
      ? data.results.map(normalizeItunesTrack)
      : [];

    return res.json({ songs });
  } catch (error) {
    return res.status(500).json({ message: "Failed to search songs" });
  }
}

async function latestSongs(req, res) {
  try {
    const country = String(req.query.country || "us").toLowerCase();
    const limit = Math.min(Number(req.query.limit || 12) || 12, 25);

    const endpoint = `https://rss.applemarketingtools.com/api/v2/${encodeURIComponent(
      country
    )}/music/most-played/${limit}/songs.json`;

    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "CoupleApp/1.0",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ message: "Latest songs feed unavailable" });
    }

    const data = await response.json();
    const baseSongs = Array.isArray(data?.feed?.results)
      ? data.feed.results.map(normalizeAppleSong)
      : [];

    const songs = await Promise.all(
      baseSongs.map(async (song) => {
        try {
          const preview = await fetchItunesPreviewByName(song.name, song.artist);
          if (!preview) {
            return song;
          }

          return {
            ...song,
            id: preview.trackId || song.id,
            previewUrl: preview.previewUrl || song.previewUrl,
            url: song.url || preview.trackViewUrl || "",
            artwork: song.artwork || preview.artworkUrl100 || "",
          };
        } catch (error) {
          return song;
        }
      })
    );

    return res.json({ songs, country });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch latest songs" });
  }
}

module.exports = {
  searchSongs,
  latestSongs,
};
