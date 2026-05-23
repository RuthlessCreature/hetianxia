import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectApi, tenantApi } from '../../api/projects';
import type { Project, Usage } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([projectApi.list(), tenantApi.usage()])
      .then(([pRes, uRes]) => {
        setProjects(pRes.data);
        setUsage(uRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">加载中...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">仪表盘</h2>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">项目数量</div>
          <div className="text-2xl font-bold mt-1">
            {usage?.projects_used ?? projects.length}
            <span className="text-sm text-gray-400 font-normal"> / {usage?.projects_max ?? '-'}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">图片总数</div>
          <div className="text-2xl font-bold mt-1">
            {usage?.images_used ?? 0}
            <span className="text-sm text-gray-400 font-normal"> / {usage?.images_max ?? '-'}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">本月训练次数</div>
          <div className="text-2xl font-bold mt-1">
            {usage?.training_jobs_used ?? 0}
            <span className="text-sm text-gray-400 font-normal"> / {usage?.training_jobs_max ?? '-'}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">存储用量</div>
          <div className="text-2xl font-bold mt-1">
            {usage?.storage_used_gb ?? 0} GB
            <span className="text-sm text-gray-400 font-normal"> / {usage?.storage_max_gb ?? '-'} GB</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold mb-3">项目类型分布</h3>
          {projects.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(
                    projects.reduce<Record<string, number>>((acc, p) => {
                      const t = p.task_type || 'unknown';
                      acc[t] = (acc[t] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([name, value]) => ({ name, value }))}
                  cx="50%" cy="50%" outerRadius={70}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'].map((c, i) => (
                    <Cell key={i} fill={c} />
                  ))}
                </Pie>
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">暂无数据</div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold mb-3">图片/标注概览</h3>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {projects.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 truncate mr-2" title={p.name}>{p.name}</span>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span title="图片数">📷{p.image_count}</span>
                  <span title="标注数">🏷️{p.annotation_count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">最近项目</h3>
          <Link to="/projects" className="text-blue-600 text-sm hover:underline">查看全部</Link>
        </div>
        {projects.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="mb-4">还没有项目</p>
            <Link to="/projects" className="text-blue-600 hover:underline">创建第一个项目</Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-sm text-gray-500">
              <tr>
                <th className="px-6 py-3">项目名称</th>
                <th className="px-6 py-3">检测类型</th>
                <th className="px-6 py-3">图片数</th>
                <th className="px-6 py-3">标注数</th>
                <th className="px-6 py-3">状态</th>
                <th className="px-6 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {projects.slice(0, 5).map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{p.name}</td>
                  <td className="px-6 py-3">{p.task_type || '-'}</td>
                  <td className="px-6 py-3">{p.image_count}</td>
                  <td className="px-6 py-3">{p.annotation_count}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {p.status === 'active' ? '活跃' : p.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <Link to={`/projects/${p.id}`} className="text-blue-600 hover:underline text-xs">详情</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
