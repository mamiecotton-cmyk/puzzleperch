import { useState } from 'react';

const TAB_GROUPS = [
  { id: 'food',      label: 'Food & Drink',    icon: '🍕', color: 'from-fuchsia-500 to-violet-500', cats: [
    { name: 'Food',        icon: '🍕', free: true  },
    { name: 'Fruits',      icon: '🍎', free: false },
    { name: 'Desserts',    icon: '🍰', free: false },
    { name: 'Fast Food',   icon: '🍔', free: false },
    { name: 'Drinks',      icon: '🥤', free: false },
  ]},
  { id: 'animals',   label: 'Animals & Nature', icon: '🐼', color: 'from-emerald-400 to-lime-400', cats: [
    { name: 'Animals',     icon: '🐼', free: true  },
    { name: 'Ocean',       icon: '🐠', free: false },
    { name: 'Birds',       icon: '🦅', free: false },
    { name: 'Insects',     icon: '🐝', free: false },
    { name: 'Dinosaurs',   icon: '🦖', free: false },
    { name: 'Plants',      icon: '🌿', free: false },
  ]},
  { id: 'places',    label: 'Places',           icon: '🌍', color: 'from-sky-400 to-cyan-400', cats: [
    { name: 'Countries',   icon: '🌍', free: true  },
    { name: 'Capitals',    icon: '🏛️', free: false },
    { name: 'US States',   icon: '🇺🇸', free: false },
    { name: 'Cities',      icon: '🌆', free: false },
    { name: 'Landmarks',   icon: '🗽', free: false },
  ]},
  { id: 'ent',       label: 'Entertainment',    icon: '🎬', color: 'from-amber-400 to-orange-400', cats: [
    { name: 'Movies',      icon: '🎬', free: true  },
    { name: 'TV Shows',    icon: '📺', free: false },
    { name: 'Cartoons',    icon: '🎨', free: false },
    { name: 'Superheroes', icon: '🦸', free: false },
    { name: 'Disney',      icon: '🏰', free: false },
    { name: 'Video Games', icon: '🎮', free: false },
  ]},
  { id: 'music',     label: 'Music & Arts',     icon: '🎤', color: 'from-pink-400 to-rose-400', cats: [
    { name: 'Music',       icon: '🎤', free: true  },
    { name: 'Bands',       icon: '🎸', free: false },
    { name: 'Instruments', icon: '🎹', free: false },
    { name: 'Books',       icon: '📚', free: false },
    { name: 'Authors',     icon: '✍️', free: false },
    { name: 'Art',         icon: '🖼️', free: false },
    { name: 'Fashion',     icon: '👗', free: false },
  ]},
  { id: 'sports',    label: 'Sports & Body',    icon: '⚽', color: 'from-lime-400 to-green-500', cats: [
    { name: 'Sports',      icon: '⚽', free: true  },
    { name: 'Olympics',    icon: '🏅', free: false },
    { name: 'Athletes',    icon: '🏃', free: false },
    { name: 'Human Body',  icon: '🫀', free: false },
  ]},
  { id: 'knowledge', label: 'Knowledge',        icon: '🧠', color: 'from-violet-400 to-indigo-500', cats: [
    { name: 'Science',     icon: '🔬', free: true  },
    { name: 'Space',       icon: '🚀', free: false },
    { name: 'Inventions',  icon: '💡', free: false },
    { name: 'History',     icon: '📜', free: false },
    { name: 'Mythology',   icon: '⚡', free: false },
  ]},
  { id: 'life',      label: 'Everyday Life',    icon: '🎉', color: 'from-teal-400 to-cyan-500', cats: [
    { name: 'Jobs',        icon: '💼', free: true  },
    { name: 'Hobbies',     icon: '🎯', free: false },
    { name: 'Holidays',    icon: '🎄', free: false },
    { name: 'Colors',      icon: '🎨', free: false },
    { name: 'Toys',        icon: '🧸', free: false },
    { name: 'Vehicles',    icon: '🚗', free: false },
    { name: 'Weather',     icon: '⛅', free: false },
    { name: 'Technology',  icon: '💻', free: false },
  ]},
];

const difficulty = [
  { name: 'Easy',   icon: '🌱', desc: 'Relaxed warm-up',     accent: 'from-emerald-400/30 to-lime-300/20'   },
  { name: 'Medium', icon: '🔥', desc: 'Smart pressure',      accent: 'from-amber-400/30 to-orange-300/20'   },
  { name: 'Hard',   icon: '💎', desc: 'Brutally satisfying', accent: 'from-sky-400/30 to-violet-300/20'     },
];

export default function WordPerchRedesign() {
  const [activeTab, setActiveTab] = useState('food');
  const activeGroup = TAB_GROUPS.find(g => g.id === activeTab)!;

  return (
    <div className="min-h-screen bg-[#07111f] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(142,97,255,0.25),transparent_28%),radial-gradient(circle_at_top_right,rgba(0,214,201,0.18),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(160,255,96,0.13),transparent_24%)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-6">
        <header className="mb-6 flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-500 shadow-lg shadow-violet-900/40">🦉</div>
            <div>
              <div className="text-xl font-black tracking-tight">PuzzlePerch</div>
              <div className="text-xs text-white/55">WordPerch • Daily brain sprint</div>
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">⚡ 1,280 points</div>
            <div className="rounded-full border border-orange-400/20 bg-orange-400/10 px-4 py-2 text-sm text-orange-200">🔥 2-day streak</div>
            <button className="rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400 px-5 py-2.5 text-sm font-bold shadow-lg shadow-fuchsia-900/40">Play</button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-sm text-violet-200">
              <span>🧠</span>
              <span>Fresh AI-generated word puzzles every day</span>
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              Build speed.
              <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-orange-300 bg-clip-text text-transparent">
                Sharpen recall.
              </span>
              <span className="block text-white/90">Own the board.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
              Pick a category and difficulty — fresh AI-generated puzzles every day!
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {difficulty.map((item) => (
                <button
                  key={item.name}
                  className={`group rounded-[1.75rem] border border-white/10 bg-gradient-to-br ${item.accent} p-[1px] text-left transition hover:-translate-y-1`}
                >
                  <div className="rounded-[1.65rem] bg-[#0c1728]/95 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-3xl">{item.icon}</span>
                      <span className="rounded-full bg-white/8 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/45 group-hover:text-white/70">Mode</span>
                    </div>
                    <div className="text-2xl font-extrabold">{item.name}</div>
                    <div className="mt-1 text-sm text-white/60">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-500/20 to-cyan-400/10 p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.25em] text-white/45">Today's perch</div>
                <div className="mt-2 text-3xl font-black">Daily Challenge</div>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-2xl">🏆</div>
            </div>
            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#0b1626]/90 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">Logic + vocab mashup</div>
                  <div className="text-sm text-white/55">Finish in under 3:00</div>
                </div>
                <div className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-200">Medium</div>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/8">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-400 to-cyan-300" />
              </div>
              <div className="mt-2 flex justify-between text-sm text-white/55">
                <span>67% friends beat it</span>
                <span>3 min avg</span>
              </div>
              <button className="mt-6 w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-orange-400 px-5 py-4 text-lg font-extrabold shadow-xl shadow-fuchsia-900/35">
                Start Challenge
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/45">Best</div>
                <div className="mt-1 text-lg font-black">80</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/45">Streak</div>
                <div className="mt-1 text-lg font-black">2 days</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/45">Rank</div>
                <div className="mt-1 text-lg font-black">Top 18%</div>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm uppercase tracking-[0.22em] text-white/45">Browse worlds</div>
                <h2 className="mt-1 text-2xl font-black">Pick your category</h2>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {TAB_GROUPS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={item.id === activeTab
                    ? `rounded-full bg-gradient-to-r ${item.color} px-5 py-3 text-sm font-bold shadow-lg`
                    : 'rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/70 hover:bg-white/10'}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {activeGroup.cats.map((item) => (
                <button key={item.name} className="group rounded-[1.5rem] border border-white/10 bg-[#0b1626]/85 p-4 text-left transition hover:-translate-y-1 hover:border-violet-300/40 hover:bg-[#0e1b2f]">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="text-3xl">{item.icon}</div>
                    <span className={item.free ? 'rounded-full bg-lime-400/15 px-2.5 py-1 text-xs font-bold text-lime-200' : 'rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-bold text-amber-200'}>
                      {item.free ? 'FREE' : 'PRO'}
                    </span>
                  </div>
                  <div className="text-lg font-extrabold">{item.name}</div>
                  <div className="mt-1 text-sm text-white/50">Fast round • 3–5 min</div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
