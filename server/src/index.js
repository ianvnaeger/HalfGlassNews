import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 8787;

app.use(cors());
app.use(express.json());

// function requireEnv(name) {
//   console.log(`Checking environment variable: ${name}`);
//   const value = process.env[name];
//   console.log(`Value for ${name}: ${value}`);

//   if (!value) {
//     throw new Error(`Missing required environment variable: ${name}`);
//   }

//   return value;
// }

function toNewsDto(article) {
  return {
    title: article.title || "Untitled",
    description: article.description || "",
    url: article.url,
    publishedAt: article.publishedAt,
    source: article.source?.name || "Unknown",
  };
}

app.get("/api/health", (_, res) => {
  res.json({ ok: true });
});

app.get("/api/news", async (req, res) => {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    console.log("Using NEWS_API_KEY:", apiKey);
    const country = process.env.NEWS_COUNTRY || "us";
    const pageSize = Math.min(Number(req.query.limit) || 8, 20);

    const newsUrl = new URL("https://newsapi.org/v2/top-headlines");
    newsUrl.searchParams.set("country", country);
    newsUrl.searchParams.set("language", "en");
    newsUrl.searchParams.set("pageSize", String(pageSize));
    newsUrl.searchParams.set("apiKey", apiKey);

    const response = await fetch(newsUrl);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.message || "Failed to fetch news");
    }

    const articles = (payload.articles || []).filter((item) => item.url && item.title).map(toNewsDto);

    res.json({ articles });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch news" });
  }
});

app.post("/api/spin", async (req, res) => {
  try {
    const mood = req.body?.mood === "negative" ? "negative" : "positive";
    const title = req.body?.title || "";
    const description = req.body?.description || "";
    const url = req.body?.url || "";

    if (!title) {
      res.status(400).json({ error: "Missing story title" });
      return;
    }

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-10-21";
    const apiKey = process.env.AZURE_OPENAI_API_KEY;

    //TODO: Add more granular mood options and corresponding prompt adjustments
    const prompt = [
      `Story title: ${title}`,
      `Story summary: ${description || "No summary available."}`,
      `Story URL: ${url}`,
      "",
      mood === "positive"
        ? "Summarize this story in a hopeful, constructive tone. Keep it factual and do not invent details.Summarize this story from an extremely optimistic and future-positive perspective.\n\n" +
          "Your goal is to: \n\n" +
          "1. Accurately summarize the key facts of the article.\n" +
          "2. Frame the developments as signs of long-term progress, resilience, innovation, or opportunity.\n" +
          "3. Highlight positive implications for humanity, technology, science, society, or the environment.\n" +
          "4. When the news is negative, reinterpret it as a challenge humanity is actively working to solve.\n" +
          "5. Emphasize trends toward improvement, cooperation, and problem-solving.\n" +
          "6. Avoid cynicism, doom framing, or neutral pessimism.\n\n" +
          "Writing style guidelines:\n" +
          "- Tone should be hopeful, energetic, and forward-looking.\n" +
          "- Focus on solutions, momentum, and human ingenuity.\n" +
          "- If the article is negative, include a short section about why this situation can lead to positive change.\n" +
          "- Avoid exaggerating facts, but always emphasize the most encouraging interpretation.\n" +
          "- Add 2 new lines between each paragraph for readability."
        : "Summarize this story from an extremely pessimistic, “doomer” perspective about the future of the world.\n\n" +
          "Your goal is to: \n\n" +
          "1. Accurately summarize the key facts of the article.\n" +
          "2. Frame the developments as signs of long-term decline, instability, or systemic risk.\n" +
          "3. Highlight negative implications for humanity, institutions, technology, the environment, or social stability.\n" +
          "4. When the news is positive, reinterpret it as temporary progress, fragile improvement, or something that may create new problems later.\n" +
          "5. Emphasize patterns of worsening trends, unintended consequences, and structural weaknesses.\n" +
          "6. Avoid hopeful framing, optimism, or reassuring interpretations.\n\n" +
          "Writing style guidelines:\n" +
          "- Tone should be sober, bleak, and cautionary.\n" +
          "- Focus on risks, fragility, and potential long-term deterioration.\n" +
          "- Point out how short-term successes may mask deeper issues.\n" +
          "- When possible, connect the story to broader global problems or systemic decline.\n" +
          "- Do not invent facts or exaggerate beyond what can reasonably be inferred from the article, but emphasize the most concerning interpretation of events.\n" +
          "- Add 2 new lines between each paragraph for readability.",
      "Length: 1 or 2 paragraphs.",
    ].join("\n");

    const modelUrl = `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;

    const response = await fetch(modelUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You summarize news with tonal framing while staying accurate and clearly separated from original reporting.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 280,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      const message = payload?.error?.message || "Azure model call failed";
      throw new Error(message);
    }

    const spin = payload?.choices?.[0]?.message?.content?.trim();

    res.json({ spin: spin || "No response generated." });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to generate spin" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
