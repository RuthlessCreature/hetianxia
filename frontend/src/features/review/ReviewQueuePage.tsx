import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { annotationApi } from '../../api/annotations';
import { imageApi } from '../../api/images';
import type { Annotation, ImageAsset } from '../../types';

export default function ReviewQueuePage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pending, setPending] = useState<Annotation[]>([]);
  const [images, setImages] = useState<Record<string, ImageAsset>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchStatus, setBatchStatus] = useState('');

  const fetchPending = async () => {
    if (!projectId) return;
    try {
      const res = await annotationApi.listPending(projectId);
      const anns: Annotation[] = res.data;
      setPending(anns);

      const imgIds = [...new Set(anns.map((a) => a.image_id))];
      const imgMap: Record<string, ImageAsset> = {};
      for (const imgId of imgIds.slice(0, 20)) {
        try {
          const img = await imageApi.get(imgId);
          imgMap[imgId] = img.data;
        } catch {}
      }
      setImages(imgMap);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, [projectId]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === pending.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map((a) => a.id)));
    }
  };

  const handleBatchReview = async (status: string) => {
    const ids = Array.from(selected);
    if (ids.length === 0) { alert('请先选择标注'); return; }
    setBatchStatus(status);
    try {
      await annotationApi.batchReview(ids, status);
      setSelected(new Set());
      fetchPending();
    } catch (err: any) {
      alert(err.response?.data?.detail || '操作失败');
    } finally {
      setBatchStatus('');
    }
  };

  const handleSingleReview = async (annId: string, status: string) => {
    try {
      await annotationApi.review(annId, status);
      fetchPending();
    } catch {}
  };

  const grouped = pending.reduce<Record<string, Annotation[]>>((acc, a) => {
    (acc[a.image_id] ||= []).push(a);
    return acc;
  }, {});

  if (loading) return <div className="text-center text-gray-500 py-12">加载中...</div>;

  return (
    <div>
      <div className="mb-4">
        <Link to={`/projects/${projectId}`} className="text-blue-600 text-sm hover:underline">&larr; 返回项目</Link>
        <h2 className="text-xl font-bold mt-1">审核队列 ({pending.length} 待审核)</h2>
        <p className="text-sm text-gray-500">AI预标注候选，需人工确认后才能进入训练集</p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
          <p className="text-lg mb-2">没有待审核标注</p>
          <p className="text-sm">所有AI预标注已处理完毕</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-3 mb-4 flex gap-3 items-center">
            <button onClick={selectAll} className="text-sm text-blue-600 hover:underline">
              {selected.size === pending.length ? '取消全选' : `全选 (${pending.length})`}
            </button>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm text-gray-500">已选 {selected.size} 项</span>
            <div className="flex-1" />
            <button
              onClick={() => handleBatchReview('confirmed')}
              disabled={selected.size === 0 || batchStatus !== ''}
              className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {batchStatus === 'confirmed' ? '确认中...' : '批量确认'}
            </button>
            <button
              onClick={() => handleBatchReview('rejected')}
              disabled={selected.size === 0 || batchStatus !== ''}
              className="bg-red-500 text-white px-4 py-1.5 rounded text-sm hover:bg-red-600 disabled:opacity-50"
            >
              {batchStatus === 'rejected' ? '拒接中...' : '批量拒绝'}
            </button>
          </div>

          <div className="space-y-4">
            {Object.entries(grouped).slice(0, 30).map(([imgId, anns]) => {
              const img = images[imgId];
              const allSelected = anns.every((a) => selected.has(a.id));
              return (
                <div key={imgId} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="flex">
                    <div className="w-48 h-32 bg-gray-100 flex-shrink-0">
                      {img ? (
                        <img src={img.thumbnail_path || img.file_path} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">加载中...</div>
                      )}
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs text-gray-500 font-mono">{imgId}</span>
                          <span className="text-xs text-gray-400 ml-2">{anns.length} 个候选标注</span>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            to={`/projects/${projectId}/images/${imgId}/annotate`}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            标注页查看
                          </Link>
                          <button
                            onClick={() => {
                              anns.forEach((a) => handleSingleReview(a.id, 'confirmed'));
                            }}
                            className="text-xs text-green-600 hover:underline"
                          >
                            全部确认
                          </button>
                          <button
                            onClick={() => {
                              anns.forEach((a) => handleSingleReview(a.id, 'rejected'));
                            }}
                            className="text-xs text-red-500 hover:underline"
                          >
                            全部拒绝
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {anns.map((a) => (
                          <div key={a.id} className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={selected.has(a.id)}
                              onChange={() => toggleSelect(a.id)}
                              className="rounded"
                            />
                            <span className={`px-1.5 py-0.5 rounded font-medium ${
                              a.status === 'candidate' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {a.label || '?'}
                            </span>
                            <span className="text-gray-400">{a.annotation_type}</span>
                            {a.confidence != null && (
                              <span className="text-gray-400">conf: {(a.confidence * 100).toFixed(0)}%</span>
                            )}
                            {a.geometry && (
                              <span className="text-gray-400 text-xs">
                                [{a.geometry.x},{a.geometry.y} {a.geometry.w}x{a.geometry.h}]
                              </span>
                            )}
                            <div className="flex-1" />
                            <button onClick={() => handleSingleReview(a.id, 'confirmed')} className="text-green-500 hover:text-green-700">确认</button>
                            <button onClick={() => handleSingleReview(a.id, 'rejected')} className="text-red-400 hover:text-red-600">拒绝</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
