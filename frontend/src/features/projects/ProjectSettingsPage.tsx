import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectApi } from '../../api/projects';
import type { Project } from '../../types';

export default function ProjectSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    projectApi.get(id).then((res) => {
      setProject(res.data);
      setName(res.data.name);
      setDescription(res.data.description || '');
      setTaskType(res.data.task_type || '');
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await projectApi.update(id, { name, description, task_type: taskType });
      alert('保存成功');
    } catch (err: any) {
      alert(err.response?.data?.detail || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('⚠️ 确认删除项目？此操作不可恢复，所有图片和标注数据将被删除。')) return;
    if (!confirm('再次确认：真的要删除吗？')) return;
    setDeleting(true);
    try {
      await projectApi.delete(id);
      navigate('/projects');
    } catch (err: any) {
      alert(err.response?.data?.detail || '删除失败');
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-center text-gray-500 py-12">加载中...</div>;

  return (
    <div>
      <div className="mb-4">
        <Link to={`/projects/${id}`} className="text-blue-600 text-sm hover:underline">&larr; 返回项目</Link>
        <h2 className="text-xl font-bold mt-1">项目设置</h2>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-semibold mb-4">基本信息</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">项目名称</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">描述</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-3 py-2" rows={3} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">任务类型</label>
          <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="defect_detection">缺陷检测</option>
            <option value="classification">分类</option>
            <option value="segmentation">分割</option>
            <option value="anomaly_detection">异常检测</option>
          </select>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {saving ? '保存中...' : '保存修改'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-red-200">
        <h3 className="font-semibold text-red-600 mb-2">危险区域</h3>
        <p className="text-sm text-gray-500 mb-4">删除项目将永久删除所有关联的图片、标注、训练记录和模型。此操作不可恢复。</p>
        <button onClick={handleDelete} disabled={deleting} className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50">
          {deleting ? '删除中...' : '删除此项目'}
        </button>
      </div>
    </div>
  );
}
