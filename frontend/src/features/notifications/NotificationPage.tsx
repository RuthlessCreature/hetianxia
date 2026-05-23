import { useEffect, useState } from 'react';
import { notifApi } from '../../api/admin';

export default function NotificationPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notifApi.list(false).then((res) => {
      setNotifs(res.data);
      setLoading(false);
    });
  }, []);

  const handleMarkRead = async (id: string) => {
    await notifApi.markRead(id);
    setNotifs(notifs.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleMarkAll = async () => {
    await notifApi.markAllRead();
    setNotifs(notifs.map((n) => ({ ...n, is_read: true })));
  };

  const handleDelete = async (id: string) => {
    await notifApi.delete(id);
    setNotifs(notifs.filter((n) => n.id !== id));
  };

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  const levelColors: Record<string, string> = {
    info: 'border-l-blue-500', warning: 'border-l-yellow-500',
    error: 'border-l-red-500', success: 'border-l-green-500',
  };

  if (loading) return <div className="text-center text-gray-500 py-12">加载中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">通知中心 {unreadCount > 0 && <span className="text-sm font-normal text-red-500">({unreadCount} 未读)</span>}</h2>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} className="text-blue-600 text-sm hover:underline">全部已读</button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">暂无通知</div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <div key={n.id} className={`bg-white rounded-lg shadow p-4 border-l-4 ${levelColors[n.level] || 'border-l-gray-300'} ${!n.is_read ? 'bg-blue-50' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{n.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  {!n.is_read && (
                    <button onClick={() => handleMarkRead(n.id)} className="text-xs text-blue-500 hover:text-blue-700">已读</button>
                  )}
                  <button onClick={() => handleDelete(n.id)} className="text-xs text-red-400 hover:text-red-600">删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
