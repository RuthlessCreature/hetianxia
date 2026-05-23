import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { modelApi, evaluationApi } from '../../api/models';
import type { EvaluationReport, ModelRegistry } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function EvaluationPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [models, setModels] = useState<ModelRegistry[]>([]);
  const [reports, setReports] = useState<EvaluationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState('');
  const [threshold, setThreshold] = useState(0.5);
  const [evaluating, setEvaluating] = useState(false);

  const fetchData = () => {
    if (!projectId) return;
    Promise.all([
      modelApi.list(projectId),
      // Fetch all evaluation reports - we'll filter
      evaluationApi.listByModel('all').catch(() => ({ data: [] })),
    ]).then(async ([mRes]) => {
      setModels(mRes.data);
      if (mRes.data.length > 0) setSelectedModel(mRes.data[0].id);

      const allReports: EvaluationReport[] = [];
      for (const m of mRes.data) {
        try {
          const r = await evaluationApi.listByModel(m.id);
          allReports.push(...r.data);
        } catch {}
      }
      setReports(allReports);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const handleEvaluate = async () => {
    if (!selectedModel) return;
    setEvaluating(true);
    try {
      const res = await evaluationApi.create(selectedModel, { threshold });
      setReports([res.data, ...reports]);
    } catch (err: any) {
      alert(err.response?.data?.detail || '评估失败');
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) return <div className="text-center text-gray-500 py-12">加载中...</div>;

  const latestReport = reports.length > 0 ? reports[0] : null;

  const metricData = latestReport?.metrics
    ? Object.entries(latestReport.metrics)
        .filter(([k]) => !['task_type'].includes(k))
        .map(([name, value]) => ({ name, value: typeof value === 'number' ? Math.round(value * 100) : value }))
    : [];

  const radarData = latestReport?.metrics
    ? [
        { metric: 'Precision', value: (latestReport.metrics.precision || 0) * 100 },
        { metric: 'Recall', value: (latestReport.metrics.recall || 0) * 100 },
        { metric: 'F1', value: (latestReport.metrics.f1 || 0) * 100 },
        { metric: 'mAP50', value: (latestReport.metrics.map50 || 0) * 100 },
      ]
    : [];

  return (
    <div>
      <div className="mb-4">
        <Link to={`/projects/${projectId}`} className="text-blue-600 text-sm hover:underline">&larr; 返回项目</Link>
        <h2 className="text-xl font-bold mt-1">评估报告</h2>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm mb-1">选择模型版本</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- 选择模型 --</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.version}</option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <label className="block text-sm mb-1">
              阈值: <span className="font-bold text-blue-600">{threshold.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0</span><span>0.5</span><span>1.0</span>
            </div>
          </div>
          <button
            onClick={handleEvaluate}
            disabled={evaluating || !selectedModel}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {evaluating ? '评估中...' : '运行评估'}
          </button>
        </div>
      </div>

      {latestReport && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(latestReport, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `evaluation_${latestReport.id}.json`;
                a.click(); URL.revokeObjectURL(url);
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
            >
              导出报告 (JSON)
            </button>
            <button
              onClick={async () => {
                try {
                  const { exportApi } = await import('../../api/admin');
                  const md = await exportApi.evaluation(`/export/evaluation/${latestReport.id}/markdown`);
                  const blob = new Blob([md.data], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `evaluation_${latestReport.id}.md`;
                  a.click(); URL.revokeObjectURL(url);
                } catch {}
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 ml-2"
            >
              导出报告 (Markdown)
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Precision</div>
              <div className="text-2xl font-bold text-blue-600">
                {((latestReport.metrics?.precision || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Recall</div>
              <div className="text-2xl font-bold text-green-600">
                {((latestReport.metrics?.recall || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">F1 Score</div>
              <div className="text-2xl font-bold text-purple-600">
                {((latestReport.metrics?.f1 || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Avg Inference</div>
              <div className="text-2xl font-bold text-orange-600">
                {latestReport.metrics?.avg_inference_ms || '-'} ms
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">检测指标</h3>
              {metricData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metricData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-400 py-12">无指标数据</div>
              )}
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">综合评估</h3>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" fontSize={11} />
                    <PolarRadiusAxis fontSize={10} />
                    <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-400 py-12">无评估数据</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">误报/漏报</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-xl font-bold text-red-600">{latestReport.metrics?.false_positive_count || 0}</div>
                  <div className="text-xs text-gray-500">误报 (FP)</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="text-xl font-bold text-yellow-600">{latestReport.metrics?.false_negative_count || 0}</div>
                  <div className="text-xs text-gray-500">漏检 (FN)</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-xl font-bold text-green-600">
                    {latestReport.metrics?.false_positive_count != null ? (
                      ((1 - latestReport.metrics.false_positive_count / 100) * 100).toFixed(0)
                    ) : '-'}%
                  </div>
                  <div className="text-xs text-gray-500">准确率</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">失败样本 / 建议</h3>
              {latestReport.failure_cases && Array.isArray(latestReport.failure_cases) ? (
                <div className="max-h-48 overflow-auto">
                  {latestReport.failure_cases.slice(0, 5).map((fc: any, i: number) => (
                    <div key={i} className="text-xs py-1 border-b last:border-0">
                      <span className="text-red-500">{fc.reason}</span>
                      <span className="text-gray-400 ml-2">score: {fc.score}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">暂无失败样本</div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-lg shadow mt-6">
        <div className="px-6 py-3 border-b font-semibold">评估历史 ({reports.length})</div>
        {reports.length === 0 ? (
          <div className="p-12 text-center text-gray-400">暂无评估报告，请先训练模型</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-6 py-2">报告ID</th>
                <th className="px-6 py-2">模型</th>
                <th className="px-6 py-2">阈值</th>
                <th className="px-6 py-2">Precision</th>
                <th className="px-6 py-2">Recall</th>
                <th className="px-6 py-2">F1</th>
                <th className="px-6 py-2">时间</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-2 font-mono text-xs">{r.id}</td>
                  <td className="px-6 py-2 text-xs">{r.model_id}</td>
                  <td className="px-6 py-2">{r.threshold ?? '-'}</td>
                  <td className="px-6 py-2">{r.metrics?.precision ? (r.metrics.precision * 100).toFixed(1) + '%' : '-'}</td>
                  <td className="px-6 py-2">{r.metrics?.recall ? (r.metrics.recall * 100).toFixed(1) + '%' : '-'}</td>
                  <td className="px-6 py-2">{r.metrics?.f1 ? (r.metrics.f1 * 100).toFixed(1) + '%' : '-'}</td>
                  <td className="px-6 py-2 text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
