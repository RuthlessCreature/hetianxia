import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { modelApi } from '../../api/models';
import { evaluationApi } from '../../api/models';
import type { ModelRegistry, EvaluationReport } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ModelComparePage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [models, setModels] = useState<ModelRegistry[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    modelApi.list(projectId).then((res) => {
      setModels(res.data);
      setLoading(false);
    });
  }, [projectId]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedModels = models.filter((m) => selected.includes(m.id));

  const compareData = [
    { name: 'Precision', ...Object.fromEntries(selectedModels.map((m) => [m.version, (m.metrics?.precision || 0) * 100])) },
    { name: 'Recall', ...Object.fromEntries(selectedModels.map((m) => [m.version, (m.metrics?.recall || 0) * 100])) },
    { name: 'F1', ...Object.fromEntries(selectedModels.map((m) => [m.version, (m.metrics?.f1 || 0) * 100])) },
  ];

  const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];

  if (loading) return <div className="text-center text-gray-500 py-12">加载中...</div>;

  return (
    <div>
      <div className="mb-4">
        <Link to={`/projects/${projectId}`} className="text-blue-600 text-sm hover:underline">&larr; 返回项目</Link>
        <h2 className="text-xl font-bold mt-1">模型对比</h2>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-semibold mb-3">选择对比模型 (勾选 2-5 个)</h3>
        <div className="flex flex-wrap gap-2">
          {models.map((m) => (
            <button
              key={m.id}
              onClick={() => toggleSelect(m.id)}
              className={`px-4 py-2 rounded text-sm border transition-colors ${
                selected.includes(m.id)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              {m.version}
            </button>
          ))}
        </div>
      </div>

      {selectedModels.length >= 2 ? (
        <>
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="font-semibold mb-3">指标对比</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={compareData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[70, 100]} />
                <Tooltip />
                <Legend />
                {selectedModels.map((m, i) => (
                  <Bar key={m.id} dataKey={m.version} fill={COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-6 py-3">指标</th>
                  {selectedModels.map((m) => (
                    <th key={m.id} className="px-6 py-3">{m.version}</th>
                  ))}
                  <th className="px-6 py-3">最佳</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'precision', label: 'Precision', format: (v: number) => (v * 100).toFixed(1) + '%', higher: true },
                  { key: 'recall', label: 'Recall', format: (v: number) => (v * 100).toFixed(1) + '%', higher: true },
                  { key: 'f1', label: 'F1 Score', format: (v: number) => (v * 100).toFixed(1) + '%', higher: true },
                  { key: 'map50', label: 'mAP@50', format: (v: number) => (v * 100).toFixed(1) + '%', higher: true },
                ].map((metric) => {
                  const values = selectedModels.map((m) => m.metrics?.[metric.key] as number || 0);
                  const best = metric.higher ? Math.max(...values) : Math.min(...values);
                  return (
                    <tr key={metric.key} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium">{metric.label}</td>
                      {values.map((v, i) => (
                        <td key={i} className={`px-6 py-3 ${v === best && values.filter((x) => x === best).length === 1 ? 'text-green-600 font-bold' : ''}`}>
                          {metric.format(v)}
                        </td>
                      ))}
                      <td className="px-6 py-3 text-xs text-gray-400">{metric.format(best)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
          请选择至少 2 个模型进行对比
        </div>
      )}
    </div>
  );
}
