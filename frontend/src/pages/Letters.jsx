import { useEffect, useRef, useState } from "react";
import { createLetter, fetchLetters } from "../utils/api";

const fallbackLetters = [
  {
    id: 1,
    title: "The Day We Met",
    date: "Always remembered",
    preview: "I still remember the first moment...",
    content: `I still remember the first moment I saw you. Everything around us seemed to blur, and all I could focus on was your smile. I didn't know it then, but that was the moment my life changed forever.

Every day since then has been a gift. You've brought light into places I didn't even know were dark. You've made me laugh when I thought I couldn't, and you've held me when I needed it most.

Thank you for being you. Thank you for choosing me.`,
  },
  {
    id: 2,
    title: "Your Laugh",
    date: "Every single day",
    preview: "The sound that makes everything better...",
    content: `Your laugh is my favorite sound in the entire world. It's warm and genuine and completely infectious. When you laugh, I can't help but smile, no matter what kind of day I'm having.

I love how you laugh at my terrible jokes. I love the way your eyes light up when something catches you off guard. I love that I get to be the person who makes you laugh.

Keep laughing, keep smiling. You make the world brighter.`,
  },
  {
    id: 3,
    title: "Quiet Moments",
    date: "Our favorite time",
    preview: "When words aren't needed...",
    content: `Some of my favorite moments with you are the quiet ones. When we're just sitting together, not saying anything, just being present. Those moments feel like home.

In a world that's always loud and demanding, you're my peace. You're the calm I didn't know I needed. With you, silence isn't empty—it's full of understanding, comfort, and love.

Thank you for being my safe place.`,
  },
  {
    id: 4,
    title: "Your Strength",
    date: "Always inspiring",
    preview: "You're braver than you know...",
    content: `I admire your strength more than you realize. The way you handle challenges with grace, the way you keep going even when things are hard, the way you care for others even when you're struggling yourself.

You're one of the bravest people I know, and I'm so proud to be by your side. Watching you grow and face life head-on inspires me to be better too.

You're amazing, and I hope you never forget that.`,
  },
  {
    id: 5,
    title: "Our Future",
    date: "Everything ahead",
    preview: "All the days to come...",
    content: `When I think about the future, I see you in every part of it. Every adventure, every quiet morning, every challenge we'll face—I want you there with me.

I can't wait to build more memories with you. To explore new places, to create new traditions, to keep learning and growing together. Whatever comes our way, I know we'll handle it together.

Here's to us, and to everything we're building. I love you.`,
  },
  {
    id: 6,
    title: "Thank You",
    date: "For everything",
    preview: "For being exactly who you are...",
    content: `Thank you for loving me the way you do. Thank you for accepting me with all my quirks and flaws. Thank you for being patient, kind, and understanding.

Thank you for the little things—the texts that make me smile, the hugs that make everything better, the way you remember the small details I mention in passing.

Most of all, thank you for being you. You're everything I didn't know I needed, and I'm so grateful every single day.`,
  },
];

function Letters({ authToken }) {
  const [letters, setLetters] = useState(fallbackLetters);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    preview: "",
    content: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [openingId, setOpeningId] = useState(null);
  const openTimeoutRef = useRef(null);
  const hearts = Array.from({ length: 12 }, (_, index) => index);

  const openLetter = (letter) => {
    setOpeningId(letter.id);
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
    }
    openTimeoutRef.current = setTimeout(() => {
      setSelectedLetter(letter);
    }, 220);
  };

  const closeLetter = () => {
    setSelectedLetter(null);
    setOpeningId(null);
  };

  useEffect(() => () => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadLetters = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetchLetters(authToken);
        if (!isMounted) {
          return;
        }
        if (response.letters?.length) {
          setLetters(response.letters);
        } else {
          setLetters([]);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLetters();

    return () => {
      isMounted = false;
    };
  }, [authToken]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateLetter = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await createLetter(authToken, formData);
      setLetters((prev) => [response.letter, ...prev]);
      setFormData({ title: "", date: "", preview: "", content: "" });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="letters-page">
      <div className="letters-background" aria-hidden="true">
        {hearts.map((heart) => (
          <span key={heart} className="floating-heart" />
        ))}
      </div>
      <div className="letters-header">
        <h1>Love Letters</h1>
        <p className="letters-subtitle">
          Words I wanted to put somewhere you could always find them.
        </p>
      </div>

      <form className="letters-create" onSubmit={handleCreateLetter}>
        <h2>Create a new letter</h2>
        <input
          name="title"
          value={formData.title}
          onChange={handleFormChange}
          placeholder="Letter title"
          required
        />
        <input
          name="date"
          value={formData.date}
          onChange={handleFormChange}
          placeholder="Date label (optional)"
        />
        <input
          name="preview"
          value={formData.preview}
          onChange={handleFormChange}
          placeholder="Preview (optional)"
        />
        <textarea
          name="content"
          value={formData.content}
          onChange={handleFormChange}
          placeholder="Write your letter..."
          required
        />
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save letter"}
        </button>
      </form>

      {error ? <p className="letters-error">{error}</p> : null}
      {loading ? <p className="letters-loading">Loading letters...</p> : null}

      <div className="letters-grid">
        {letters.map((letter) => (
          <div
            key={letter.id}
            className={`letter-card ${openingId === letter.id ? "letter-card--open" : ""}`}
            onClick={() => openLetter(letter)}
          >
            <div className="envelope">
              <div className="envelope-back" />
              <div className="envelope-front" />
              <div className="envelope-paper">
                <p className="letter-preview-text">{letter.preview}</p>
              </div>
              <div className="envelope-like">❤</div>
            </div>
          </div>
        ))}
      </div>

      {selectedLetter && (
        <div className="letter-modal" onClick={closeLetter}>
          <div
            className="letter-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="letter-modal-close" onClick={closeLetter}>
              ×
            </button>
            <div className="letter-modal-header">
              <h2>{selectedLetter.title}</h2>
              <span className="letter-modal-date">{selectedLetter.date}</span>
            </div>
            <div className="letter-modal-body">
              {selectedLetter.content.split("\n\n").map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Letters;
