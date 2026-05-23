import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { imageApi } from '../../api/images';
import { trainingApi } from '../../api/training';
import type { ImageAsset, TrainingJob } from '../../types';
import { datasetApi, modelApi, evaluationApi } from '../../api/models';

export default function AnomalyDetectionPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upload' | 'train' | 'test'>('upload');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [trainingResult, setTrainingResult] = useState<any>(null);

  const fetchData = () => {
    if (!projectId) return;
    Promise.all([
      imageApi.list(projectId),
      trainingApi.list(projectId),
    ]).then(([imgRes, trainRes]) => {
      setImages(imgRes.data.images);
      setTrainingJobs(trainRes.data.filter((j) => j.task_type === 'anomaly_detection'));
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const handleUploadOK = async () => {
    if (!selectedFiles || !projectId) return;
    const fd = new FormData();
    Array.from(selectedFiles).forEach((f) => fd.append('files', f));
    try {
      await imageApi.upload(projectId, fd);
      setSelectedFiles(null);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleTrainAnomaly = async () => {
    if (!projectId) return;
    const ds = await datasetApi.create(projectId, { name: 'anomaly-ok-dataset' });
    await datasetApi.freeze(ds.data.id);

    const job = await trainingApi.create(projectId, {
      dataset_version_id: ds.data.id,
      task_type: 'anomaly_detection',
      strategy: 'fast_baseline',
    });
    setTrainingResult(job.data);
    fetchData();
  };

  if (loading) return <div className="text-center text-gray-500 py-12">加载中...</div>;

  return (
    <div>
      <div className="mb-4">
        <Link to={`/projects/${projectId}`} className="text-blue-600 text-sm hover:underline">&larr; 返回项目</Link>
        <h2 className="text-xl font-bold mt-1">异常检测 (无监督)</h2>
        <p className="text-sm text-gray-500 mt-1">路径说明：只使用 OK 样本训练正常分布模型，测试时输出异常分数</p>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <nav className="flex border-b">
          {[
            { key: 'upload' as const, label: '1. 上传 OK 图片' },
            { key: 'train' as const, label: '2. 训练模型' },
            { key: 'test' as const, label: '3. 异常检测' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-6">
          {activeTab === 'upload' && (
            <div>
              <h3 className="font-semibold mb-3">上传正常(OK)样本图片</h3>
              <p className="text-sm text-gray-500 mb-4">请确保只上传无缺陷的 OK 图片。混入 NG 样本会影响模型精度。</p>
              <input type="file" multiple accept="image/*" onChange={(e) => setSelectedFiles(e.target.files)} className="mb-3" />
              <button onClick={handleUploadOK} disabled={!selectedFiles} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm">上传</button>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {images.slice(0, 10).map((img) => (
                  <img key={img.id} src={img.thumbnail_path || img.file_path} className="w-full h-20 object-cover rounded" alt="" />
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">共 {images.length} 张 OK 图片</div>
            </div>
          )}

          {activeTab === 'train' && (
            <div>
              <h3 className="font-semibold mb-3">训练异常检测模型</h3>
              <p className="text-sm text-gray-500 mb-4">系统将学习 OK 样本的正常分布，后续用于识别异常样本。</p>
              <button onClick={handleTrainAnomaly} disabled={images.length < 5} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">启动训练 ({images.length} 张OK图)</button>
              {trainingResult && (
                <div className="mt-4 bg-green-50 p-4 rounded">
                  <div className="text-green-700 font-medium">训练完成</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {trainingResult.metrics && `AUROC: ${(trainingResult.metrics.auroc * 100).toFixed(1)}% | Precision: ${(trainingResult.metrics.precision * 100).toFixed(1)}%`}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'test' && (
            <div>
              <h3 className="font-semibold mb-3">异常检测测试</h3>
              <p className="text-sm text-gray-500 mb-4">上传测试图片，系统将输出异常评分和热力图。</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-400">
                拖拽或点击上传测试图片
                <div className="text-xs mt-2">支持 OK/NG 混合图片</div>
              </div>
              {trainingJobs.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">训练历史</h4>
                  {trainingJobs.map((j) => (
                    <div key={j.id} className="bg-gray-50 p-3 rounded mb-2 text-sm">
                      <span className="font-mono text-xs">{j.id}</span>
                      <span className={`ml-3 px-2 py-0.5 rounded text-xs ${j.status === 'succeeded' ? 'bg-green-100 text-green-700' : 'bg-gray-200'}`}>{j.status}</span>
                      {j.metrics && <span className="ml-3 text-gray-500">AUROC: {((j.metrics.auroc || 0) * 100).toFixed(1)}%</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
