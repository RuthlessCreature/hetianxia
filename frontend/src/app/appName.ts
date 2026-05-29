export const THEME_OPTIONS = ['light', 'dark', 'industrial'] as const;
export const LAYOUT_OPTIONS = ['sidebar', 'topbar', 'focus'] as const;

export type AppTheme = (typeof THEME_OPTIONS)[number];
export type AppLayout = (typeof LAYOUT_OPTIONS)[number];

export interface AppRuntimeConfig {
  appName: string;
  companyName: string;
  platformName: string;
  theme: AppTheme;
  layout: AppLayout;
}

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<Record<keyof AppRuntimeConfig, string>>;
  }
}

const env = (import.meta as any).env || {};
const runtime = typeof window !== 'undefined' ? window.__APP_CONFIG__ || {} : {};

function readConfig(runtimeKey: keyof AppRuntimeConfig, envKeys: string[], fallback: string): string {
  const envValue = envKeys.find((key) => typeof env[key] === 'string' && env[key].trim());
  const value = runtime[runtimeKey] || (envValue ? env[envValue] : '') || fallback;
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeTheme(value: string): AppTheme {
  return THEME_OPTIONS.includes(value as AppTheme) ? (value as AppTheme) : 'light';
}

function normalizeLayout(value: string): AppLayout {
  return LAYOUT_OPTIONS.includes(value as AppLayout) ? (value as AppLayout) : 'sidebar';
}

const APP_NAME = readConfig('appName', ['HTX_APP_NAME'], '高纳AI');
const COMPANY_NAME = readConfig('companyName', ['HTX_COMPANY_NAME'], '高纳科技');
const PLATFORM_NAME = readConfig('platformName', ['HTX_PLATFORM_NAME'], '工业视觉平台');
const THEME = normalizeTheme(readConfig('theme', ['HTX_THEME'], 'light'));
const LAYOUT = normalizeLayout(readConfig('layout', ['HTX_LAYOUT'], 'sidebar'));

const appConfig: AppRuntimeConfig = {
  appName: APP_NAME,
  companyName: COMPANY_NAME,
  platformName: PLATFORM_NAME,
  theme: THEME,
  layout: LAYOUT,
};

function applyRuntimeChrome() {
  document.documentElement.setAttribute('data-theme', appConfig.theme);
  document.documentElement.setAttribute('data-layout', appConfig.layout);
  document.title = `${appConfig.appName} - ${appConfig.platformName}`;
}

export { APP_NAME, COMPANY_NAME, PLATFORM_NAME, THEME, LAYOUT, appConfig, applyRuntimeChrome };
