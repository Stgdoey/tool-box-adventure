const speak = (text) => {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 1.05;
    u.lang = "en-US";
    synth.speak(u);
  } catch {}
};

// --- Audio Manager (WebAudio; no external files) ---
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.3;
  }
  ensure() {
    if (!this.ctx && typeof window !== 'undefined') {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
  }
  setEnabled(v){ this.enabled = v; if (!v && this.ctx) { /* could suspend */ } }
  setVolume(v){ this.volume = Math.max(0, Math.min(1, v)); }
  tone(freq=880, dur=0.15, type='sine'){
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = this.volume;
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(g); g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }
  // simple sounds
  ding(){ this.tone(880, 0.12, 'triangle'); this.tone(1320, 0.08, 'sine'); }
  clink(){ this.tone(600, 0.06, 'square'); this.tone(900, 0.05, 'triangle'); }
  dawn(){ this.tone(523.25,0.18,'sine'); setTimeout(()=>this.tone(659.25,0.18,'sine'),140); setTimeout(()=>this.tone(783.99,0.22,'sine'),280); }
}
const SND = new SoundManager();

const tierColor = (tier) => tier==='gold'? '#f59e0b' : tier==='silver'? '#9ca3af' : tier==='bronze'? '#b45309' : '#10b981';

// Global milestone config (extendable)
const MILESTONES_DEFAULT = [
  { xpThreshold: 10, reward: 'Gold Star' },
  { xpThreshold: 15, reward: 'Builder Hat' },
  { xpThreshold: 20, reward: 'Gear' },
  { xpThreshold: 25, reward: 'Goggles' },
  { xpThreshold: 30, reward: 'Heart' },
  { xpThreshold: 35, reward: 'Work Gloves' },
  { xpThreshold: 40, reward: 'Wrench' },
];
const [milestones, setMilestones] = useLocalState('ta_milestones', MILESTONES_DEFAULT);
const getNextMilestone = (xp) => {
  const sorted = [...(seasonFile?.milestones?.length ? seasonFile.milestones : milestones)].sort((a,b)=>a.xpThreshold-b.xpThreshold);
  for (const m of sorted) if (xp < m.xpThreshold) return m;
  return null;
};

const useLocalState = (key, initial) => {
  const [val, setVal] = React.useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  
  const addXP = (delta) => {
    const next = Math.max(0, xp + delta);
    setXp(next);
  };

  const unlockByXP = () => {
    const thresholds = {
"
      "  's_star': 10,
"
      "  's_gear': 20,
"
      "  's_heart': 30,
"
      "  's_wrench': 40
"
      "};
"
      "const avatarUnlocks = { hat: 15, goggles: 25, gloves: 35 };
"
      "const ns = stickers.map(s => ({...s}));
"
      "for (const s of ns) { if (xp >= thresholds[s.id]) s.unlocked = true; }
"
      "const nav = { ...avatar, unlocked: { ...avatar.unlocked } };
"
      "for (const k of Object.keys(avatarUnlocks)) { if (xp >= avatarUnlocks[k]) nav.unlocked[k] = true; }
"
      "setStickers(ns); setAvatar(nav);
"
  };

  React.useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  const monthId = () => new Date().toISOString().slice(0,7);
  const [seasonFile, setSeasonFile] = React.useState({ name: null, milestones: [] });
  const [season, setSeason] = useLocalState("ta_season", {
    id: monthId(), name: 'Season of Sparks', enabled: true,
    streak: 0, lastDate: null,
    badgesCfg: [
      { days: 5, reward: 'Spark Scout', tier: 'bronze' },
      { days: 10, reward: 'Workshop Warden', tier: 'silver' },
      { days: 20, reward: 'Guardian of Gears', tier: 'gold' },
    ],
    earned: []
  });
  return [val, setVal];
};

const apprenticeSpeech = `Apprentice, welcome back to the workshop. You gathered your supplies and built half your box—strong work. Today we focus on two things: a steady handle and colors that make the box truly yours. We move with calm hands and sharp eyes. Breathe in. Shoulders down. We build with respect for our tools and for each other.`;

const toolOath = `I will treat my tools with respect. I will work with patience and care. I will fix what I can, ask for help when I need it, and celebrate small wins. I will put tools back where they belong. I am an Apprentice Builder—and I grow stronger each time I try.`;

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl shadow-lg p-5 bg-white/90 ${className}`}>
      {children}
    </div>
  );
}

function BigButton({ children, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-lg md:text-xl font-semibold rounded-2xl px-5 py-4 mt-3 transition active:scale-95 
        ${disabled ? "bg-zinc-300 text-zinc-500" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
    >
      {children}
    </button>
  );
}

function App() {
  const [focusMode, setFocusMode] = useLocalState("ta_focus", false);
  const [activeStep, setActiveStep] = useLocalState("ta_step", 0);
  const [handleType, setHandleType] = useLocalState("ta_handleType", "rope");
  const [color, setColor] = useLocalState("ta_color", "#3b82f6");
  const [colorName, setColorName] = useLocalState("ta_colorName", "Blue Bolt");
  const [checkA, setCheckA] = useLocalState("ta_check_handle", [
    { id: "mark", text: "Mark and center the handle holes.", done: false },
    { id: "pilot", text: "Drill small pilot holes (careful & straight).", done: false },
    { id: "attach", text: "Secure the handle (rope/metal/wood).", done: false },
    { id: "test", text: "Test the handle with gentle lifts.", done: false },
  ]);
  const [checkB, setCheckB] = useLocalState("ta_check_color", [
    { id: "sand", text: "Lightly sand edges—smooth and safe.", done: false },
    { id: "dust", text: "Wipe away dust with a cloth.", done: false },
    { id: "first", text: "Apply first coat (thin, even strokes).", done: false },
    { id: "dry", text: "Let it dry fully (timer below).", done: false },
    { id: "second", text: "Optional: second coat or sealant.", done: false },
  ]);

  const [timerSecs, setTimerSecs] = useLocalState("ta_timer", 15 * 60);
  const [running, setRunning] = useLocalState("ta_timer_run", false);
  const intervalRef = React.useRef(null);

  
  const addXP = (delta) => {
    const next = Math.max(0, xp + delta);
    setXp(next);
  };

  const unlockByXP = () => {
    const thresholds = {
"
      "  's_star': 10,
"
      "  's_gear': 20,
"
      "  's_heart': 30,
"
      "  's_wrench': 40
"
      "};
"
      "const avatarUnlocks = { hat: 15, goggles: 25, gloves: 35 };
"
      "const ns = stickers.map(s => ({...s}));
"
      "for (const s of ns) { if (xp >= thresholds[s.id]) s.unlocked = true; }
"
      "const nav = { ...avatar, unlocked: { ...avatar.unlocked } };
"
      "for (const k of Object.keys(avatarUnlocks)) { if (xp >= avatarUnlocks[k]) nav.unlocked[k] = true; }
"
      "setStickers(ns); setAvatar(nav);
"
  };

  React.useEffect(() => {
    if (!running) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setTimerSecs((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running, setTimerSecs]);

  
  const addXP = (delta) => {
    const next = Math.max(0, xp + delta);
    setXp(next);
  };

  const unlockByXP = () => {
    const thresholds = {
"
      "  's_star': 10,
"
      "  's_gear': 20,
"
      "  's_heart': 30,
"
      "  's_wrench': 40
"
      "};
"
      "const avatarUnlocks = { hat: 15, goggles: 25, gloves: 35 };
"
      "const ns = stickers.map(s => ({...s}));
"
      "for (const s of ns) { if (xp >= thresholds[s.id]) s.unlocked = true; }
"
      "const nav = { ...avatar, unlocked: { ...avatar.unlocked } };
"
      "for (const k of Object.keys(avatarUnlocks)) { if (xp >= avatarUnlocks[k]) nav.unlocked[k] = true; }
"
      "setStickers(ns); setAvatar(nav);
"
  };

  React.useEffect(() => {
    if (timerSecs === 0 && running) {
      setRunning(false);
      speak("Timer complete. Nice patience, builder.");
    }
  }, [timerSecs, running, setRunning]);

  const stickerCatalog = React.useMemo(() => {
    // base unlockables (threshold stickers)
    const base = [
      { id: 's_star', name: 'Gold Star' },
      { id: 's_gear', name: 'Gear' },
      { id: 's_heart', name: 'Heart' },
      { id: 's_wrench', name: 'Wrench' },
    ];
    // shop items marked as sticker
    const shopStickers = (shop||[]).filter(x=>x.type==='sticker').map(x=>({ id: x.id, name: x.name }));
    const rareStickers = (rareCfg||[]).map(r=>({ id: r.id, name: r.name }));
    // streak badges as stickers
    const badgeStickers = (badges||[]).map(b=>({ id: 'badge_'+b.replaceAll(' ','_').toLowerCase(), name: b }));
    // dedupe by id
    const seen = new Set();
    const out = [];
    [...base, ...shopStickers, ...badgeStickers, ...rareStickers].forEach(s=>{ if (!seen.has(s.id)) { seen.add(s.id); out.push(s); } });
    return out;
  }, [shop, badges]);

  const steps = React.useMemo(() => [
      {
        key: "apprentice",
        title: "Apprentice Builder: Focus In",
        body: (
          <div>
            <p className="text-base md:text-lg leading-relaxed">
              {apprenticeSpeech}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <BigButton onClick={() => speak(apprenticeSpeech)}>Read Aloud</BigButton>
              <BigButton onClick={() => setActiveStep(1)}>I’m Ready →</BigButton>
            </div>
          </div>
        ),
      },
      {
        key: "handle",
        title: "Finish the Handle",
        body: (
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="font-medium">Handle type:</label>
              <select
                value={handleType}
                onChange={(e) => setHandleType(e.target.value)}
                className="rounded-xl px-3 py-2 bg-white/80 border border-zinc-300"
              >
                <option value="rope">Rope (knotted inside)</option>
                <option value="metal">Metal (U-handle)</option>
                <option value="wood">Wooden dowel</option>
              </select>
            </div>

            <ul className="mt-4 space-y-2">
              {checkA.map((c, i) => (
                <li key={c.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={c.done}
                    onChange={(e) => {
                      const next = [...checkA];
                      next[i] = { ...c, done: e.target.checked };
                      setCheckA(next);
                    }}
                    className="h-5 w-5"
                  />
                  <span className={`text-base ${c.done ? "line-through text-zinc-500" : ""}`}>{c.text}</span>
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <BigButton onClick={() => setCheckA(checkA.map((x) => ({ ...x, done: false })))}>Reset</BigButton>
              <BigButton onClick={() => setActiveStep(2)} disabled={!checkA.every((x) => x.done)}>Next: Color →</BigButton>
            </div>
          </div>
        ),
      },
      {
        key: "color",
        title: "Pick a Color & Paint",
        body: (
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Choose color"
                className="h-12 w-20 rounded-lg border border-zinc-300"
              />
              <input
                type="text"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="Color name (e.g., Dragonberry)"
                className="flex-1 rounded-xl px-3 py-2 bg-white/80 border border-zinc-300"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-70">Preview</span>
                <div className="h-10 w-16 rounded-lg border" style={{ background: color }} />
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {checkB.map((c, i) => (
                <li key={c.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={c.done}
                    onChange={(e) => {
                      const next = [...checkB];
                      next[i] = { ...c, done: e.target.checked };
                      setCheckB(next);
                    }}
                    className="h-5 w-5"
                  />
                  <span className={`text-base ${c.done ? "line-through text-zinc-500" : ""}`}>{c.text}</span>
                </li>
              ))}
            </ul>

            <Card className="mt-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold">Drying timer</span>
                <input
                  type="number"
                  value={Math.floor(timerSecs / 60)}
                  onChange={(e) => setTimerSecs(Math.max(0, Number(e.target.value)) * 60)}
                  className="w-24 rounded-xl px-3 py-2 bg-white/80 border border-zinc-300"
                />
                <span className="opacity-70">minutes</span>
              </div>
              <div className="text-3xl font-bold mt-2 tabular-nums">
                {String(Math.floor(timerSecs / 60)).padStart(2, "0")}:{String(timerSecs % 60).padStart(2, "0")}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <BigButton onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Start"}</BigButton>
                <BigButton onClick={() => setTimerSecs(15 * 60)}>15m</BigButton>
                <BigButton onClick={() => setTimerSecs(30 * 60)}>30m</BigButton>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <BigButton onClick={() => setCheckB(checkB.map((x) => ({ ...x, done: false })))}>Reset</BigButton>
              <BigButton onClick={() => setActiveStep(3)} disabled={!checkB.every((x) => x.done)}>Finish →</BigButton>
            </div>
          </div>
        ),
      },
      {
        key: "stickers",
        title: "Sticker Time!",
        body: (
          <div>
            <p className="text-base md:text-lg">Earn stickers by finishing missions. Place them on your box preview!</p>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              {stickers.map(s => (
                <button key={s.id}
                  disabled={!s.unlocked}
                  onClick={() => {
                    if (!s.unlocked) return;
                    const next = [...placedStickers, s.id];
                    setPlacedStickers(next);
                  }}
                  className={`rounded-xl px-3 py-3 border ${s.unlocked ? 'bg-white hover:bg-amber-50' : 'bg-zinc-200 text-zinc-500'}`}
                >
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs opacity-70">{s.unlocked ? 'Unlocked' : 'Locked'}</div>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <div className="text-sm opacity-80">XP: <span className="font-semibold">{xp}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button className="rounded-2xl px-5 py-3 font-semibold bg-zinc-200"
                onClick={() => setPlacedStickers([])}>Clear Stickers</button>
              <button className="rounded-2xl px-5 py-3 font-semibold bg-blue-600 text-white"
                onClick={() => setActiveStep(4)}>Next: Avatar →</button>
            </div>
          </div>
        ),
      },
      {
        key: "avatar",
        title: "Build Your Avatar",
        body: (
          <div>
            <p className="text-base md:text-lg">Customize Kairi’s builder avatar. Items unlock with XP.</p>
            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <div className="rounded-xl border p-4">
                <div className="text-sm opacity-70 mb-2">Preview</div>
                <div className="w-40 h-52 mx-auto relative">
                  {/* Body */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-36 rounded-2xl" style={{ background: avatar.skin }} />
                  {/* Hair */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-14 rounded-t-3xl" style={{ background: avatar.hair }} />
                  {/* Eyes */}
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 flex gap-4">
                    <div className="w-3 h-3 rounded-full" style={{ background: avatar.eyes }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: avatar.eyes }} />
                  </div>
                  {/* Hat */}
                  {avatar.hat && <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-8 rounded-b-xl bg-black/70" />}
                  {/* Goggles */}
                  {avatar.goggles && <div className="absolute top-14 left-1/2 -translate-x-1/2 flex gap-2">
                    <div className="w-6 h-4 rounded bg-black/40 border" />
                    <div className="w-6 h-4 rounded bg-black/40 border" />
                  </div>}
                  {/* Gloves */}
                  {avatar.gloves && <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-28 h-6 rounded bg-black/30" />}
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm opacity-80">Hair</label>
                    <input type="color" value={avatar.hair} onChange={(e)=>setAvatar({ ...avatar, hair: e.target.value })}
                      className="w-full h-10 rounded border"/>
                  </div>
                  <div>
                    <label className="text-sm opacity-80">Eyes</label>
                    <input type="color" value={avatar.eyes} onChange={(e)=>setAvatar({ ...avatar, eyes: e.target.value })}
                      className="w-full h-10 rounded border"/>
                  </div>
                  <div>
                    <label className="text-sm opacity-80">Skin</label>
                    <input type="color" value={avatar.skin} onChange={(e)=>setAvatar({ ...avatar, skin: e.target.value })}
                      className="w-full h-10 rounded border"/>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    disabled={!avatar.unlocked.hat}
                    onClick={()=>setAvatar({ ...avatar, hat: !avatar.hat })}
                    className={`w-full rounded-xl px-3 py-2 border ${avatar.unlocked.hat ? 'bg-white' : 'bg-zinc-200 text-zinc-500'}`}
                  >Toggle Hat (XP 15)</button>
                  <button
                    disabled={!avatar.unlocked.goggles}
                    onClick={()=>setAvatar({ ...avatar, goggles: !avatar.goggles })}
                    className={`w-full rounded-xl px-3 py-2 border ${avatar.unlocked.goggles ? 'bg-white' : 'bg-zinc-200 text-zinc-500'}`}
                  >Toggle Goggles (XP 25)</button>
                  <button
                    disabled={!avatar.unlocked.gloves}
                    onClick={()=>setAvatar({ ...avatar, gloves: !avatar.gloves })}
                    className={`w-full rounded-xl px-3 py-2 border ${avatar.unlocked.gloves ? 'bg-white' : 'bg-zinc-200 text-zinc-500'}`}
                  >Toggle Gloves (XP 35)</button>
                </div>

                <div className="mt-4 text-sm opacity-80">XP: <span className="font-semibold">{xp}</span></div>
                <div className="mt-3">
                  <button className="rounded-2xl px-5 py-3 font-semibold bg-blue-600 text-white" onClick={()=>setActiveStep(5)}>Next: Tool Oath →</button>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "oath",
        title: "Tool Oath",
        body: (
          <div>
            <p className="text-base md:text-lg leading-relaxed">{toolOath}</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <BigButton onClick={() => speak(toolOath)}>Read Aloud</BigButton>
              <BigButton onClick={() => alert("Oath complete! Apprentice leveled up.")}>Mark Complete</BigButton>
            </div>

            <Card className="mt-5">
              <h3 className="text-lg font-semibold mb-2">Sunday Tool Care (Quiet Ritual)</h3>
              <ul className="list-disc pl-6 space-y-1 text-base">
                <li>Wipe tools clean and dry.</li>
                <li>Return each tool to its home spot.</li>
                <li>Check the box for loose screws.</li>
                <li>Plan next week’s mini-fix mission.</li>
              </ul>
            </Card>
          </div>
        ),
      },
    ], [checkA, checkB, handleType, color, colorName]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-200 text-zinc-900">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-extrabold">🔧 Toolbox Adventure – Focus Mode</h1>
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold border ${focusMode ? "bg-purple-600 text-white border-purple-600" : "bg-white/80 border-zinc-300"}`}
            onClick={() => setFocusMode((v) => !v)}
            aria-label="Toggle Focus Mode"
          >
            {focusMode ? "Exit Focus" : "Focus Mode"}
          </button>
          <div className="hidden md:flex items-center gap-2 ml-2">
            <button className="rounded-full px-3 py-2 text-xs font-semibold border bg-white/80" onClick={()=>SND.setEnabled(!SND.enabled)}>{SND.enabled? 'Mute' : 'Unmute'}</button>
            <input type="range" min="0" max="1" step="0.05" defaultValue="0.3" onChange={(e)=>SND.setVolume(parseFloat(e.target.value))} />
          </div>
        </header>

        <Card className="mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm opacity-70">Progress</span>
            <div className="flex-1 h-3 rounded-full bg-zinc-200 overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{ width: `${(Math.min(activeStep, steps.length - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold">
              Step {Math.min(activeStep + 1, steps.length)} / {steps.length}
            </span>
          </div>
        </Card>

        <div className={`grid ${focusMode ? "grid-cols-1" : "md:grid-cols-5"} gap-4 mt-4`}>
          {!focusMode && (
            <Card className="md:col-span-2">
              <h2 className="text-lg font-bold mb-2">Steps</h2>
              <ol className="space-y-2">
                {steps.map((s, idx) => (
                  <li key={s.key}>
                    <button
                      onClick={() => setActiveStep(idx)}
                      className={`w-full text-left rounded-xl px-3 py-2 border transition ${
                        idx === activeStep
                          ? "bg-green-100 border-green-400"
                          : "bg-white/70 border-zinc-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm opacity-70">{idx + 1}.</span>
                        <span className="font-semibold">{s.title}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ol>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <BigButton onClick={() => setActiveStep(Math.max(0, activeStep - 1))} disabled={activeStep === 0}>
                  ← Back
                </BigButton>
                <BigButton onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}>
                  Next →
                </BigButton>
              </div>
            </Card>
          )}

          <Card className={`${focusMode ? "" : "md:col-span-3"}`}>
            <h2 className="text-xl md:text-2xl font-bold mb-2">{steps[activeStep]?.title}</h2>
            <div>{steps[activeStep]?.body}</div>
          </Card>
        </div>

        {!focusMode && (
          <Card className="mt-4">
            <h3 className="text-lg font-bold mb-2">Box Preview</h3>
            <div className="flex flex-wrap items-center gap-6">
              <div className="w-44 h-28 rounded-xl border shadow-inner relative overflow-hidden" style={{ background: color }}>
              {placedStickers.map((id, idx) => (
                <div key={idx} className="absolute text-xs font-bold px-2 py-1 rounded"
                  style={{
                    top: (idx*10)%90 + '%', left: (idx*17)%80 + '%',
                    background: id==='s_star'?'#fbbf24': id==='s_gear'?'#9ca3af': id==='s_heart'?'#ef4444':'#94a3b8',
                    color: 'white'
                  }}>
                  {id.replace('s_','')}
                </div>
              ))}
            </div>
              <div className="text-base">
                <div><span className="opacity-70">Color name:</span> <span className="font-semibold">{colorName}</span></div>
                <div><span className="opacity-70">Hex:</span> <span className="font-mono">{color}</span></div>
                <div><span className="opacity-70">Handle:</span> <span className="font-semibold capitalize">{handleType}</span></div>
              </div>
            </div>
          </Card>
        )}


        {showDawn && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-b from-amber-200 to-amber-500 animate-fadein">
            <div className="text-center">
              <div className="mx-auto w-40 h-28 bg-amber-300 rounded-2xl shadow-2xl animate-pulse-glow"></div>
              <div className="mt-4 text-2xl font-extrabold text-white drop-shadow">A new day dawns in the Workshop</div>
              <div className="mt-1 text-white/90">Today’s quests await you, Apprentice Kairi.</div>
              <button className="mt-4 rounded-xl px-4 py-2 bg-white text-amber-700 font-semibold" onClick={()=> setShowDawn(false)}>Begin</button>
            </div>
          </div>
        )}

        <footer className="mt-8 text-center opacity-70 text-sm">
          Built for calm focus. Progress is saved on this device.
        </footer>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);