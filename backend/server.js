import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.NEWSDATA_API_KEY;

app.use(cors());

app.get("/api/news", async (req, res) => {
    const { query } = req.query;

    if (!API_KEY) {
        return res.status(500).json({ error: "Missing API key in backend" });
    }

    try {
        const url = `https://newsdata.io/api/1/news?apikey=${API_KEY}&q=${encodeURIComponent(query)}&language=en`;
        const response = await fetch(url);
        const data = await response.json();

        const safeResults = Array.isArray(data.results) ? data.results : [];
        res.json({ results: safeResults });

    } catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({ error: "Failed to fetch news", results: [] });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});