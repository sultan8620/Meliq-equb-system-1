import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './FirebaseProvider';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { LogOut, Globe, Menu, X, LayoutDashboard, Settings } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, userData, isAdmin } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const { pathname } = useLocation();
  const isLanding = pathname === '/';

  const isPendingUser = user && !isAdmin && (userData?.status === 'pending' || userData?.status === 'rejected');

  if (isLanding) return <main>{children}</main>;

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-500/30">
      <nav className="fixed top-2 sm:top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-5xl px-2 sm:px-4 no-flicker">
        <div className="bg-white/80 backdrop-blur-2xl border border-slate-200/50 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.05)] rounded-[1.5rem] sm:rounded-[2rem] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/5 group-hover:-rotate-6 transition-all duration-300 border border-slate-100 overflow-hidden">
              <img src="/logo.png" className="w-full h-full object-contain p-0.5" alt="Logo" referrerPolicy="no-referrer" />
            </div>
            <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tighter uppercase italic">
              {t('common.appName').split(' ')[0]}
              <span className="text-emerald-500 not-italic hidden xs:inline">{t('common.appName').split(' ')[1] || ''}</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-6">
            <button 
              onClick={() => setLanguage(language === 'am' ? 'en' : 'am')}
              className="flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3 sm:py-2 rounded-xl hover:bg-slate-100 transition-colors text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 gap-2"
              title={language === 'am' ? 'Change Language' : 'ቋንቋ ቀይር'}
            >
              <Globe size={16} className="text-slate-400" />
              <span className="hidden sm:inline">{language === 'am' ? 'English' : 'አማርኛ'}</span>
              <span className="sm:hidden">{language === 'am' ? 'EN' : 'AM'}</span>
            </button>
            {!user ? (
              <div className="flex items-center gap-1 sm:gap-3">
                <Link to="/login" className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">{t('nav.login')}</Link>
                <Link to="/signup" className="bg-slate-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95">{t('nav.signup')}</Link>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-3">
                {isPendingUser ? (
                  <Link to="/pending-approval" className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-500 font-bold hover:text-amber-600 transition-colors">
                    {language === 'am' ? 'ይሁንታ ማረጋገጫ' : 'Pending Approval'}
                  </Link>
                ) : (
                  <Link to="/dashboard" className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-600 font-bold hover:text-emerald-700 transition-colors">{t('nav.dashboard')}</Link>
                )}
                {isAdmin && <Link to="/admin" className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors">{t('nav.admin')}</Link>}
                <button 
                  onClick={async () => { await signOut(auth); window.location.href = '/'; }} 
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 text-slate-400 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-100 shadow-sm shrink-0"
                >
                  <LogOut size={16} className="sm:hidden" />
                  <LogOut size={18} className="hidden sm:block" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-20 sm:pt-28 pb-10">{children}</main>
    </div>
  );
}
