import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { modelApi } from '../../api/models';
import type { ModelRegistry } from '../../types';

export default function ModelPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [models, setModels] = useState<ModelRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchModels = () => {
    if (!projectId) return;
    modelApi.list(projectId).then((res) => {
      setModels(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchModels(); }, [projectId]);

  const handleTest = async (modelId: string) => {
    try {
      const res = await modelApi.test(modelId);
      setTestResult({ modelId, ...res.data });
    } catch (err) {
      console.error('测试失败', err);
    }
  };

  const handleExport = async (modelId: string) => {
    try {
      const res = await modelApi.export(modelId);
      alert(JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.error('导出失败', err);
    }
  };

  if (loading) return <div className="text-center text-gray-500 py-12">加载中...</div>;

  return (
    <div>
      <div className="mb-4">
        <Link to={`/projects/${projectId}`} className="text-blue-600 text-sm hover:underline">&larr; 返回项目</Link>
        <h2 className="text-xl font-bold mt-1">模型管理</h2>
      </div>

      {testResult && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">在线测试结果</h3>
            <button onClick={() => setTestResult(null)} className="text-sm text-gray-500 hover:text-gray-700">关闭</button>
          </div>
          <div className="text-sm text-gray-500 mb-3">推理耗时: {testResult.inference_time_ms}ms</div>
          <div className="grid grid-cols-3 gap-4">
            {testResult.predictions?.map((p: any, i: number) => (
              <div key={i} className="bg-blue-50 p-3 rounded">
                <div className="font-medium">{p.label}</div>
                <div className="text-sm text-gray-600">置信度: {p.confidence}</div>
                {p.bbox && <div className="text-xs text-gray-500">BBox: [{p.bbox.x}, {p.bbox.y}, {p.bbox.w}x{p.bbox.h}]</div>}
              </div>
            ))}
            {(!testResult.predictions || testResult.predictions.length === 0) && (
              <div className="col-span-3 text-center text-gray-400 py-4">未检测到缺陷</div>
            )}
          </div>
        </div>
      )}

      {models.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
          <p className="mb-2">暂无模型</p>
          <p className="text-sm">请先在训练页面启动训练任务</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((m) => (
            <div key={m.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{m.version}</h3>
                  <p className="text-xs text-gray-500 font-mono">{m.id}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  m.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {m.status}
                </span>
              </div>

              {m.metrics && (
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-lg font-bold text-blue-600">
                      {((m.metrics.precision || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Precision</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-lg font-bold text-green-600">
                      {((m.metrics.recall || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Recall</div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <div className="text-lg font-bold text-purple-600">
                      {((m.metrics.f1 || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">F1</div>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 mb-3">
                格式: {m.model_format || '-'} | 产物: {m.artifact_path || '-'}
              </div>

              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => handleTest(m.id)}
                  className="flex-1 bg-blue-600 text-white py-1.5 rounded text-sm hover:bg-blue-700"
                >
                  测试
                </button>
                <button
                  onClick={() => handleExport(m.id)}
                  className="flex-1 bg-gray-600 text-white py-1.5 rounded text-sm hover:bg-gray-700"
                >
                  导出
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      await modelApi.rollback(m.id);
                      alert('回滚成功');
                      fetchModels();
                    } catch (err: any) { alert(err.response?.data?.detail || '回滚失败'); }
                  }}
                  className="flex-1 bg-yellow-600 text-white py-1.5 rounded text-sm hover:bg-yellow-700"
                >
                  回滚
                </button>
                <button
                  onClick={async () => {
                    try {
                      await modelApi.deploy(m.id);
                      alert('部署成功');
                    } catch (err: any) { alert(err.response?.data?.detail || '部署失败'); }
                  }}
                  className="flex-1 bg-green-600 text-white py-1.5 rounded text-sm hover:bg-green-700"
                >
                  部署
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
