'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminAuthWrapperProps {
  children: React.ReactNode;
}

const AdminAuthWrapper: React.FC<AdminAuthWrapperProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar sessão do admin
    const adminSession = localStorage.getItem('adminSession');
    
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        
        // Sessão expira em 24 horas
        const sessionAge = now.getTime() - loginTime.getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        
        if (sessionAge < maxAge) {
          setIsAuthenticated(true);
        } else {
          // Sessão expirada
          localStorage.removeItem('adminSession');
          router.push('/admin');
        }
      } catch (error) {
        localStorage.removeItem('adminSession');
        router.push('/admin');
      }
    } else {
      router.push('/admin');
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

export default AdminAuthWrapper;
