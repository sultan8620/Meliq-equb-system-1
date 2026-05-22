/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import PendingApproval from './pages/PendingApproval';
import { FirebaseProvider, useAuth } from './components/FirebaseProvider';
import { LanguageProvider } from './lib/LanguageContext';
import { auth, db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const MaintenanceGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'main'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().maintenanceMode) {
        setMaintenanceMode(true);
      } else {
        setMaintenanceMode(false);
      }
      setIsReady(true);
    }, (error) => {
      console.warn("MaintenanceGuard settings listener error:", error);
      setIsReady(true); // Still proceed but without maintenance mode knowledge
    });
    return () => unsub();
  }, []);

  if (!isReady || loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">በመጫን ላይ...</p>
    </div>
  );

  if (maintenanceMode && !isAdmin) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
        <div className="w-24 h-24 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-6">
           <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">የጥገና ጊዜ <br/><span className="text-amber-500">Maintenance</span></h1>
        <p className="text-slate-400 font-medium max-w-md text-sm leading-relaxed">
          ሲስተሙ በአሁኑ ሰዓት በማሻሻያ ላይ ይገኛል። ማሻሻያውን አጠናቀን በቅርቡ እንመለሳለን። (The system is temporarily offline for software updates. We'll be back shortly.)
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userData, loading, isAdmin } = useAuth();
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">በመጫን ላይ...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  
  if (!userData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">የአባል መረጃ በመጫን ላይ...</p>
      </div>
    );
  }
  
  if (!isAdmin && (userData.status === 'pending' || userData.status === 'rejected')) {
    return <Navigate to="/pending-approval" replace />;
  }
  
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userData, isAdmin, loading } = useAuth();
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">በመጫን ላይ...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" />;

  if (!userData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">የአድሚን መረጃ በመጫን ላይ...</p>
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <LanguageProvider>
      <FirebaseProvider>
        <BrowserRouter>
          <MaintenanceGuard>
            <ScrollToTop />
            <Layout>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/pending-approval" element={<PendingApproval />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          </MaintenanceGuard>
        </BrowserRouter>
      </FirebaseProvider>
    </LanguageProvider>
  );
}
