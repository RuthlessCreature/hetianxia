import { useEffect, useState } from 'react';
import { userApi } from '../../api/admin';

export default function MemberPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'engineer', password: 'invite123' });
  const [error, setError] = useState('');

  const fetchUsers = () => {
    userApi.list().then((res) => {
      setUsers(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleInvite = async () => {
    setError('');
    try {
      await userApi.invite(inviteForm);
      setShowInvite(false);
      setInviteForm({ email: '', name: '', role: 'engineer', password: 'invite123' });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || '邀请失败');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await userApi.changeRole(userId, newRole);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || '操作失败');
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await userApi.changeStatus(userId, newStatus);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || '操作失败');
    }
  };

  const roleLabels: Record<string, string> = { owner: 'Owner', admin: 'Admin', engineer: 'Engineer', labeler: 'Labeler', viewer: 'Viewer' };
  const roleColors: Record<string, string> = {
    owner: 'bg-red-100 text-red-700', admin: 'bg-purple-100 text-purple-700',
    engineer: 'bg-blue-100 text-blue-700', labeler: 'bg-green-100 text-green-700',
    viewer: 'bg-gray-100 text-gray-600',
  };

  if (loading) return <div className="text-center text-gray-500 py-12">加载中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">成员管理</h2>
        <button onClick={() => setShowInvite(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">+ 邀请成员</button>
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">邀请新成员</h3>
            {error && <div className="bg-red-50 text-red-600 p-2 rounded mb-3 text-sm">{error}</div>}
            <div className="mb-3">
              <label className="block text-sm mb-1">邮箱</label>
              <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">姓名</label>
              <input type="text" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">角色</label>
              <select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })} className="w-full border rounded px-3 py-2">
                <option value="admin">Admin</option>
                <option value="engineer">Engineer</option>
                <option value="labeler">Labeler</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1">初始密码</label>
              <input type="text" value={inviteForm.password} onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowInvite(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">取消</button>
              <button onClick={handleInvite} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">邀请</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-6 py-3">姓名</th>
              <th className="px-6 py-3">邮箱</th>
              <th className="px-6 py-3">角色</th>
              <th className="px-6 py-3">状态</th>
              <th className="px-6 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-3 font-medium">{u.name}</td>
                <td className="px-6 py-3 text-gray-500">{u.email}</td>
                <td className="px-6 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className={`px-2 py-0.5 rounded text-xs ${roleColors[u.role] || ''}`}
                  >
                    {Object.keys(roleLabels).map((r) => (
                      <option key={r} value={r} disabled={r === 'owner'}>{roleLabels[r]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.status === 'active' ? '活跃' : '禁用'}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <button
                    onClick={() => handleStatusToggle(u.id, u.status)}
                    className={`text-xs ${u.status === 'active' ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}
                  >
                    {u.status === 'active' ? '禁用' : '启用'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
