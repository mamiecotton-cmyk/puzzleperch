import { useEffect, useRef, useState } from "react";
import owlMascot from "./assets/owl-mascot.png";

const tickerItems = [
  "NEW: Synapse Sparks!",
  "42,069 Active Users Today",
  "Streak Leader: @NeuroNinja (60 days!)",
  "Daily Challenge: Logic Lagoon",
  "Hot Streak Alert!",
];

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
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tickerContent = (
    <>
      {tickerItems.map((item, i) => (
        <span key={i}>{item} •</span>
      ))}
    </>
  );

  return (
    <>
      {/* NAV */}
      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          <a href="#top" className="logo">
            <span className="logo-owl" aria-hidden="true">🦉</span>
            <span>Puzzle<span className="logo-perch">Perch</span></span>
          </a>
          <div className="nav-actions">
            <button className="btn btn-coral">Play Now</button>
            <button className="btn btn-outline">Login</button>
            <button className="btn btn-outline">For Teams</button>
          </div>
        </div>
      </nav>

      {/* TICKER */}
      <div className="ticker" id="top">
        <div className="ticker-track" ref={tickerRef}>
          {tickerContent}
          {tickerContent}
          {tickerContent}
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-blob" aria-hidden="true" />
        <div className="hero-blob-2" aria-hidden="true" />
        <Confetti />
        <div className="hero-inner">
          <div>
            <h1>
              <span>Sharpen Your Mind.</span>
              <span>Perch Higher.</span>
            </h1>
            <p className="hero-sub">
              Fresh daily puzzles for clever adults who like their brain
              workouts playful, AND a little bit punishing!
            </p>
            <div className="hero-cta">
              <button className="btn-cta">Let's Play! 🚀</button>
              <a href="#demo" className="demo-link">
                Watch the fun 45-second demo
              </a>
            </div>
          </div>
          <div className="hero-owl-wrap">
            <img
              src={owlMascot}
              alt="PuzzlePerch owl mascot wearing green glasses and a party hat"
              className="hero-owl-img"
            />
          </div>
        </div>
      </section>

      {/* FEATURED GAMES — Word Perch + Logic Lagoon + Lateral Lounge */}
      <section className="featured-section" id="games">
        <div className="featured-grid featured-grid-3">
          {/* Word Perch */}
          <a className="card highlighted" href="/word-perch.html" style={{ cursor: 'pointer' }}>
            <div className="card-title">Word Perch</div>
            <div className="card-preview preview-word">
              <span>🐦</span>
              <span className="bird-bubble">Squawk!</span>
            </div>
            <div className="card-tags">
              <span className="tag new">New</span>
              <span className="tag">Vocabulary</span>
              <span className="tag">Strategy</span>
            </div>
            <div className="badge-bottom badge-green">PUNbelievable!</div>
          </a>

          {/* Logic Lagoon */}
          <a className="card lagoon" href="/logic-lagoon.html" style={{ cursor: 'pointer' }}>
            <div className="card-title">Logic Lagoon</div>
            <div className="card-preview preview-lagoon">
              <span>🌊</span>
              <span className="brain-bubble">🧠</span>
            </div>
            <div className="card-meta lagoon-desc">
              Logic-grid puzzles to train deductive reasoning
            </div>
            <div className="card-tags">
              <span className="tag new">New</span>
              <span className="tag">Deduction</span>
              <span className="tag">Logic Grid</span>
            </div>
            <div className="badge-bottom badge-teal">Dive In!</div>
          </a>

          {/* Lateral Lounge */}
          <a className="card lounge" href="/lateral-lounge.html" style={{ cursor: 'pointer' }}>
            <div className="card-title">Lateral Lounge</div>
            <div className="card-preview preview-lounge">
              <span>🛋️</span>
              <span className="lounge-bubble">💭</span>
            </div>
            <div className="card-meta lounge-desc">
              Think sideways — solve the twist in daily riddles
            </div>
            <div className="card-tags">
              <span className="tag new">New</span>
              <span className="tag">Riddles</span>
              <span className="tag">Lateral</span>
            </div>
            <div className="badge-bottom badge-amber">Think Sideways!</div>
          </a>

          {/* Memory Meadow */}
          <a className="card meadow" href="/memory-meadow.html" style={{ cursor: 'pointer' }}>
            <div className="card-title">Memory Meadow</div>
            <div className="card-preview preview-meadow">
              <span>🌸</span>
              <span className="meadow-bubble">🧠</span>
            </div>
            <div className="card-meta meadow-desc">
              Four memory games in surprise order — train your recall
            </div>
            <div className="card-tags">
              <span className="tag new">New</span>
              <span className="tag">Memory</span>
              <span className="tag">Focus</span>
            </div>
            <div className="badge-bottom badge-lavender">Train Your Brain!</div>
          </a>
        </div>
      </section>

      {/* MORE GAMES + PRICING */}
      <section className="cards-section">
        <div className="cards-grid">
          {/* Pattern Pulse */}
          <div className="card">
            <div className="card-title">Pattern Pulse</div>
            <div className="card-preview preview-pattern" />
            <div className="card-meta">
              Daily · 4 min <span className="star">⭐</span> 4.9
            </div>
            <div className="card-tags">
              <span className="tag">Visual Logic</span>
            </div>
            <div className="badge-bottom badge-coral">Explosive Fun</div>
          </div>

          {/* Number Nest */}
          <div className="card">
            <div className="card-title">Number Nest</div>
            <div className="card-preview preview-number">
              <span>☀️</span>
              <span style={{ fontSize: 44 }}>🧩</span>
            </div>
            <div className="card-meta">
              Medium · 6 min <span className="star">⭐</span> 4.9
            </div>
            <div className="card-tags">
              <span className="tag">Featured in</span>
              <span className="tag wired">WIRED</span>
            </div>
            <div className="badge-bottom badge-blue">Math with a Smile</div>
          </div>

          {/* Memory Meadow */}
          <div className="card">
            <div className="card-title">Memory Meadow</div>
            <div className="card-preview preview-memory">
              <span>🌸</span>
            </div>
            <div className="card-meta">
              Daily · 5 min <span className="star">⭐</span> 4.8
            </div>
            <div className="card-tags">
              <span className="tag">Pattern Recognition</span>
            </div>
            <div className="badge-bottom badge-purple">Magical &amp; Fun</div>
          </div>

          {/* Free Plan */}
          <div className="price-card">
            <div className="card-title">Free Plan</div>
            <div className="price-amount">$0</div>
            <ul className="price-features">
              <li>3 daily puzzles</li>
              <li>Basic stats</li>
              <li>Ad-supported</li>
              <li>Community leaderboards</li>
            </ul>
            <button className="price-cta price-cta-outline">Select Plan</button>
          </div>

          {/* Premium Plan */}
          <div className="price-card premium">
            <span className="most-fun">Most Fun!</span>
            <div className="card-title">Premium Membership</div>
            <div className="price-amount">
              $6.99<small>/mo or $59/yr</small>
            </div>
            <ul className="price-features">
              <li>Unlimited puzzles</li>
              <li>Ad-free experience</li>
              <li>Exclusive weekly challenges</li>
              <li>Streak saver</li>
              <li>Progress sync across devices</li>
              <li>Unlock Bird Badges</li>
            </ul>
            <button className="price-cta price-cta-coral">
              Upgrade &amp; Unleash the Fun!
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-text">
          <span>🎉 🦉</span>
          <span>
            Designed for the intellectually curious… and the playfully
            mischievous.
          </span>
          <span>🦉 🎉</span>
        </div>
      </footer>
    </>
  );
}

export default App;
