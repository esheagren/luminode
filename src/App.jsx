import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage.jsx'
import Textbook from './components/textbook/Textbook.jsx'
import AboutPage from './components/about/AboutPage.jsx'
import LandingPage from './components/LandingPage.jsx'
import AdminPage from './admin/AdminPage.jsx'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <div className="app-container">
          <div className="main-layout">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/app" element={<HomePage />} />
              <Route path="/learn" element={<Textbook />} />
              <Route path="/learn/:chapter" element={<Textbook />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<div className="content-page"><h2>Contact</h2></div>} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/:pane" element={<AdminPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  )
}

export default App
