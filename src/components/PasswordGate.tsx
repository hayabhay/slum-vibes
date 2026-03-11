import { useState, useEffect, type ReactNode } from 'react';

const STORAGE_KEY = 'sv_pass';
const CORRECT = import.meta.env.VITE_SITE_PASSWORD as string | undefined;

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!CORRECT) { setUnlocked(true); return; }
    if (localStorage.getItem(STORAGE_KEY) === CORRECT) setUnlocked(true);
  }, []);

  if (unlocked) return <>{children}</>;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (input === CORRECT) {
      localStorage.setItem(STORAGE_KEY, input);
      setUnlocked(true);
    } else {
      setError(true);
      setInput('');
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <form onSubmit={submit} className="flex flex-col items-center gap-4">
        <p className="font-mono text-white/40 text-sm tracking-widest uppercase">slum vibes</p>
        <input
          autoFocus
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          placeholder="password"
          className={`font-mono text-sm bg-white/5 border px-4 py-2 rounded text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-colors ${error ? 'border-red-500/60' : 'border-white/10'}`}
        />
        {error && <p className="font-mono text-red-400/70 text-xs">nope</p>}
      </form>
    </div>
  );
}
