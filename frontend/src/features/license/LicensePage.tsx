import { useEffect, useState } from 'react';
import { tenantApi } from '../../api/projects';
import type { Tenant, Usage } from '../../types';

export default function LicensePage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [license, setLicense] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      tenantApi.current(),
      tenantApi.usage(),
      tenantApi.license(),
    ]).then(([tRes, uRes, lRes]) => {
      setTenant(tRes.data);
      setUsage(uRes.data);
      setLicense(lRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center text-gray-500 py-12">加载中...</div>;

  const now = new Date();
  const licenseEnd = license?.license_end ? new Date(license.license_end) : null;
  const daysLeft = licenseEnd ? Math.ceil((licenseEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isExpired = license?.is_active === false;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">License 与用量</h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">License 状态</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">套餐</div>
              <div className="text-lg font-bold uppercase">{license?.plan || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">状态</div>
              <div className={`text-lg font-bold ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                {isExpired ? '已过期' : '有效'}
                {daysLeft != null && !isExpired && (
                  <span className="text-sm font-normal text-gray-500 ml-2">剩余 {daysLeft} 天</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">授权开始</div>
              <div className="text-sm">{license?.license_start ? new Date(license.license_start).toLocaleDateString() : '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">授权结束</div>
              <div className="text-sm">{license?.license_end ? new Date(license.license_end).toLocaleDateString() : '-'}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">租户信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">租户名称</div>
              <div className="text-lg font-bold">{tenant?.name || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">租户 ID</div>
              <div className="text-sm font-mono text-gray-600">{tenant?.id || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">允许模型导出</div>
              <div className={`text-lg ${tenant?.allow_model_export ? 'text-green-600' : 'text-red-500'}`}>
                {tenant?.allow_model_export ? '是' : '否'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">允许私有化部署</div>
              <div className={`text-lg ${tenant?.allow_private_deploy ? 'text-green-600' : 'text-red-500'}`}>
                {tenant?.allow_private_deploy ? '是' : '否'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-semibold text-lg mb-4">用量统计</h3>
        <div className="grid grid-cols-4 gap-6">
          {[
            { label: '项目', used: usage?.projects_used, max: usage?.projects_max, unit: '个' },
            { label: '图片', used: usage?.images_used, max: usage?.images_max, unit: '张' },
            { label: '本月训练', used: usage?.training_jobs_used, max: usage?.training_jobs_max, unit: '次' },
            { label: '存储', used: usage?.storage_used_gb, max: usage?.storage_max_gb, unit: 'GB' },
          ].map((item) => {
            const pct = item.max ? Math.min((item.used ?? 0) / item.max * 100, 100) : 0;
            return (
              <div key={item.label}>
                <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-2xl font-bold">{item.used ?? 0}</span>
                  <span className="text-sm text-gray-400">/ {item.max ?? '-'} {item.unit}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4">限制详情</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">限制项</th>
              <th className="px-4 py-2">当前值</th>
              <th className="px-4 py-2">限额</th>
              <th className="px-4 py-2">使用率</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['用户数', tenant?.max_users ? '-' : '-', tenant?.max_users ?? 5],
              ['项目数', usage?.projects_used ?? 0, tenant?.max_projects ?? 10],
              ['图片数', usage?.images_used ?? 0, tenant?.max_images ?? 100000],
              ['存储(GB)', usage?.storage_used_gb ?? 0, tenant?.max_storage_gb ?? 100],
              ['月训练次数', usage?.training_jobs_used ?? 0, tenant?.max_training_jobs_per_month ?? 100],
              ['月预标注次数', 0, tenant?.max_prelabel_jobs_per_month ?? 100],
            ].map(([label, used, max]) => (
              <tr key={label} className="border-t">
                <td className="px-4 py-2">{label}</td>
                <td className="px-4 py-2 font-mono">{used}</td>
                <td className="px-4 py-2 font-mono">{max}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min((Number(used) || 0) / (Number(max) || 1) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">
                      {((Number(used) || 0) / (Number(max) || 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
