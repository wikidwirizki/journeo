import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';

export default function Login() {
  const { user, login } = useAuth();
  const [searchParams] = useSearchParams();

  if (user) {
    const returnTo = searchParams.get('returnTo') || '/';
    return <Navigate to={returnTo} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1EE] p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#288C78]/10 rounded-full blur-3xl mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-[#0C2B4E]/10 rounded-full blur-3xl mix-blend-multiply" />

      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#0C2B4E]/5 w-full max-w-sm flex flex-col items-center relative z-10">
        
        {/* Logo Replacement -> Journeo Gradient J */}
        <div className="w-20 h-20 rounded-[28px] shrink-0 overflow-hidden mb-6 flex items-center justify-center p-[2px] shadow-sm">
          <div className="w-full h-full rounded-[26px] overflow-hidden" style={{ background: 'linear-gradient(135deg, #16b797 0%, #0C2B4E 100%)' }}>
            <div className="w-full h-full flex items-center justify-center p-3 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
                 <path d="M70,10 C70,10 70,60 70,65 C70,75 60,85 50,85 C40,85 30,75 30,65 C30,60 40,60 40,65 C40,70 45,75 50,75 C55,75 60,70 60,65 C60,50 60,10 60,10 L70,10 Z M30,30 C25,30 35,40 40,35 C40,30 35,25 30,30 Z M80,20 C85,15 90,20 85,25 Z M75,15 C80,20 85,15 80,10 Z"/>
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-serif font-bold text-[#0C2B4E] tracking-tight mb-2">Journeo</h1>
        <p className="text-sm text-[#288C78] font-medium tracking-wide mb-8">All your journeys, in one place</p>
        
        <button 
          onClick={login}
          className="w-full bg-[#0C2B4E] hover:bg-[#1a416e] text-white py-4 rounded-xl flex items-center justify-center gap-3 transition-colors font-bold tracking-wide"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
