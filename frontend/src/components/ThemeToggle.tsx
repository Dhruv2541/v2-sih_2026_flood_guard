import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check, ChevronDown } from 'lucide-react';
import { useTheme, Theme } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { id: Theme; label: string; icon: typeof Sun; hint: string }[] = [
    { id: 'light', label: 'Light', icon: Sun, hint: 'Crisp high-contrast daylight' },
    { id: 'dark', label: 'Dark', icon: Moon, hint: 'Deep slate night mode' },
    { id: 'system', label: 'System', icon: Monitor, hint: `Auto (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})` },
  ];

  const currentOption = options.find(o => o.id === theme) || options[2];
  const CurrentIcon = currentOption.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        id="theme-toggle-btn"
        className="flex items-center justify-center gap-1 sm:gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all text-xs font-medium bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs shadow-xs touch-manipulation"
        title={`Theme: ${currentOption.label} (${resolvedTheme})`}
        aria-label="Toggle display theme"
        aria-expanded={isOpen}
      >
        <CurrentIcon className="w-4 h-4 text-sky-600 dark:text-sky-400 transition-transform duration-200 flex-shrink-0" />
        <span className="hidden xl:inline capitalize">{currentOption.label}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 dark:text-slate-500 transition-transform duration-200 hidden sm:inline-block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="theme-toggle-dropdown"
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          role="menu"
        >
          <div className="px-2.5 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
              Appearance
            </span>
          </div>

          <div className="space-y-0.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  id={`theme-opt-${opt.id}`}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`} />
                    <div className="flex flex-col text-left">
                      <span>{opt.label}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                        {opt.hint}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 ml-2 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
