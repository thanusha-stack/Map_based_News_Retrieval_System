import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FaMapMarkerAlt, FaSearch, FaCrosshairs, FaHistory } from "react-icons/fa";

const defaultCenter = [20.5937, 78.9629];
const defaultZoom = 5;

// Fix Leaflet's default marker icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Reverse geocode
const reverseGeocode = async (lat, lng) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
  );
  const data = await res.json();
  return data.display_name || "Unknown location";
};

// Forward geocode
const forwardGeocode = async (place) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`
  );
  const data = await res.json();
  if (data.length > 0) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  }
  return null;
};

// Map click handler
function LocationMarker({ onSelectLocation }) {
  useMapEvents({
    click(e) {
      onSelectLocation([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

const HomePage = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markers, setMarkers] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("recentSearches") || "[]");
    setRecentSearches(stored);
  }, []);

  const addRecentSearch = (name, coords) => {
    const updated = [{ name, coords }, ...recentSearches].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const handleSearch = async () => {
    if (!searchInput) return;
    const coords = await forwardGeocode(searchInput);
    if (coords) {
      setMapCenter(coords);
      setMarkers([{ position: coords, name: searchInput }]);
      addRecentSearch(searchInput, coords);
      navigate("/news", { state: { clickedLocation: coords } });
    } else {
      alert("Location not found!");
    }
  };

  const handleFindMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setMapCenter(coords);
        const name = await reverseGeocode(...coords);
        setMarkers([{ position: coords, name }]);
        addRecentSearch(name, coords);
        navigate("/news", { state: { clickedLocation: coords } });
      },
      (err) => {
        console.error(err);
        alert("Unable to get location.");
      }
    );
  };

  const handleMapClick = async (coords) => {
    setMapCenter(coords);
    const name = await reverseGeocode(...coords);
    setMarkers([{ position: coords, name }]);
    addRecentSearch(name, coords);
    navigate("/news", { state: { clickedLocation: coords } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-300 to-red-500 flex flex-col items-center p-4">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-4">
        🗺 Map-based News Finder
      </h1>

      {/* Floating Search Bar */}
      <div className="bg-white shadow-lg rounded-full flex items-center w-full max-w-2xl p-2 mb-4">
        <FaSearch className="ml-3 text-gray-500" />
        <input
          type="text"
          placeholder="Search location..."
          className="flex-grow px-4 py-2 rounded-full outline-none"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button
          onClick={handleSearch}
          className="bg-white-500 hover:text-gray-300 text-red-500 px-4 py-2 rounded-full mx-1 transition"
        >
          Search
        </button>
        <button
          onClick={handleFindMyLocation}
          className="bg-red-500 hover:bg-red-300 text-white px-4 py-2 rounded-full mx-1 flex items-center transition"
        >
          <FaCrosshairs className="mr-1" /> Locate Me
        </button>
      </div>

      {/* Map */}
      <div className="relative w-full max-w-5xl h-[500px] rounded-2xl overflow-hidden shadow-lg border-4 border-white">
        <MapContainer center={mapCenter} zoom={defaultZoom} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {markers.map((m, idx) => (
            <Marker key={idx} position={m.position}>
              <Popup>{m.name}</Popup>
            </Marker>
          ))}
          <LocationMarker onSelectLocation={handleMapClick} />
        </MapContainer>
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="mt-6 bg-white shadow-lg rounded-xl p-4 w-full max-w-md">
          <h2 className="font-bold text-lg flex items-center mb-2">
            <FaHistory className="mr-2 text-gray-600" /> Recent Searches
          </h2>
          <ul className="space-y-2">
            {recentSearches.map((item, idx) => (
              <li key={idx}>
                <button
                  onClick={() => {
                    setMapCenter(item.coords);
                    setMarkers([{ position: item.coords, name: item.name }]);
                    navigate("/news", { state: { clickedLocation: item.coords } });
                  }}
                  className="flex items-center w-full text-left hover:bg-gray-100 p-2 rounded-lg transition"
                >
                  <FaMapMarkerAlt className="text-blue-500 mr-2" /> {item.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HomePage;
