interface Env {
  STRAVA_CLIENT_ID: string;
  STRAVA_CLIENT_SECRET: string;
  STRAVA_KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code || url.searchParams.get('error')) {
    return Response.redirect(`${url.origin}/strava?error=denied`, 302);
  }

  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return Response.redirect(`${url.origin}/strava?error=token`, 302);
  }

  const { access_token, refresh_token, expires_at, athlete } = await tokenRes.json() as any;

  // Store athlete tokens + profile
  await env.STRAVA_KV.put(`athlete:${athlete.id}`, JSON.stringify({
    access_token,
    refresh_token,
    expires_at,
    athlete: {
      id: athlete.id,
      firstname: athlete.firstname,
      lastname: athlete.lastname,
      profile: athlete.profile_medium,
    },
  }));

  // Add to index
  const raw = await env.STRAVA_KV.get('athlete_ids');
  const ids: number[] = raw ? JSON.parse(raw) : [];
  if (!ids.includes(athlete.id)) {
    ids.push(athlete.id);
    await env.STRAVA_KV.put('athlete_ids', JSON.stringify(ids));
  }

  return Response.redirect(`${url.origin}/strava?connected=1`, 302);
};
