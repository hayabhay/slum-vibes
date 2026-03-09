import { useState, useMemo } from 'react';
import { Search, X, Sun, Moon, Github } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { regions } from '../data/regions';
import { countries } from '../data/countries';
import { countryRegionMap } from '../data/countryRegionMap';
import type { CountryCuisine } from '../types';

const allCountries = Object.values(countries).sort((a, b) => a.name.localeCompare(b.name));

const grouped: { regionId: string; regionName: string; color: string; items: CountryCuisine[] }[] =
  regions.map((region) => ({
    regionId: region.id,
    regionName: region.name,
    color: region.color,
    items: Object.values(countries)
      .filter((c) => countryRegionMap[c.id] === region.id)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length > 0);

interface SidebarProps {
  isOpen: boolean;
  onCountryClick: (countryId: string) => void;
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export default function Sidebar({ isOpen, onCountryClick, onClose, isDark, onToggleTheme }: SidebarProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return allCountries.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && results && results.length > 0) {
      onCountryClick(results[0].id);
      setQuery('');
    }
    if (e.key === 'Escape') setQuery('');
  }

  return (
    <aside
      className={cn(
        'fixed right-0 inset-y-0 z-40',
        'flex flex-col shrink-0 overflow-hidden',
        'bg-background border-l border-border',
        'transition-transform duration-300 ease-in-out',
        'w-64 2xl:w-80',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      )}
    >
      {/* Close + theme toggle + github */}
      <div className="flex justify-between px-3 pt-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar">
          <X className="w-5 h-5 2xl:w-6 2xl:h-6" />
        </Button>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onToggleTheme} aria-label="Toggle theme">
            {isDark ? <Sun className="w-5 h-5 2xl:w-6 2xl:h-6" /> : <Moon className="w-5 h-5 2xl:w-6 2xl:h-6" />}
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="GitHub">
            <a href="https://github.com/hayabhay/slum-vibes" target="_blank" rel="noopener noreferrer">
              <Github className="w-5 h-5 2xl:w-6 2xl:h-6" />
            </a>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pt-1 pb-3 shrink-0">
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
          <Search className="w-4 h-4 2xl:w-5 2xl:h-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="search countries..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent font-mono text-sm 2xl:text-base text-foreground placeholder:text-muted-foreground outline-none min-w-0"
          />
        </div>
      </div>

      <Separator />

      {/* Search results */}
      {results !== null ? (
        <nav className="py-1 overflow-y-auto flex-1">
          {results.map((country, i) => (
            <button
              key={country.id}
              onClick={() => { onCountryClick(country.id); setQuery(''); }}
              className={cn(
                'w-full flex items-center px-4 py-2 2xl:py-3 text-left hover:bg-muted transition-colors',
                i === 0 && 'bg-muted/50',
              )}
            >
              <span className="font-mono text-sm 2xl:text-base text-foreground truncate">{country.name}</span>
            </button>
          ))}
          {results.length === 0 && (
            <p className="px-4 py-3 font-mono text-sm 2xl:text-base text-muted-foreground">no results</p>
          )}
        </nav>
      ) : (
        <nav className="py-1 overflow-y-auto flex-1">
          {grouped.map((group, i) => (
            <div key={group.regionId}>
              {i > 0 && <Separator className="my-1" />}
              <div className="flex items-center gap-2 px-4 py-2 2xl:py-2.5">
                <span className="w-2.5 h-2.5 2xl:w-3 2xl:h-3 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                <span className="font-mono text-xs 2xl:text-sm font-bold uppercase tracking-widest text-muted-foreground truncate">
                  {group.regionName}
                </span>
              </div>
              {group.items.map((country) => (
                <button
                  key={country.id}
                  onClick={() => onCountryClick(country.id)}
                  className="w-full flex items-center pl-9 pr-4 py-1.5 2xl:py-2 text-left hover:bg-muted transition-colors"
                >
                  <span className="font-mono text-sm 2xl:text-base text-foreground truncate">{country.name}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      )}
    </aside>
  );
}
