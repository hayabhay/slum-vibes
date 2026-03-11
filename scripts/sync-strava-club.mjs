#!/usr/bin/env node
/**
 * Syncs Strava club data to Cloudflare KV.
 * Reads stored OAuth token, refreshes if needed, then pulls club members +
 * activities and writes athletes + activities KV keys.
 *
 * Required env vars:
 *   STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET
 *   STRAVA_CLUB_ID, STRAVA_ATHLETE_ID
 *
 * Set LOCAL=1 to write to local KV (wrangler dev), otherwise writes remote.
 */

import { execSync } from 'child_process';

const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_CLUB_ID, STRAVA_ATHLETE_ID } = process.env;

const KV_NAMESPACE_ID = 'b3039d030a994346bb7b165dcbd86140';
const remoteFlag = process.env.LOCAL ? '' : '--remote';

// ── KV helpers ───────────────────────────────────────────────────────────────

function kvGet(key) {
  try {
    const cmd = `wrangler kv key get ${remoteFlag} --namespace-id=${KV_NAMESPACE_ID} "${key}"`;
    console.log(`KV GET: ${cmd}`);
    const out = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    return JSON.parse(out);
  } catch (e) {
    console.error(`KV GET failed for "${key}":`, e.stderr?.toString() || e.message);
    return null;
  }
}

function kvPut(key, value) {
  const json = JSON.stringify(value);
  execSync(
    `wrangler kv key put ${remoteFlag} --namespace-id=${KV_NAMESPACE_ID} "${key}" '${json.replace(/'/g, "'\\''")}'`,
    { stdio: 'inherit' }
  );
}

// ── Strava helpers ───────────────────────────────────────────────────────────

async function ensureFreshToken(data) {
  const now = Math.floor(Date.now() / 1000);
  if (data.expires_at > now + 300) return data;

  console.log('Refreshing Strava token...');
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: data.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  const refreshed = await res.json();
  return { ...data, access_token: refreshed.access_token, refresh_token: refreshed.refresh_token, expires_at: refreshed.expires_at };
}

async function stravaGet(path, token) {
  const res = await fetch(`https://www.strava.com/api/v3${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Strava API ${res.status}: ${path}`);
  return res.json();
}

// Normalize Strava profile URLs — club member API often returns relative paths
// like "avatar/athlete/large.png" for default avatars, which aren't usable.
function normalizeProfileUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Relative default-avatar paths are not real images we can use
  if (!trimmed.startsWith('http') && !trimmed.startsWith('//')) return null;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return trimmed;
}

// Stable ID for an activity based on content (no date available from club API)
function activityId(a) {
  return `${a.athlete.firstname.trim()}-${a.athlete.lastname.trim()[0]}-${a.name}-${Math.round(a.distance || 0)}`
    .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 60);
}

// ── Main ─────────────────────────────────────────────────────────────────────

const stored = await kvGet(`athlete:${STRAVA_ATHLETE_ID}`);
if (!stored) throw new Error(`No stored token for athlete ${STRAVA_ATHLETE_ID}`);

let tokenData = await ensureFreshToken(stored);
if (tokenData.expires_at !== stored.expires_at) {
  await kvPut(`athlete:${STRAVA_ATHLETE_ID}`, tokenData);
  console.log('Token refreshed and saved.');
}

const token = tokenData.access_token;

// Fetch all club members
console.log(`Fetching members for club ${STRAVA_CLUB_ID}...`);
let members = [];
for (let page = 1; page <= 5; page++) {
  const batch = await stravaGet(`/clubs/${STRAVA_CLUB_ID}/members?per_page=100&page=${page}`, token);
  members = members.concat(batch);
  if (batch.length < 100) break;
}
console.log(`Found ${members.length} members.`);

// Fetch recent activities (3 pages × 200 = up to 600)
// Note: club activities don't include start_date — Strava strips it for privacy.
console.log('Fetching club activities...');
let allActivities = [];
for (let page = 1; page <= 3; page++) {
  const batch = await stravaGet(`/clubs/${STRAVA_CLUB_ID}/activities?per_page=200&page=${page}`, token);
  allActivities = allActivities.concat(batch);
  if (batch.length < 200) break;
}
console.log(`Fetched ${allActivities.length} activities total.`);

// ── Build activity lookup map (firstname|lastInitial → activities) ────────────

const actsByMember = new Map();
for (const a of allActivities) {
  const key = `${a.athlete.firstname.trim()}|${a.athlete.lastname.trim()[0].toUpperCase()}`;
  if (!actsByMember.has(key)) actsByMember.set(key, []);
  actsByMember.get(key).push(a);
}

// ── Build per-athlete leaderboard stats ──────────────────────────────────────

const athletes = members.map(member => {
  const fname = member.firstname.trim();
  const lInitial = member.lastname.trim()[0].toUpperCase();
  const memberActs = actsByMember.get(`${fname}|${lInitial}`) ?? [];

  const totals = memberActs.reduce(
    (acc, a) => ({
      distance:      acc.distance + (a.distance || 0),
      moving_time:   acc.moving_time + (a.moving_time || 0),
      elevation_gain: acc.elevation_gain + (a.total_elevation_gain || 0),
      count:         acc.count + 1,
    }),
    { distance: 0, moving_time: 0, elevation_gain: 0, count: 0 }
  );

  return {
    id: member.id,
    firstname: fname,
    lastname: member.lastname,
    profile: normalizeProfileUrl(member.profile_medium) || normalizeProfileUrl(member.profile),
    stats: { totals },
    // Fields used by the roast endpoint
    recent_km: (totals.distance / 1000).toFixed(1),
    activity_count: totals.count,
    recent_activity_names: memberActs.slice(0, 5).map(a => a.name),
  };
});

await kvPut('athletes', athletes);
console.log(`✓ Wrote ${athletes.length} athletes to KV.`);
athletes.forEach(a => console.log(`  ${a.firstname} ${a.lastname}: ${a.recent_km}km, ${a.activity_count} activities`));

// ── Build activity feed ──────────────────────────────────────────────────────

// Build member profile lookup for activity feed
const memberByKey = new Map(members.map(m => [`${m.firstname.trim()}|${m.lastname.trim()[0].toUpperCase()}`, m]));

const recentActivities = allActivities.map(a => {
  const fname = a.athlete.firstname.trim();
  const lInitial = a.athlete.lastname.trim()[0].toUpperCase();
  const member = memberByKey.get(`${fname}|${lInitial}`);
  return {
    id: activityId(a),
    firstname: fname,
    lastname: a.athlete.lastname,
    profile: normalizeProfileUrl(member?.profile_medium) || normalizeProfileUrl(member?.profile),
    name: a.name,
    sport_type: a.sport_type || a.type || 'Activity',
    distance: a.distance || 0,
    moving_time: a.moving_time || 0,
    elevation_gain: a.total_elevation_gain || 0,
  };
});

await kvPut('activities', recentActivities);
console.log(`✓ Wrote ${recentActivities.length} activities to KV.`);

