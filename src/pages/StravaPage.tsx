import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { House, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface AthleteStats {
  recent_run_totals: { distance: number; moving_time: number; elevation_gain: number; count: number };
  ytd_run_totals:    { distance: number; moving_time: number; elevation_gain: number; count: number };
}

interface Athlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  stats: AthleteStats;
}

function fmt(meters: number) {
  return (meters / 1000).toFixed(1) + ' km';
}

function fmtTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

type Metric = 'distance' | 'elevation' | 'count';
type Period = 'recent' | 'ytd';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function StravaPage() {
  const { isDark, toggle } = useTheme();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<Metric>('distance');
  const [period, setPeriod] = useState<Period>('recent');
  const [roasts, setRoasts] = useState<Record<string, string>>({});
  const [roasting, setRoasting] = useState(false);
  const [params] = useSearchParams();

  useEffect(() => {
    // Persist athlete ID to localStorage after OAuth
    const aid = params.get('aid');
    if (aid) localStorage.setItem('strava_aid', aid);

    fetch('/api/strava/athletes')
      .then((r) => r.json())
      .then((data) => { setAthletes(data); setLoading(false); })
      .catch(() => setLoading(false));

    fetch('/api/strava/roast')
      .then((r) => r.json())
      .then((data: { roasts: Record<string, string> }) => setRoasts(data.roasts ?? {}))
      .catch(() => {});
  }, []);

  async function handleRefreshRoast() {
    setRoasting(true);
    const res = await fetch('/api/strava/roast?force=1');
    const data = await res.json() as { roasts: Record<string, string> };
    setRoasts(data.roasts ?? {});
    setRoasting(false);
  }

  function getVal(a: Athlete): number {
    const totals = period === 'recent' ? a.stats.recent_run_totals : a.stats.ytd_run_totals;
    if (metric === 'distance') return totals.distance;
    if (metric === 'elevation') return totals.elevation_gain;
    return totals.count;
  }

  const sorted = [...athletes].sort((a, b) => getVal(b) - getVal(a));
  const max = sorted[0] ? getVal(sorted[0]) : 1;
  const myId = localStorage.getItem('strava_aid');
  const alreadyConnected = myId && athletes.some((a) => String(a.id) === myId);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-white flex flex-col transition-colors">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/10">
        <Link to="/" className="text-zinc-400 hover:text-zinc-700 dark:text-white/40 dark:hover:text-white/80 transition-colors">
          <House className="w-5 h-5" />
        </Link>
        <h1 className="font-mono text-lg font-bold tracking-tight">strava wars</h1>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="text-zinc-400 hover:text-zinc-700 dark:text-white/40 dark:hover:text-white/80 transition-colors">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {!alreadyConnected && (
            <a href="/api/strava/auth" className="font-mono text-xs border border-zinc-300 dark:border-white/20 text-zinc-500 dark:text-white/50 hover:text-zinc-800 dark:hover:text-white hover:border-zinc-400 dark:hover:border-white/40 px-3 py-1.5 rounded transition-colors">
              + connect
            </a>
          )}
        </div>
      </header>

      {params.get('connected') && (
        <div className="bg-green-50 dark:bg-green-900/30 border-b border-green-200 dark:border-green-500/20 px-6 py-2 text-center font-mono text-xs text-green-600 dark:text-green-400">
          you're in 🎉
        </div>
      )}

      <main className="flex-1 px-6 py-8 max-w-2xl w-full mx-auto flex flex-col gap-8">

        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          {(['recent', 'ytd'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${
                period === p
                  ? 'border-zinc-400 dark:border-white/40 text-zinc-900 dark:text-white'
                  : 'border-zinc-200 dark:border-white/10 text-zinc-400 dark:text-white/40 hover:text-zinc-600 dark:hover:text-white/60'
              }`}>
              {p === 'recent' ? 'last 4 weeks' : 'this year'}
            </button>
          ))}
          <div className="flex-1" />
          {(['distance', 'elevation', 'count'] as Metric[]).map((m) => (
            <button key={m} onClick={() => setMetric(m)}
              className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${
                metric === m
                  ? 'border-[#fc4c02]/60 text-[#fc4c02]'
                  : 'border-zinc-200 dark:border-white/10 text-zinc-400 dark:text-white/40 hover:text-zinc-600 dark:hover:text-white/60'
              }`}>
              {m}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        {loading ? (
          <p className="font-mono text-zinc-400 dark:text-white/30 text-sm text-center py-20">loading...</p>
        ) : athletes.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-mono text-zinc-400 dark:text-white/30 text-sm">no one's connected yet</p>
            <p className="font-mono text-zinc-300 dark:text-white/20 text-xs mt-2">be the first → click + connect</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {sorted.map((athlete, i) => {
              const val = getVal(athlete);
              const pct = max > 0 ? (val / max) * 100 : 0;
              const totals = period === 'recent' ? athlete.stats.recent_run_totals : athlete.stats.ytd_run_totals;
              const roast = roasts[athlete.firstname];

              return (
                <div key={athlete.id} className="flex gap-4">
                  {/* Avatar + medal */}
                  <div className="relative shrink-0">
                    <img src={athlete.profile} alt={athlete.firstname} className="w-14 h-14 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-white/10" />
                    {i < 3 && (
                      <span className="absolute -bottom-1 -right-1 text-base leading-none">{MEDALS[i]}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="font-mono font-bold text-base">
                        {athlete.firstname} {athlete.lastname[0]}.
                      </span>
                      <span className="font-mono text-base font-semibold text-zinc-700 dark:text-white/70 ml-2 shrink-0">
                        {metric === 'distance' ? fmt(val)
                          : metric === 'elevation' ? `${Math.round(val)}m`
                          : `${val} runs`}
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="h-1.5 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: i === 0 ? '#fc4c02' : `rgba(252,76,2,${0.5 - i * 0.05})` }} />
                    </div>

                    {/* Sub stats */}
                    <div className="flex gap-4 mb-2">
                      <span className="font-mono text-xs text-zinc-400 dark:text-white/25">{fmtTime(totals.moving_time)}</span>
                      <span className="font-mono text-xs text-zinc-400 dark:text-white/25">↑{Math.round(totals.elevation_gain)}m</span>
                      <span className="font-mono text-xs text-zinc-400 dark:text-white/25">{totals.count} runs</span>
                    </div>

                    {/* Roast */}
                    {roast && (
                      <p className="font-mono text-sm text-zinc-500 dark:text-white/50 italic leading-relaxed border-l-2 border-zinc-200 dark:border-white/10 pl-3 mt-1">
                        {roast}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Refresh roast */}
            <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-white/5">
              <button onClick={handleRefreshRoast} disabled={roasting}
                className="font-mono text-xs text-zinc-300 dark:text-white/20 hover:text-zinc-500 dark:hover:text-white/40 transition-colors disabled:opacity-30">
                {roasting ? 'roasting...' : '↺ new roast'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
