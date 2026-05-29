import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  APP_NAME,
  COMPANY_NAME,
  LAYOUT,
  PLATFORM_NAME,
  THEME,
  THEME_OPTIONS,
  type AppTheme,
} from '../appName';

const themeLabels: Record<AppTheme, string> = {
  light: '浅色',
  dark: '深色',
  industrial: '工业',
};

const navItems = [
  { path: '/dashboard', label: '仪表盘', icon: '📊' },
  { path: '/projects', label: '项目管理', icon: '📁' },
  { path: '/members', label: '成员管理', icon: '👥' },
  { path: '/notifications', label: '通知', icon: '🔔' },
  { path: '/license', label: 'License', icon: '🔑' },
];

function getTheme(): AppTheme {
  const current = document.documentElement.getAttribute('data-theme');
  if (current && THEME_OPTIONS.includes(current as AppTheme)) return current as AppTheme;

  return THEME;
}

function setTheme(key: AppTheme) {
  document.documentElement.setAttribute('data-theme', key);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setThemeState] = useState<AppTheme>(getTheme());

  const isActive = (path: string) => location.pathname.startsWith(path);
  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const ThemePicker = (
    <select
      value={theme}
      onChange={(e) => {
        const nextTheme = e.target.value as AppTheme;
        setThemeState(nextTheme);
        setTheme(nextTheme);
      }}
      className="app-select text-xs rounded px-2 py-1"
      aria-label="切换主题"
    >
      {THEME_OPTIONS.map((key) => <option key={key} value={key}>{themeLabels[key]}</option>)}
    </select>
  );

  const UserSummary = (
    <div className="app-user-summary text-sm text-gray-500">
      {user?.role || '?'} | {user?.email}
    </div>
  );

  const MobileBottomNav = (
    <nav className="app-mobile-nav" aria-label="移动端导航">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`app-mobile-nav-link ${isActive(item.path) ? 'app-mobile-nav-link-active' : ''}`}
        >
          <span className="app-mobile-nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );

  if (LAYOUT === 'topbar') {
    return (
      <div className="app-shell min-h-screen flex flex-col">
        <header className="app-header border-b flex flex-wrap items-center justify-between gap-4">
          <div className="app-brand">
            <h1 className="app-brand-title text-xl font-bold">{APP_NAME}</h1>
            <p className="app-brand-subtitle text-xs text-gray-500">{PLATFORM_NAME} · {COMPANY_NAME}</p>
          </div>
          <div className="app-header-actions flex items-center gap-4">
            {ThemePicker}
            {UserSummary}
            <button onClick={handleLogout} className="app-text-button text-xs">退出登录</button>
          </div>
        </header>
        <nav className="app-topbar-nav app-desktop-nav border-b flex gap-2 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`app-topbar-link ${isActive(item.path) ? 'app-topbar-link-active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <main className="app-main flex-1 overflow-auto">{children}</main>
        {MobileBottomNav}
      </div>
    );
  }

  if (LAYOUT === 'focus') {
    return (
      <div className="app-shell flex h-screen">
        <aside className="app-focus-rail hidden md:flex flex-col items-center py-4">
          <div className="app-focus-mark mb-6" title={APP_NAME}>{APP_NAME.slice(0, 1)}</div>
          <nav className="flex-1 flex flex-col items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`app-focus-link ${isActive(item.path) ? 'app-focus-link-active' : ''}`}
              >
                {item.icon}
              </Link>
            ))}
          </nav>
          <button onClick={handleLogout} className="app-focus-link" title="退出登录">⏻</button>
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="app-header border-b flex flex-wrap items-center justify-between gap-3">
            <div className="app-brand">
              <h1 className="app-brand-title text-lg font-bold">{APP_NAME}</h1>
              <p className="app-brand-subtitle text-xs text-gray-500">{PLATFORM_NAME} · {COMPANY_NAME}</p>
            </div>
            <div className="app-header-actions flex items-center gap-4">
              {ThemePicker}
              {UserSummary}
            </div>
          </header>
          <main className="app-main app-main-focus flex-1 overflow-auto">{children}</main>
        </div>
        {MobileBottomNav}
      </div>
    );
  }

  return (
    <div className="app-shell flex h-screen">
      {sidebarOpen && (
        <aside className="app-sidebar hidden md:flex flex-col">
          <div className="p-4 app-sidebar-divider">
            <h1 className="text-lg font-bold">{APP_NAME}</h1>
            <p className="text-xs app-sidebar-muted">{PLATFORM_NAME}</p>
          </div>
          <nav className="flex-1 py-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`app-sidebar-link ${isActive(item.path) ? 'app-sidebar-link-active' : ''}`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 app-sidebar-divider">
            <div className="text-sm app-sidebar-muted mb-1">{user?.name || user?.email}</div>
            <div className="text-xs app-sidebar-muted mb-3">{COMPANY_NAME}</div>
            <button onClick={handleLogout} className="app-sidebar-action text-xs">退出登录</button>
          </div>
        </aside>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="app-header border-b flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="app-sidebar-toggle app-text-button text-sm">
              {sidebarOpen ? '◀' : '▶'}
            </button>
            <div className="app-brand md:hidden">
              <h1 className="app-brand-title text-base font-bold">{APP_NAME}</h1>
              <p className="app-brand-subtitle text-xs text-gray-500">{PLATFORM_NAME}</p>
            </div>
          </div>
          <div className="app-header-actions flex items-center gap-4">
            {ThemePicker}
            {UserSummary}
          </div>
        </header>
        <main className="app-main flex-1 overflow-auto">{children}</main>
      </div>
      {MobileBottomNav}
    </div>
  );
}
