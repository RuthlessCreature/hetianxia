import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../api/auth';
import type { LoginData } from '../../types';

export default function LoginPage() {
  const [form, setForm] = useState<LoginData>({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', tenant: '' });
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await authApi.login(form);
      const { access_token, user_id, tenant_id, email, name, role } = res.data;
      setAuth({ id: user_id, tenant_id, email, name, role, status: 'active' }, access_token);
      navigate('/dashboard');
    } catch (err: any) { setError('邮箱或密码错误'); } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await authApi.register({ email: regForm.email, password: regForm.password, name: regForm.name, tenant_name: regForm.tenant });
      const { access_token, user_id, tenant_id, email, name, role } = res.data;
      setAuth({ id: user_id, tenant_id, email, name, role, status: 'active' }, access_token);
      navigate('/dashboard');
    } catch (err: any) { setError(err.response?.data?.detail || '注册失败'); } finally { setLoading(false); }
  };

  const features = [
    { number: '01', label: '上传图片', desc: '拖入或批量导入，自动去重校验' },
    { number: '02', label: '自动标注', desc: 'YOLO + OpenCV 混合引擎，秒出候选框' },
    { number: '03', label: '一键训练', desc: '选数据集，点开始，模型直接可用' },
    { number: '04', label: '部署上线', desc: '导出 ONNX，接上产线就能跑' },
  ];

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left: Product Intro */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 text-white flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-zinc-800 to-transparent rounded-full translate-x-32 -translate-y-32 opacity-30" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-zinc-800 to-transparent rounded-full -translate-x-16 translate-y-16 opacity-20" />

        <div className="relative z-10">
          <div className="text-zinc-500 text-xs tracking-[0.3em] uppercase mb-8">高纳AI · 工业视觉平台</div>
          <h1 className="text-5xl font-light leading-tight mb-6 tracking-tight">
            把产线质检<br />
            <span className="font-normal">变成一件简单的事</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-md font-light">
            不需要算法工程师，不需要GPU集群。<br />
            从第一张图片到第一个可部署的检测模型，<br />
            你只需要点几次按钮。
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          {features.map((f) => (
            <div key={f.number} className="flex items-start gap-4 group">
              <span className="text-zinc-600 text-sm font-mono mt-0.5 group-hover:text-zinc-400 transition-colors">{f.number}</span>
              <div>
                <div className="text-sm font-medium text-zinc-300">{f.label}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 text-xs text-zinc-600">
          面向工业 AOI / 外观检测场景
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <h2 className="text-2xl font-light tracking-tight text-zinc-900">
              {mode === 'login' ? '登录' : '创建账号'}
            </h2>
            <p className="text-sm text-zinc-500 mt-2">
              {mode === 'login' ? '欢迎回来' : '30秒完成注册，开始使用'}
            </p>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              {error && <div className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">邮箱</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all" placeholder="name@company.com" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">密码</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all" placeholder="••••••••" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-zinc-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-60">
                {loading ? '...' : '登录'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {error && <div className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">姓名</label>
                <input type="text" value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">公司/团队</label>
                <input type="text" value={regForm.tenant} onChange={(e) => setRegForm({ ...regForm, tenant: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" placeholder="可选" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">邮箱</label>
                <input type="email" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">密码</label>
                <input type="password" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-zinc-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-60">
                {loading ? '...' : '注册'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              {mode === 'login' ? '没有账号？注册' : '已有账号？登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
