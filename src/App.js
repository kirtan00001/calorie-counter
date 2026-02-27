import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import cal from './cal.png';     // your existing icon
import auth from './auth.jpg';   // your existing icon
import studyIcon from './study.png'; // ← add your own flashcard/study icon here (or use any png)
import './App.css';
import CalCounter from './CalCounter.js';
import Study from './Study';     // new import

// Cool Box component with hover effects (unchanged)
function Box({ name, icon, link, color }) {
  return (
    <Link to={link} className="box" style={{ '--box-color': color }}>
      <div className="box-inner">
        <img src={icon} alt={name} className="box-icon" />
        <h3 className="box-name">{name}</h3>
      </div>
      <div className="box-glow"></div>
    </Link>
  );
}

// Home page with clean design
function Home() {
  return (
    <div className="page">
      {/* Title Card */}
      <div className="title-card">
        <div className="title-card-content">
          <h1 className="main-title">
            <span className="title-word">KIRTAN'S </span>
            <span className="title-word gradient">PROJECTS</span>
          </h1>
          <div className="title-decoration">
            <span className="dot"></span>
            <span className="line"></span>
            <span className="dot"></span>
          </div>
        </div>
        <div className="title-card-bg">
          <div className="bg-shape shape1"></div>
          <div className="bg-shape shape2"></div>
          <div className="bg-shape shape3"></div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="projects-section">
        <div className="grid">
          <Box
            name="Calorie Counter"
            icon={cal}
            link="/cal-counter"
            color="#FF6B6B"
          />
          <Box
            name="Simple Auth"
            icon={auth}
            link="https://github.com/kirtan00001/Simple-Auth"
            color="#4ECDC4"
          />
          <Box
            name="Study Flashcards"
            icon={studyIcon}           // ← your new icon
            link="/study"
            color="#8b5cf6"
          />
        </div>
      </div>
    </div>
  );
}

// CalCounter Page (unchanged)
function CalCounterPage() {
  const navigate = useNavigate();
  return (
    <div className="page subpage">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back
      </button>
      <CalCounter />
    </div>
  );
}

// New Study Page
function StudyPage() {
  const navigate = useNavigate();
  return (
    <div className="page subpage">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back
      </button>
      <Study />
    </div>
  );
}

// App with routing
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cal-counter" element={<CalCounterPage />} />
        <Route path="/study" element={<StudyPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;