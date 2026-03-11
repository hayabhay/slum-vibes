import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { House, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';


interface Totals {
  distance: number;
  moving_time: number;
  elevation_gain: number;
  count: number;
}

interface Athlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  stats: { totals: Totals };
}

interface Activity {
  id: string;
  firstname: string;
  lastname: string;
  profile: string | null;
  name: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elevation_gain: number;
}

function normalizeProfileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('http://')) return `https://${trimmed.slice('http://'.length)}`;
  if (trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return `https://www.strava.com${trimmed}`;
  return `https://www.strava.com/${trimmed}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

function Avatar({
  name,
  profile,
  className,
}: {
  name: string;
  profile: string | null | undefined;
  className: string;
}) {
  const [hasError, setHasError] = useState(false);
  const src = normalizeProfileUrl(profile);

  if (!src || hasError) {
    return (
      <div
        className={`${className} bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-white/50 flex items-center justify-center font-mono text-xs font-bold`}
        aria-label={name}
      >
        {initials(name) || '?'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

function fmt(meters: number) {
  return (meters / 1000).toFixed(1) + ' km';
}

function fmtTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

type Tab = 'feed' | 'leaderboard';
type Metric = 'distance' | 'elevation' | 'count' | 'calories';

function estimateCalories(activity: Activity): number {
  const hours = activity.moving_time / 3600;
  const sport = (activity.sport_type ?? '').toLowerCase();
  let met = 7;
  if (sport.includes('run')) met = 10;
  else if (sport.includes('ride') || sport.includes('cycling') || sport.includes('virtual')) met = 8;
  else if (sport.includes('walk')) met = 4;
  else if (sport.includes('swim')) met = 7;
  else if (sport.includes('hike')) met = 6;
  return Math.round(met * 70 * hours);
}

function metricVal(totals: Totals | undefined, metric: Metric) {
  if (!totals) return 0;
  if (metric === 'distance') return totals.distance;
  if (metric === 'elevation') return totals.elevation_gain;
  if (metric === 'count') return totals.count;
  return 0;
}

function fmtMetric(val: number, metric: Metric) {
  if (metric === 'distance') return fmt(val);
  if (metric === 'elevation') return `${Math.round(val)}m`;
  if (metric === 'calories') return `${val.toLocaleString()} kcal`;
  return `${val} activities`;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function StravaPage() {
  const { isDark, toggle } = useTheme();
  const [tab, setTab] = useState<Tab>('feed');

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityRoasts, setActivityRoasts] = useState<Record<string, string>>({});
  const [visibleCount, setVisibleCount] = useState(20);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [roasts, setRoasts] = useState<Record<string, string>>({});
  const [nicks, setNicks] = useState<Record<string, string>>({});
  const [metric, setMetric] = useState<Metric>('distance');

  const [loading, setLoading] = useState(true);

  const nick = (firstname: string) => (nicks[firstname] ?? firstname).replace('Penga', 'Sakkat');

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/strava/activities').then(r => r.json()) as Promise<Activity[]>,
      fetch('/api/strava/athletes').then(r => r.json()) as Promise<Athlete[]>,
      fetch('/api/strava/activity-roasts').then(r => r.json()) as Promise<Record<string, string>>,
      fetch('/api/strava/athlete-roasts').then(r => r.json()) as Promise<Record<string, string>>,
      fetch('/api/strava/nicknames').then(r => r.json()) as Promise<Record<string, string>>,
    ]).then(([acts, aths, actRoastRes, athleteRoastRes, nicksRes]) => {
      if (acts.status === 'fulfilled') setActivities(acts.value);
      if (aths.status === 'fulfilled') setAthletes(aths.value);
      if (actRoastRes.status === 'fulfilled') setActivityRoasts(actRoastRes.value);
      if (athleteRoastRes.status === 'fulfilled') setRoasts(athleteRoastRes.value);
      if (nicksRes.status === 'fulfilled') setNicks(nicksRes.value);
      setLoading(false);
    });
  }, []);


  const caloriesMap = activities.reduce<Record<string, number>>((acc, a) => {
    acc[a.firstname] = (acc[a.firstname] ?? 0) + estimateCalories(a);
    return acc;
  }, {});

  const athleteVal = (athlete: Athlete) =>
    metric === 'calories' ? (caloriesMap[athlete.firstname] ?? 0) : metricVal(athlete.stats?.totals, metric);

  const sorted = [...athletes].sort((a, b) => athleteVal(b) - athleteVal(a));
  const max = sorted[0] ? athleteVal(sorted[0]) : 1;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-white flex flex-col transition-colors">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/10">
        <Link to="/" className="text-zinc-400 hover:text-zinc-700 dark:text-white/40 dark:hover:text-white/80 transition-colors">
          <House className="w-5 h-5" />
        </Link>
        <h1 className="font-mono text-lg font-bold tracking-tight">strava shata</h1>
        <button onClick={toggle} className="text-zinc-400 hover:text-zinc-700 dark:text-white/40 dark:hover:text-white/80 transition-colors">
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Tabs */}
      <div className="flex justify-center border-b border-zinc-200 dark:border-white/10 px-6">
        {(['feed', 'leaderboard'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`font-mono text-sm px-4 py-3 border-b-2 transition-colors ${
              tab === t
                ? 'border-[#fc4c02] text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-400 dark:text-white/30 hover:text-zinc-600 dark:hover:text-white/50'
            }`}>
            {t}
          </button>
        ))}
      </div>

      <main className="flex-1 px-6 py-8 max-w-2xl w-full mx-auto flex flex-col gap-6">
        {loading ? (
          <p className="font-mono text-zinc-400 dark:text-white/30 text-sm text-center py-20">loading...</p>
        ) : tab === 'feed' ? (

          /* ── Activity Feed ── */
          <div className="flex flex-col gap-6">
            {activities.length === 0 ? (
              <p className="font-mono text-zinc-400 dark:text-white/30 text-sm text-center py-20">no activities yet</p>
            ) : (
              <>
                {activities.slice(0, visibleCount).map(activity => {
                  const roast = activityRoasts[activity.id];
                  return (
                    <div key={activity.id} className="flex gap-4">
                      {/* Avatar */}
                      <Avatar
                        name={nick(activity.firstname)}
                        profile={activity.profile}
                        className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-zinc-100 dark:ring-white/10 mt-0.5"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <span className="font-mono font-bold text-sm">{nick(activity.firstname)}</span>
                          <span className="font-mono text-xs text-zinc-400 dark:text-white/30 shrink-0">{activity.sport_type}</span>
                        </div>
                        <p className="font-mono text-base font-semibold mb-1">{activity.name}</p>
                        <div className="flex gap-3 mb-2">
                          {activity.distance > 0 && (
                            <span className="font-mono text-xs text-zinc-400 dark:text-white/30">{fmt(activity.distance)}</span>
                          )}
                          {activity.moving_time > 0 && (
                            <span className="font-mono text-xs text-zinc-400 dark:text-white/30">{fmtTime(activity.moving_time)}</span>
                          )}
                          {activity.elevation_gain > 0 && (
                            <span className="font-mono text-xs text-zinc-400 dark:text-white/30">↑{Math.round(activity.elevation_gain)}m</span>
                          )}
                        </div>
                        {roast && (
                          <p className="font-mono text-sm text-zinc-500 dark:text-white/50 italic leading-relaxed border-l-2 border-zinc-200 dark:border-white/10 pl-3">
                            {roast}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {visibleCount < activities.length && (
                  <button onClick={() => setVisibleCount(c => c + 20)}
                    className="font-mono text-xs text-zinc-400 dark:text-white/30 hover:text-zinc-600 dark:hover:text-white/50 transition-colors w-full text-center py-2">
                    load more ({activities.length - visibleCount} remaining)
                  </button>
                )}

              </>
            )}
          </div>

        ) : (

          /* ── Leaderboard ── */
          <div className="flex flex-col gap-6">
            {/* Metric toggle */}
            <div className="flex gap-2 flex-wrap justify-end">
              {(['distance', 'elevation', 'count', 'calories'] as Metric[]).map(m => (
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

            {athletes.length === 0 ? (
              <p className="font-mono text-zinc-400 dark:text-white/30 text-sm text-center py-20">no data yet</p>
            ) : (
              <>
                {sorted.map((athlete, i) => {
                  const val = athleteVal(athlete);
                  const pct = max > 0 ? (val / max) * 100 : 0;
                  const roast = roasts[athlete.firstname];

                  return (
                    <div key={athlete.id} className="flex gap-4">
                      <div className="relative shrink-0">
                        <Avatar
                          name={nick(athlete.firstname)}
                          profile={athlete.profile}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-white/10"
                        />
                        {i < 3 && (
                          <span className="absolute -bottom-1 -right-1 text-sm leading-none">{MEDALS[i]}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="font-mono font-bold text-base">{nick(athlete.firstname)}</span>
                          <span className="font-mono text-base font-semibold text-zinc-700 dark:text-white/70 ml-2 shrink-0">
                            {fmtMetric(val, metric)}
                          </span>
                        </div>

                        <div className="h-1.5 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden mb-2">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: i === 0 ? '#fc4c02' : `rgba(252,76,2,${0.5 - i * 0.05})` }} />
                        </div>

                        {roast && (
                          <p className="font-mono text-sm text-zinc-500 dark:text-white/50 italic leading-relaxed border-l-2 border-zinc-200 dark:border-white/10 pl-3">
                            {roast}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
