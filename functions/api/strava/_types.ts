export interface Env {
  STRAVA_KV: KVNamespace;
  AI: Ai;
}

export interface Activity {
  id: string;
  firstname: string;
  lastname: string;
  name: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elevation_gain: number;
  synced_at?: string;
}

export interface ScrapedAthlete {
  firstname: string;
  lastname: string;
  recent_km: string;
  activity_count: number;
  recent_activity_names: string[];
}
