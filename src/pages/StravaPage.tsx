import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { House } from 'lucide-react';

interface AthleteStats {
  recent_run_totals: { distance: number; moving_time: number; elevation_gain: number; count: number };
  ytd_run_totals:    { distance: number; moving_time: number; elevation_gain: number; count: number };
  recent_ride_totals: { distance: number; moving_time: number; elevation_gain: number; count: number };
}

interface Athlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  stats: AthleteStats;
  recent_activities: { name: string; type: string; distance: number; moving_time: number; total_elevation_gain: number; start_date: string }[];
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

export default function StravaPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<Metric>('distance');
  const [period, setPeriod] = useState<Period>('recent');
  const [roast, setRoast] = useState('');
  const [roasting, setRoasting] = useState(false);
  const [params] = useSearchParams();

  useEffect(() => {
    fetch('/api/strava/athletes')
      .then((r) => r.json())
      .then((data) => { setAthletes(data); setLoading(false); })
      .catch(() => setLoading(false));

    // Auto-load today's roast
    fetch('/api/strava/roast')
      .then((r) => r.json())
      .then((data: { roast: string }) => setRoast(data.roast))
      .catch(() => {});
  }, []);

  async function handleRoast() {
    setRoasting(true);
    setRoast('');
    const res = await fetch('/api/strava/roast?force=1');
    const data = await res.json() as { roast: string };
    setRoast(data.roast);
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="text-white/40 hover:text-white/80 transition-colors">
          <House className="w-5 h-5" />
        </Link>
        <h1 className="font-mono font-bold tracking-tight">strava wars</h1>
        <a
          href="/api/strava/auth"
          className="font-mono text-xs bg-[#fc4c02] hover:bg-[#e04400] text-white px-3 py-1.5 rounded transition-colors"
        >
          + connect
        </a>
      </header>

      {/* Connected banner */}
      {params.get('connected') && (
        <div className="bg-green-900/30 border-b border-green-500/20 px-6 py-2 text-center font-mono text-xs text-green-400">
          you're in 🎉
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 px-6 pt-6 flex-wrap">
        {(['recent', 'ytd'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${period === p ? 'border-white/40 text-white' : 'border-white/10 text-white/40 hover:text-white/60'}`}
          >
            {p === 'recent' ? 'last 4 weeks' : 'this year'}
          </button>
        ))}
        <div className="flex-1" />
        {(['distance', 'elevation', 'count'] as Metric[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${metric === m ? 'border-[#fc4c02]/60 text-[#fc4c02]' : 'border-white/10 text-white/40 hover:text-white/60'}`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <main className="flex-1 px-6 py-6 max-w-2xl w-full mx-auto">
        {loading ? (
          <p className="font-mono text-white/30 text-sm text-center py-20">loading...</p>
        ) : athletes.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-mono text-white/30 text-sm">no one's connected yet</p>
            <p className="font-mono text-white/20 text-xs mt-2">be the first → click + connect</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sorted.map((athlete, i) => {
              const val = getVal(athlete);
              const pct = max > 0 ? (val / max) * 100 : 0;
              const totals = period === 'recent' ? athlete.stats.recent_run_totals : athlete.stats.ytd_run_totals;

              return (
                <div key={athlete.id} className="flex items-center gap-4">
                  {/* Rank */}
                  <span className="font-mono text-sm text-white/30 w-4 text-right shrink-0">
                    {i + 1}
                  </span>

                  {/* Avatar */}
                  <img
                    src={athlete.profile}
                    alt={athlete.firstname}
                    className="w-9 h-9 rounded-full shrink-0 object-cover"
                  />

                  {/* Bar + info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-mono text-sm font-semibold truncate">
                        {athlete.firstname} {athlete.lastname[0]}.
                      </span>
                      <span className="font-mono text-sm text-white/70 ml-2 shrink-0">
                        {metric === 'distance' ? fmt(val)
                          : metric === 'elevation' ? `${Math.round(val)}m`
                          : `${val} runs`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: i === 0 ? '#fc4c02' : `rgba(252,76,2,${0.4 - i * 0.07})`,
                        }}
                      />
                    </div>
                    <div className="flex gap-3 mt-1">
                      <span className="font-mono text-xs text-white/25">{fmtTime(totals.moving_time)}</span>
                      <span className="font-mono text-xs text-white/25">↑{Math.round(totals.elevation_gain)}m</span>
                      <span className="font-mono text-xs text-white/25">{totals.count} runs</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}


        {/* Roast section */}
        {athletes.length > 0 && (
          <div className="mt-10 border-t border-white/10 pt-8">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs text-white/30 uppercase tracking-widest">weekly roast</span>
              <button
                onClick={handleRoast}
                disabled={roasting}
                className="font-mono text-xs border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-3 py-1.5 rounded transition-colors disabled:opacity-40"
              >
                {roasting ? 'roasting...' : '↺ refresh'}
              </button>
            </div>
            {roast && (
              <p className="font-mono text-sm text-white/80 leading-relaxed">{roast}</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
