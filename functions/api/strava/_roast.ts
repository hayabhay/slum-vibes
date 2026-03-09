export function fmt(meters: number) { return (meters / 1000).toFixed(1) + 'km'; }

export function fmtTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const DEFAULT_PROMPT = `Roast this Strava activity in English only. Fully become ONE character — Trump, Arnab Goswami, Gordon Ramsay, or another iconic personality. Use their actual catchphrases and speech patterns. Sparingly sprinkle a Kannada slang only if it fits — don't force it. One or two sentences, under 40 words. No bullet points, no formatting.`;

const MAX_GENERATE_PER_REQUEST = 5;

interface RoastConfig<T> {
  kv: KVNamespace;
  ai: Ai;
  items: T[];
  keyPrefix: string;
  getKey: (item: T) => string;
  buildDesc: (item: T) => string;
  promptAction: string;
  putOptions?: KVNamespacePutOptions;
}

export async function generateRoasts<T>(config: RoastConfig<T>): Promise<Record<string, string>> {
  const { kv, ai, items, keyPrefix, getKey, buildDesc, promptAction, putOptions } = config;

  const results = await Promise.allSettled(
    items.map(item => kv.get(`${keyPrefix}${getKey(item)}`))
  );

  const roasts: Record<string, string> = {};
  const missing: T[] = [];

  for (let i = 0; i < items.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled' && result.value) {
      roasts[getKey(items[i])] = result.value;
    } else {
      missing.push(items[i]);
    }
  }

  if (missing.length > 0) {
    const systemPrompt = (await kv.get('roast_prompt')) ?? DEFAULT_PROMPT;

    for (const item of missing.slice(0, MAX_GENERATE_PER_REQUEST)) {
      try {
        const response = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages: [{ role: 'user', content: `${systemPrompt}\n\n${promptAction} ${buildDesc(item)}\n\nRespond with ONLY the roast sentence, nothing else.` }],
          max_tokens: 150,
        }) as { response: string };

        const roast = (response.response ?? '').trim();
        if (roast) {
          roasts[getKey(item)] = roast;
          await kv.put(`${keyPrefix}${getKey(item)}`, roast, putOptions);
        }
      } catch {
        // skip failed roasts, they'll get picked up next time
      }
    }
  }

  return roasts;
}
