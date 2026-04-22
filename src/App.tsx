import { useEffect, useState } from "react";
import owlMascot from "./assets/owl-mascot.png";

const confettiColors = [
  "#FF6B6B",
  "#8CC63F",
  "#6B4BF6",
  "#FFD23F",
  "#56CCF2",
  "#FF8FB1",
];

function Confetti() {
  const pieces = Array.from({ length: 36 });
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 6;
        const duration = 6 + Math.random() * 7;
        const color = confettiColors[i % confettiColors.length];
        const size = 6 + Math.random() * 10;
        return (
          <i
            key={i}
            style={{
              left: `${left}%`,
              backgroundColor: color,
              width: `${size}px`,
              height: `${size * 1.4}px`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              borderRadius: i % 3 === 0 ? "50%" : "2px",
            }}
          />
        );
      })}
    </div>
  );
}

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [streak, setStreak] = useState<{ current: number; best: number }>({ current: 0, best: 0 });
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Load shared pp-stats module once on mount
  useEffect(() => {
    const readStats = () => {
      const pp = (window as any).ppStats;
      if (pp && typeof pp.getSharedStreak === "function") {
        const s = pp.getSharedStreak();
        setStreak({ current: s.current || 0, best: s.best || 0 });
      }
      if (pp && typeof pp.getTotalPoints === "function") {
        setPoints(pp.getTotalPoints() || 0);
      }
    };
    readStats();
    window.addEventListener("pp-stats-ready", readStats);

    if ((window as any).ppStats) return;
    if (document.querySelector('script[data-pp-stats]')) return;
    const s = document.createElement("script");
    s.type = "module";
    s.dataset.ppStats = "true";
    s.textContent = `
      import * as PPStats from '/pp-stats.js';
      window.ppStats = PPStats;
      window.dispatchEvent(new Event('pp-stats-ready'));
    `;
    document.head.appendChild(s);

    return () => window.removeEventListener("pp-stats-ready", readStats);
  }, []);

  const displayStreak = streak.current > 0 ? streak.current : 12;
  const displayPoints = points > 0 ? points.toLocaleString() : "1,250";

  const streakDays = ["S", "M", "T", "W", "T", "F", "S"];
  const completedDays = 5;

  return (
    <>
      {/* NAV */}
      <nav className={`nav${scrolled ? " scrolled" : ""}`} id="top">
        <div className="nav-inner">
          <a href="#top" className="logo">
            <span className="logo-owl" aria-hidden="true">🦉</span>
            <span>Puzzle<span className="logo-perch">Perch</span></span>
          </a>
          <div className="nav-links">
            <a href="#top" className="nav-link active">Home</a>
            <a href="#games" className="nav-link">Puzzles</a>
            <a href="#progress" className="nav-link">Stats</a>
            <a href="#" className="nav-link">Learn</a>
            <a href="#" className="nav-link">Community</a>
          </div>
          <div className="nav-actions">
            <div className="nav-stat">
              <span className="nav-stat-icon">⚡</span>
              <span className="nav-stat-value">{displayPoints}</span>
            </div>
            <div className="nav-stat">
              <span className="nav-stat-icon">🔥</span>
              <span className="nav-stat-value">{displayStreak} day streak</span>
            </div>
            <div className="nav-avatar" aria-label="User profile">
              <img src={owlMascot} alt="User" className="nav-avatar-img" />
              <span className="nav-avatar-caret">▾</span>
            </div>
            <button className="btn btn-pink">Play Now</button>
            <button className="btn btn-dark-outline">
              <span>👥</span> For Teams
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <Confetti />
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge">
              <span>⭐</span> Sharpen your mind. Perch higher.
            </div>
            <h1 className="hero-h1">
              <span className="hero-h1-white">Play Puzzles.</span>
              <span className="hero-h1-gradient">Level Up Your Brain.</span>
            </h1>
            <p className="hero-sub">
              Fun, challenging, and satisfying brain workouts<br />
              for curious minds and puzzle lovers.
            </p>
            <div className="hero-cta">
              <button className="btn-cta">Let's Play! 🚀</button>
              <button className="demo-btn">
                <span className="demo-play">▶</span>
                <div className="demo-text">
                  <span className="demo-label">Watch Demo</span>
                  <span className="demo-dur">45 seconds</span>
                </div>
              </button>
            </div>
          </div>
          <div className="hero-owl-wrap">
            <div className="hero-orb" aria-hidden="true" />
            <div className="hero-speech">
              Ready to perch higher today? 🧠
            </div>
            <img
              src={owlMascot}
              alt="PuzzlePerch owl mascot wearing green glasses and a party hat"
              className="hero-owl-img"
            />
          </div>
        </div>
      </section>

      {/* GAMES + DAILY CHALLENGE */}
      <section className="games-section" id="games">
        <div className="games-layout">
          <div className="game-cards">

            {/* Word Perch */}
            <a className="game-card game-card--word" href="/word-perch.html">
              <div className="game-card-header">
                <span className="game-card-title">Word Perch</span>
                <span className="game-card-badge badge-new">NEW</span>
              </div>
              <p className="game-card-desc">Unscramble, connect, and expand your vocabulary.</p>
              <div className="game-card-preview preview-word-dark">
                <span className="word-tile">W</span>
                <span className="word-tile">R</span>
                <span className="word-tile">D</span>
              </div>
              <button className="game-play-btn">Play Now →</button>
            </a>

            {/* Logic Lagoon */}
            <a className="game-card game-card--lagoon" href="/logic-lagoon.html">
              <div className="game-card-header">
                <span className="game-card-title">Logic Lagoon</span>
              </div>
              <p className="game-card-desc">Dive into logic puzzles that make you think deeper.</p>
              <div className="game-card-preview preview-lagoon-dark">
                🌊🏝️
              </div>
              <button className="game-play-btn">Play Now →</button>
            </a>

            {/* Lateral Lounge */}
            <a className="game-card game-card--lounge" href="/lateral-lounge.html">
              <div className="game-card-header">
                <span className="game-card-title">Lateral Lounge</span>
              </div>
              <p className="game-card-desc">Think sideways. Solve creatively. Surprise yourself.</p>
              <div className="game-card-preview preview-lounge-dark">
                💡🧠
              </div>
              <button className="game-play-btn">Play Now →</button>
            </a>

            {/* Memory Meadow */}
            <a className="game-card game-card--meadow" href="/memory-meadow.html">
              <div className="game-card-header">
                <span className="game-card-title">Memory Meadow</span>
              </div>
              <p className="game-card-desc">Test your memory. Sharpen your recall.</p>
              <div className="game-card-preview preview-meadow-dark">
                🌸⭐
              </div>
              <button className="game-play-btn game-play-btn--orange">Play Now →</button>
            </a>
          </div>

          {/* Daily Challenge */}
          <div className="daily-challenge">
            <div className="daily-challenge-header">
              <span className="daily-trophy">🏆</span>
              <div>
                <div className="daily-title">Daily Challenge</div>
                <div className="daily-sub">Solve today's puzzle and keep your streak alive!</div>
              </div>
            </div>
            <div className="daily-dots">
              {streakDays.map((day, i) => (
                <div key={i} className={`daily-dot ${i < completedDays ? "dot-done" : "dot-todo"}`}>
                  {i < completedDays ? "✓" : day}
                </div>
              ))}
            </div>
            <div className="daily-game-row">
              <span className="daily-game-icon">🏝️</span>
              <div className="daily-game-info">
                <span className="daily-game-name">Logic Lagoon</span>
                <span className="daily-game-diff">MEDIUM</span>
              </div>
            </div>
            <p className="daily-game-hint">Can you solve it in under 3 minutes?</p>
            <button className="btn-start-challenge">Start Challenge</button>
          </div>
        </div>
      </section>

      {/* YOUR PROGRESS + LEADERBOARD */}
      <section className="progress-section" id="progress">
        <div className="progress-layout">

          <div className="progress-block">
            <div className="section-header">
              <span className="section-title">📊 Your Progress</span>
              <a href="#" className="section-link">View Stats →</a>
            </div>
            <div className="progress-grid">
              <div className="stat-card">
                <span className="stat-icon">📈</span>
                <span className="stat-label">Puzzles Solved</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">📈</span>
                <span className="stat-label">Win Rate</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">⚡</span>
                <span className="stat-label">Current Streak</span>
                <span className="stat-value">{displayStreak}</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🔥</span>
                <span className="stat-label">Total Points</span>
                <span className="stat-value">{displayPoints}</span>
              </div>
            </div>
          </div>

          <div className="leaderboard-block">
            <div className="section-header">
              <span className="section-title">🏆 Leaderboard</span>
              <div className="lb-tabs">
                <button className="lb-tab lb-tab--active">Friends</button>
                <button className="lb-tab">Global</button>
              </div>
            </div>
            <div className="lb-row lb-row--you">
              <span className="lb-rank">1</span>
              <div className="lb-avatar">
                <img src={owlMascot} alt="You" className="lb-avatar-img" />
              </div>
              <span className="lb-name">You</span>
              <span className="lb-pts">{displayPoints} pts</span>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-text">
          <span>🎉 🦉</span>
          <span>Designed for the intellectually curious… and the playfully mischievous.</span>
          <span>🦉 🎉</span>
        </div>
      </footer>
    </>
  );
}

export default App;