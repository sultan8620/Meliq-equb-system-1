/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import { AlertTriangle } from 'lucide-react';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const SavedPathRestorer = () => {
  const navigate = useNavigate();
  useEffect(() => {
    try {
      const savedPath = localStorage.getItem('spa_redirect_path');
      if (savedPath) {
        localStorage.removeItem('spa_redirect_path');
        console.log("Restoring saved SPA redirect path:", savedPath);
        navigate(savedPath, { replace: true });
      }
    } catch (e) {
      console.warn("Could not restore saved path:", e);
    }
  }, [navigate]);
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
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
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
  const [showTimeoutError, setShowTimeoutError] = React.useState(false);

  React.useEffect(() => {
    let timer: any;
    if (user && !userData && !loading) {
      // If authenticated but no document has loaded, wait 5 seconds then show error card
      timer = setTimeout(() => {
        setShowTimeoutError(true);
      }, 5000);
    } else {
      setShowTimeoutError(false);
    }
    return () => clearTimeout(timer);
  }, [user, userData, loading]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">በመጫን ላይ...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  
  if (!userData) {
    if (showTimeoutError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100 transition-all duration-300">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-4 animate-bounce">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2 font-sans">የአባል መለያ አልተገኘም</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              ይህ መለያ በሲስተሙ ውስጥ አልተመዘገበም። እባክዎ መጀመሪያ በትክክል ይመዝገቡ! (This account is not registered. Please sign up to create an account first!)
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  const { signOut } = await import('firebase/auth');
                  const { auth } = await import('./firebase');
                  await signOut(auth);
                  window.location.href = '/signup';
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-600/10 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                ወደ ምዝገባ ሒድ (Go to Registration)
              </button>
              <button
                onClick={async () => {
                  const { signOut } = await import('firebase/auth');
                  const { auth } = await import('./firebase');
                  await signOut(auth);
                  window.location.href = '/login';
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase text-xs tracking-widest py-3 px-4 rounded-xl transition-all cursor-pointer"
              >
                ውጣ (Logout)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
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
  const [showTimeoutError, setShowTimeoutError] = React.useState(false);

  React.useEffect(() => {
    let timer: any;
    if (user && !userData && !loading) {
      timer = setTimeout(() => {
        setShowTimeoutError(true);
      }, 5000);
    } else {
      setShowTimeoutError(false);
    }
    return () => clearTimeout(timer);
  }, [user, userData, loading]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">በመጫን ላይ...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" />;

  if (!userData) {
    if (showTimeoutError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100 transition-all duration-300">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-4 animate-bounce">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2 font-sans">የአድሚን መለያ አልተገኘም</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              ይህ መለያ የአድሚን መብት የለውም ወይም በሲስተሙ ውስጥ አልተመዘገበም። (This admin account profile was not found or has no admin permissions.)
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  const { signOut } = await import('firebase/auth');
                  const { auth } = await import('./firebase');
                  await signOut(auth);
                  window.location.href = '/login';
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs tracking-widest py-3 px-4 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                ውጣና በሌላ ግባ (Logout & Switch)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">የአድሚን መረጃ በመጫን ላይ...</p>
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/login" />;
  return <>{children}</>;
};

import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <LanguageProvider>
      <Toaster position="top-right" />
      <FirebaseProvider>
        <BrowserRouter>
          <MaintenanceGuard>
            <ScrollToTop />
            <SavedPathRestorer />
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
