import { PanelLeft, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onToggleSidebar: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export default function Header({ onToggleSidebar, isDark, onToggleTheme }: HeaderProps) {
  return (
    <header className="relative px-4 py-3 shrink-0" style={{ backgroundColor: 'var(--ocean)' }}>
      <div className="absolute top-2 left-3">
        <Button variant="ghost" size="icon" className="w-10 h-10 2xl:w-12 2xl:h-12 [&_svg]:size-auto" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <PanelLeft className="w-8 h-8 2xl:w-10 2xl:h-10" />
        </Button>
      </div>

      <div className="absolute top-2 right-3">
        <Button variant="ghost" size="icon" className="w-10 h-10 2xl:w-12 2xl:h-12 [&_svg]:size-auto" onClick={onToggleTheme} aria-label="Toggle theme">
          {isDark
            ? <Sun className="w-8 h-8 2xl:w-10 2xl:h-10" />
            : <Moon className="w-8 h-8 2xl:w-10 2xl:h-10" />}
        </Button>
      </div>

      <div className="text-center">
        <h1 className="font-mono text-xl lg:text-2xl 2xl:text-3xl font-bold tracking-tight text-foreground">
          cuisine explorer
        </h1>
        <p className="font-mono text-xs lg:text-sm 2xl:text-base text-muted-foreground tracking-wide mt-0.5">
          click a region to explore
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, hsl(var(--border)) 25%, hsl(var(--border)) 75%, transparent)' }} />
    </header>
  );
}
