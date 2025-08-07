import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Login from './Login';
import Signup from './Signup';

// Fix for leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mock articles
const mockArticles = [
  {
    id: 1,
    title: "Festival Downtown This Weekend",
    summary: "Annual music festival with 50+ bands.",
    location: [51.505, -0.09],
    topic: "events",
  },
  {
    id: 2,
    title: "Road Closure Due to Construction",
    summary: "Main Street closed until Friday.",
    location: [51.51, -0.1],
    topic: "traffic",
  },
];

// Helper component to update map center
const RecenterMap = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(location, 13);
  }, [location]);
  return null;
};

const HomePage = () => {
  const [userLocation, setUserLocation] = useState([51.505, -0.09]);
  const [filteredArticles, setFilteredArticles] = useState(mockArticles);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef();
  const navigate = useNavigate();

  // Find my location
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = [position.coords.latitude, position.coords.longitude];
        setUserLocation(coords);
        if (mapRef.current) {
          mapRef.current.setView(coords, 13);
        }
      },
      (error) => {
        alert(`Geolocation failed: ${error.message}`);
      }
    );
  };

  // Search and center on article
  const handleSearch = () => {
    const match = mockArticles.find(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (match) {
      setUserLocation(match.location);
      if (mapRef.current) {
        mapRef.current.setView(match.location, 13);
      }
    } else {
      alert("No matching article found.");
    }
  };

  // Filter articles on topic or search query
  useEffect(() => {
    let results = mockArticles;
    if (selectedTopic !== "all") {
      results = results.filter(article => article.topic === selectedTopic);
    }
    if (searchQuery) {
      results = results.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredArticles(results);
  }, [selectedTopic, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg width="40px" height="40px" viewBox="0 0 24 24" fill="none" stroke="#171616">
              <path opacity="0.5" d="M3.46 20.54C4.93 22 7.29 22 12 22s7.07 0 8.54-1.46C22 19.07 22 16.71 22 12s0-7.07-1.46-8.54C19.07 2 16.71 2 12 2S4.93 2 3.46 3.46C2 4.93 2 7.29 2 12s0 7.07 1.46 8.54z" fill="#d00b0b" />
              <path d="M13.42 17.36l3.51-9.16c.28-.73-.4-1.41-1.13-1.13l-9.17 3.51c-.83.32-.86 1.48-.04 1.72l3.48 1.06c.27.08.48.29.56.56l1.06 3.48c.24.82 1.4.79 1.73-.04z" fill="#d00b0b" />
            </svg>
            <h1 className="text-xl font-bold text-red-500">AroundU</h1>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => navigate('/login')} className="px-4 py-1 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white">
              Login
            </button>
            <button onClick={() => navigate('/signup')} className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600">
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="container mx-auto p-4 flex-grow">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search bar with icon */}
          <div className="flex items-center border rounded overflow-hidden flex-1">
            <input
              type="text"
              placeholder="Search by title..."
              className="flex-1 p-2 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={handleSearch}
              className="p-2 bg-red-500 text-white hover:bg-red-600"
            >
              🔍
            </button>
          </div>

          {/* Topic Filter */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">All Topics</option>
            <option value="events">Events</option>
            <option value="traffic">Traffic</option>
          </select>

          {/* Find My Location */}
          <button
            onClick={handleGeolocation}
            className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Find My Location
          </button>
        </div>

        {/* Map */}
        <div className="h-96 w-full mb-8 rounded-lg overflow-hidden shadow-md">
          <MapContainer
            center={userLocation}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            whenCreated={(mapInstance) => { mapRef.current = mapInstance }}
          >
            <RecenterMap location={userLocation} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filteredArticles.map(article => (
              <Marker key={article.id} position={article.location}>
                <Popup>
                  <h3 className="font-bold">{article.title}</h3>
                  <p>{article.summary}</p>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
