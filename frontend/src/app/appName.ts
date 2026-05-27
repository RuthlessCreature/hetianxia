const APP_NAME = (import.meta as any).env?.VITE_APP_NAME || '高纳AI';
const COMPANY_NAME = (import.meta as any).env?.VITE_COMPANY_NAME || '高纳科技';
const THEME = (import.meta as any).env?.VITE_THEME || 'light';

export { APP_NAME, COMPANY_NAME, THEME };
