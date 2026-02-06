import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import cal from './cal.png'; // your icon
import './App.css';
import CalCounter from './CalCounter.js';

// Box component — clickable to subpage
function Box({ name, icon, link }) {
  return (
    <Link to={link} className="box">
      <img src={icon} alt={name} className="box-icon" />
      <p>{name}</p>
    </Link>
  );
}

// Home page
function Home() {
  return (
    <div className="page">
      <div className="intro">
        <p>
          My name is Kirtan Magan. I am 17 years old. I live in Ukiah, California.
          I like working out and programming.
        </p>
      </div>

      <h1 className="projects-title">My Projects</h1>

      <div className="grid">
        {[{ name: "Calorie Counter", icon: cal, link: "/cal-counter" }].map((item, index) => (
          <Box
            key={index}
            name={item.name}
            icon={item.icon}
            link={item.link}
          />
        ))}
      </div>
    </div>
  );
}

// Wrapper for CalCounter with back button
function CalCounterPage() {
  
  return (
    <div className="page">
      <CalCounter />
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;