import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const API_KEY = import.meta.env.VITE_NEWS_API_KEY;

const reverseGeocode = async (lat, lng) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
  );
  const data = await res.json();
  return (
    data.address.city ||
    data.address.town ||
    data.address.village ||
    data.display_name
  );
};

const getDateNDaysAgo = (n) => {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split("T")[0];
};

const fetchNews = async (query) => {
  const res = await fetch(
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      query
    )}&from=${getDateNDaysAgo(7)}&sortBy=publishedAt&apiKey=${API_KEY}`
  );
  const data = await res.json();
  return data.articles || [];
};

const isWithinDays = (dateString, days) => {
  const articleDate = new Date(dateString);
  const today = new Date();
  const diffInDays = (today - articleDate) / (1000 * 3600 * 24);
  return diffInDays <= days;
};

const NewsListPage = () => {
  const locationHook = useLocation();
  const clickedLocation = locationHook.state?.clickedLocation || null;

  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [daysFilter, setDaysFilter] = useState("all");

  useEffect(() => {
    if (!API_KEY) {
      console.error("❌ Missing API key. Check your .env file!");
      return;
    }

    const loadData = async () => {
      if (!clickedLocation) return;
      const [lat, lng] = clickedLocation;
      const cityName = await reverseGeocode(lat, lng);
      setCity(cityName);

      const newsData = await fetchNews(cityName);
      setArticles(newsData);
      setLoading(false);
    };
    loadData();
  }, [clickedLocation]);

  const filteredArticles = articles.filter((article) => {
    const matchesCategory =
      selectedCategory === "all" ||
      (article.title &&
        article.title.toLowerCase().includes(selectedCategory));
    const matchesDate =
      daysFilter === "all" ||
      isWithinDays(article.publishedAt, parseInt(daysFilter));
    const matchesSearch =
      !searchQuery ||
      (article.title &&
        article.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesDate && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {!API_KEY && (
        <div className="bg-red-600 text-white p-4 rounded mb-4 text-center font-bold">
          ⚠ API key is missing! Check your <code>.env</code> file.  
          Make sure it’s named <code>VITE_NEWS_API_KEY</code> and restart the dev server.
        </div>
      )}

      <h2 className="text-3xl font-bold mb-6 text-center text-red-600">
       News near {city || "your location"}
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by title..."
          className="p-2 border rounded shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border rounded shadow-sm"
        >
          <option value="all">All Categories</option>
          <option value="sports">Sports</option>
          <option value="politics">Politics</option>
          <option value="weather">Weather</option>
        </select>

        <select
          value={daysFilter}
          onChange={(e) => setDaysFilter(e.target.value)}
          className="p-2 border rounded shadow-sm"
        >
          <option value="all">All Dates</option>
          <option value="1">Last 1 Day</option>
          <option value="3">Last 3 Days</option>
          <option value="5">Last 5 Days</option>
          <option value="7">Last 7 Days</option>
        </select>
      </div>

      {/* News List */}
      {loading ? (
        <p className="text-center">Loading news...</p>
      ) : filteredArticles.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article, index) => (
            <div key={index} className="bg-white rounded shadow overflow-hidden">
              <img
                src={article.urlToImage || "https://via.placeholder.com/400x200"}
                alt={article.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold">{article.title}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(article.publishedAt).toLocaleDateString()}
                </p>
                <p className="mt-2 text-gray-700 text-sm">
                  {article.description}
                </p>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-red-500 text-sm"
                >
                  Read more →
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600">No articles found.</p>
      )}
    </div>
  );
};

export default NewsListPage;
