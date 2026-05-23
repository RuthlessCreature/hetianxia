import { useEffect, useState } from 'react';
import { notifApi } from '../api/admin';

export function createNotifications(tenantId: string) {
  // Placeholder for future server-side notification triggers
}

export function useNotifications() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await notifApi.list(true);
        setUnread(res.data.length);
      } catch {}
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return { unread };
}
