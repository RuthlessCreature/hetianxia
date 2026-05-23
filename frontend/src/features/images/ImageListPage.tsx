import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { imageApi } from '../../api/images';
import { annotationApi } from '../../api/annotations';
import { prelabelApi } from '../../api/models';
import type { ImageAsset } from '../../types';

export default function ImageListPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [prelabelLoading, setPrelabelLoading] = useState(false);
  const [prelabelStatus, setPrelabelStatus] = useState('');
  const [prelabelModel, setPrelabelModel] = useState('hybrid');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchImages = () => {
    if (!id) return;
    setLoading(true);
    imageApi.list(id, { page, page_size: 20, label_status: filter || undefined }).then((res) => {
      let imgs = res.data.images;

      if (search) {
        imgs = imgs.filter((i: ImageAsset) => (i.file_name || '').toLowerCase().includes(search.toLowerCase()));
      }

      if (sortBy === 'name') {
        imgs.sort((a: ImageAsset, b: ImageAsset) => (a.file_name || '').localeCompare(b.file_name || ''));
      } else if (sortBy === 'status') {
        const order: Record<string, number> = { prelabeled: 0, labeled: 1, raw: 2 };
        imgs.sort((a: ImageAsset, b: ImageAsset) => (order[a.label_status] || 3) - (order[b.label_status] || 3));
      }

      setImages(imgs);
      setTotal(res.data.total);
      setLoading(false);
    });
  };

  useEffect(() => { fetchImages(); }, [id, page, filter, location]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !id) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('files', f));
    try {
      await imageApi.upload(id, formData);
      fetchImages();
    } catch (err) {
      console.error('上传失败', err);
    }
  };

  const handleDelete = async (imgId: string) => {
    if (!confirm('确认删除?')) return;
    await imageApi.delete(imgId);
    fetchImages();
  };

  const handlePrelabel = async () => {
    if (!id || images.length === 0) return;
    setPrelabelLoading(true);
    setPrelabelStatus('YOLOv8+OpenCV 分析中，请稍候...');
    try {
      const t0 = Date.now();
      await prelabelApi.create(id, {
        image_ids: images.slice(0, 24).map((i) => i.id),
        method: prelabelModel,
      });
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      setPrelabelStatus('');
      await fetchImages();
      try {
        const pending = await annotationApi.listPending(id);
        setPrelabelStatus(`完成 (${elapsed}s) — ${pending.data.length} 个候选标注`);
      } catch { setPrelabelStatus(`完成 (${elapsed}s)`); }
    } catch (err) {
      setPrelabelStatus('预标注失败，请重试');
      console.error('预标注失败', err);
    } finally {
      setPrelabelLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <Link to={`/projects/${id}`} className="text-blue-600 text-sm hover:underline">&larr; 返回项目</Link>
          <h2 className="text-xl font-bold mt-1">图片管理</h2>
        </div>
        <div className="flex gap-2">
          <select
            value={prelabelModel}
            onChange={(e) => setPrelabelModel(e.target.value)}
            className="border rounded px-2 py-2 text-xs bg-white"
          >
            <option value="hybrid">YOLOv8 + OpenCV</option>
            <option value="yolo">YOLOv8-nano</option>
            <option value="opencv">OpenCV only</option>
          </select>
          <button
            onClick={handlePrelabel}
            disabled={prelabelLoading || images.length === 0}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
          >
            {prelabelLoading ? '分析中...' : 'AI预标注'}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            + 上传图片
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {prelabelStatus && (
        <div className={`mb-3 px-4 py-2 rounded text-sm ${prelabelStatus.includes('失败') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
          {prelabelStatus}
        </div>
      )}

      <div className="flex gap-2 mb-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="搜索文件名..."
          className="border rounded px-3 py-1.5 text-sm w-48"
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="border rounded px-2 py-1.5 text-sm">
          <option value="date">按时间</option><option value="name">按名称</option><option value="status">按状态</option>
        </select>
        {selectedIds.size > 0 && (
          <div className="flex gap-2 items-center ml-2">
            <span className="text-sm text-gray-500">已选 {selectedIds.size}</span>
            <button onClick={async () => { for (const imgId of selectedIds) { try { await imageApi.delete(imgId); } catch {} }; setSelectedIds(new Set()); fetchImages(); }} className="text-red-500 text-sm hover:underline">批量删除</button>
            <button onClick={() => setSelectedIds(new Set())} className="text-gray-500 text-sm hover:underline">取消</button>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'raw', 'labeled', 'prelabeled'].map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1); }}
            className={`px-3 py-1 rounded text-sm ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            {s === '' ? '全部' : s === 'raw' ? '未标注' : s === 'labeled' ? '已标注' : '预标注待审核'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">加载中...</div>
      ) : images.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
          <p className="mb-4">暂无图片，请上传</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            {images.map((img) => (
              <div key={img.id} className="bg-white rounded-lg shadow overflow-hidden relative group">
                <input
                  type="checkbox"
                  checked={selectedIds.has(img.id)}
                  onChange={() => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      next.has(img.id) ? next.delete(img.id) : next.add(img.id);
                      return next;
                    });
                  }}
                  className="absolute top-2 left-2 z-10 w-4 h-4 rounded"
                />
                <img
                  src={img.thumbnail_path || img.file_path}
                  alt={img.file_name}
                  className="w-full h-40 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" fill="%23ddd"><rect width="200" height="150"/><text x="30" y="80" font-size="14" fill="%23999">No Image</text></svg>'; }}
                />
                <div className="p-2">
                  <div className="text-xs truncate text-gray-600">{img.file_name}</div>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      img.label_status === 'labeled' ? 'bg-green-100 text-green-700' :
                      img.label_status === 'prelabeled' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {img.label_status === 'raw' ? '未标注' : img.label_status === 'labeled' ? '已标注' : '预标注'}
                    </span>
                    <span className="text-xs text-gray-400">{img.annotation_count} 个标注</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Link
                      to={`/projects/${id}/images/${img.id}/annotate`}
                      className="flex-1 text-center text-xs bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
                    >
                      标注
                    </Link>
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="text-xs text-red-500 hover:text-red-700 py-1 px-2"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {total > 20 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-30"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">第 {page} 页 / 共 {Math.ceil(total / 20)} 页</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * 20 >= total}
                className="px-3 py-1 border rounded disabled:opacity-30"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
