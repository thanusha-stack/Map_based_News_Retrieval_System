import React from "react";
import { Link } from "react-router-dom";
import map from "../assets/map.jpg";

function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-200 flex flex-col justify-center">
      {/* Section 1 */}
      <section className="px-6 md:px-20 py-10">
        <div className="flex flex-col items-center md:flex-row md:justify-between gap-10">
          {/* Left Section */}
          <div className="flex flex-col space-y-6 md:w-1/2 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-red-800 leading-tight">
              Stay Informed, Anytime — Anywhere 🌍
            </h1>
            <p className="text-gray-600 text-lg max-w-md mx-auto md:mx-0">
              Discover real-time, location-based news from your surroundings.
              Get updates instantly and stay connected with what matters most.
            </p>

            <div className="flex justify-center md:justify-start gap-4">
              <Link
                to="/signUp"
                className="px-6 py-3 bg-red-700 text-white font-medium rounded-full shadow-md hover:bg-red-800 hover:shadow-lg transition-all duration-300"
              >
                Get Started
              </Link>
            </div>

            <div className="pt-4">
              <p className="text-gray-500 text-sm uppercase tracking-widest">
                Trusted by Top News Networks
              </p>
              <div className="flex gap-4 justify-center md:justify-start mt-2">
                <span className="text-gray-600 font-semibold">BBC</span>
                <span className="text-gray-600 font-semibold">CNN</span>
                <span className="text-gray-600 font-semibold">NDTV</span>
                <span className="text-gray-600 font-semibold">Reuters</span>
              </div>
            </div>
          </div>

          {/* Right Section - Image */}
          <div className="flex justify-center md:w-1/2">
            <img
              src={map}
              alt="Illustration"
              className="rounded-2xl shadow-xl w-64 md:w-80 lg:w-96 hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
