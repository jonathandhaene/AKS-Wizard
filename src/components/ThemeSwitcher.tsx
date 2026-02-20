import { useTheme } from '../contexts/ThemeContext';
import type { Theme } from '../types/wizard';

const THEMES: { value: Theme; label: string; emoji: string }[] = [
  { value: 'theme-classic', label: 'Classic', emoji: '🔵' },
  { value: 'theme-win95', label: 'Win95', emoji: '🪟' },
  { value: 'theme-cyberpunk', label: 'Cyberpunk', emoji: '🌆' },
  { value: 'theme-nature', label: 'Nature', emoji: '🌿' },
  { value: 'theme-dark', label: 'Dark', emoji: '🌙' },
  { value: 'theme-high-contrast', label: 'High Contrast', emoji: '⬛' },
  { value: 'theme-fluent', label: 'Fluent', emoji: '🪟' },
  { value: 'theme-paleontology', label: 'Paleontology', emoji: '🦕' },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-xs mr-1" style={{ color: 'var(--text-muted)' }}>
        Theme:
      </span>
      {THEMES.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          title={t.label}
          className="px-2 py-1 text-xs rounded transition-all"
          style={{
            background: theme === t.value ? 'var(--accent)' : 'var(--bg-secondary)',
            color: theme === t.value ? 'var(--accent-text)' : 'var(--text-secondary)',
            border: `1px solid ${theme === t.value ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
          }}
        >
          {t.emoji} {t.label}
        </button>
      ))}
    </div>
  );
}
