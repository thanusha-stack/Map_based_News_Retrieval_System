import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const NewsPage = () => {
  const location = useLocation();
  const [articles, setArticles] = useState([]);
  const clickedLocation = location.state?.clickedLocation;

  useEffect(() => {
    if (!clickedLocation) return;

    // You can convert coords to city if you want, or pass city from HomePage
    const city = "chennai"; // or dynamically from reverse geocode
    const from = "2025-01-01";
    const to = "2025-01-07";

    fetch(`/api/news?city=${city}&from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((data) => setArticles(data.articles || []))
      .catch((err) => console.error(err));
  }, [clickedLocation]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">News</h1>
      {articles.length === 0 ? (
        <p>No news found.</p>
      ) : (
        articles.map((article, idx) => (
          <div key={idx} className="mb-4 border-b pb-2">
            <h2 className="font-semibold">{article.title}</h2>
            <p>{article.description}</p>
            <a href={article.url} target="_blank" rel="noreferrer">
              Read more
            </a>
          </div>
        ))
      )}
    </div>
  );
};

export default NewsPage;
