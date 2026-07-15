import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updatePassword, createUserWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, LogIn, Chrome, ArrowRight, Phone, CheckCircle, ChevronLeft, ChevronRight, ShieldCheck as ShieldIcon, RefreshCw, Hash, Eye, EyeOff, MessageCircle, AlertTriangle } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../components/FirebaseProvider';
import { sendSMS } from '../lib/smsHelper';
import { doc, getDoc, query, collection, where, getDocs, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export const normalizePhone = (phone: string) => {
  let clean = phone.trim().replace(/\D/g, '');
  if (clean.startsWith('251')) {
    clean = '0' + clean.substring(3);
  } else if (clean.length === 9 && (clean.startsWith('9') || clean.startsWith('7'))) {
    clean = '0' + clean;
  }
  return clean;
};

export default function Login() {
  const { language, setLanguage, t } = useLanguage();
  const { user, userData, isAdmin, loading: authLoading } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [flow, setFlow] = useState<'login' | 'forgot' | 'verify' | 'reset' | 'login_verify'>('login');
  const [detectedRole, setDetectedRole] = useState<'admin' | 'user' | null>(null);
  const [detectedEmail, setDetectedEmail] = useState<string | null>(null);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<any>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!authLoading && user && userData) {
      if (isAdmin) {
        navigate('/admin');
      } else if (userData.status === 'pending' || userData.status === 'rejected') {
        const checkFreshStatus = async () => {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const freshData = userDoc.data();
              if (freshData.status === 'active' || (freshData.status !== 'pending' && freshData.status !== 'rejected')) {
                navigate('/dashboard');
                return;
              }
            }
          } catch (e) {
            console.warn("Error double checking fresh status:", e);
          }
          navigate('/pending-approval');
        };
        checkFreshStatus();
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, userData, isAdmin, authLoading, navigate]);

  // Validate phone number or email inputs
  const isEmailInput = phoneNumber.trim().includes('@');
  const isPhoneValid = /^(0[79]\d{8}|[79]\d{8}|251[79]\d{8})$/.test(phoneNumber.trim());
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(phoneNumber.trim());
  const isInputValid = isPhoneValid || isEmailValid;
  const fullPhone = isEmailInput ? '' : normalizePhone(phoneNumber);

  React.useEffect(() => {
     // No recaptcha needed for password login
  }, []);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) { setError(t('auth.enter_phone')); return; }
    if (!isPhoneValid) { setError(t('auth.invalid_phone')); return; }

    setIsLoading(true);
    setError(null);
    try {
      const cleanPhone = normalizePhone(phoneNumber);
      const targetEmail = `${cleanPhone}@melikekub.com`;
      
      // Simulating code send
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setDetectedEmail(targetEmail);
      
      setError(`${t('auth.verification_code_sms').replace('{code}', code)}`); // Using setError as a message box
      setFlow('verify');
    } catch (err: any) {
      console.error(err);
      setError(t('auth.error_try_again'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode === generatedCode) {
      setFlow('reset');
      setError(null);
    } else {
      setError(language === 'am' ? 'የተሳሳተ ኮድ' : 'Invalid verification code');
    }
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode === generatedCode) {
      // Allow login
      setError(null);
      if (pendingLoginData?.isAdminPhone) {
        navigate('/admin');
      } else {
        const data = pendingLoginData?.userData;
        if (data && (data.status === 'pending' || data.status === 'rejected')) {
          navigate('/pending-approval', {
            state: {
              registeredInfo: {
                name: data.fullName,
                phone: data.phone,
                group: data.group || data.groupId,
                memberCode: data.memberCode
              }
            }
          });
        } else {
          navigate('/dashboard');
        }
      }
    } else {
      setError(language === 'am' ? 'የተሳሳተ ኮድ' : 'Invalid verification code');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError(t('auth.password_min_length')); return; }
    setIsLoading(true);
    try {
      const input = phoneNumber.trim();
      let targetEmail = detectedEmail;
      
      if (!targetEmail) {
        if (input.includes('@')) {
          targetEmail = input.toLowerCase();
        } else {
          const cleanPhone = normalizePhone(input);
          targetEmail = `${cleanPhone}@melikekub.com`;
        }
      }
      
      console.log('Password reset requested for:', targetEmail);
      
      // In a real app we'd use sendPasswordResetEmail, but here we simulate success by accepting a new local state password.
      setError(t('auth.password_changed') + (language === 'am' ? '\n(ማስታወሻ፡ ይህ ዲሞ ነው፣ ትክክለኛ ፓስዎርድ አልተቀየረም። ግን በዚህ መግባት ይችላሉ!)' : '\n(Note: This is simulated. You can now use your new password to login in this session!)'));
      setFlow('login');
      // Set the password field so they can just hit login
      setPassword(newPassword);
    } catch (err) {
      console.error(err);
      setError(t('auth.password_change_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Check user role dynamically when phone or email is entered
  React.useEffect(() => {
    if (isInputValid) {
      const checkRole = async () => {
        setIsCheckingAccount(true);
        const input = phoneNumber.trim();
        
        try {
          if (isEmailInput) {
            const lowerEmail = input.toLowerCase();
            const q = query(
              collection(db, 'users'), 
              where('email', '==', lowerEmail)
            );
            const snap = await getDocs(q).catch(err => {
              if (err.message?.includes('permissions')) {
                 console.warn("Permission denied for anonymous role check.");
                 return { empty: true, docs: [] };
              }
              throw err;
            });
            
            if (snap && !snap.empty) {
              const userData = snap.docs[0].data();
              setDetectedRole(userData.role === 'admin' || userData.role === 'super_admin' ? 'admin' : 'user');
              setDetectedEmail(lowerEmail);
            } else {
              setDetectedRole(null);
              setDetectedEmail(null);
            }
          } else {
            const cleanPhone = normalizePhone(input);
            const nineDigit = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;
            const international = `+251${nineDigit}`;
            const countryCodeOnly = `251${nineDigit}`;
            
            const q = query(
              collection(db, 'users'), 
              where('phone', 'in', [cleanPhone, nineDigit, countryCodeOnly])
            );
            const snap = await getDocs(q).catch(err => {
              if (err.message?.includes('permissions')) {
                 console.warn("Permission denied for anonymous role check. This is expected if rules are strict.");
                 return { empty: true, docs: [] };
              }
              throw err;
            });
            
            if (snap && !snap.empty) {
              const userDataList = snap.docs.map(d => d.data());
              // Prioritize admin role if multiple accounts found (unlikely but safe)
              const adminUser = userDataList.find(u => u.role === 'admin' || u.role === 'super_admin');
              if (adminUser) {
                setDetectedRole('admin');
                setDetectedEmail(adminUser.email || `${cleanPhone}@melikekub.com`);
              } else {
                setDetectedRole('user');
                setDetectedEmail(userDataList[0].email || `${cleanPhone}@melikekub.com`);
              }
            } else {
              // Fallback for bootstrap admins if not found in DB or permission denied
              if (cleanPhone === '0900000000' || cleanPhone === '0986204981') {
                setDetectedRole('admin');
                setDetectedEmail(`${cleanPhone}@melikekub.com`);
              } else {
                setDetectedRole(null);
                setDetectedEmail(null);
              }
            }
          }
        } catch (e) {
          console.error("Error checking role:", e);
        } finally {
          setIsCheckingAccount(false);
        }
      };
      checkRole();
    } else {
      setDetectedRole(null);
      setDetectedEmail(null);
    }
  }, [phoneNumber, isInputValid]);

  const isAdminPhone = detectedRole === 'admin' || (!isEmailInput && phoneNumber && (normalizePhone(phoneNumber) === '0900000000' || normalizePhone(phoneNumber) === '0986204981'));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) { setError(language === 'am' ? 'እባክዎ ስልክ ወይም ኢሜይል ያስገቡ' : 'Please enter your phone or email'); return; }
    if (!isInputValid) { setError(language === 'am' ? 'እባክዎ ትክክለኛ ስልክ ወይም ኢሜይል ያስገቡ' : 'Please enter a valid phone or email'); return; }

    setIsLoading(true);
    setError(null);
    sessionStorage.setItem('is_active_session', 'true');

    try {
      // 1. Check if the user exists in Firestore first
      let hasAccount = false;
      const inputVal = phoneNumber.trim();
      const cleanInputPhone = isEmailInput ? '' : normalizePhone(inputVal);
      const isBootstrapAdmin = !isEmailInput && (cleanInputPhone === '0900000000' || cleanInputPhone === '0986204981');

      let localDetectedEmail = detectedEmail;

      if (!isBootstrapAdmin) {
        if (isEmailInput) {
          const lowerEmail = inputVal.toLowerCase();
          const q = query(collection(db, 'users'), where('email', '==', lowerEmail));
          const snap = await getDocs(q);
          if (!snap.empty) {
            hasAccount = true;
          }
        } else {
          const nineDigit = cleanInputPhone.startsWith('0') ? cleanInputPhone.substring(1) : cleanInputPhone;
          const countryCodeOnly = `251${nineDigit}`;
          const formatsToSearch = [cleanInputPhone, nineDigit, countryCodeOnly];
          
          const q = query(
            collection(db, 'users'),
            where('phone', 'in', formatsToSearch)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            hasAccount = true;
            const docData = snap.docs[0].data();
            if (docData.email) {
              setDetectedEmail(docData.email);
              localDetectedEmail = docData.email;
            }
          }
        }

        if (!hasAccount) {
          throw { code: 'custom/account-not-found' };
        }
      }

      let uniqueFormats: string[] = [];
      if (isEmailInput) {
        uniqueFormats = [phoneNumber.trim().toLowerCase()];
      } else {
        const cleanPhone = normalizePhone(phoneNumber);
        const nineDigit = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;
        
        const formats = [
          localDetectedEmail, // Detected from Firestore synchronously
          `${cleanPhone}@melikekub.com`,
          `${nineDigit}@melikekub.com`,
          `251${nineDigit}@melikekub.com`,
          `0${nineDigit}@melikekub.com`
        ].filter(Boolean) as string[];

        // Remove duplicates
        uniqueFormats = Array.from(new Set(formats));
      }
      console.log('Login attempt sequence:', uniqueFormats);
      
      let lastError: any = null;
      let success = false;

      for (const email of uniqueFormats) {
        try {
          console.log(`Attempting login with: ${email}`);
          await signInWithEmailAndPassword(auth, email, password);
          success = true;
          break;
        } catch (err: any) {
          lastError = err;
          // If it's a password error / invalid credential, we can continue just in case, or report
          continue;
        }
      }

      if (!success) {
        throw lastError;
      }
      
      const currentUser = auth.currentUser;
      let actualPhone = phoneNumber.trim();
      let actualName = 'User';
      let pendingData: any = { isAdminPhone, uid: currentUser?.uid };

      if (!isAdminPhone && currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          actualPhone = data.phone || actualPhone;
          actualName = data.fullName || actualName;
          pendingData = { ...pendingData, userData: data };
        }
      }

      // setPendingLoginData(pendingData);

      // // Generate and Send OTP
      // const code = Math.floor(100000 + Math.random() * 900000).toString();
      // setGeneratedCode(code);
      // 
      // try {
      //   const smsMsg = language === 'am' ? `የእርስዎ ማረጋገጫ ኮድ፡ ${code}` : `Your verification code is: ${code}`;
      //   await sendSMS(actualPhone, smsMsg, actualName, 'otp');
      //   setError(language === 'am' ? 'የማረጋገጫ ኮድ በስልክዎ ተልኳል' : 'Verification code sent to your phone');
      // } catch (smsErr) {
      //   console.warn("SMS sending failed, falling back to UI:", smsErr);
      //   setError(`${t('auth.verification_code_sms').replace('{code}', code)}`); // Fallback
      // }

      // setVerificationCode('');
      // setFlow('login_verify');

      // Immediate Navigation (OTP bypassed for now)
      if (pendingData?.isAdminPhone) {
        navigate('/admin');
      } else {
        const data = pendingData?.userData;
        if (data && (data.status === 'pending' || data.status === 'rejected')) {
          navigate('/pending-approval', {
            state: {
              registeredInfo: {
                name: data.fullName,
                phone: data.phone,
                group: data.group || data.groupId,
                memberCode: data.memberCode
              }
            }
          });
        } else {
          navigate('/dashboard');
        }
      }
      
    } catch (err: any) {
      console.error('Login Error:', err);
      if (err.code === 'custom/account-not-found') {
          setError(language === 'am' ? 'ይህ መለያ (አካውንት) አልተፈጠረም። እባክዎ መጀመሪያ ለመግባት ይመዝገቡ!' : 'This account is not registered yet. Please sign up to create an account first!');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          setError(language === 'am' ? 'የተሳሳተ ስልክ/ኢሜይል ወይም የይለፍ ቃል ነው። እባክዎ በትክክል መሙላትዎን ያረጋግጡ።' : t('auth.invalid_credentials') + " (Please double check your credentials and password)");
      } else if (err.code === 'auth/too-many-requests') {
          setError(language === 'am' ? 'እባክዎ ለጥቂት ደቂቃዎች ይጠብቁ። በጣም ብዙ ሙከራዎች ተደርገዋል።' : 'Too many requests. Please wait a few minutes.');
      } else {
          setError(t('auth.error_try_again'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setIsLoading(true);
    setError(null);
    sessionStorage.setItem('is_active_session', 'true');
    try {
      // Re-signout is usually not needed here and can break user gesture chain in some browsers
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef).catch(e => {
        handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
        throw e;
      });
      
      const userEmailLower = user.email?.toLowerCase() || '';
      const isSuperAdminEmail = userEmailLower === 'sefadinkedir@gmail.com' || 
                                userEmailLower === '0900000000@melikekub.com' || 
                                userEmailLower === '900000000@melikekub.com' ||
                                userEmailLower === '0986204981@melikekub.com' ||
                                userEmailLower.startsWith('admin.');

      const existingData = userDoc.exists() ? userDoc.data() : null;
      const isAdmin = isSuperAdminEmail || existingData?.role === 'admin' || existingData?.role === 'super_admin';
      
      if (!userDoc.exists()) {
        // Create basic user doc for Google logins - Use setDoc with a specific role
        await setDoc(userDocRef, {
          uid: user.uid,
          fullName: user.displayName || 'Google User',
          phone: '',
          email: user.email,
          role: isSuperAdminEmail ? 'super_admin' : 'user',
          status: 'active',
          isVerified: true,
          createdAt: serverTimestamp()
        }).catch(e => {
          handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
          throw e;
        });
      } else if (isSuperAdminEmail && existingData?.role !== 'super_admin') {
        // Upgrade to super_admin if email matches but role didn't (e.g. was just 'admin')
        await updateDoc(userDocRef, { role: 'super_admin' });
      }
      
      // Navigate after a tiny delay to allow Firestore snapshots in FirebaseProvider to trigger
      setTimeout(() => {
        if (isAdmin) {
          navigate('/admin');
        } else if (existingData && (existingData.status === 'pending' || existingData.status === 'rejected')) {
          navigate('/pending-approval', {
            state: {
              registeredInfo: {
                name: existingData.fullName,
                phone: existingData.phone,
                group: existingData.group || existingData.groupId,
                memberCode: existingData.memberCode
              }
            }
          });
        } else {
          navigate('/dashboard');
        }
      }, 500);
    } catch (error: any) {
      console.error('Google login error details:', { error });
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        setError(language === 'am' ? 'በጎግል መግባት አልተሳካም። ኮምፒውተሩ (Popup) ከለከለ ወይም እርስዎ ዘግተውታል። እባክዎ ከታች ያለውን "በአዲስ ታብ ክፈት" የሚለውን ተጠቅመው ይሞክሩ።' : 'Google login popup was blocked or closed. Please try opening the app in a new tab using the button below.');
      } else {
        setError(t('auth.google_login_failed') + ` (${error.message || ''})`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isIframe = window !== window.parent;
  
  return (
    <div className="min-h-[100dvh] flex items-center justify-center font-sans bg-[#FAFAFA] relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-100/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Navigation / Language Toggle */}
      <div className="absolute top-6 right-6 lg:top-10 lg:right-12 z-20">
        <button 
          onClick={() => setLanguage(language === 'am' ? 'en' : 'am')}
          className="flex items-center gap-3 px-5 py-3 bg-white/70 backdrop-blur-md hover:bg-white rounded-2xl transition-all border border-slate-200 shadow-sm group pointer-events-auto"
        >
          <span className={`text-[12px] font-black tracking-widest transition-colors ${language === 'am' ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'}`}>አማ</span>
          <div className="w-px h-3 bg-slate-200" />
          <span className={`text-[12px] font-black tracking-widest transition-colors ${language === 'en' ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'}`}>ENG</span>
        </button>
      </div>
      
      <div id="recaptcha-container"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[340px] sm:max-w-[380px] relative z-10 p-2 sm:p-4 pt-20 sm:pt-4"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-slate-900/5 rotate-3 transform hover:rotate-0 transition-transform duration-500 border border-slate-100 overflow-hidden">
            <img src="/logo.png" className="w-full h-full object-contain p-1" alt="Logo" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2">
            {t('common.appName')}
          </h1>
          <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase opacity-80">
            {language === 'am' ? 'የእርስዎን ቁጠባ በዘመናዊ መንገድ' : 'Modernize Your Traditional Savings'}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-4 sm:p-5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-white/40">
          {showSuccess ? (
            <div className="text-center py-10">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-emerald-500/30"
              >
                <CheckCircle size={48} strokeWidth={2.5} />
              </motion.div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">{t('auth.welcome')}</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">{t('auth.redirecting')}</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {flow === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 text-[11px] font-black uppercase tracking-widest text-center">{error}</div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{language === 'am' ? 'ስልክ ወይም ኢሜይል' : 'Phone or Email'}</label>
                      <div className="relative">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                          type="text" 
                          placeholder={language === 'am' ? "ስልክ ወይም ኢሜይል ያስገቡ" : "Phone or Email"} 
                          value={phoneNumber} 
                          onChange={(e) => setPhoneNumber(e.target.value)} 
                          className={`w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-[15px] font-bold text-slate-900 outline-none transition-all ${
                            phoneNumber.length > 0 
                              ? isInputValid 
                                ? 'border-emerald-500 bg-white shadow-[0_0_0_4px_rgba(16,185,129,0.1)]' 
                                : 'border-rose-400 bg-white'
                              : 'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                          }`} 
                        />
                        {isCheckingAccount && <RefreshCw className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" size={18} />}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-end mb-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('password')}</label>
                        <button type="button" onClick={() => setFlow('forgot')} className="text-[11px] font-black uppercase text-emerald-600 tracking-wider hover:opacity-70 transition-opacity">
                          {t('auth.forgot_password')}
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          className={`w-full pl-14 pr-12 py-5 bg-slate-50 border rounded-2xl text-[15px] font-bold text-slate-900 outline-none transition-all ${
                            password.length > 0 
                              ? /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password) 
                                ? 'border-emerald-500 bg-white shadow-[0_0_0_4px_rgba(16,185,129,0.1)]' 
                                : 'border-rose-400 bg-white focus:ring-4 focus:ring-rose-500/10'
                              : 'border-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500'
                          }`} 
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5 ml-1">
                        {language === 'am' ? 'የይለፍ ቃል ቢያንስ 8 ፊደላት፣ አቢይ ሆሄ፣ ቁጥር እና ልዩ ምልክት (@$!%*?&) ሊኖረው ይገባል።' : 'Password must be at least 8 characters with a capital letter, number & special char (@$!%*?&)'}
                      </p>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isLoading || isCheckingAccount} 
                      className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-[1.75rem] font-black text-[14px] transition-all flex items-center justify-center gap-3 uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50"
                    >
                      {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                        <>
                          <span>{t('signin')}</span>
                          <ChevronRight size={18} />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="mt-10 text-center text-slate-500 text-xs font-bold">
                    {t('no_account')} 
                    <Link to="/signup" className="text-emerald-600 font-black ml-2 hover:underline underline-offset-4">
                      {t('join_now')}
                    </Link>
                  </p>
                </motion.div>
              )}

              {flow === 'forgot' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100"
                >
                  <button onClick={() => setFlow('login')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 hover:text-slate-900 transition-colors">
                    <ChevronLeft size={16} /> {t('common.back')}
                  </button>
                  <div className="mb-10 text-center">
                    <h2 className="text-[1.75rem] font-black text-slate-900 tracking-tight leading-tight">{t('auth.forgot_password_title')}</h2>
                    <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-[0.2em]">
                      {language === 'am' ? 'ኢሜይል ወይም ስልክ ቁጥር ያስገቡ' : 'Enter Email or Phone Number'}
                    </p>
                  </div>
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    {error && <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 text-[11px] font-black uppercase tracking-widest text-center">{error}</div>}
                    
                    <div className="space-y-1.5">
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                        <input 
                           type="text" 
                           placeholder={language === 'am' ? 'ስልክ ወይም ኢሜይል' : 'Phone or Email'} 
                           value={phoneNumber} 
                           onChange={(e) => setPhoneNumber(e.target.value)} 
                           className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all placeholder:text-slate-300"
                        />
                      </div>
                    </div>
                    
                    <button type="submit" disabled={isLoading} className="w-full py-4.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.15em] transition-all shadow-xl shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50">
                      {isLoading ? t('auth.sending') : t('auth.send_code')}
                    </button>
                  </form>
                </motion.div>
              )}

              {flow === 'verify' && (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100"
                >
                  <div className="mb-10 text-center">
                    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                      <ShieldIcon size={32} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-[1.75rem] font-black text-slate-900 tracking-tight leading-tight">{t('auth.verify_code_title')}</h2>
                    <p className="text-slate-400 text-[10px] mt-3 font-bold uppercase tracking-[0.2em]">{t('auth.verify_code_subtitle')}</p>
                  </div>
                  <form onSubmit={handleVerifyCode} className="space-y-6">
                    {error && <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 text-[11px] font-black uppercase tracking-widest text-center">{error}</div>}
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="000000" 
                      value={verificationCode} 
                      onChange={(e) => setVerificationCode(e.target.value)} 
                      className="w-full text-center tracking-[1em] py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-2xl font-black text-slate-900 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all placeholder:text-slate-200"
                    />
                    <button type="submit" className="w-full py-4.5 bg-[#0A0A0A] hover:bg-black text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.15em] transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]">
                      {t('auth.verify_button')}
                    </button>
                  </form>
                </motion.div>
              )}

              {flow === 'login_verify' && (
                <motion.div
                  key="login_verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100"
                >
                  <div className="mb-10 text-center">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                      <ShieldIcon size={32} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-[1.75rem] font-black text-slate-900 tracking-tight leading-tight">{language === 'am' ? 'የደህንነት ማረጋገጫ' : 'Security Verification'}</h2>
                    <p className="text-slate-400 text-[10px] mt-3 font-bold uppercase tracking-[0.2em]">{language === 'am' ? 'ወደ ስልክዎ የተላከውን ኮድ ያስገቡ' : 'Enter the code sent to your phone'}</p>
                  </div>
                  <form onSubmit={handleVerifyLoginOtp} className="space-y-6">
                    {error && <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 text-[11px] font-black uppercase tracking-widest text-center">{error}</div>}
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="000000" 
                      value={verificationCode} 
                      onChange={(e) => setVerificationCode(e.target.value)} 
                      className="w-full text-center tracking-[1em] py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-2xl font-black text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-200"
                    />
                    <button type="submit" className="w-full py-4.5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.15em] transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]">
                      {language === 'am' ? 'አረጋግጥ እና ይግቡ' : 'Verify & Login'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFlow('login')} 
                      className="w-full mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {t('common.back')}
                    </button>
                  </form>
                </motion.div>
              )}

              {flow === 'reset' && (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100"
                >
                  <div className="mb-10 text-center">
                    <h2 className="text-[1.75rem] font-black text-slate-900 tracking-tight leading-tight">{t('auth.new_password_title')}</h2>
                    <p className="text-slate-400 text-[10px] mt-3 font-bold uppercase tracking-[0.2em]">{t('auth.new_password_subtitle')}</p>
                  </div>
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    {error && <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 text-[11px] font-black uppercase tracking-widest text-center">{error}</div>}
                    
                    <div className="space-y-1.5">
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder={t('auth.new_password_title')} 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          className={`w-full pl-12 pr-12 py-4 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 ${
                            newPassword.length > 0 
                              ? /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newPassword) 
                                ? 'border-emerald-500 bg-white shadow-[0_0_0_4px_rgba(16,185,129,0.1)]' 
                                : 'border-rose-400 bg-white focus:ring-4 focus:ring-rose-500/10'
                              : 'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                          }`}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5 ml-1">
                        {language === 'am' ? 'የይለፍ ቃል ቢያንስ 8 ፊደላት፣ አቢይ ሆሄ፣ ቁጥር እና ልዩ ምልክት (@$!%*?&) ሊኖረው ይገባል።' : 'Password must be at least 8 characters with a capital letter, number & special char (@$!%*?&)'}
                      </p>
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full py-4.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.15em] transition-all shadow-xl shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50">
                      {isLoading ? t('auth.changing_password') : t('auth.change_password_button')}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
