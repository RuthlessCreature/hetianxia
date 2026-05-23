import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectApi } from '../../api/projects';
import type { Project } from '../../types';

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTaskType, setNewTaskType] = useState('defect_detection');
  const navigate = useNavigate();

  const fetchProjects = () => {
    projectApi.list().then((res) => {
      setProjects(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await projectApi.create({ name: newName, description: newDesc, task_type: newTaskType });
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      navigate(`/projects/${res.data.id}`);
    } catch (err) {
      console.error('创建失败', err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">加载中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">项目管理</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          + 创建项目
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">创建新项目</h3>
            <div className="mb-3">
              <label className="block text-sm mb-1">项目名称</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="如：手机中框划痕检测"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">任务类型</label>
              <select
                value={newTaskType}
                onChange={(e) => setNewTaskType(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="defect_detection">缺陷检测 (Object Detection)</option>
                <option value="classification">分类 (Classification)</option>
                <option value="segmentation">分割 (Segmentation)</option>
                <option value="anomaly_detection">异常检测 (Anomaly Detection)</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1">描述</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">取消</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">创建</button>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
          <p className="mb-4 text-lg">还没有项目</p>
          <p className="mb-4">点击"创建项目"开始您的第一个AOI检测项目</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-lg mb-1">{p.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{p.task_type || '未指定类型'}</p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>{p.image_count} 张图片</span>
                <span>{p.annotation_count} 个标注</span>
                <span className={`px-2 py-0.5 rounded ${
                  p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                }`}>
                  {p.status === 'active' ? '活跃' : p.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
