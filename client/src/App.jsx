import { useEffect, useMemo, useState } from "react";
import { fetchNews, spinStory } from "./api";

const moods = [
  { value: "positive", label: "Bloomer" },
  { value: "negative", label: "Doomer" },
];

function formatDate(value) {
  if (!value) return "Unknown date";

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Unknown date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function App() {
  const [mood, setMood] = useState("positive");
  const [news, setNews] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState("");
  const [spin, setSpin] = useState("");
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingSpin, setLoadingSpin] = useState(false);
  const [error, setError] = useState("");

  const selectedStory = useMemo(() => news.find((story) => story.url === selectedUrl), [news, selectedUrl]);

  const handleStorySelect = useEffect(() => {
    // setSelectedUrl(url);
    handleGenerateSpin();
  }, [selectedUrl, mood]);

  const initilallyLoadNews = useEffect(() => {
    handleLoadNews();
  }, []);

  async function handleLoadNews() {
    setLoadingNews(true);
    setError("");
    setSpin("");

    try {
      const data = await fetchNews(9);
      setNews(data.articles || []);
      setSelectedUrl(data.articles?.[0]?.url || "");
    } catch (err) {
      setError(err.message || "Failed to fetch news");
    } finally {
      setLoadingNews(false);
    }
  }

  async function handleGenerateSpin() {
    if (!selectedStory) {
      setError("Choose a story first.");
      return;
    }

    setLoadingSpin(true);
    setError("");

    try {
      const data = await spinStory({
        title: selectedStory.title,
        description: selectedStory.description,
        url: selectedStory.url,
        mood,
      });

      setSpin(data.spin || "No spin generated.");
    } catch (err) {
      setError(err.message || "Failed to generate spin");
    } finally {
      setLoadingSpin(false);
    }
  }

  return (
    <div className={`page-shell ${mood === "positive" ? "theme-bloomer" : mood === "negative" ? "theme-doomer" : ""}`}>
      {/* <div className="bg-orb orb-left" /> */}
      {/* <div className="bg-orb orb-right" /> */}

      <main
        className={`app-card ${mood === "positive" ? "app-card-bloomer" : mood === "negative" ? "app-card-doomer" : ""}`}
      >
        <header>
          <p className="eyebrow">Half Glass News</p>
          <p className="subtitle">
            Pull recent stories and rewrite them based on how you want to feel about things going on right now.
          </p>
        </header>

        <section className="controls">
          <label htmlFor="mood-toggle">Would you like to be a:</label>
          <div
            className="toggle-group"
            style={{ display: "flex", gap: "1rem", justifyContent: "space-around", padding: "16px" }}
          >
            <button
              id="mood-toggle"
              type="button"
              disabled={mood === "positive" && loadingNews}
              className={mood === "positive" ? "bloomer-toggle active" : "bloomer-toggle"}
              onClick={() => setMood("positive")}
              aria-pressed={mood === "positive"}
            >
              Bloomer
            </button>
            <button
              type="button"
              disabled={mood === "negative" && loadingNews}
              className={mood === "negative" ? "doomer-toggle active" : "doomer-toggle"}
              onClick={() => setMood("negative")}
              aria-pressed={mood === "negative"}
            >
              Doomer
            </button>
          </div>

          {/* <button type="button" onClick={handleLoadNews} disabled={loadingNews}>
            {loadingNews ? "Loading..." : "Load Recent Stories"}
          </button> */}
        </section>

        <section className="content-grid">
          <article
            className={`panel ${mood === "positive" ? "panel-bloomer" : mood === "negative" ? "panel-doomer" : ""}`}
          >
            <div
              className={`panel-header ${mood === "positive" ? "panel-bloomer" : mood === "negative" ? "panel-doomer" : ""}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingBottom: "16px",
                alignContent: "center",
                alignItems: "center",
              }}
            >
              <h2>Recent stories</h2>
              <button type="button" onClick={handleLoadNews} disabled={loadingNews}>
                {loadingNews ? "Loading..." : "Refresh"}
              </button>
            </div>
            {news.length === 0 ? (
              <p className="muted">Load stories to begin.</p>
            ) : (
              <ul
                className={`story-list ${mood === "positive" ? "bloomer-story-list" : mood === "negative" ? "doomer-story-list" : ""}`}
              >
                {news.map((story) => (
                  <li key={story.url}>
                    <button
                      className={story.url === selectedUrl ? "active" : ""}
                      onClick={() => {
                        setSelectedUrl(story.url);
                        // handleGenerateSpin();
                      }}
                      type="button"
                    >
                      <span>{story.title}</span>
                      <small>{formatDate(story.publishedAt)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article
            className={`panel ${mood === "positive" ? "panel-bloomer" : mood === "negative" ? "panel-doomer" : ""}`}
          >
            <h2>Summarized Stories</h2>
            {/* <button type="button" onClick={handleGenerateSpin} disabled={!selectedStory || loadingSpin}> */}
            {/* {loadingSpin ? "Generating..." : `Generate ${mood} spin`} */}
            {/* </button>} */}

            {selectedStory ? (
              <div className="story-preview">
                <h3>{selectedStory.title}</h3>
                <p>{selectedStory.description || "No description available."}</p>
                <a href={selectedStory.url} target="_blank" rel="noreferrer" className="story-link">
                  Open original source
                </a>
              </div>
            ) : (
              <p className="muted">Pick a story after loading news.</p>
            )}

            {loadingSpin ? (
              <p className="muted">Generating summary...</p>
            ) : (
              spin && (
                <p
                  className={`spin-copy ${mood === "positive" ? "spin-copy-bloomer" : mood === "negative" ? "spin-copy-doomer" : ""}`}
                >
                  {spin}
                </p>
              )
            )}
            {error && <p className="error">{error}</p>}
          </article>
        </section>
      </main>
    </div>
  );
}
