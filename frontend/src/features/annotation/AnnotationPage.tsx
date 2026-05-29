import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { imageApi } from '../../api/images';
import { annotationApi } from '../../api/annotations';
import client from '../../api/client';
import type { ImageAsset, Annotation } from '../../types';
import { fabric } from 'fabric';

const LABELS = ['scratch', 'dent', 'stain', 'crack', 'burr', 'OK', 'NG'];
const LBL: Record<string, string> = { scratch: '#ef4444', dent: '#f97316', stain: '#eab308', crack: '#22c55e', burr: '#3b82f6', OK: '#16a34a', NG: '#dc2626' };
const CC = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

function loadLabels(): string[] { try { const v = localStorage.getItem('htx_labels'); if (v) { const a = JSON.parse(v); if (Array.isArray(a) && a.length) return a; } } catch {} return [...LABELS]; }
function saveLabels(l: string[]) { localStorage.setItem('htx_labels', JSON.stringify(l)); }

type Mode = 'bbox' | 'polygon' | 'pointer' | 'sam';

export default function AnnotationPage() {
  const { projectId, imageId } = useParams<{ projectId: string; imageId: string }>();
  const navigate = useNavigate();
  const [image, setImage] = useState<ImageAsset | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [labels, setLabels] = useState<string[]>(loadLabels);
  const [selLabel, setSelLabel] = useState(labels[0] || 'scratch');
  const [mode, setMode] = useState<Mode>('bbox');
  const [loading, setLoading] = useState(true);
  const [imgList, setImgList] = useState<ImageAsset[]>([]);
  const [selAnnId, setSelAnnId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [newLbl, setNewLbl] = useState('');
  const [pcnt, setPcnt] = useState(0);
  const [samPrompt, setSamPrompt] = useState('');

  const elRef = useRef<HTMLCanvasElement>(null);
  const fcRef = useRef<fabric.Canvas | null>(null);
  const annsRef = useRef<Annotation[]>([]);
  const modeRef = useRef(mode);
  const lblRef = useRef(selLabel);
  const iidRef = useRef('');
  const promptRef = useRef('');
  const pr = useRef<{ pts: fabric.Point[]; dots: fabric.Circle[]; line: fabric.Polyline | null }>({ pts: [], dots: [], line: null });
  modeRef.current = mode; lblRef.current = selLabel; iidRef.current = imageId || ''; annsRef.current = annotations; promptRef.current = samPrompt;

  useEffect(() => {
    if (!imageId || !projectId) return; setLoading(true);
    Promise.all([imageApi.get(imageId), annotationApi.list(imageId), imageApi.list(projectId, { page_size: 100 })])
      .then(([ir, ar, lr]) => { setImage(ir.data); setAnnotations(ar.data); setImgList(lr.data.images || []); setLoading(false); }).catch(() => setLoading(false));
  }, [imageId, projectId]);

  useEffect(() => {
    if (!image || !elRef.current) return;
    const el = elRef.current; const iw = image.width || 800; const ih = image.height || 600;
    const canvas = new fabric.Canvas(el, { width: iw, height: ih, selection: true, backgroundColor: '#e5e7eb' });
    fcRef.current = canvas;
    fabric.Image.fromURL(image.file_path, (fImg) => {
      fImg.set({ left: 0, top: 0, scaleX: 1, scaleY: 1, selectable: false, evented: false, excludeFromExport: true });
      canvas.add(fImg); canvas.sendToBack(fImg); drawAll(canvas, annsRef.current);
    }, { crossOrigin: 'anonymous' });

    let down = false, sx = 0, sy = 0, drawR: fabric.Rect | null = null;
    pr.current = { pts: [], dots: [], line: null }; const pk = pr.current;

    canvas.on('mouse:down', async (opt: any) => {
      const m = modeRef.current, ptr = canvas.getPointer(opt.e, false);
      if (m === 'pointer') {
        if (opt.target && (opt.target as any)._annId) { canvas.setActiveObject(opt.target); setSelAnnId((opt.target as any)._annId); }
        else { canvas.discardActiveObject(); canvas.renderAll(); setSelAnnId(null); }
        return;
      }
      if (m === 'sam') {
        const dot = new fabric.Circle({ left: ptr.x - 5, top: ptr.y - 5, radius: 5, fill: '#3b82f6', opacity: 0.7, selectable: false, evented: false, excludeFromExport: true });
        canvas.add(dot); canvas.renderAll(); setTimeout(() => { canvas.remove(dot); canvas.renderAll(); }, 1500);
        setMsg('SAM 处理中...');
        try {
          const p = promptRef.current || '';
          const res = p
            ? await client.get(`/sam/images/${iidRef.current}/ground?x=${Math.round(ptr.x)}&y=${Math.round(ptr.y)}&prompt=${encodeURIComponent(p)}`)
            : await client.post(`/sam/images/${iidRef.current}/decode?x=${Math.round(ptr.x)}&y=${Math.round(ptr.y)}`);
          if (res.data?.status === 'ok' && res.data.polygon) {
            const r = await annotationApi.create(iidRef.current, { image_id: iidRef.current, annotation_type: 'polygon', label: lblRef.current, geometry: { points: res.data.polygon }, source: 'ai_prelabel', status: 'confirmed' });
            setAnnotations(x => { const n = [...x, r.data]; annsRef.current = n; drawAll(canvas, n); return n; });
            setMsg(`完成 score=${res.data.score}`);
          } else { setMsg('SAM 模型未安装。pip install segment-anything-2'); }
        } catch { setMsg('SAM 模型未安装。pip install segment-anything-2'); }
        setTimeout(() => setMsg(''), 3000); return;
      }
      if (m === 'bbox') {
        if (opt.target && (opt.target as any)._annId) { const a = annsRef.current.find(x => x.id === (opt.target as any)._annId); if (a?.status === 'confirmed') { canvas.setActiveObject(opt.target); setSelAnnId(a.id); return; } if (a?.status === 'candidate') return; }
        down = true; sx = ptr.x; sy = ptr.y;
        drawR = new fabric.Rect({ left: sx, top: sy, width: 0, height: 0, fill: 'rgba(59,130,246,0.08)', stroke: '#3b82f6', strokeWidth: 2, strokeDashArray: [6, 3], selectable: false, evented: false, excludeFromExport: true });
        canvas.add(drawR);
      }
      if (m === 'polygon') {
        pk.pts.push(new fabric.Point(ptr.x, ptr.y));
        const d = new fabric.Circle({ left: ptr.x - 4, top: ptr.y - 4, radius: 4, fill: '#3b82f6', selectable: false, evented: false, excludeFromExport: true });
        canvas.add(d); pk.dots.push(d); if (pk.line) canvas.remove(pk.line);
        if (pk.pts.length >= 2) { pk.line = new fabric.Polyline(pk.pts, { fill: 'transparent', stroke: '#3b82f6', strokeWidth: 2, strokeDashArray: [6, 3], selectable: false, evented: false, excludeFromExport: true }); canvas.add(pk.line); }
        canvas.renderAll(); setPcnt(pk.pts.length);
      }
    });

    canvas.on('mouse:move', (opt: any) => { if (!down || !drawR || modeRef.current !== 'bbox') return; const p = canvas.getPointer(opt.e, false); drawR.set({ left: Math.min(sx, p.x), top: Math.min(sy, p.y), width: Math.abs(p.x - sx), height: Math.abs(p.y - sy) }); canvas.renderAll(); });

    canvas.on('mouse:up', async () => { if (modeRef.current !== 'bbox') { down = false; return; } down = false; if (!drawR) return;
      const rw = Math.round(drawR.width!), rh = Math.round(drawR.height!), rx = Math.round(drawR.left!), ry = Math.round(drawR.top!);
      canvas.remove(drawR); drawR = null; canvas.renderAll(); if (rw < 8 || rh < 8) return;
      try { const r = await annotationApi.create(iidRef.current, { image_id: iidRef.current, annotation_type: 'bbox', label: lblRef.current, geometry: { x: rx, y: ry, w: rw, h: rh }, source: 'human', status: 'confirmed' });
        setAnnotations(x => { const n = [...x, r.data]; annsRef.current = n; drawAll(canvas, n); return n; }); } catch {} });

    canvas.on('mouse:dblclick', async () => { if (modeRef.current === 'polygon' && pk.pts.length >= 3) {
      const pts = pk.pts.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })); pk.dots.forEach(d => canvas.remove(d)); if (pk.line) canvas.remove(pk.line);
      pk.pts = []; pk.dots = []; pk.line = null; setPcnt(0); canvas.renderAll();
      try { const r = await annotationApi.create(iidRef.current, { image_id: iidRef.current, annotation_type: 'polygon', label: lblRef.current, geometry: { points: pts }, source: 'human', status: 'confirmed' });
        setAnnotations(x => { const n = [...x, r.data]; annsRef.current = n; drawAll(canvas, n); return n; }); } catch {} } });
    (window as any).__htxPoly = () => { if (pk.pts.length >= 3) { canvas.fire('mouse:dblclick'); } };

    canvas.on('object:modified', async (opt: any) => { const obj = opt.target; if (!obj || !(obj as any)._annId) return; const id = (obj as any)._annId, a = annsRef.current.find(x => x.id === id); if (!a || a.status === 'candidate') return;
      let x = Math.round(obj.left!), y = Math.round(obj.top!), w = 0, h = 0; if (obj instanceof fabric.Group) { const r = obj.getObjects().find(o => o instanceof fabric.Rect); if (r) { w = Math.round((r as fabric.Rect).getScaledWidth()); h = Math.round((r as fabric.Rect).getScaledHeight()); } }
      if (w < 5 || h < 5) return; try { const r = await annotationApi.update(id, { geometry: { x, y, w, h } }); setAnnotations(x => x.map(a => a.id === id ? r.data : a)); } catch {} });

    window.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const a = canvas.getActiveObject(); if (!a || !(a as any)._annId) return; const aid = (a as any)._annId;
      annotationApi.delete(aid).catch(() => {}); setAnnotations(x => x.filter(y => y.id !== aid)); canvas.remove(a); canvas.discardActiveObject(); canvas.renderAll(); setSelAnnId(null); });

    return () => { canvas.dispose(); fcRef.current = null; delete (window as any).__htxPoly; };
  }, [image]);

  useEffect(() => { const c = fcRef.current; if (c) drawAll(c, annotations); }, [annotations]);

  const review = async (id: string, st: string) => { try { await annotationApi.review(id, st); if (st === 'rejected') { setAnnotations(x => x.filter(a => a.id !== id)); setMsg('已拒绝'); } else { setAnnotations(x => x.map(a => a.id === id ? { ...a, status: 'confirmed' } : a)); setMsg('已确认'); } setTimeout(() => setMsg(''), 1500); } catch {} };
  const chLabel = async (id: string, l: string) => { try { const r = await annotationApi.update(id, { label: l }); setAnnotations(x => x.map(a => a.id === id ? r.data : a)); } catch {} };
  const imgLabel = async (l: string) => { try { const r = await annotationApi.create(iidRef.current, { image_id: iidRef.current, annotation_type: 'image_label', label: l, source: 'human', status: 'confirmed' }); setAnnotations(x => [...x, r.data]); } catch {} };
  const addLabel = () => { const n = newLbl.trim(); if (!n || labels.includes(n)) { setNewLbl(''); return; } const nx = [...labels, n]; setLabels(nx); saveLabels(nx); setSelLabel(n); setNewLbl(''); };
  const rmLabel = (l: string) => { if (['OK', 'NG'].includes(l)) return; const nx = labels.filter(x => x !== l); setLabels(nx); saveLabels(nx); if (selLabel === l) setSelLabel(nx[0] || 'scratch'); };

  const idx = imgList.findIndex(i => i.id === imageId); const prev = idx > 0 ? imgList[idx - 1] : null, next = idx < imgList.length - 1 ? imgList[idx + 1] : null;
  if (loading) return <div className="text-center text-gray-500 py-12">加载中...</div>;
  if (!image) return <div className="text-center text-gray-500 py-12">图片不存在</div>;
  const cand = annotations.filter(a => a.status === 'candidate'), conf = annotations.filter(a => a.status === 'confirmed'), sel = annotations.find(a => a.id === selAnnId);

  return (
    <div className="annotation-workbench flex gap-3" style={{ height: 'calc(100vh - 100px)' }}>
      <div className="annotation-panel w-44 bg-white rounded-lg shadow p-3 flex-shrink-0 flex flex-col gap-2 text-sm overflow-auto">
        <Link to={`/projects/${projectId}/images`} className="text-blue-600 text-xs hover:underline">&larr; 返回</Link>
        <div>
          <div className="text-xs text-gray-500 mb-1">模式</div>
          <div className="flex gap-1">
            {(['bbox', 'polygon', 'pointer', 'sam'] as Mode[]).map(m => (<button key={m} onClick={() => { setMode(m); setSelAnnId(null); }} className={`flex-1 py-1.5 text-xs rounded font-medium ${mode === m ? 'bg-zinc-900 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{m === 'bbox' ? '框' : m === 'polygon' ? '多边形' : m === 'sam' ? 'SAM' : '选择'}</button>))}
          </div>
          {mode === 'polygon' && <button onClick={() => { const f = (window as any).__htxPoly; if (f) f(); }} className="w-full mt-1 py-1.5 text-xs rounded font-medium bg-blue-600 text-white hover:bg-blue-700">闭合 ({pcnt}顶点)</button>}
          {mode === 'sam' && <input type="text" value={samPrompt} onChange={e => setSamPrompt(e.target.value)} placeholder="提示词(可选)" className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400" />}
          <div className="text-xs text-gray-400 mt-1">{mode === 'bbox' ? '拖空白画框' : mode === 'polygon' ? '点空白加顶点' : mode === 'sam' ? '点击图片区域自动分割' : '选中移动·Delete删除'}</div>
        </div>
        <div><div className="text-xs text-gray-500 mb-1">整图</div><div className="flex gap-1"><button onClick={() => imgLabel('OK')} className="flex-1 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700">OK</button><button onClick={() => imgLabel('NG')} className="flex-1 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700">NG</button></div></div>
        <div className="flex-1 overflow-auto"><div className="text-xs text-gray-500 mb-1">类型</div>
          {labels.filter(l => l !== 'OK' && l !== 'NG').map((l, i) => (<div key={l} className="flex items-center group"><button onClick={() => setSelLabel(l)} className={`flex-1 text-left px-2 py-1 text-xs rounded mb-0.5 ${selLabel === l ? 'ring-2 ring-blue-500 font-medium' : 'hover:bg-gray-100'}`} style={{ backgroundColor: (CC[i % CC.length] || '#666') + '12', color: CC[i % CC.length] || '#666' }}>{l}</button>{!['scratch', 'dent', 'stain', 'crack', 'burr'].includes(l) && <button onClick={() => rmLabel(l)} className="text-gray-300 hover:text-red-400 text-xs px-1 opacity-0 group-hover:opacity-100">x</button>}</div>))}
          <div className="flex gap-0.5 mt-1"><input value={newLbl} onChange={e => setNewLbl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addLabel(); }} placeholder="新标签..." className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400" /><button onClick={addLabel} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">+</button></div></div>
      </div>
      <div className="annotation-stage flex-1 bg-white rounded-lg shadow p-3 flex flex-col">
        <div className="flex justify-between items-center mb-1"><span className="text-sm text-gray-600 truncate">{image.file_name} {image.width}x{image.height} {annotations.length}标注</span><div className="flex items-center gap-1"><button onClick={() => prev && navigate(`/projects/${projectId}/images/${prev.id}/annotate`)} disabled={!prev} className="px-2 py-1 text-xs bg-gray-100 rounded disabled:opacity-30">&#9664;</button><span className="text-xs text-gray-400 px-1">{idx + 1}/{imgList.length}</span><button onClick={() => next && navigate(`/projects/${projectId}/images/${next.id}/annotate`)} disabled={!next} className="px-2 py-1 text-xs bg-gray-100 rounded disabled:opacity-30">&#9654;</button></div></div>
        {msg && <div className="mb-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">{msg}</div>}
        <div className="annotation-stage-canvas flex-1 overflow-auto border border-gray-300 rounded bg-gray-200"><canvas ref={elRef} /></div>
      </div>
      <div className="annotation-panel w-52 bg-white rounded-lg shadow p-3 flex-shrink-0 overflow-auto text-sm flex flex-col gap-3">
        <h3 className="font-semibold text-sm">标注列表 ({annotations.length})</h3>
        {sel && sel.status === 'confirmed' && (<div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs"><div className="font-medium mb-1">选中</div><div className="flex items-center gap-1 mb-1"><span className="text-gray-500">标签:</span><select value={sel.label || ''} onChange={e => chLabel(sel.id, e.target.value)} className="border border-gray-200 rounded px-1 py-0.5 text-xs flex-1">{labels.map(l => <option key={l} value={l}>{l}</option>)}</select></div><button onClick={() => { annotationApi.delete(sel.id).catch(() => {}); setAnnotations(x => x.filter(a => a.id !== sel.id)); setSelAnnId(null); }} className="text-red-500 hover:text-red-700 text-xs mt-1">删除</button></div>)}
        {cand.length > 0 && (<div><div className="text-xs font-medium text-yellow-600 mb-1">待审核 ({cand.length})</div>{cand.map(a => (<div key={a.id} className="bg-yellow-50 border border-yellow-200 p-1.5 rounded mb-1 text-xs"><div className="flex justify-between"><span className="font-medium">{a.label}</span><span className="text-gray-400">{a.confidence ? Math.round(a.confidence * 100) + '%' : ''}</span></div>{a.geometry && (a.geometry as any).w && <div className="text-gray-400">{(a.geometry as any).w}x{(a.geometry as any).h}</div>}<div className="flex gap-1 mt-1"><button onClick={() => review(a.id, 'confirmed')} className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs hover:bg-green-600">确认</button><button onClick={() => review(a.id, 'rejected')} className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs hover:bg-red-600">拒绝</button></div></div>))}</div>)}
        <div className="flex-1 overflow-auto">{conf.map(a => <div key={a.id} onClick={() => setSelAnnId(a.id)} className={`p-1.5 rounded mb-1 text-xs cursor-pointer border ${selAnnId === a.id ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}><div className="flex justify-between"><span className="font-medium">{a.label || '?'}</span><span className="text-gray-400">{a.annotation_type}</span></div></div>)}</div>
        {annotations.length === 0 && <div className="text-gray-400 text-center py-8 text-xs">暂无标注</div>}
      </div>
    </div>
  );
}

function drawAll(canvas: fabric.Canvas, anns: Annotation[]) {
  canvas.getObjects().forEach((o: any) => { if (o._annId) canvas.remove(o); });
  anns.forEach((ann, idx) => {
    if (ann.annotation_type === 'image_label') { const t = new fabric.Text(`[${ann.label || '?'}]`, { left: 12, top: 12 + idx * 22, fontSize: 16, fontWeight: 'bold', fill: LBL[ann.label || ''] || '#666', selectable: false, excludeFromExport: true }); (t as any)._annId = ann.id; canvas.add(t); return; }
    if (!ann.geometry) return;
    const isC = ann.status === 'candidate', clr = isC ? '#f59e0b' : (LBL[ann.label || ''] || '#6b7280'), dash = isC ? [6, 4] as number[] : [];
    if (ann.annotation_type === 'bbox') {
      const { x, y, w, h } = ann.geometry, rect = new fabric.Rect({ left: 0, top: 0, width: w, height: h, fill: 'rgba(255,255,255,0.05)', stroke: clr, strokeWidth: 2, strokeDashArray: dash, selectable: false, evented: false });
      const kids: fabric.Object[] = [rect];
      if (ann.label) kids.push(new fabric.Text(ann.confidence ? `${ann.label} ${Math.round(ann.confidence * 100)}%` : ann.label, { left: 0, top: -16, fontSize: 11, fill: '#fff', backgroundColor: clr, selectable: false, evented: false }));
      const g = new fabric.Group(kids, { left: x, top: y, selectable: !isC, hasControls: !isC, hasBorders: !isC, subTargetCheck: true }); (g as any)._annId = ann.id; canvas.add(g);
    }
    if (ann.annotation_type === 'polygon' && ann.geometry.points) {
      const pts = ann.geometry.points.map((p: { x: number; y: number }) => new fabric.Point(p.x, p.y)); if (pts.length < 3) return;
      const poly = new fabric.Polygon(pts, { fill: `${clr}25`, stroke: clr, strokeWidth: 2, strokeDashArray: dash, selectable: !isC, hasControls: !isC, hasBorders: !isC }); (poly as any)._annId = ann.id; canvas.add(poly);
    }
  }); canvas.renderAll();
}
