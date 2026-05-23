import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { deployApi } from '../../api/admin';
import { modelApi } from '../../api/models';

export default function DeploymentPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [deployments, setDeployments] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');

  const fetchData = () => {
    if (!projectId) return;
    Promise.all([deployApi.list(projectId), modelApi.list(projectId)]).then(([dRes, mRes]) => {
      setDeployments(dRes.data);
      setModels(mRes.data);
      if (mRes.data.length > 0) setSelectedModelId(mRes.data[0].id);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const handleCreate = async () => {
    if (!projectId || !selectedModelId || !newName.trim()) return;
    try {
      await deployApi.create(projectId, { model_id: selectedModelId, name: newName, target: 'local' });
      setShowCreate(false);
      setNewName('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || '部署失败');
    }
  };

  const handleDelete = async (depId: string) => {
    if (!confirm('确认删除此部署?')) return;
    await deployApi.delete(depId);
    fetchData();
  };

  const statusColors: Record<string, string> = {
    created: 'bg-gray-100 text-gray-600', deploying: 'bg-yellow-100 text-yellow-700',
    running: 'bg-green-100 text-green-700', stopped: 'bg-red-100 text-red-700',
    failed: 'bg-red-100 text-red-700',
  };

  if (loading) return <div className="text-center text-gray-500 py-12">加载中...</div>;

  return (
    <div>
      <div className="mb-4">
        <Link to={`/projects/${projectId}`} className="text-blue-600 text-sm hover:underline">&larr; 返回项目</Link>
        <h2 className="text-xl font-bold mt-1">部署管理</h2>
      </div>

      <div className="mb-4">
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">+ 创建部署</button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">创建部署</h3>
            <div className="mb-3">
              <label className="block text-sm mb-1">部署名称</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="如：产线1号机" />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1">选择模型</label>
              <select value={selectedModelId} onChange={(e) => setSelectedModelId(e.target.value)} className="w-full border rounded px-3 py-2">
                {models.map((m) => <option key={m.id} value={m.id}>{m.version}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">取消</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">部署</button>
            </div>
          </div>
        </div>
      )}

      {deployments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">暂无部署</div>
      ) : (
        <div className="space-y-3">
          {deployments.map((d) => (
            <div key={d.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold">{d.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs ${statusColors[d.status] || 'bg-gray-100'}`}>{d.status}</span>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <div>模型: {d.model_id}</div>
                  {d.endpoint_url && <div>端点: {d.endpoint_url}</div>}
                  <div>部署时间: {d.deployed_at ? new Date(d.deployed_at).toLocaleString() : '-'}</div>
                </div>
              </div>
              <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:text-red-700 text-sm px-3 py-1">删除</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
