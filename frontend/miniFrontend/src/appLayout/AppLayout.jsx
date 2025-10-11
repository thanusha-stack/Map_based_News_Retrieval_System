import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/home';
import NewsListPage from '../pages/newslist';
import WelcomePage from '../pages/welcome';
import Signup from '../pages/signup';
import Login from '../pages/login';

function App() {
  return (
    <Router>
        <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/news" element={<NewsListPage />} />
            <Route path="/" element={<WelcomePage />} />
            <Route path="/signUp" element={< Signup />} />
            <Route path="/login" element={<Login />}/>
        </Routes>
    </Router>
  );
}

export default App;
