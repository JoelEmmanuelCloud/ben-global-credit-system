import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PortalRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/login'); }, [router]);
  return null;
}
