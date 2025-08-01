import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/home';
import Login from '../pages/Login';
import Signup from '../pages/Signup';

function App() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
        
    </Router>
  );
}

export default App;
