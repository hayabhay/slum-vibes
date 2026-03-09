interface Env {
  STRAVA_CLIENT_ID: string;
  STRAVA_CLIENT_SECRET: string;
  STRAVA_KV: KVNamespace;
}

async function ensureFreshToken(env: Env, data: any) {
  const now = Math.floor(Date.now() / 1000);
  if (data.expires_at > now + 300) return data;

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      refresh_token: data.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const refreshed = await res.json() as any;
  return { ...data, access_token: refreshed.access_token, refresh_token: refreshed.refresh_token, expires_at: refreshed.expires_at };
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const raw = await env.STRAVA_KV.get('athlete_ids');
  if (!raw) return Response.json([]);

  const ids: number[] = JSON.parse(raw);

  const results = await Promise.all(ids.map(async (id) => {
    const stored = await env.STRAVA_KV.get(`athlete:${id}`);
    if (!stored) return null;

    let data = JSON.parse(stored);
    data = await ensureFreshToken(env, data);

    // Persist refreshed token if it changed
    await env.STRAVA_KV.put(`athlete:${id}`, JSON.stringify(data));

    const [statsRes, activitiesRes] = await Promise.all([
      fetch(`https://www.strava.com/api/v3/athletes/${id}/stats`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }),
      fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=10`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }),
    ]);

    const stats = await statsRes.json();
    const activities = await activitiesRes.json();

    return { ...data.athlete, stats, recent_activities: activities };
  }));

  return Response.json(results.filter(Boolean), {
    headers: { 'Cache-Control': 'no-store' },
  });
};
