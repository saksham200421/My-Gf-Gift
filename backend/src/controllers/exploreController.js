async function fetchWikipediaSummary(title) {
  if (!title) {
    return null;
  }

  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "my-gf-gift-app/1.0 (place-explorer)",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function searchPlace(req, res) {
  const query = String(req.query.query || "").trim();

  if (!query) {
    return res.status(400).json({ message: "query is required" });
  }

  const nominatimUrl =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`;

  const nominatimResponse = await fetch(nominatimUrl, {
    headers: {
      "User-Agent": "my-gf-gift-app/1.0 (place-explorer)",
      Accept: "application/json",
    },
  });

  if (!nominatimResponse.ok) {
    return res.status(502).json({ message: "Place lookup failed" });
  }

  const results = await nominatimResponse.json();
  const bestMatch = Array.isArray(results) ? results[0] : null;

  if (!bestMatch) {
    return res.status(404).json({ message: "No place found" });
  }

  const latitude = Number(bestMatch.lat);
  const longitude = Number(bestMatch.lon);
  const name = bestMatch.name || bestMatch.display_name?.split(",")?.[0] || query;
  const displayName = bestMatch.display_name || name;
  const country = bestMatch.address?.country || "";

  const wikipediaSummary = await fetchWikipediaSummary(name);

  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?layer=mapnik&marker=${latitude},${longitude}`;
  const mapStaticUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=12&size=800x400&markers=${latitude},${longitude},lightblue1`;

  return res.json({
    place: {
      name,
      displayName,
      latitude,
      longitude,
      country,
      description: wikipediaSummary?.extract || "",
      imageUrl: wikipediaSummary?.thumbnail?.source || "",
      wikiUrl: wikipediaSummary?.content_urls?.desktop?.page || "",
      mapEmbedUrl,
      mapStaticUrl,
    },
  });
}

module.exports = {
  searchPlace,
};
