import { useEffect } from 'react';
import { useRouter } from 'next/router';

// /portal now redirects to the unified login page
export default function PortalRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/login'); }, [router]);
  return null;
}
