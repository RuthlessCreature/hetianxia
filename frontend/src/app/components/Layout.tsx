import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import APP_NAME from '../appName';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { path: '/dashboard', label: '仪表盘', icon: '📊' },
    { path: '/projects', label: '项目管理', icon: '📁' },
    { path: '/members', label: '成员管理', icon: '👥' },
    { path: '/notifications', label: '通知', icon: '🔔' },
    { path: '/license', label: 'License', icon: '🔑' },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-100">
      {sidebarOpen && (
        <aside className="sidebar bg-gray-900 text-white flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h1 className="text-lg font-bold">{APP_NAME}</h1>
            <p className="text-xs text-gray-400">工业视觉平台</p>
          </div>
          <nav className="flex-1 py-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-3 text-sm transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-700">
            <div className="text-sm text-gray-400 mb-2">{user?.name || user?.email}</div>
            <button
              onClick={() => { logout(); navigate('/auth/login'); }}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              退出登录
            </button>
          </div>
        </aside>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <div className="text-sm text-gray-500">
            {user?.role === 'owner' ? 'Owner' : user?.role === 'admin' ? 'Admin' : user?.role === 'engineer' ? 'Engineer' : user?.role} | {user?.email}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
