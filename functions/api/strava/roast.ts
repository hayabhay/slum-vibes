interface Env {
  STRAVA_CLIENT_ID: string;
  STRAVA_CLIENT_SECRET: string;
  STRAVA_KV: KVNamespace;
  AI: Ai;
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

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const force = new URL(request.url).searchParams.has('force');

  // Return cached roast if it's less than 24 hours old
  if (!force) {
    const cached = await env.STRAVA_KV.get('roast_cache', 'json') as { roast: string; generated_at: number } | null;
    if (cached && Date.now() - cached.generated_at < ONE_DAY_MS) {
      return Response.json({ roast: cached.roast, cached: true });
    }
  }

  const raw = await env.STRAVA_KV.get('athlete_ids');
  if (!raw) return Response.json({ roast: 'nobody has connected strava yet. cowards.' });

  const ids: number[] = JSON.parse(raw);

  const athletes = await Promise.all(ids.map(async (id) => {
    const stored = await env.STRAVA_KV.get(`athlete:${id}`);
    if (!stored) return null;

    let data = JSON.parse(stored);
    data = await ensureFreshToken(env, data);
    await env.STRAVA_KV.put(`athlete:${id}`, JSON.stringify(data));

    const activitiesRes = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=10',
      { headers: { Authorization: `Bearer ${data.access_token}` } }
    );
    const activities = await activitiesRes.json() as any[];

    const statsRes = await fetch(
      `https://www.strava.com/api/v3/athletes/${id}/stats`,
      { headers: { Authorization: `Bearer ${data.access_token}` } }
    );
    const stats = await statsRes.json() as any;

    const daysSinceLast = activities.length > 0
      ? Math.floor((Date.now() - new Date(activities[0].start_date).getTime()) / 86400000)
      : 999;

    return {
      name: `${data.athlete.firstname} ${data.athlete.lastname}`,
      recent_km: (stats.recent_run_totals.distance / 1000).toFixed(1),
      recent_runs: stats.recent_run_totals.count,
      ytd_km: (stats.ytd_run_totals.distance / 1000).toFixed(1),
      days_since_last: daysSinceLast,
      recent_activity_names: activities.slice(0, 5).map((a: any) => a.name),
    };
  }));

  const group = athletes.filter(Boolean);

  const defaultPrompt = `You are a savage but loving friend roasting your group's Strava activity. Keep it short, punchy, and funny. No bullet points — just flowing trash talk like a group chat message. Call people out by first name. Pick an MVP and a slacker. Be funny, not mean. Max 150 words.`;
  const customPrompt = await env.STRAVA_KV.get('roast_prompt');
  const systemPrompt = customPrompt ?? defaultPrompt;

  const prompt = `${systemPrompt}

Here's the crew's data from the last 4 weeks:
${group.map(a => `
- ${a!.name}: ${a!.recent_km}km over ${a!.recent_runs} runs, ${a!.days_since_last} days since last activity. Recent activity names: ${a!.recent_activity_names.join(', ') || 'none'}`).join('')}`;

  const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
  }) as any;

  const roast = response.response as string;

  // Cache it
  await env.STRAVA_KV.put('roast_cache', JSON.stringify({ roast, generated_at: Date.now() }));

  return Response.json({ roast, cached: false });
};
