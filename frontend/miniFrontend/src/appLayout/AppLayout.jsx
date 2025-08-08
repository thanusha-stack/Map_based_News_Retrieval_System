import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/home';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import NewsListPage from '../pages/newslist';

function App() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/news" element={<NewsListPage />} />
        </Routes>
        
    </Router>
  );
}

export default App;
