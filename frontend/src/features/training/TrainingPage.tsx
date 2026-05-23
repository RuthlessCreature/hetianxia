import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { trainingApi } from '../../api/training';
import { datasetApi } from '../../api/models';
import type { TrainingJob, DatasetVersion } from '../../types';

export default function TrainingPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [datasets, setDatasets] = useState<DatasetVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [taskType, setTaskType] = useState('object_detection');
  const [strategy, setStrategy] = useState('transfer_learning');
  const [trainingModel, setTrainingModel] = useState('resnet18');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    if (!projectId) return;
    Promise.all([
      trainingApi.list(projectId),
      datasetApi.list(projectId),
    ]).then(([jRes, dRes]) => {
      setJobs(jRes.data);
      setDatasets(dRes.data);
      if (dRes.data.length > 0) setSelectedDataset(dRes.data[0].id);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const handleCreateAndFreezeDataset = async () => {
    if (!projectId) return;
    try {
      const ds = await datasetApi.create(projectId, { name: 'auto-dataset' });
      const frozen = await datasetApi.freeze(ds.data.id);
      setDatasets([frozen.data, ...datasets]);
      setSelectedDataset(frozen.data.id);
    } catch (err: any) {
      alert(err.response?.data?.detail || '创建数据集失败');
    }
  };

  const handleStartTraining = async () => {
    if (!projectId || !selectedDataset) {
      alert('请先选择数据集版本');
      return;
    }
    setSubmitting(true);
    try {
      const res = await trainingApi.create(projectId, {
        dataset_version_id: selectedDataset,
        task_type: taskType,
        strategy,
        config: { model: trainingModel },
      });
      setJobs([res.data, ...jobs]);
      alert('训练任务已启动并完成');
    } catch (err: any) {
      alert(err.response?.data?.detail || '启动训练失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center text-gray-500 py-12">加载中...</div>;

  return (
    <div>
      <div className="mb-4">
        <Link to={`/projects/${projectId}`} className="text-blue-600 text-sm hover:underline">&larr; 返回项目</Link>
        <h2 className="text-xl font-bold mt-1">训练任务</h2>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-semibold mb-4">启动新训练</h3>
          <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-1">数据集版本</label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- 选择数据集 --</option>
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.version} - {d.name || '未命名'} ({d.status})
                </option>
              ))}
            </select>
            <button onClick={handleCreateAndFreezeDataset} className="text-xs text-blue-600 hover:underline mt-1">
              快速创建并冻结数据集
            </button>
          </div>
          <div>
            <label className="block text-sm mb-1">任务类型</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="object_detection">缺陷检测</option>
              <option value="classification">分类</option>
              <option value="segmentation">分割</option>
              <option value="anomaly_detection">异常检测</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">训练策略</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="transfer_learning">迁移学习 (推荐)</option>
              <option value="fast_baseline">Fast Baseline</option>
              <option value="high_precision">高精度</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">骨干网络</label>
            <select
              value={trainingModel}
              onChange={(e) => setTrainingModel(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="resnet18">ResNet-18 (快)</option>
              <option value="resnet34">ResNet-34</option>
              <option value="resnet50">ResNet-50 (准)</option>
              <option value="efficientnet_b0">EfficientNet-B0</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleStartTraining}
          disabled={submitting || !selectedDataset}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? '提交中...' : '启动训练'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-3 border-b font-semibold">训练历史</div>
        {jobs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">暂无训练任务</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-6 py-2">ID</th>
                <th className="px-6 py-2">任务类型</th>
                <th className="px-6 py-2">策略</th>
                <th className="px-6 py-2">状态</th>
                <th className="px-6 py-2">指标</th>
                <th className="px-6 py-2">时间</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-2 font-mono text-xs">{j.id}</td>
                  <td className="px-6 py-2">{j.task_type}</td>
                  <td className="px-6 py-2">{j.strategy || '-'}</td>
                  <td className="px-6 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      j.status === 'succeeded' ? 'bg-green-100 text-green-700' :
                      j.status === 'running' ? 'bg-blue-100 text-blue-700' :
                      j.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {j.status}
                    </span>
                  </td>
                  <td className="px-6 py-2">
                    {j.metrics && (
                      <span className="text-xs">
                        P: {j.metrics.precision?.toFixed(2)} R: {j.metrics.recall?.toFixed(2)} F1: {j.metrics.f1?.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-2 text-xs text-gray-500">
                    {new Date(j.created_at).toLocaleString()}
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
