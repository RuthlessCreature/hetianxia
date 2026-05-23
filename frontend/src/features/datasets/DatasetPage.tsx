import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { datasetApi } from '../../api/models';
import type { DatasetVersion } from '../../types';

export default function DatasetPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [datasets, setDatasets] = useState<DatasetVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchDatasets = () => {
    if (!projectId) return;
    datasetApi.list(projectId).then((res) => {
      setDatasets(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchDatasets(); }, [projectId]);

  const handleCreate = async () => {
    if (!projectId) return;
    setCreating(true);
    try {
      await datasetApi.create(projectId, { name: `dataset-${Date.now()}` });
      fetchDatasets();
    } catch (err: any) {
      alert(err.response?.data?.detail || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleFreeze = async (dsId: string) => {
    try {
      const res = await datasetApi.freeze(dsId);
      setDatasets(datasets.map((d) => (d.id === dsId ? res.data : d)));
    } catch (err: any) {
      alert(err.response?.data?.detail || '冻结失败');
    }
  };

  if (loading) return <div className="text-center text-gray-500 py-12">加载中...</div>;

  return (
    <div>
      <div className="mb-4">
        <Link to={`/projects/${projectId}`} className="text-blue-600 text-sm hover:underline">&larr; 返回项目</Link>
        <h2 className="text-xl font-bold mt-1">数据集版本</h2>
      </div>

      <div className="mb-4">
        <button
          onClick={handleCreate}
          disabled={creating}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {creating ? '创建中...' : '+ 创建新版本'}
        </button>
      </div>

      {datasets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
          暂无数据集版本，请先上传并标注图片
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {datasets.map((ds) => (
            <div key={ds.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{ds.version}</h3>
                  <p className="text-xs text-gray-500">{ds.name || '未命名'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  ds.status === 'frozen' ? 'bg-blue-100 text-blue-700' :
                  ds.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {ds.status === 'frozen' ? '已冻结' : ds.status === 'draft' ? '草稿' : ds.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-xl font-bold text-blue-600">{ds.train_count}</div>
                  <div className="text-xs text-gray-500">Train</div>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-xl font-bold text-green-600">{ds.val_count}</div>
                  <div className="text-xs text-gray-500">Val</div>
                </div>
                <div className="bg-purple-50 p-2 rounded">
                  <div className="text-xl font-bold text-purple-600">{ds.test_count}</div>
                  <div className="text-xs text-gray-500">Test</div>
                </div>
              </div>

              {ds.status === 'draft' && (
                <button
                  onClick={() => handleFreeze(ds.id)}
                  className="w-full bg-orange-500 text-white py-1.5 rounded text-sm hover:bg-orange-600"
                >
                  冻结数据集
                </button>
              )}

              {ds.description && (
                <p className="text-xs text-gray-500 mt-3">{ds.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
