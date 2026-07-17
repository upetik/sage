import { IceCreamIcon, MoonIcon, SunIcon } from './Icons.jsx';

const THEME_META = {
  minimal: { label: 'Light', Icon: SunIcon },
  dark: { label: 'Dark', Icon: MoonIcon },
  sorbet: { label: 'Sorbet', Icon: IceCreamIcon },
};
const THEME_ORDER = ['minimal', 'dark', 'sorbet'];

// shared top bar: brand + theme switcher, used on home and quiz detail
export default function HeaderBar({ theme, themes, onThemeChange, children }) {
  return (
    <header className="home-header">
      <div className="brand" role="button" onClick={() => window.location.assign('/') }>
        <span className="brand-mark" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain-icon lucide-brain"><path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/></svg>
        </span>
        <h1 style={{ margin: 0 }}>Sage</h1>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {themes && (() => {
          const order = THEME_ORDER.filter((t) => themes.includes(t));
          const activeIndex = Math.max(0, order.indexOf(theme));
          return (
          <div className="theme-switcher" role="group" aria-label="Theme" style={{ '--active-index': activeIndex }}>
            {order.map((t) => {
              const { label, Icon } = THEME_META[t];
              return (
                <button
                  key={t}
                  className={`theme-seg ${t === theme ? 'active' : ''}`}
                  onClick={() => onThemeChange(t)}
                  aria-label={`${label} theme`}
                  title={label}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
          );
        })()}
        {children}
      </div>
    </header>
  );
}
