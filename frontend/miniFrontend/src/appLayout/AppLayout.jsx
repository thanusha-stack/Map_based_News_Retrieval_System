import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/home';
import NewsListPage from '../pages/newslist';
import WelcomePage from '../pages/welcome';
import Navbar from '../components/navbar';

function App() {
  return (
    <Router>
          <Navbar /> 
          <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/news" element={<NewsListPage />} />
            <Route path="/" element={<WelcomePage />} />
          </Routes>
    </Router>
  );
}

export default App;
