'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MasterAuthWrapperProps {
  children: React.ReactNode;
}

const MasterAuthWrapper: React.FC<MasterAuthWrapperProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const masterSession = localStorage.getItem('masterSession');

    if (masterSession) {
      try {
        const session = JSON.parse(masterSession);
        const loginTime = new Date(session.loginTime);
        const now = new Date();

        const sessionAge = now.getTime() - loginTime.getTime();
        const maxAge = 24 * 60 * 60 * 1000;

        if (sessionAge < maxAge) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('masterSession');
          router.push('/admin/master');
        }
      } catch (error) {
        localStorage.removeItem('masterSession');
        router.push('/admin/master');
      }
    } else {
      router.push('/admin/master');
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};

export default MasterAuthWrapper;
