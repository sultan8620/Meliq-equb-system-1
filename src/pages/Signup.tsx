import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Lock, MapPin, Phone, Calendar, DollarSign, FileText, CheckCircle, Upload, Key, ChevronRight, ChevronLeft, Hash, Camera, CreditCard, Scan, X, RefreshCw, Eye, EyeOff, ShieldIcon, Users, Chrome, Image as ImageIcon, Zap, ArrowRight, Clock, UserCheck } from 'lucide-react';
import { auth, db } from '../firebase';
import { useLanguage } from '../lib/LanguageContext';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, increment, addDoc, orderBy, serverTimestamp, onSnapshot, deleteDoc } from 'firebase/firestore';
import ethiopianDate from 'ethiopian-date';

const calculateDuration = (memberLimit: number, frequency: string, language: string) => {
  let multiplier = 1;
  if (frequency === 'fivedays') multiplier = 5;
  if (frequency === 'tendays' || frequency === 'daily') multiplier = 10;
  if (frequency === 'weekly') multiplier = 7;
  if (frequency === 'monthly') multiplier = 30;

  const totalDays = memberLimit * multiplier;
  const years = Math.floor(totalDays / 365);
  const remainingDaysAfterYears = totalDays % 365;
  const months = Math.floor(remainingDaysAfterYears / 30);
  const days = remainingDaysAfterYears % 30;

  let resultEn = [];
  let resultAm = [];

  if (years > 0) {
    resultEn.push(`${years} year${years > 1 ? 's' : ''}`);
    resultAm.push(`${years} ዓመት`);
  }
  if (months > 0) {
    resultEn.push(`${months} month${months > 1 ? 's' : ''}`);
    resultAm.push(`${months} ወር`);
  }
  if (days > 0) {
    resultEn.push(`${days} day${days > 1 ? 's' : ''}`);
    resultAm.push(`${days} ቀን`);
  }

  if (resultEn.length === 0) return language === 'am' ? '0 ቀን' : '0 days';

  return language === 'am' ? resultAm.join(' ') : resultEn.join(' ');
}

const REGIONS = [
  'አዲስ አበባ', 'አፋር', 'አማራ', 'ቤንሻንጉል ጉሙዝ', 'ድሬዳዋ', 'ጋምቤላ', 'ሐረሪ', 'ኦሮሚያ', 'ሲዳማ', 'ደቡብ ኢትዮጵያ', 'ማዕከላዊ ኢትዮጵያ', 'ደቡብ ምዕራብ ኢትዮጵያ', 'ትግራይ'
];

const MONTHS_ETH = [
  'መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
];

const MONTHS_GC = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
];

const InputField = ({ icon: Icon, ...props }: any) => (
  <div className="space-y-2">
    {props.placeholder && (
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{props.placeholder}</label>
    )}
    <div className="group relative">
      <Icon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
      <input 
        {...props} 
        className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-[15px] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" 
      />
    </div>
  </div>
);

const DAILY_AMOUNTS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
const OTHER_AMOUNTS = [1000, 2000, 3000, 5000, 10000, 15000, 20000];
const MEMBER_LIMITS = [10, 15, 20, 25, 30, 35, 40, 45, 50];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

const TERMS_AND_CONDITIONS = `
የእቁብ ህግ እና ደንቦች፡
1. አባላት በመዋጮ ወቅት መዘግየት የለባቸውም። በወቅቱ ያልከፈለ አባል በህጉ መሰረት ይቀጣል።
2. እጣ የደረሰው አባል እጣውን ከመውሰዱ በፊት ሦስት (3) ዋሶችን ማቅረብ ይኖርበታል።
3. ዋሶች የፋይዳ መታወቂያ (Fayda ID) እና የንግድ ፈቃድ (Business License) ማቅረብ ግዴታ ይኖርባቸዋል።
4. እጣ የደረሰው አባል በአካል ቀርቦ የስም መሙያ ቀን እና "ደርሶኛል" የሚል ማረጋገጫ መፈረም ይኖርበታል።
5. ዋሶችም ስማቸውን፣ ስራቸውን እና አድራሻቸውን በመጥቀስ በዋስትና ሰነዱ ላይ መፈረም ይኖርባቸዋል።
6. ማንኛውም አባል መዋጮውን ሳያጠናቅቅ ከእቁቡ መውጣት አይችልም።
7. አድሚኑ የእቁቡን ደህንነት የመጠበቅ እና ደንብ የጣሱ አባላትን የማገድ ሙሉ ስልጣን አለው።
`;

export default function Signup() {
  const { language, setLanguage, t } = useLanguage();
  const [systemSettings, setSystemSettings] = useState<any>({
     autoApprove: false,
     notifyRegistrations: true
  });

  const stepConfig = useMemo(() => {
    const config = [];
    config.push({ id: 'personal', title: t('signup.personal'), color: 'bg-amber-500', icon: User });
    if (systemSettings.signupShowBirthplace !== false) config.push({ id: 'birthplace', title: t('signup.birthplace'), color: 'bg-blue-500', icon: User });
    if (systemSettings.signupShowAddress !== false) config.push({ id: 'address', title: t('signup.address'), color: 'bg-purple-500', icon: MapPin });
    if (systemSettings.signupShowGroup !== false) config.push({ id: 'ekub_group', title: t('signup.ekub_group'), color: 'bg-orange-500', icon: Calendar });
    if (systemSettings.signupShowKYC !== false) config.push({ id: 'kyc_photo', title: t('signup.kyc_photo'), color: 'bg-rose-500', icon: CreditCard });
    config.push({ id: 'confirmation', title: t('signup.confirmation'), color: 'bg-amber-500', icon: CheckCircle });
    return config;
  }, [t, systemSettings]);
  const [step, setStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [formData, setFormData] = useState<any>({
    fullName: '', phone: '', password: '', confirmPassword: '',
    birthCountry: 'ኢትዮጵያ', birthRegion: 'አዲስ አበባ', birthZone: '', birthWoreda: '', birthKebele: '',
    birthYear: '1990', birthMonth: '1', birthDay: '1', calendarType: 'GC',
    ethBirthYear: '1982', ethBirthMonth: '4', ethBirthDay: '23',
    jobTitle: '',
    ekubType: '',
    addressCountry: 'ኢትዮጵያ', addressRegion: 'አዲስ አበባ', addressZone: '', addressWoreda: '', addressKebele: '', addressHouseNumber: '',
    birthDate: '',
    frequency: 'tendays', memberLimit: 10, amount: 1000, customAmount: '', slots: 1,
    nationalId: '', idFront: null as string | null, idBack: null as string | null, faceScan: null as string | null, preferredItem: 'Cash (ጥሬ ገንዘብ)'
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validate phone number: 9 or 10 digits
  const isPhoneValid = /^(0[79]\d{8}|[79]\d{8}|251[79]\d{8})$/.test(phoneNumber.trim());
  const fullPhone = phoneNumber;
  const [isScanning, setIsScanning] = useState(false);
  const [cameraMode, setCameraMode] = useState<'face' | 'idFront' | 'idBack' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [legalRules, setLegalRules] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setSystemSettings(prev => ({ ...prev, ...docSnap.data() }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'system_settings/main');
    });

    const unsubLegal = onSnapshot(query(collection(db, 'legal_rules'), orderBy('createdAt', 'asc')), (snapshot) => {
      setLegalRules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'legal_rules');
    });

    return () => {
      unsub();
      unsubLegal();
    };
  }, []);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const navigate = useNavigate();

  // Clear step error when form data changes
  useEffect(() => {
    if (stepError) setStepError(null);
  }, [formData]);

  const validateStep = () => {
    setStepError(null);
    const stepId = stepConfig[step - 1]?.id;

    if (stepId === 'personal') {
      if (!formData.fullName.trim()) { setStepError(t('signup.error.full_name')); return false; }
      if (!formData.phone.trim()) { setStepError(t('signup.error.phone')); return false; }
      if (!formData.password.trim()) { setStepError(t('signup.error.password')); return false; }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)) { 
        setStepError('Password is too weak. Must be 8+ chars with upper, lower, number, and special character. / የይለፍ ቃሉ ደካማ ነው፤ ቢያንስ 8 ፊደላት፣ ካፒታል፣ ስሞል፣ ቁጥር እና ልዩ ምልክት ይኑረው።'); 
        return false; 
      }
      if (formData.password !== formData.confirmPassword) { 
        setStepError('Passwords do not match. / የይለፍ ቃሎቹ አይዛመዱም።'); 
        return false; 
      }
      
      // Dynamic custom fields validation
      if (systemSettings.signupCustomFields) {
        for (const field of systemSettings.signupCustomFields) {
          if (field.required && !formData[field.id]?.trim()) {
            setStepError((language === 'am' && field.labelAm ? field.labelAm : field.label) + ' is required / ያስፈልጋል');
            return false;
          }
        }
      }
    }
    if (stepId === 'birthplace') {
      if (!formData.birthCountry.trim()) { setStepError(t('signup.error.birth_country')); return false; }
      if (!formData.birthRegion.trim()) { setStepError(t('signup.error.birth_region')); return false; }
      if (!formData.birthZone.trim()) { setStepError(t('signup.error.birth_zone')); return false; }
      if (!formData.birthWoreda.trim()) { setStepError(t('signup.error.birth_woreda')); return false; }
      if (!formData.birthKebele.trim()) { setStepError(t('signup.error.birth_kebele')); return false; }
      if (!formData.birthYear || !formData.birthMonth || !formData.birthDay) { setStepError(t('signup.error.birth_date')); return false; }
      if (birthInfo.age < 18) { setStepError(t('signup.error.age_limit')); return false; }
    }
    if (stepId === 'address') {
      if (!formData.addressCountry.trim()) { setStepError(t('signup.error.address_country')); return false; }
      if (!formData.addressRegion.trim()) { setStepError(t('signup.error.address_region')); return false; }
      if (!formData.addressZone.trim()) { setStepError(t('signup.error.address_zone')); return false; }
      if (!formData.addressWoreda.trim()) { setStepError(t('signup.error.address_woreda')); return false; }
      if (!formData.addressKebele.trim()) { setStepError(t('signup.error.address_kebele')); return false; }
    }
    if (stepId === 'ekub_group') {
      if (!formData.frequency) { setStepError(t('signup.error.frequency')); return false; }
      if (!formData.memberLimit) { setStepError(t('signup.error.member_limit')); return false; }
      if (formData.amount === 0 && !formData.customAmount) { setStepError(t('signup.error.amount')); return false; }
      if (!formData.amount && !formData.customAmount) { setStepError(t('signup.error.amount')); return false; }
    }
    if (stepId === 'kyc_photo') {
      if (!formData.nationalId.trim()) { setStepError(t('signup.error.national_id')); return false; }
      if (!formData.idFront) { setStepError(t('signup.error.id_front_attach')); return false; }
      if (!formData.idBack) { setStepError(t('signup.error.id_back_attach')); return false; }
      if (!formData.faceScan) { setStepError(t('signup.error.face_scan_perform')); return false; }
    }
    if (stepId === 'confirmation') {
      if (!agreedToTerms) { 
        setStepError(t('signup.error.terms_agree')); 
        return false; 
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  // Dynamic Member Limits based on frequency
  const currentMemberLimits = useMemo(() => {
    if (formData.frequency === 'monthly') return [10];
    return MEMBER_LIMITS;
  }, [formData.frequency]);

  const currentAmounts = useMemo(() => {
    return formData.frequency === 'daily' || formData.frequency === 'fivedays' || formData.frequency === 'tendays' ? DAILY_AMOUNTS : OTHER_AMOUNTS;
  }, [formData.frequency]);

  useEffect(() => {
    setFormData(prev => {
      let limit = prev.memberLimit;
      let amount = prev.amount;
      
      if (!currentMemberLimits.includes(limit)) {
        limit = currentMemberLimits[0];
      }
      
      if (amount !== 0 && !currentAmounts.includes(amount)) {
        amount = currentAmounts[0];
      }
      
      if (limit !== prev.memberLimit || amount !== prev.amount) {
        return { ...prev, memberLimit: limit, amount: amount };
      }
      return prev;
    });
  }, [currentMemberLimits, currentAmounts]);

  const getDurationLabel = () => {
    if (language === 'am') {
      if (formData.frequency === 'weekly') return '1 ሳምንት';
      if (formData.frequency === 'monthly') return '1 ወር';
      return `${multiplier} ቀናት`;
    } else {
      if (formData.frequency === 'weekly') return '1 week';
      if (formData.frequency === 'monthly') return '1 month';
      return `${multiplier} days`;
    }
  };

  const finalAmount = formData.customAmount ? Number(formData.customAmount) : formData.amount;
  const multiplier = useMemo(() => {
    switch (formData.frequency) {
      case 'daily': return 10;
      case 'fivedays': return 5;
      case 'tendays': return 10;
      case 'weekly': return 1;
      case 'monthly': return 1;
      default: return 1;
    }
  }, [formData.frequency]);

  const commissionPerSlot = finalAmount * 0.1; // 10% commission per slot
  const totalPerSlot = finalAmount + commissionPerSlot;
  const totalPayoutPerSlot = finalAmount * multiplier * formData.memberLimit;
  const totalCyclePayment = totalPerSlot * multiplier * formData.memberLimit * formData.slots;

  // Age and Ethiopian Date Calculation (Fully synchronized)
  const birthInfo = useMemo(() => {
    const gcY = parseInt(formData.birthYear);
    const gcM = parseInt(formData.birthMonth);
    const gcD = parseInt(formData.birthDay);

    const ecY = parseInt(formData.ethBirthYear);
    const ecM = parseInt(formData.ethBirthMonth);
    const ecD = parseInt(formData.ethBirthDay);

    if (isNaN(gcY) || isNaN(gcM) || isNaN(gcD)) return { age: 0, ethDate: '', gcDate: '' };

    const today = new Date();
    let age = 0;
    
    // Calculate age using GC for absolute precision
    const birth = new Date(gcY, gcM - 1, gcD);
    if (!isNaN(birth.getTime())) {
      age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    }

    const ethDateStr = !isNaN(ecY) && !isNaN(ecM) && !isNaN(ecD) ? `${ecD}/${ecM}/${ecY}` : '';
    const gcDateStr = !isNaN(gcY) && !isNaN(gcM) && !isNaN(gcD) ? `${gcY}-${String(gcM).padStart(2, '0')}-${String(gcD).padStart(2, '0')}` : '';

    return { age, ethDate: ethDateStr, gcDate: gcDateStr };
  }, [formData.birthYear, formData.birthMonth, formData.birthDay, formData.ethBirthYear, formData.ethBirthMonth, formData.ethBirthDay]);

  const updateECDate = (field: 'year' | 'month' | 'day', value: string) => {
    setFormData(prev => {
      const next = { ...prev };
      if (field === 'year') next.ethBirthYear = value;
      if (field === 'month') next.ethBirthMonth = value;
      if (field === 'day') next.ethBirthDay = value;

      const y = parseInt(next.ethBirthYear);
      const m = parseInt(next.ethBirthMonth);
      const d = parseInt(next.ethBirthDay);

      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        try {
          const gc = ethiopianDate.toGregorian(y, m, d);
          if (gc && gc.length === 3) {
            next.birthYear = String(gc[0]);
            next.birthMonth = String(gc[1]);
            next.birthDay = String(gc[2]);
          }
        } catch (e) {
          console.error("Error converting EC to GC:", e);
        }
      }
      return next;
    });
  };

  // Sync birthDate for backend
  useEffect(() => {
    if (birthInfo.gcDate && birthInfo.gcDate !== formData.birthDate) {
      setFormData(prev => ({ ...prev, birthDate: birthInfo.gcDate }));
    }
  }, [birthInfo.gcDate]);

  const toggleCalendarType = (targetType: 'GC' | 'EC') => {
    setFormData(prev => ({ ...prev, calendarType: targetType }));
  };

  const groupCreationInstance = useRef<string>('');

  useEffect(() => {
    let active = true;
    const fetchGroups = async () => {
      if (!finalAmount || finalAmount <= 0) {
        if (active) setAvailableGroups([]);
        return;
      }
      try {
        const q = query(
          collection(db, 'groups'), 
          where('type', '==', formData.frequency), 
          where('limit', '==', formData.memberLimit),
          where('amount', '==', finalAmount)
        );
        const snapshot = await getDocs(q).catch(err => {
          if (err.message?.includes('permissions')) {
            console.warn("Permission denied for groups fetch.");
            return null;
          }
          throw err;
        });

        if (!active) return;

        let groups: any[] = [];
        if (snapshot && !snapshot.empty) {
          groups = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as any))
            .filter(g => ['open', 'registration'].includes(g.status))
            .sort((a, b) => a.name.localeCompare(b.name));
        }

        const validOpenGroups = groups.filter(g => g.memberCount < g.limit);

        if (validOpenGroups.length === 0) {
          if (active) {
            setAvailableGroups([]);
            setSelectedGroup(null);
          }
        } else {
          if (active) {
            setAvailableGroups(groups);
            // If currently selected group isn't in the loaded groups, or is full, or none chosen, auto-select first open group with enough slots
            const currentSelectedInList = groups.find(g => g.id === selectedGroup?.id);
            const chosenSlots = formData.slots || 1;
            
            if (!selectedGroup || !currentSelectedInList || (currentSelectedInList.memberCount + chosenSlots > currentSelectedInList.limit)) {
              const firstWithSpace = groups.find(g => (g.memberCount + chosenSlots) <= g.limit) || groups[0];
              setSelectedGroup(firstWithSpace);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching or creating groups:", error);
        groupCreationInstance.current = '';
      }
    };
    fetchGroups();
    return () => {
      active = false;
    };
  }, [formData.frequency, formData.memberLimit, finalAmount, formData.slots]);

  const startScan = (mode: 'face' | 'idFront' | 'idBack' = 'face') => {
    setCameraMode(mode);
    setIsScanning(true);
  };

  useEffect(() => {
    let stream: MediaStream | null = null;

    const enableStream = async () => {
      if (isScanning && videoRef.current && cameraMode) {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
             throw new Error("MediaDevices not supported");
          }

          const facingMode = cameraMode === 'face' ? 'user' : 'environment';
          try {
            stream = await navigator.mediaDevices.getUserMedia({ 
              video: { 
                facingMode,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
              } 
            });
          } catch (e) {
            console.warn("First fallback: Trying without resolution constraints");
            try {
              stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode } 
              });
            } catch (e2) {
              console.warn("Second fallback: Trying basic video: true");
              stream = await navigator.mediaDevices.getUserMedia({ video: true });
            }
          }

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(console.error);
            };
          }
        } catch (err) {
          console.error("Camera access error:", err);
          setStepError(t('signup.alert.camera_denied'));
          setIsScanning(false);
          setCameraMode(null);
        }
      }
    };

    enableStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning, cameraMode]);

  const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium';
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  };

  const captureScan = async () => {
    if (videoRef.current && videoRef.current.readyState >= 2 && cameraMode) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const dataUrl = await compressImage(rawDataUrl);
        
        if (cameraMode === 'face') {
          setFormData({ ...formData, faceScan: dataUrl });
        } else if (cameraMode === 'idFront') {
          setFormData({ ...formData, idFront: dataUrl });
        } else if (cameraMode === 'idBack') {
          setFormData({ ...formData, idBack: dataUrl });
        }
        
        setIsScanning(false);
        setCameraMode(null);
      }
    } else {
      setStepError(t('signup.alert.camera_not_ready'));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'idFront' | 'idBack' | 'faceScan') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setFormData({ ...formData, [field]: compressed });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateUniqueCode = async (frequency: string) => {
    const prefix = frequency === 'tendays' ? 'T' : frequency === 'daily' ? 'D' : frequency === 'weekly' ? 'W' : frequency === 'fivedays' ? 'F' : 'M';
    let isUnique = false;
    let code = '';
    while (!isUnique) {
      const randomPart = Math.floor(10000 + Math.random() * 90000);
      code = `${prefix}${randomPart}`;
      try {
        const q = query(collection(db, 'users'), where('memberCode', '==', code));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          isUnique = true;
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    }
    return code;
  };

  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    setStepError('');
    sessionStorage.setItem('is_active_session', 'true');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Extract details
      const displayName = user.displayName || '';
      const email = user.email || '';

      // Check if user already registered completely
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data()?.memberCode) {
         // User already exists, navigate to dashboard
         navigate('/dashboard');
         return;
      }
      
      // Auto-fill form and advance
      setFormData(prev => ({
        ...prev,
        fullName: displayName,
      }));
      setStep(1); // Set step to 1 to collect missing fields (e.g., phone, password - though pw might be optional now, they still need to set one if phone is used for login later)
      // For phone login next time, we still need a password and a phone number
    } catch (error: any) {
      console.error('Google signup error:', error);
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        setStepError(language === 'am' ? 'በጎግል መመዝገብ አልተሳካም። ኮምፒውተሩ (Popup) ከለከለ ወይም እርስዎ ዘግተውታል።' : 'Google signup popup was blocked or closed.');
      } else {
        setStepError(language === 'am' ? 'የጎግል ምዝገባ አልተሳካም። እባክዎ እንደገና ይሞክሩ።' : 'Google signup failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    sessionStorage.setItem('is_active_session', 'true');
    try {
      const phoneInput = formData.phone.trim();
      let cleanPhone = phoneInput.replace(/\D/g, '');
      if (cleanPhone.startsWith('251')) {
        cleanPhone = '0' + cleanPhone.substring(3);
      } else if (cleanPhone.length === 9 && (cleanPhone.startsWith('9') || cleanPhone.startsWith('7'))) {
        cleanPhone = '0' + cleanPhone;
      }
      
      // Update normalized phone back to formData
      const updatedFormData = { ...formData, phone: cleanPhone };

      // Strictly check if the user is already actively registered in Firestore
      try {
        const nineDigit = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;
        const international = `+251${nineDigit}`;
        const countryCodeOnly = `251${nineDigit}`;
        const qPhone = query(collection(db, 'users'), where('phone', 'in', [cleanPhone, nineDigit, international, countryCodeOnly]));
        const phoneSnap = await getDocs(qPhone).catch(err => {
          if (err.message?.includes('permissions')) {
            console.warn("Permission denied for phone check. Proceeding as if unique.");
            return { empty: true, docs: [] };
          }
          throw err;
        });
        if (phoneSnap && !phoneSnap.empty) {
          throw new Error(t('signup.error.already_registered'));
        }
      } catch (error: any) {
        if (error.message === t('signup.error.already_registered')) throw error;
        // Proceed silently if it's a permissions issue or other error during check
      }

      let targetGroup = selectedGroup;
      
      const dummyEmail = `${cleanPhone}@melikekub.com`;
      let userCredential;
      
      try {
        userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, formData.password);
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          // Check if it's actually registered by trying to log in using iterative fallback for deleted users
          let emailOffset = 1;
          let foundFreeEmail = false;
          
          while (!foundFreeEmail && emailOffset < 20) {
             const attemptEmail = `${cleanPhone}+${emailOffset}@melikekub.com`;
             try {
                userCredential = await createUserWithEmailAndPassword(auth, attemptEmail, formData.password);
                foundFreeEmail = true;
             } catch (e: any) {
                if (e.code === 'auth/email-already-in-use') {
                   emailOffset++;
                } else {
                   throw e;
                }
             }
          }
          if (!foundFreeEmail) {
             throw new Error(t('signup.error.already_registered'));
          }
        } else {
          throw authError;
        }
      }

      // Before proceeding, verify there is no active user with this phone number in Firestore
      try {
         const existingPhoneQuery = query(collection(db, 'users'), where('phone', '==', cleanPhone));
         const existingPhoneSnap = await getDocs(existingPhoneQuery);
         if (!existingPhoneSnap.empty) {
            // Found an active user. Clean up current auth.
            if (auth.currentUser) {
                const currentDoc = await getDoc(doc(db, 'users', auth.currentUser.uid)).catch(() => null);
                if (!currentDoc || !currentDoc.exists()) {
                   await auth.currentUser.delete().catch(() => auth.signOut());
                } else {
                   await auth.signOut();
                }
            }
            throw new Error(t('signup.error.already_registered'));
         }
      } catch (e: any) {
         if (e.message === t('signup.error.already_registered')) throw e;
      }

      // Generate member code after authentication to satisfy security rules
      const generateUniqueMemberCode = async () => {
        const prefix = formData.frequency === 'tendays' ? 'T' : formData.frequency === 'daily' ? 'D' : formData.frequency === 'weekly' ? 'W' : formData.frequency === 'fivedays' ? 'F' : 'M';
        let isUnique = false;
        let code = '';
        while (!isUnique) {
          const randomPart = Math.floor(10000 + Math.random() * 90000);
          code = `${prefix}${randomPart}`;
          try {
            const q = query(collection(db, 'users'), where('memberCode', '==', code));
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
              isUnique = true;
            }
          } catch (error) {
            console.error(error);
            isUnique = true; // Fallback to avoid infinite loop
          }
        }
        return code;
      };

      const memberCode = await generateUniqueMemberCode();

      // Check National ID (Fayda) uniqueness now that we are authenticated
      if (formData.nationalId?.trim()) {
        const qFayda = query(collection(db, 'users'), where('nationalId', '==', formData.nationalId.trim()));
        const faydaSnap = await getDocs(qFayda);
        if (!faydaSnap.empty) {
          // It's a duplicate. If this is a brand new auth account, delete it to clean up.
          // Wait, if it was a rescued account we just sign out.
          try {
            if (auth.currentUser) {
              const currentDoc = await getDoc(doc(db, 'users', auth.currentUser.uid)).catch(() => null);
              if (!currentDoc || !currentDoc.exists()) {
                await auth.currentUser.delete();
              } else {
                await auth.signOut();
              }
            }
          } catch (e) {
            console.error('Cleanup failed', e);
          }
          throw new Error(language === 'am' ? 'ይህ የፋይዳ (መታወቂያ) ቁጥር ቀድሞ ተመዝግቧል' : 'This National ID (Fayda) is already registered');
        }
      }

      // 1. Resolve Target Group
      // If there is an existing open group for this Equb type, join it (fills existing group first).
      // If no open group exists with enough capacity, automatically create a new group.
      let resolvedTargetGroup = null;
      try {
        const groupsRef = collection(db, 'groups');
        const qGroups = query(
          groupsRef,
          where('type', '==', formData.frequency),
          where('limit', '==', formData.memberLimit),
          where('amount', '==', finalAmount)
        );
        
        const groupsSnap = await getDocs(qGroups);
        const allGroups = groupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        // Find the oldest open group with enough capacity for user's slots
        const openGroup = allGroups
          .filter(g => ['open', 'registration'].includes(g.status) && (g.memberCount + formData.slots) <= g.limit)
          .sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateA - dateB;
          })[0];

        if (openGroup) {
          resolvedTargetGroup = openGroup;
        } else {
          // Automatic Group Creation
          const count = allGroups.length;
          const frequencyLabelEn = formData.frequency === 'tendays' ? '10 Days' : formData.frequency === 'fivedays' ? '5 Days' : formData.frequency === 'weekly' ? 'Weekly' : formData.frequency === 'monthly' ? 'Monthly' : 'Daily';
          const frequencyLabelAm = formData.frequency === 'tendays' ? 'የ10 ቀን' : formData.frequency === 'fivedays' ? 'የ5 ቀን' : formData.frequency === 'weekly' ? 'ሳምንታዊ' : formData.frequency === 'monthly' ? 'ወርሃዊ' : 'ዕለታዊ';
          
          const newGroupName = language === 'am'
            ? `${frequencyLabelAm} - ${finalAmount} ብር - ምድብ ${count + 1}`
            : `${frequencyLabelEn} - ${finalAmount} ETB - Group ${count + 1}`;
            
          const newGroupDoc = {
            name: newGroupName,
            type: formData.frequency,
            limit: formData.memberLimit,
            amount: finalAmount,
            memberCount: 0,
            status: 'registration',
            createdAt: serverTimestamp(),
            currentRound: 1,
            cbeAccount: '',
            telebirrAccount: '',
            boaAccount: ''
          };
          
          const newGroupRef = await addDoc(groupsRef, newGroupDoc);
          resolvedTargetGroup = {
            id: newGroupRef.id,
            ...newGroupDoc,
            memberCount: 0
          };
        }
      } catch (grpErr) {
        console.error("Error resolving/creating target group, falling back:", grpErr);
        resolvedTargetGroup = targetGroup;
      }

      if (!resolvedTargetGroup) {
        throw new Error(
          language === 'am' 
            ? 'ይቅርታ፣ መምረጥ ወይም መፍጠር አልተቻለም። እባክዎ አስተዳዳሪውን ያነጋግሩ።' 
            : 'Sorry, unable to assign or create a group. Please contact the administrator.'
        );
      }

      targetGroup = resolvedTargetGroup;

      const isAdminPhone = cleanPhone === '0900000000';
      
      try {
        await deleteDoc(doc(db, 'rejected_members', userCredential.user.uid)).catch(() => {});
        const { password: _, confirmPassword: __, ...userDataToSave } = updatedFormData;
        const userDocRaw = {
          uid: userCredential.user.uid, 
          phone: cleanPhone,
          profession: formData.profession || '',
          email: dummyEmail,
          authEmail: dummyEmail,
          memberCode: memberCode,
          round: targetGroup?.currentRound || 1,
          amount: finalAmount,
          commission: commissionPerSlot,
          totalPerSlot,
          totalPayout: totalPayoutPerSlot,
          totalCyclePayment,
          age: birthInfo.age,
          ethBirthDate: birthInfo.ethDate,
          gcBirthDate: birthInfo.gcDate,
          calendarType: formData.calendarType,
          groupId: targetGroup.id, 
          teamId: '', 
          isVerified: true,
          status: systemSettings.autoApprove ? 'active' : 'pending',
          role: isAdminPhone ? 'admin' : 'user',
          createdAt: serverTimestamp(),
          ...userDataToSave
        };

        const cleanUserDocData: any = {};
        for (const [key, val] of Object.entries(userDocRaw)) {
          cleanUserDocData[key] = val === undefined ? null : val;
        }

        await setDoc(doc(db, 'users', userCredential.user.uid), cleanUserDocData, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${userCredential.user.uid}`);
      }

      // 3. Create Team Document (NEW)
      let teamId = '';
      try {
        const teamRef = await addDoc(collection(db, 'teams'), {
          name: `${updatedFormData.fullName}'s Team`,
          memberId: userCredential.user.uid,
          status: 'active',
          points: 0,
          createdAt: serverTimestamp()
        });
        teamId = teamRef.id;
        
        await updateDoc(doc(db, 'users', userCredential.user.uid), {
          teamId: teamId
        });
      } catch (error) {
        console.error("Team creation failed:", error);
      }
      
      try {
        await updateDoc(doc(db, 'groups', targetGroup.id), { 
          memberCount: increment(formData.slots),
          status: (targetGroup.memberCount + formData.slots >= targetGroup.limit) ? 'closed' : 'open'
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `groups/${targetGroup.id}`);
      }

      if (systemSettings.notifyRegistrations) {
        try {
          // Notify admins
          await addDoc(collection(db, 'notifications'), {
            title: 'አዲስ አባል ምዝግባ / New Registration',
            message: `${updatedFormData.fullName} ወደ እቁቡ ተሳታፊነት ጥያቄ ልከዋል።`,
            recipientId: 'admin', 
            read: false,
            createdAt: serverTimestamp(),
            type: 'system'
          });
        } catch (error) {
          console.error("Unable to create notification", error);
        }
      }
      
      const signupData = {
        signupSuccess: true,
        memberCode,
        registeredInfo: { 
          name: formData.fullName, 
          profession: formData.profession || '',
          group: targetGroup.name,
          phone: formData.phone,
          frequency: formData.frequency === 'tendays' ? t('signup.tendays') : formData.frequency === 'fivedays' ? t('signup.fivedays') : formData.frequency === 'weekly' ? t('signup.weekly') : t('signup.monthly'),
          amount: finalAmount,
          memberLimit: formData.memberLimit,
          totalPayout: totalPayoutPerSlot,
          isAdminPhone: isAdminPhone,
          memberCode: memberCode,
          status: isAdminPhone ? 'active' : 'pending'
        }
      };
      
      // Auto-signout after registration to prevent access until explicit login
      if (!isAdminPhone) {
        await auth.signOut();
      }

      // Navigate to pending approval page
      if (isAdminPhone) {
        navigate('/admin');
      } else {
        // Ensure navigation happens before or reliably alongside cleanup
        const sanitizedInfo = JSON.parse(JSON.stringify(signupData.registeredInfo));
        navigate('/pending-approval', { state: { registeredInfo: sanitizedInfo } });
      }
      
    } catch (error: any) {
      console.error(error);
      const errMsg = error.message || '';
      let errorText = t('signup.error.registration_failed') + ': ' + errMsg;
      if (errMsg.includes('operation-not-allowed')) {
        errorText += ' (Firebase Error: Email/Password Authentication provider is disabled. Please enable "Email/Password" in Firebase Console under Authentication -> Sign-in method.)';
      } else if (errMsg.includes('permission-denied')) {
        errorText += ' (Firebase Error: Firestore Rules denied write permissions. Please check your firestore.rules and deploy rules.)';
      }
      setStepError(errorText);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center font-sans bg-[#FAFAFA] relative overflow-hidden py-12 px-4">
      {/* Background Elements */}
      <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-emerald-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Language Toggle */}
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

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[320px] sm:max-w-[360px] relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-slate-900/5 rotate-3 transform hover:rotate-0 transition-transform duration-500 border border-slate-100 overflow-hidden">
            <img src="/logo.png" className="w-full h-full object-contain p-1" alt="Logo" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2">
            {t('common.appName')}
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
            {language === 'am' ? 'አባልነት ይጀምሩ' : 'Join the Community'}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-4 sm:p-5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-white/50">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg ${stepConfig[step - 1]?.color || 'bg-slate-500'}`}>
                  {React.createElement(stepConfig[step - 1]?.icon || User, { size: 16 } )}
                </div>
                <span className="text-sm font-black text-slate-900 tracking-tight">{stepConfig[step - 1]?.title}</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest">{step}/{stepConfig.length}</span>
            </div>
            <div className="flex gap-1">
              {stepConfig.map((c, i) => (
                <div key={i} className={`flex-1 flex flex-col gap-1.5 transition-all duration-700 ${step === i + 1 ? 'flex-[1.5]' : 'flex-1'}`} title={c.title}>
                  <span className={`text-[8px] font-black uppercase tracking-wider truncate text-center ${step === i + 1 ? 'text-emerald-600' : step > i ? 'text-slate-600' : 'text-slate-300'}`}>
                    {c.title}
                  </span>
                  <div className={`h-1.5 w-full rounded-full transition-all duration-700 ${step > i ? 'bg-emerald-500' : step === i + 1 ? 'bg-emerald-400' : 'bg-slate-150 bg-slate-100'}`} />
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {stepError && (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 text-[12px] font-black uppercase tracking-widest text-center">
                  {stepError}
                </div>
              )}

              {stepConfig[step - 1]?.id === 'personal' && (
                <div className="space-y-6">
                  <InputField icon={User} type="text" placeholder={t('full_name')} value={formData.fullName} onChange={(e: any) => setFormData({...formData, fullName: e.target.value})} />
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('phone')}</label>
                    <div className="relative group">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
                      <input 
                        type="tel" 
                        placeholder="09XXXXXXXX" 
                        value={phoneNumber} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhoneNumber(val);
                          setFormData({...formData, phone: val});
                        }}
                        className={`w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-[15px] font-bold text-slate-900 outline-none transition-all ${
                          phoneNumber.length > 0
                            ? isPhoneValid
                              ? 'border-emerald-500 bg-white shadow-[0_0_0_4px_rgba(16,185,129,0.1)]'
                              : 'border-rose-400 bg-white'
                            : 'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                        }`}
                      />
                    </div>
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField icon={FileText} type="text" placeholder={language === 'am' ? 'የስራ አይነት' : 'Job Title'} value={formData.jobTitle} onChange={(e: any) => setFormData({...formData, jobTitle: e.target.value})} />
                  <InputField icon={Users} type="text" placeholder={language === 'am' ? 'የእቁብ ምድብ' : 'Ekub Type'} value={formData.ekubType} onChange={(e: any) => setFormData({...formData, ekubType: e.target.value})} />
                </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('password')}</label>
                       <div className="relative group">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
                          <input 
                            type={showPassword ? "text" : "password"} 
                            value={formData.password} 
                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                            className={`w-full pl-14 pr-12 py-5 bg-slate-50 border rounded-2xl text-[15px] font-bold text-slate-900 outline-none transition-all ${
                              formData.password.length > 0
                                ? /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)
                                  ? 'border-emerald-500 bg-white shadow-[0_0_0_4px_rgba(16,185,129,0.1)]' 
                                  : 'border-rose-400 bg-white focus:ring-4 focus:ring-rose-500/10'
                                : 'border-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500'
                            }`}
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors">
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('confirm_password')}</label>
                       <div className="relative group">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
                          <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            value={formData.confirmPassword} 
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                            className={`w-full pl-14 pr-12 py-5 bg-slate-50 border rounded-2xl text-[15px] font-bold text-slate-900 outline-none transition-all ${
                              formData.confirmPassword.length > 0
                                ? formData.password === formData.confirmPassword
                                  ? 'border-emerald-500 bg-white shadow-[0_0_0_4px_rgba(16,185,129,0.1)]'
                                  : 'border-rose-400 bg-white focus:ring-4 focus:ring-rose-500/10'
                                : 'border-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500'
                            }`}
                          />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors">
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                       </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold ml-1">
                     {language === 'am' ? 'የይለፍ ቃል ቢያንስ 8 ፊደላት፣ አቢይ ሆሄ፣ ቁጥር እና ልዩ ምልክት (@$!%*?&) ሊኖረው ይገባል።' : 'Password must be at least 8 characters with a capital letter, number & special char (@$!%*?&)'}
                  </p>
                  


                  {/* Dynamic Custom Fields */}
                  {systemSettings.signupCustomFields?.map((field: any) => (
                    <InputField key={field.id} icon={FileText} type={field.type || 'text'} placeholder={language === 'am' && field.labelAm ? field.labelAm : field.label} value={formData[field.id] || ''} onChange={(e: any) => setFormData({...formData, [field.id]: e.target.value})} />
                  ))}
                </div>
              )}

              {stepConfig[step - 1]?.id === 'birthplace' && (
                <div className="space-y-6">
                  {/* Ethiopian Calendar Date Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-emerald-700 uppercase tracking-wider ml-1">
                      {language === 'am' ? 'የትውልድ ቀን በኢትዮጵያ ዘመን አቆጣጠር' : 'Date of Birth (Ethiopian Calendar)'}
                    </label>
                    <div className="grid grid-cols-3 gap-3 p-5 bg-emerald-50/40 border border-emerald-100/50 rounded-2xl">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{language === 'am' ? 'ቀን' : 'Day'}</label>
                        <select value={formData.ethBirthDay} onChange={(e) => updateECDate('day', e.target.value)} className="w-full px-4 py-4 bg-white border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-emerald-500">
                          {Array.from({length: formData.ethBirthMonth === '13' ? 6 : 30}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2 col-span-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{language === 'am' ? 'ወር' : 'Month'}</label>
                        <select value={formData.ethBirthMonth} onChange={(e) => updateECDate('month', e.target.value)} className="w-full px-4 py-4 bg-white border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-emerald-500">
                          {MONTHS_ETH.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{language === 'am' ? 'ዓመት' : 'Year'}</label>
                        <select value={formData.ethBirthYear} onChange={(e) => updateECDate('year', e.target.value)} className="w-full px-4 py-4 bg-white border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-emerald-500">
                          {Array.from({length: 100}, (_, i) => 2017 - i).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {birthInfo.age > 0 && (
                    <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-[2rem] border border-emerald-100 flex flex-col gap-4">
                      <div className="flex justify-between items-center pb-3 border-b border-emerald-100/60">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'am' ? 'የተሰላ እድሜ' : 'Calculated Age'}</div>
                          <div className="text-xl font-black text-emerald-950">{birthInfo.age} {language === 'am' ? 'ዓመት' : 'Years'}</div>
                        </div>
                        <div className="bg-emerald-500 text-white font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                          {birthInfo.age >= 18 ? (language === 'am' ? 'ተፈቅዷል (18+)' : 'Eligible (18+)') : (language === 'am' ? 'ዕድሜው አልደረሰም' : 'Under 18')}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'am' ? 'የኢትዮጵያ ቀን (EC)' : 'Ethiopian Date (EC)'}</div>
                          <div className="text-emerald-800 font-extrabold text-[13px]">{birthInfo.ethDate}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'am' ? 'የፈረንጅ ቀን (GC)' : 'Gregorian Date (GC)'}</div>
                          <div className="text-emerald-800 font-extrabold text-[13px]">{birthInfo.gcDate}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <InputField icon={MapPin} type="text" placeholder={t('country')} value={formData.birthCountry} onChange={(e: any) => setFormData({...formData, birthCountry: e.target.value})} />
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('region')}</label>
                      <select value={formData.birthRegion} onChange={(e) => setFormData({...formData, birthRegion: e.target.value})} className="w-full px-5 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-[15px] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all">
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <InputField icon={MapPin} type="text" placeholder={t('zone')} value={formData.birthZone} onChange={(e: any) => setFormData({...formData, birthZone: e.target.value})} />
                    <InputField icon={MapPin} type="text" placeholder={t('woreda')} value={formData.birthWoreda} onChange={(e: any) => setFormData({...formData, birthWoreda: e.target.value})} />
                    <InputField icon={MapPin} type="text" placeholder={t('kebele')} value={formData.birthKebele} onChange={(e: any) => setFormData({...formData, birthKebele: e.target.value})} />
                  </div>
                </div>
              )}

              {stepConfig[step - 1]?.id === 'address' && (
                <div className="space-y-6">
                  <InputField icon={MapPin} type="text" placeholder={t('country')} value={formData.addressCountry} onChange={(e: any) => setFormData({...formData, addressCountry: e.target.value})} />
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('region')}</label>
                    <select value={formData.addressRegion} onChange={(e) => setFormData({...formData, addressRegion: e.target.value})} className="w-full px-5 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-[15px] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all">
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <InputField icon={MapPin} type="text" placeholder={t('zone')} value={formData.addressZone} onChange={(e: any) => setFormData({...formData, addressZone: e.target.value})} />
                    <InputField icon={MapPin} type="text" placeholder={t('woreda')} value={formData.addressWoreda} onChange={(e: any) => setFormData({...formData, addressWoreda: e.target.value})} />
                    <InputField icon={MapPin} type="text" placeholder={t('kebele')} value={formData.addressKebele} onChange={(e: any) => setFormData({...formData, addressKebele: e.target.value})} />
                  </div>
                  <InputField icon={MapPin} type="text" placeholder={language === 'am' ? 'የቤት ቁጥር' : 'House Number'} value={formData.addressHouseNumber} onChange={(e: any) => setFormData({...formData, addressHouseNumber: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField icon={FileText} type="text" placeholder={language === 'am' ? 'የስራ አይነት' : 'Job Title'} value={formData.jobTitle} onChange={(e: any) => setFormData({...formData, jobTitle: e.target.value})} />
                    <InputField icon={Users} type="text" placeholder={language === 'am' ? 'የእቁብ ምድብ' : 'Ekub Type'} value={formData.ekubType} onChange={(e: any) => setFormData({...formData, ekubType: e.target.value})} />
                  </div>
                </div>
              )}

              {stepConfig[step - 1]?.id === 'ekub_group' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('signup.frequency')}</label>
                      <select value={formData.frequency} onChange={(e) => setFormData({...formData, frequency: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-bold text-slate-900 outline-none focus:border-emerald-500">
                        <option value="tendays">{t('signup.tendays')}</option>
                        <option value="fivedays">{t('signup.fivedays')}</option>
                        <option value="weekly">{t('signup.weekly')}</option>
                        <option value="monthly">{t('signup.monthly')}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('signup.member_limit')}</label>
                      <select value={formData.memberLimit} onChange={(e) => setFormData({...formData, memberLimit: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-bold text-slate-900 outline-none focus:border-emerald-500">
                        {currentMemberLimits.map(limit => <option key={limit} value={limit}>{limit} {t('common.members')}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2">
                      {language === 'am' ? 'የእቁብ አይነት ዝርዝር' : 'Equb Type Details'}
                    </p>
                    <p className="text-xs font-medium text-emerald-600 leading-relaxed">
                      {formData.frequency === 'tendays' && t('signup.tendays_desc')}
                      {formData.frequency === 'fivedays' && t('signup.fivedays_desc')}
                      {formData.frequency === 'weekly' && t('signup.weekly_desc')}
                      {formData.frequency === 'monthly' && t('signup.monthly_desc')}
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                     <Clock size={18} className="text-amber-500 shrink-0 mt-0.5" />
                     <div>
                        <p className="text-xs font-black text-amber-800 uppercase tracking-tight mb-1">
                           {language === 'am' ? 'የእቁቡ ቆይታ ጊዜ' : 'Ekub Duration'}
                        </p>
                        <p className="text-[11px] font-bold text-amber-600">
                           {calculateDuration(formData.memberLimit, formData.frequency, language)}
                        </p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('signup.contribution')}</label>
                      <select value={formData.amount} onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-bold text-slate-900 outline-none focus:border-emerald-500">
                        {currentAmounts.map(amt => <option key={amt} value={amt}>{amt} {t('common.etb')}</option>)}
                        <option value="0">{language === 'am' ? 'ሌላ' : 'Other'}</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{language === 'am' ? 'የእጣ ብዛት' : 'Slots'}</label>
                      <select value={formData.slots} onChange={(e) => setFormData({...formData, slots: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-bold text-slate-900 outline-none focus:border-emerald-500">
                        {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s} {language === 'am' ? 'እጣ' : 'Slots'}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  {formData.amount === 0 && (
                    <InputField icon={DollarSign} type="number" placeholder={t('common.etb')} value={formData.customAmount} onChange={(e: any) => setFormData({...formData, customAmount: e.target.value})} />
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{language === 'am' ? 'የእጣ ፍላጎት (Preferred Payout)' : 'Preferred Payout'}</label>
                    <select value={formData.preferredItem} onChange={(e) => setFormData({...formData, preferredItem: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-bold text-slate-900 outline-none focus:border-emerald-500">
                      <option value="Cash (ጥሬ ገንዘብ)">{language === 'am' ? 'Cash (ጥሬ ገንዘብ)' : 'Cash'}</option>
                      <option value="Car (መኪና)">{language === 'am' ? 'Car (መኪና)' : 'Car'}</option>
                      <option value="House (ቤት)">{language === 'am' ? 'House (ቤት)' : 'House'}</option>
                      <option value="Electronics (ኤሌክትሮኒክስ)">{language === 'am' ? 'Electronics (ኤሌክትሮኒክስ)' : 'Electronics'}</option>
                      <option value="Gold (ወርቅ)">{language === 'am' ? 'Gold (ወርቅ)' : 'Gold'}</option>
                      <option value="Other (ሌላ)">{language === 'am' ? 'Other (ሌላ)' : 'Other'}</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{language === 'am' ? 'ምድብ ይምረጡ' : 'Select Group'}</label>
                    <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                      {availableGroups.length > 0 ? availableGroups.map(g => {
                        const remaining = g.limit - g.memberCount;
                        const percentage = Math.min(100, Math.round((g.memberCount / g.limit) * 100));
                        return (
                          <div 
                            key={g.id}
                            onClick={() => setSelectedGroup(g)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedGroup?.id === g.id 
                                ? 'border-emerald-500 bg-emerald-50/70 shadow-sm' 
                                : 'border-slate-100 bg-white hover:border-slate-200'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                                  {g.name}
                                  {(g.currentRound || 1) > 1 && (
                                    <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                      {language === 'am' ? `ዙር ${g.currentRound}` : `Round ${g.currentRound}`}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1 text-[11px] text-slate-500 font-bold mt-2">
                                  <div className="flex items-center gap-1.5">
                                    <Users size={12} className="text-emerald-500 shrink-0" />
                                    <span>
                                      {language === 'am' 
                                        ? `በምድቡ የተመዘገቡ አባላት: ${g.memberCount} ከ ${g.limit}` 
                                        : `Registered Members: ${g.memberCount} of ${g.limit}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-emerald-600">
                                    <UserCheck size={12} className="shrink-0" />
                                    <span>
                                      {language === 'am' 
                                        ? `የሚቀሩ ክፍት ቦታዎች: ${remaining} ሰው ብቻ` 
                                        : `Remaining Slots: ${remaining} left`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                selectedGroup?.id === g.id ? 'bg-emerald-500 text-white shadow-sm' : 'border-2 border-slate-200'
                              }`}>
                                {selectedGroup?.id === g.id && <CheckCircle size={14} />}
                              </div>
                            </div>
                            
                            {/* Capacity progress bar */}
                            <div className="mt-3">
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    percentage >= 90 
                                      ? 'bg-rose-500' 
                                      : percentage >= 70 
                                        ? 'bg-amber-500' 
                                        : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="p-4 bg-slate-50 rounded-xl text-center border-2 border-dashed border-slate-200 text-sm font-bold text-slate-500">
                          {language === 'am' ? 'አዲስ ምድብ ይፈጠራል' : 'A new group will be created automatically'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-emerald-700 text-white rounded-[2rem] shadow-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] uppercase tracking-widest opacity-80">{language === 'am' ? 'ጠቅላላ ክፍያ' : 'Total Cycle Payment'}</span>
                      <span className="font-bold">{totalCyclePayment.toLocaleString()} ETB</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] uppercase tracking-widest text-emerald-300">Service Fee (10%)</span>
                      <span className="text-[10px] text-emerald-300">+{commissionPerSlot} ETB / slot</span>
                    </div>
                    <div className="h-px w-full bg-white/20 mb-4" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-widest text-emerald-200">{language === 'am' ? 'እጣ ሲደርስዎት (Payout)' : 'Expected Payout'}</span>
                      <span className="text-xl font-black">{totalPayoutPerSlot.toLocaleString()} ETB</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                        {language === 'am' ? 'የአሰራር ስሌት' : 'Calculation Breakdown'}
                      </p>
                      <p className="text-[11px] font-medium text-emerald-100 leading-relaxed italic">
                        {t('signup.payout_calc')
                          .replace('{amount}', finalAmount.toLocaleString())
                          .replace('{duration}', getDurationLabel())
                          .replace('{members}', formData.memberLimit.toString())}
                      </p>
                      <p className="text-[9px] font-bold text-emerald-300/60 uppercase tracking-tighter">
                        {t('signup.cycle_note').replace('{days}', (multiplier * formData.memberLimit).toString())}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {stepConfig[(step - 1)]?.id === 'kyc_photo' && (
                <div className="space-y-8">
                  <input type="file" id="idFrontInput" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'idFront')} />
                  <input type="file" id="idBackInput" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'idBack')} />
                  <input type="file" id="faceScanInput" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'faceScan')} />

                  <InputField icon={CreditCard} type="text" placeholder={t('signup.national_id')} value={formData.nationalId} onChange={(e: any) => setFormData({...formData, nationalId: e.target.value})} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="relative group cursor-pointer" onClick={() => startScan('idFront')}>
                        <div className={`aspect-[4/3] rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${formData.idFront ? 'bg-white border-emerald-500 shadow-xl' : 'bg-slate-50 border-slate-200 hover:border-slate-400'}`}>
                          {formData.idFront ? (
                            <>
                              <img src={formData.idFront} className="absolute inset-0 w-full h-full object-cover rounded-[2rem]" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] flex items-center justify-center">
                                <Camera className="text-white" size={32} />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="p-4 bg-white rounded-full shadow-sm text-slate-300 group-hover:text-emerald-500 transition-colors">
                                <Upload size={24} />
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">{t('signup.id_front')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => document.getElementById('idFrontInput')?.click()}
                        className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                      >
                        <ImageIcon size={14} />
                        {language === 'am' ? 'ከጋላሪ ምረጥ' : 'Choose from Gallery'}
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="relative group cursor-pointer" onClick={() => startScan('idBack')}>
                        <div className={`aspect-[4/3] rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${formData.idBack ? 'bg-white border-emerald-500 shadow-xl' : 'bg-slate-50 border-slate-200 hover:border-slate-400'}`}>
                          {formData.idBack ? (
                            <>
                              <img src={formData.idBack} className="absolute inset-0 w-full h-full object-cover rounded-[2rem]" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] flex items-center justify-center">
                                <Camera className="text-white" size={32} />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="p-4 bg-white rounded-full shadow-sm text-slate-300 group-hover:text-emerald-500 transition-colors">
                                <Upload size={24} />
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">{t('signup.id_back')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => document.getElementById('idBackInput')?.click()}
                        className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                      >
                        <ImageIcon size={14} />
                        {language === 'am' ? 'ከጋላሪ ምረጥ' : 'Choose from Gallery'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button onClick={() => startScan('face')} className={`w-full py-6 rounded-[2.25rem] border-2 border-dashed flex items-center justify-center gap-4 transition-all group ${formData.faceScan ? 'bg-white border-emerald-500 shadow-xl' : 'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'}`}>
                      {formData.faceScan ? (
                        <>
                          <img src={formData.faceScan} className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500" />
                          <span className="text-sm font-black text-emerald-600">Scan Complete / ተሳክቷል</span>
                          <RefreshCw size={20} className="text-emerald-300 group-hover:text-emerald-500" />
                        </>
                      ) : (
                        <>
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-300 group-hover:text-emerald-500 transition-colors">
                            <Scan size={24} />
                          </div>
                          <span className="text-sm font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">{t('signup.face_scan')}</span>
                        </>
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={() => document.getElementById('faceScanInput')?.click()}
                      className="w-full py-4 px-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      <ImageIcon size={16} />
                      {language === 'am' ? 'የቅርብ ጊዜ ፎቶ ከጋላሪ ምረጥ' : 'Choose recent photo from Gallery'}
                    </button>
                  </div>
                </div>
              )}

              {stepConfig[step - 1]?.id === 'confirmation' && (
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <h3 className="font-black text-slate-900 border-b border-slate-200 pb-3">{language === 'am' ? 'የመዝገብዎ ማጠቃለያ' : 'Registration Summary'}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">{t('full_name')}</span>
                        <span className="text-sm font-bold text-slate-900">{formData.fullName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">{t('phone')}</span>
                        <span className="text-sm font-bold text-slate-900">{formData.phone}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">{t('signup.frequency')}</span>
                        <span className="text-sm font-bold text-slate-900">{t(`signup.${formData.frequency}`)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">{t('signup.contribution')}</span>
                        <span className="text-sm font-bold text-slate-900">{finalAmount.toLocaleString()} {t('common.etb')} ({formData.slots} Slots)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">{language === 'am' ? 'የእጣ ምርጫ' : 'Preference'}</span>
                        <span className="text-sm font-bold text-slate-900">{formData.preferredItem}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">{language === 'am' ? 'ምድብ' : 'Group'}</span>
                        <span className="text-sm font-bold text-emerald-600">{selectedGroup ? selectedGroup.name : (language === 'am' ? 'አዲስ አውቶማቲክ' : 'Auto Allocation')}</span>
                      </div>
                      <div className="pt-3 border-t border-slate-200 space-y-2 mt-2">
                         <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black text-slate-500 uppercase">{t('signup.payout_label')}</span>
                            <span className="text-lg font-black text-emerald-600">{totalPayoutPerSlot.toLocaleString()} {t('common.etb')}</span>
                         </div>
                         <p className="text-[9px] font-bold text-slate-400 italic text-right">
                           {t('signup.payout_calc')
                             .replace('{amount}', finalAmount.toLocaleString())
                             .replace('{duration}', getDurationLabel())
                             .replace('{members}', formData.memberLimit.toString())}
                         </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start gap-4 p-5 bg-white border-2 border-slate-100 rounded-2xl cursor-pointer hover:border-emerald-200 transition-all">
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input 
                          type="checkbox" 
                          checked={agreedToTerms} 
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="peer w-6 h-6 appearance-none border-2 border-slate-300 rounded-lg checked:border-emerald-500 checked:bg-emerald-500 transition-colors"
                        />
                        <CheckCircle size={16} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900 mb-1">{language === 'am' ? 'ህግ እና ደንቦችን ተስማምቻለሁ' : 'I agree to the terms and rules'}</p>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            setShowTermsModal(true);
                          }} 
                          className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
                        >
                          {language === 'am' ? 'ህግ እና ደንቦችን አንብብ' : 'Read Terms & Conditions'}
                        </button>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                {step > 1 && (
                  <button onClick={() => setStep(step - 1)} className="p-5 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl transition-all shadow-sm">
                    <ChevronLeft size={24} />
                  </button>
                )}
                <button 
                  onClick={step === stepConfig.length ? handleSignup : handleNext}
                  disabled={isSubmitting}
                  className="flex-1 py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[14px] transition-all flex items-center justify-center gap-3 uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="animate-spin" /> : (
                    <>
                      <span>{step === stepConfig.length ? t('btn.signup') : t('btn.continue')}</span>
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              </div>

              <p className="pt-6 text-center text-slate-400 text-xs font-bold">
                {t('have_account')} <Link to="/login" className="text-emerald-600 font-black ml-2 hover:underline">{t('signin')}</Link>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Cam Scanner Overlay */}
      <AnimatePresence>
        {isScanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 lg:p-12 overflow-hidden">
            <div className="absolute top-6 right-6 lg:top-12 lg:right-12 z-10 flex gap-4">
              <button onClick={() => setCameraMode(cameraMode === 'face' ? 'idFront' : 'face')} className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white"><RefreshCw size={24} /></button>
              <button onClick={() => setIsScanning(false)} className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white"><X size={24} /></button>
            </div>
            
            <div className="w-full max-w-lg aspect-[3/4] relative">
              <video ref={videoRef} className="w-full h-full object-cover rounded-[3rem] border-2 border-emerald-500 shadow-[0_0_80px_rgba(16,185,129,0.3)]" playsInline autoPlay muted />
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none rounded-[3rem]"></div>
              
              {/* Scan Area Overlay */}
              <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-emerald-500/50 ${cameraMode === 'face' ? 'w-[70%] aspect-square rounded-full' : 'w-[85%] aspect-[3/2] rounded-3xl'}`}>
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500"></div>
                
                {/* Scanner Animation Line */}
                <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] z-10" />
              </div>
            </div>

            <div className="mt-12 text-center space-y-6">
              <h3 className="text-white text-xl font-black uppercase tracking-widest">{cameraMode === 'face' ? t('signup.face_scan') : t('signup.id_scan')}</h3>
              <p className="text-slate-400 text-sm font-medium max-w-xs">{cameraMode === 'face' ? 'የፊትዎን ፎቶ ከላይ ባለው ክበብ ውስጥ ያድርጉ / Align your face in the circle' : 'መታወቂያዎን በሚታየው ቦታ ውስጥ ያስገቡ / Align ID inside the scan area'}</p>
              <button 
                onClick={captureScan}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 border-4 border-slate-100 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-emerald-600 rounded-full"></div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms Modal - Modernized */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3rem] w-full max-w-xl p-10 relative shadow-2xl">
                <button onClick={() => setShowTermsModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
                <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                  <FileText className="text-emerald-500" size={32} />
                  {t('signup.terms_modal_title')}
                </h3>
                <div className="h-96 overflow-y-auto pr-4 mb-8 text-sm text-slate-600 leading-relaxed font-medium scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  <div className="space-y-6">
                    {legalRules.length > 0 ? (
                      legalRules.map((rule, idx) => (
                        <div key={rule.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-2">ደንብ #{idx + 1}</span>
                           <p className="text-slate-900 font-bold mb-2">{rule.title}</p>
                           <p className="text-xs leading-relaxed">{rule.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="whitespace-pre-wrap">{TERMS_AND_CONDITIONS}</div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setAgreedToTerms(true);
                    setShowTermsModal(false);
                  }} 
                  className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
                >
                  Confirm & Agree
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
