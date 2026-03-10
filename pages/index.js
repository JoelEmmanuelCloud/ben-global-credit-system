import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bge-green to-bge-light-green">
      <div className="text-white text-center">
        <h1 className="text-4xl font-bold mb-4">BGE Credit Management</h1>
        <p>Loading...</p>
      </div>
    </div>
  );
}