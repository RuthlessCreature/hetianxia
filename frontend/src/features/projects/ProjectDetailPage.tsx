import { useEffect, useState } from 'react';
import { useParams, Link, Outlet, useLocation } from 'react-router-dom';
import { projectApi } from '../../api/projects';
import type { Project } from '../../types';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    projectApi.get(id).then((res) => {
      setProject(res.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">加载中...</div>;
  if (!project) return <div className="text-center text-gray-500 py-12">项目不存在</div>;

  const tabs = [
    { key: '', label: '概览' },
    { key: 'images', label: '图片管理' },
    { key: 'training', label: '训练任务' },
    { key: 'evaluation', label: '评估报告' },
    { key: 'models', label: '模型管理' },
    { key: 'settings', label: '设置' },
  ];

  const basePath = `/projects/${id}`;

  return (
    <div>
      <div className="mb-4">
        <Link to="/projects" className="text-blue-600 text-sm hover:underline">&larr; 返回项目列表</Link>
      </div>
      <div className="bg-white rounded-lg shadow mb-4 p-6">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-gray-500 mt-1">{project.description || '暂无描述'}</p>
        <div className="flex gap-6 mt-3 text-sm text-gray-600">
          <span>类型: {project.task_type || '-'}</span>
          <span>图片: {project.image_count}</span>
          <span>标注: {project.annotation_count}</span>
          <span>状态: <span className={project.status === 'active' ? 'text-green-600' : ''}>{project.status}</span></span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-4">
        <nav className="flex border-b">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              to={`${basePath}/${tab.key}`}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                location.pathname === `${basePath}/${tab.key}` || (tab.key === '' && location.pathname === basePath)
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {location.pathname === basePath && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">快速操作</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to={`${basePath}/images`} className="bg-blue-50 p-4 rounded-lg text-center hover:bg-blue-100 transition-colors">
              <div className="text-2xl mb-1">🖼️</div>
              <div className="text-sm font-medium">图片管理</div>
              <div className="text-xs text-gray-500">{project.image_count} 张</div>
            </Link>
            <Link to={`${basePath}/images`} className="bg-green-50 p-4 rounded-lg text-center hover:bg-green-100 transition-colors">
              <div className="text-2xl mb-1">🏷️</div>
              <div className="text-sm font-medium">数据标注</div>
              <div className="text-xs text-gray-500">{project.annotation_count} 个标注</div>
            </Link>
            <Link to={`${basePath}/training`} className="bg-purple-50 p-4 rounded-lg text-center hover:bg-purple-100 transition-colors">
              <div className="text-2xl mb-1">🚀</div>
              <div className="text-sm font-medium">模型训练</div>
              <div className="text-xs text-gray-500">启动训练</div>
            </Link>
            <Link to={`${basePath}/models`} className="bg-orange-50 p-4 rounded-lg text-center hover:bg-orange-100 transition-colors">
              <div className="text-2xl mb-1">📦</div>
              <div className="text-sm font-medium">模型管理</div>
              <div className="text-xs text-gray-500">版本与导出</div>
            </Link>
            <Link to={`${basePath}/settings`} className="bg-gray-50 p-4 rounded-lg text-center hover:bg-gray-100 transition-colors">
              <div className="text-2xl mb-1">⚙️</div>
              <div className="text-sm font-medium">项目设置</div>
              <div className="text-xs text-gray-500">配置与删除</div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
