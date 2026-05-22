import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, ShieldAlert, CheckCircle, ArrowRight, Phone, User, Calendar, CreditCard } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../components/FirebaseProvider';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function PendingApproval() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData: authUserData } = useAuth();

  const userData = location.state?.registeredInfo || (authUserData ? {
    name: authUserData.fullName,
    phone: authUserData.phone,
    group: authUserData.group || authUserData.groupId || '',
    memberCode: authUserData.memberCode || ''
  } : null);

  const handleLogoutAndRedirect = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Error signing out user:", err);
    }
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-sans relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-100/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white p-8 lg:p-12 rounded-[3.5rem] w-full max-w-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-white/60 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-amber-500 shadow-inner group transition-transform hover:rotate-12">
            <Clock size={48} className="animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase leading-none">
            {language === 'am' ? 'ምዝገባው ተጠናቅቋል' : 'Registration Submitted'}
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100/50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
            <ShieldAlert size={14} />
            {language === 'am' ? 'ማረጋገጫ እየጠበቀ ነው' : 'Pending Verification'}
          </div>
          <p className="text-slate-500 text-sm font-bold leading-relaxed max-w-md mx-auto">
            {language === 'am' 
              ? 'መለያዎ በተሳካ ሁኔታ ተፈጥሯል። አድሚኑ መረጃዎን አረጋግጦ ሲጨርስ መግባት ይችላሉ። እባክዎ ለጥቂት ጊዜ በትዕግስት ይጠብቁ።' 
              : 'Your account has been successfully created. You can log in once the admin verifies and approves your information. Please be patient while we process your request.'}
          </p>
        </div>

        {userData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
              <div className="flex items-center gap-3 mb-4 text-emerald-600">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <User size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{t('signup.personal')}</span>
              </div>
              <div className="space-y-3">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase">{t('full_name')}</span>
                    <span className="text-sm font-black text-slate-900">{userData.name}</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase">{t('phone')}</span>
                    <span className="text-sm font-black text-slate-900">{userData.phone}</span>
                 </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
              <div className="flex items-center gap-3 mb-4 text-indigo-600">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{t('signup.ekub_group')}</span>
              </div>
              <div className="space-y-3">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase">{language === 'am' ? 'ምድብ' : 'Group'}</span>
                    <span className="text-sm font-black text-slate-900">{userData.group}</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase">{language === 'am' ? 'መለያ ቁጥር' : 'Member ID'}</span>
                    <span className="text-sm font-black text-indigo-600 font-mono tracking-tighter">{userData.memberCode}</span>
                 </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-start gap-4">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                <CheckCircle size={20} />
             </div>
             <div>
                <p className="text-xs font-black text-emerald-800 uppercase tracking-tight mb-1">
                   {language === 'am' ? 'ቀጣይ እርምጃ' : 'What Next?'}
                </p>
                <p className="text-[11px] font-bold text-emerald-600 leading-relaxed">
                   {language === 'am' 
                     ? 'አድሚኑ መረጃዎን ሲያጸድቅ በኤስኤምኤስ (SMS) እናሳውቅዎታለን። ከዚያ በኋላ በመረጡት የይለፍ ቃል መግባት ይችላሉ።' 
                     : 'We will notify you via SMS once your account is approved. After that, you can log in using your password.'}
                </p>
             </div>
          </div>

          <button
            onClick={handleLogoutAndRedirect}
            className="w-full py-6 rounded-[2rem] bg-slate-900 text-white font-black text-[14px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-3"
          >
            {language === 'am' ? 'ተረድቻለሁ (ወደ መግቢያ)' : 'I Understand (Go to Login)'}
            <ArrowRight size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
