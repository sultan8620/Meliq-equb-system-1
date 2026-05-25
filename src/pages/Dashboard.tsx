import { confirmAction, promptAction } from '../utils/dialogs';
import Inspiration from '../components/Inspiration';
import ShareApp from '../components/ShareApp';
import Marketplace from '../components/Marketplace';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { useAuth } from '../components/FirebaseProvider';
import { signOut, updatePassword } from 'firebase/auth';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';
import { auth, db, handleFirestoreError as logFirestoreError, OperationType, FirestoreErrorInfo } from '../firebase';
import { useLanguage } from '../lib/LanguageContext';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, or, deleteDoc, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';

const Magnetic = ({ children, className }: { children: React.ReactNode, className?: string, key?: any }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;
    
    x.set(distanceX * 0.35);
    y.set(distanceY * 0.35);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={`w-full ${className || ''}`}
    >
      {children}
    </motion.div>
  );
};
import { Users, Image as ImageIcon, Paperclip, PhoneCall, Video as VideoCall, FileDown, DollarSign, Calendar, LogOut, ShieldCheck, User as UserIcon, Clock, CheckCircle, Info, CreditCard, History, Trophy, ArrowUpRight, Wallet, MessageCircle, Send, Video, Mic, Square, FileText, Camera, MapPin, Phone as PhoneIcon, Play, ChevronRight, Bell, Edit, Trash2, Upload, XCircle, Gift, HelpCircle, Settings, AlertOctagon, LayoutDashboard, ShoppingBag, Layers, Search, Hash, Copy, UserCheck, FileSignature, Download, Printer, AlertTriangle, X, Shield, Zap, Share2, Lightbulb, Home, MessageSquare, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addDoc } from 'firebase/firestore';
import { ProfileEditFields } from '../components/MemberProfileEdit';

interface Group {
  id: string;
  name: string;
  type: string;
  limit: number;
  amount: number;
  memberCount: number;
  nextDrawDate?: any;
  createdAt?: any;
  currentRound?: number;
}

interface GroupMember {
  uid: string;
  fullName: string;
  slots: number;
  status: string;
  faceScan?: string;
  idFront?: string;
  idBack?: string;
  addressRegion?: string;
  role?: string;
  isAdmin?: boolean;
  phone?: string;
  memberCode?: string;
  wonDraw?: boolean;
}

const RULES_CONTENT = [
  { 
    id: 1, 
    amTitle: 'የዕቁብ ማቋረጥ', 
    enTitle: 'Cancellation Policy',
    am: 'ዕቁቡን ጀምሮ በመሀል ያቋረጠ ሰው ገንዘቡ ተመላሽ የሚሆነው ያገልግሎት ተቆርጦ በመጨረሻ ይሆናል።', 
    en: 'Refunds for cancelled memberships are subject to service fees and disbursed at cycle end.'
  },
  { 
    id: 2, 
    amTitle: 'ወቅታዊ ክፍያ', 
    enTitle: 'Punctual Payment',
    am: 'አንድ ዕቁብተኛ ግለሰብ በሰዓቱ ገንዘቡ መከፈልና የሰብሳቢው ፍርማ ማረጋገጥ አለበት።', 
    en: 'Punctual payment and verified collector signature are mandatory for all transactions.'
  },
  { 
    id: 3, 
    amTitle: 'የገንዘብ ጥያቄ', 
    enTitle: 'Withdrawal Rules',
    am: 'ከእጣ ውጪ ብር ስጡኝ ማለት አይቻልም ቢጠየቁም አይሰጥም።', 
    en: 'Withdrawal requests outside the official draw schedule will not be honored.'
  },
  { 
    id: 4, 
    amTitle: 'የእጣ ዕድል', 
    enTitle: 'Slot Bonus',
    am: 'ሦስት እጣ ያለው ሰው 1 እጣ በማንኛውም ሰዓት እንዲወስድ ይፈቀድለታል።', 
    en: 'Members with three active slots are entitled to prioritize one draw at any time.'
  },
  { 
    id: 5, 
    amTitle: 'ድንገተኛ እርዳታ', 
    enTitle: 'Emergency Access',
    am: 'ድንገተኛ አደጋ የደረሰበት ሰው በማንኛውም ሰዓት ለእቁቡ አባል አስረድቶ መውሰድ ይችላል።', 
    en: 'In case of severe emergency, members can access funds upon group verification.'
  }
];

const DrawsView = ({ upcomingDraws, winners, group }: { upcomingDraws: any[], winners: any[], group: any }) => {
  const { t, language } = useLanguage();
  const [activeDrawTab, setActiveDrawTab] = useState<'upcoming' | 'history'>('upcoming');
  const [selectedDraw, setSelectedDraw] = useState<any>(null);
  const [countdown, setCountdown] = useState({ days: '00', hours: '00', mins: '00', secs: '00' });

  const totalDistributed = winners.reduce((acc, curr) => acc + (parseInt(curr.amount) || 0), 0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // Use set nextDrawDate if available, otherwise default to tonight at 8 PM
      const nextDraw = group?.nextDrawDate ? new Date(group.nextDrawDate) : new Date();
      if (!group?.nextDrawDate) {
        nextDraw.setHours(20, 0, 0, 0);
        if (now > nextDraw) nextDraw.setDate(nextDraw.getDate() + 1);
      }
      
      const diff = nextDraw.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown({ days: '00', hours: '00', mins: '00', secs: '00' });
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({
        days: d.toString().padStart(2, '0'),
        hours: h.toString().padStart(2, '0'),
        mins: m.toString().padStart(2, '0'),
        secs: s.toString().padStart(2, '0')
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [group]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pb-20 relative">
      {/* Modal Detail */}
      <AnimatePresence>
        {selectedDraw && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setSelectedDraw(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2.5rem] p-10 shadow-2xl max-w-lg w-full border border-slate-100 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-gold-500/5 rounded-bl-[5rem] -mr-10 -mt-10" />
              
              <div className="flex items-center gap-6 mb-8 relative z-10">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-gold-500 shadow-lg">
                  {activeDrawTab === 'history' ? <Trophy size={24} /> : <Calendar size={24} />}
                </div>
                <div>
                   <h3 className="text-2xl font-black font-display tracking-tight text-slate-900 mb-1">
                     {selectedDraw.title || selectedDraw.name}
                   </h3>
                   <span className="px-3 py-1 bg-gold-50 text-gold-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-gold-100">
                     {activeDrawTab === 'history' ? (language === 'am' ? 'ባለፈው የደረሰው' : 'History Record') : (language === 'am' ? 'ቀጣይ ፕሮግራም' : 'Upcoming Session')}
                   </span>
                </div>
              </div>

              <div className="space-y-6 mb-10 relative z-10">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'ቀን' : 'Date'}</span>
                    <span className="text-sm font-bold text-slate-700">{selectedDraw.date}</span>
                  </div>
                  {selectedDraw.week && (
                    <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'ሳምንት' : 'Week'}</span>
                      <span className="text-sm font-bold text-slate-700">{selectedDraw.week}</span>
                    </div>
                  )}
                  {selectedDraw.amount && (
                    <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'መጠን' : 'Amount'}</span>
                      <span className="text-sm font-bold text-emerald-600">{selectedDraw.amount} ETB</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'ሁኔታ' : 'Status'}</span>
                    <span className="text-sm font-bold text-slate-700 uppercase">{selectedDraw.status || 'Verified'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">{language === 'am' ? 'ተጨማሪ መረጃ' : 'Additional Insights'}</span>
                  <p className="text-slate-500 font-medium text-xs leading-relaxed pl-2 italic">
                    {selectedDraw.details || (language === 'am' ? 'ይህ የእጣ አወጣጥ ሂደት በታላቅ ግልጽነት እና ፍትሃዊነት በዲጂታል ሲስተም የተከናወነ ነው።' : 'This draw process is conducted with absolute transparency and fairness using our digital verification system.')}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedDraw(null)}
                className="w-full py-5 bg-slate-900 text-gold-500 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-xl hover:shadow-gold-500/10 transition-all active:scale-[0.98]"
              >
                {language === 'am' ? 'ዝጋ' : 'Close Detail'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <div className="md:col-span-2">
          <div className="bg-slate-900 rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl group h-full">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-[120px] -mr-48 -mt-48 transition-all group-hover:bg-gold-500/20" />
            <div className="flex items-center gap-12 text-center md:text-left relative z-10">
              <div className="flex-1">
                <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/10 rounded-full border border-white/10 mb-8 backdrop-blur-md">
                   <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-400">{language === 'am' ? 'የእጣ አወጣጥ ሁኔታ' : 'LIVE DRAW STATUS'}</span>
                </div>
                <h3 className="text-4xl sm:text-5xl font-display font-black mb-6 tracking-tighter leading-tight drop-shadow-md">
                  {language === 'am' ? 'ቀጣዩ የእጣ አወጣጥ' : 'Next Exclusive Draw Session'}
                </h3>
                <div className="flex flex-wrap gap-x-12 gap-y-6 justify-center md:justify-start mb-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">{language === 'am' ? 'ዓይነት' : 'Cycle Type'}</span>
                    <span className="text-xl font-bold uppercase tracking-tight text-white">{group?.type || 'Vanguard'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">{language === 'am' ? 'ባለእጣ' : 'Total Potential'}</span>
                    <span className="text-xl font-bold uppercase tracking-tight text-white">{group?.amount?.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">{language === 'am' ? 'ሳምንት' : 'Week'}</span>
                    <span className="text-xl font-bold uppercase tracking-tight text-white">#{winners.length + 1}</span>
                  </div>
                </div>
              </div>
              
              <div className="hidden lg:flex flex-col items-center gap-6">
                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl group hover:bg-white/10 transition-all">
                  <Trophy size={64} className="text-gold-500 transform group-hover:rotate-12 transition-transform duration-500" />
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-black text-gold-500 uppercase tracking-widest mb-1">{language === 'am' ? 'አሸናፊዎች' : 'Winners to date'}</p>
                   <p className="text-2xl font-black text-white">{winners.length}</p>
                </div>
              </div>
            </div>
               <div>
                  <div className="flex items-center justify-center md:justify-start gap-5 mb-6">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center text-gold-400 border border-white/10 shadow-2xl relative">
                       <Trophy size={40} />
                       <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg">
                          <CheckCircle size={12} className="text-white" />
                       </div>
                    </div>
                    <div>
                       <h2 className="text-4xl font-display font-black tracking-tighter uppercase leading-none mb-2">
                         {language === 'am' ? 'የእጣ ማዕከል' : 'Draw Center'}
                       </h2>
                       <div className="flex items-center gap-2">
                          <div className="h-1 w-8 bg-gold-500 rounded-full" />
                          <p className="text-[10px] font-black text-gold-500 uppercase tracking-widest italic">{language === 'am' ? 'ግልጽነት እና ፍትሃዊነት' : 'Transparency & Fairness'}</p>
                       </div>
                    </div>
                  </div>
                  <p className="text-slate-400 font-medium max-w-xl text-sm leading-relaxed mb-8">
                     {language === 'am' 
                       ? 'የመሊቅ ዕቁብ የእጣ አወጣጥ ሂደት ሁሉንም አባላት በእኩልነት የሚያሳትፍ እና በዲጂታል መልኩ የሚከናወን ነው። እዚህ ጋር የቀደሙ አሸናፊዎችን እና ቀጣይ የእጣ ቀናትን ማየት ይችላሉ።' 
                       : `${t('common.appName').toUpperCase()} draws are conducted digitally, ensuring absolute fairness and equal opportunity for all members. Monitor previous winners and session dates here.`}
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                     <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                        <ShieldCheck size={16} className="text-gold-500" />
                        {language === 'am' ? 'ህጋዊ የተረጋገጠ' : 'Legally Verified'}
                     </div>
                     <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                        <Users size={16} className="text-emerald-500" />
                        {language === 'am' ? 'ለሁሉም እኩል' : 'Equal For All'}
                     </div>
                  </div>
               </div>
               <motion.div 
                 whileHover={{ scale: 1.05 }}
                 onClick={() => setSelectedDraw({ 
                   title: language === 'am' ? 'ባለ እድለኛ እንቆቅልሽ' : 'Drawing Algorithm', 
                   details: language === 'am' ? 'የእኛ የእጣ አወጣጥ ሲስተም በዘመናዊ እና ግልጽነት ባለው መልኩ የተገነባ በመሆኑ ለማንም አያዳላም።' : 'Our drawing algorithm is built on provably fair digital selection, ensuring zero human bias.',
                   status: 'Active',
                   date: 'LIVE'
                 })}
                 className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 text-center min-w-[280px] shadow-2xl relative group/timer cursor-pointer"
               >
                  <div className="absolute inset-0 bg-gold-500/5 opacity-0 group-hover/timer:opacity-100 transition-all rounded-[3rem]" />
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-6 relative z-10">
                    {language === 'am' ? 'ቀጣዩ እጣ የሚወጣው' : 'Next Draw In'}
                  </p>
                  <div className="flex items-center justify-center gap-4 mb-6 relative z-10">
                     <div className="text-4xl font-display font-black text-gold-400 tracking-tighter">
                       {countdown.hours} : {countdown.mins} : {countdown.secs}
                     </div>
                  </div>
                  <div className="flex justify-center gap-10 text-[8px] font-bold text-white/30 uppercase tracking-widest relative z-10">
                     <div className="flex flex-col gap-1"><span>{language === 'am' ? 'ባለ' : 'Hrs'}</span><span className="text-gold-500/50 text-[10px]">{language === 'am' ? 'ሰዓት' : 'Hours'}</span></div>
                     <div className="flex flex-col gap-1"><span>{language === 'am' ? 'ደቂቃ' : 'Mins'}</span><span className="text-gold-500/50 text-[10px]">{language === 'am' ? 'ደቂቃዎች' : 'Minutes'}</span></div>
                     <div className="flex flex-col gap-1"><span>{language === 'am' ? 'ሰኮንድ' : 'Secs'}</span><span className="text-gold-500/50 text-[10px]">{language === 'am' ? 'ሰኮንዶች' : 'Seconds'}</span></div>
                  </div>
               </motion.div>
            </div>
          </div>

          <div className="bg-emerald-600 rounded-[3.5rem] p-10 text-white shadow-2xl flex flex-col justify-between group overflow-hidden relative cursor-default">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
           <div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                 <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-display font-black tracking-tighter uppercase mb-4 italic underline decoration-white/20 underline-offset-8">
                 {language === 'am' ? 'የተረጋገጠ ክፍያ' : 'Total Distributed'}
              </h3>
              <p className="text-white/80 font-medium text-xs leading-relaxed">
                 {language === 'am' ? 'እስካሁን ለአባላት የደረሰ ጠቅላላ ክፍያ።' : 'Total prize money distributed to our community members.'}
              </p>
           </div>
           <div className="mt-8">
              <div className="text-4xl font-display font-black text-white">450,000 <span className="text-[10px] uppercase opacity-60">ETB</span></div>
              <div className="mt-2 flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
                 <span className="text-[9px] font-black uppercase text-emerald-100">{language === 'am' ? 'መረጃው ትክክል ነው' : 'Audit Confirmed'}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex bg-slate-100 p-2 rounded-[2.5rem] w-full md:w-fit border border-slate-200">
          {[
            { id: 'upcoming', label: language === 'am' ? 'ቀጣይ ፕሮግራሞች' : 'Upcoming Sessions', icon: Clock },
            { id: 'history', label: language === 'am' ? 'ያለፉ አሸናፊዎች' : 'Previous Winners', icon: History }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDrawTab(tab.id as any)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeDrawTab === tab.id ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/30 ring-4 ring-slate-900/10' : 'text-slate-400 hover:bg-white hover:text-slate-900'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          {language === 'am' ? 'የቀጥታ ስርጭት መረጃ' : 'Live Draw Status'}
        </div>
      </div>

      {activeDrawTab === 'upcoming' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {upcomingDraws.length === 0 ? (
             <div className="col-span-full py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem]">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4 border border-slate-100">
                   <Calendar size={28} />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                  {language === 'am' ? 'ምንም የሚወጣ እጣ የለም' : 'No scheduled draws found'}
                </p>
             </div>
           ) : (
              upcomingDraws.map((item, i) => (
                <motion.div 
                  key={item.id || i} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedDraw(item)} 
                  className="p-10 bg-white rounded-[3.5rem] border border-slate-100 shadow-xl group hover:border-gold-500/50 hover:shadow-2xl hover:shadow-gold-500/10 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]"
                >
                   <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[4rem] group-hover:bg-gold-50 transition-all" />
                   
                   <div className="flex items-center justify-between mb-10 relative z-10">
                      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-gold-500 transition-all shadow-sm">
                         <Calendar size={28} />
                      </div>
                      {item.status && (
                        <div className="px-4 py-1.5 bg-amber-50 rounded-full text-[9px] font-black text-amber-500 uppercase tracking-widest border border-amber-100 italic shadow-sm">
                           {item.status}
                        </div>
                      )}
                   </div>

                   <div className="space-y-2 mb-8 relative z-10">
                      <h4 className="text-2xl font-display font-black text-slate-900 uppercase tracking-tighter group-hover:text-gold-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         {language === 'am' ? 'ኦፊሴላዊ ፕሮግራም' : 'Official Session'}
                      </p>
                   </div>

                   <div className="grid grid-cols-2 gap-8 relative z-10">
                      <div className="space-y-1.5">
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">{language === 'am' ? 'ቀን' : 'Date'}</span>
                         <div className="flex items-center gap-2 text-slate-600">
                            <Calendar size={14} className="text-gold-500" />
                            <p className="text-xs font-bold">{item.date}</p>
                         </div>
                      </div>
                      <div className="space-y-1.5">
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">{language === 'am' ? 'ሰዓት' : 'Time'}</span>
                         <div className="flex items-center gap-2 text-slate-600">
                            <Clock size={14} className="text-gold-500" />
                            <p className="text-xs font-bold">{item.time}</p>
                         </div>
                      </div>
                   </div>

                   <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between relative z-10">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'ዝርዝር መግለጫ' : 'Details View'}</span>
                      <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all transform group-hover:translate-x-1">
                         <ArrowUpRight size={14} />
                      </div>
                   </div>
                </motion.div>
              ))
           )}
        </div>
      )}

      {activeDrawTab === 'history' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
           {winners.length === 0 ? (
             <div className="col-span-full py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem]">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4 border border-slate-100">
                   <History size={28} />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                  {language === 'am' ? 'ምንም ያለፈ አሸናፊ የለም' : 'No winners recorded yet'}
                </p>
             </div>
           ) : (
             winners.map((winner, idx) => (
               <motion.div 
                 key={winner.id} 
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 onClick={() => setSelectedDraw(winner)} 
                 className="p-10 bg-white rounded-[4rem] border border-slate-100 shadow-xl relative overflow-hidden group hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer active:scale-[0.98]"
               >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[4rem] group-hover:bg-emerald-100 transition-all translate-x-2 -translate-y-2" />
                  
                  <div className="flex items-center gap-6 mb-10 relative z-10">
                     <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-gold-500 shadow-2xl relative">
                        <UserIcon size={32} />
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                           <Trophy size={14} />
                        </div>
                     </div>
                     <div>
                        <h5 className="font-display font-black text-slate-900 uppercase tracking-tight text-xl mb-1 leading-none">{winner.name}</h5>
                        <div className="flex items-center gap-2">
                           <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                           <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest italic">{language === 'am' ? 'ባለድለኛ አሸናፊ' : 'Verified Winner'}</span>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                     <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner group-hover:bg-white group-hover:shadow-xl transition-all">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'am' ? 'ሳምንት' : 'Week'}</p>
                           <p className="text-2xl font-display font-black text-slate-900"># {winner.week || '---'}</p>
                        </div>
                        <div className="text-right space-y-1">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'am' ? 'መጠን' : 'Amount'}</p>
                           <p className="text-2xl font-display font-black text-emerald-600">{winner.amount || '50,000'} <span className="text-[10px] opacity-60">ETB</span></p>
                        </div>
                     </div>
                     
                     <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <Calendar size={14} className="text-slate-300" />
                           <span>{winner.date}</span>
                        </div>
                        <div className="text-[10px] font-black text-gold-600 uppercase tracking-widest flex items-center gap-2 bg-gold-50 px-3 py-1 rounded-full">
                           <CheckCircle size={10} />
                           {language === 'am' ? 'የተረጋገጠ' : 'Paid Out'}
                        </div>
                     </div>
                  </div>
               </motion.div>
             ))
           )}
        </div>
      )}

      {/* New Section: Drawing Process & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-12">
        <div className="p-12 bg-slate-50 rounded-[4rem] border border-slate-100 group">
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gold-500 shadow-xl mb-6 transform group-hover:rotate-12 transition-all">
              <ShieldCheck size={32} />
           </div>
           <h3 className="text-2xl font-display font-black tracking-tighter text-slate-900 uppercase mb-4">
             {language === 'am' ? 'የእጣ አወጣጥ ሂደት' : 'Our Drawing Process'}
           </h3>
           <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
             {language === 'am' 
               ? 'እያንዳንዱ እጣ የሚወጣው በዘመናዊ ዲጂታል ቴክኖሎጂ ተጠቅመን ሲሆን ሁሉም ነገር በግልጽ እና በፍትሃዊነት እንዲከናወን እናደርጋለን።' 
               : 'Every draw is conducted using cutting-edge digital algorithms to ensure complete transparency, security, and absolute fairness for every member.'}
           </p>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             {[
               { title: language === 'am' ? 'ዲጂታል ቬሪፊኬሽን' : 'Digital Verification', desc: language === 'am' ? 'እያንዳንዱ አባል በእኩልነት እንዲሳተፍ ይደረጋል።' : 'Zero-human interference process.', icon: LayoutDashboard },
               { title: language === 'am' ? 'ፈጣን ማሳወቂያ' : 'Instant Alert', desc: language === 'am' ? 'አሸናፊው ወዲያውኑ መልእክት ይደርሰዋል።' : 'Notified via app and SMS.', icon: Bell }
             ].map((step, i) => (
               <motion.div 
                 key={i} 
                 whileHover={{ y: -3, scale: 1.02 }}
                 className="p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-lg transition-all"
               >
                  <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-3 group-hover:bg-slate-900 group-hover:text-white transition-all">
                     <step.icon size={16} />
                  </div>
                  <h5 className="font-display font-black text-slate-900 uppercase tracking-tighter text-sm mb-1">{step.title}</h5>
                  <p className="text-slate-400 text-[10px] font-medium leading-relaxed">{step.desc}</p>
               </motion.div>
             ))}
           </div>
        </div>

        <div className="p-12 bg-slate-900 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl" />
           <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-gold-400">
                 <History size={24} />
              </div>
              <div>
                 <h3 className="text-xl font-display font-black tracking-tight uppercase leading-none">{language === 'am' ? 'የቅርብ ጊዜ እንቅስቃሴ' : 'Recent Activity'}</h3>
                 <p className="text-[10px] font-black text-gold-500/50 uppercase tracking-widest mt-1 italic">{language === 'am' ? 'በቀጥታ የተረጋገጠ' : 'Live Verified'}</p>
              </div>
           </div>

           <div className="space-y-4">
              {[
                { user: 'Sefadin K.', action: language === 'am' ? 'የቅርብ ጊዜ ክፍያ አጠናቋል' : 'Confirmed monthly contribution', time: '2m ago' },
                { user: 'Abenezer M.', action: language === 'am' ? 'ለቀጣይ እጣ ተመዝግቧል' : 'Registered for upcoming draw', time: '15m ago' },
                { user: 'Biniam T.', action: language === 'am' ? 'ባለፈው ሳምንት እጣ አሸንፏል' : 'Won previous weekly session', time: '1h ago' }
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-default">
                   <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold text-gold-400 border border-white/10">
                      {activity.user.split(' ').map(n => n[0]).join('') }
                   </div>
                   <div className="flex-1">
                      <p className="text-[11px] font-black">{activity.user}</p>
                      <p className="text-[10px] text-slate-400">{activity.action}</p>
                   </div>
                   <span className="text-[9px] font-bold text-slate-500">{activity.time}</span>
                </div>
              ))}
           </div>

           <button className="w-full mt-8 py-4 bg-white/10 hover:bg-white border border-white/10 hover:text-slate-900 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">
              {language === 'am' ? 'ሁሉንም እንቅስቃሴዎች አሳይ' : 'View Full Audit Trail'}
           </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userTeam, setUserTeam] = useState<any>(null);

  useEffect(() => {
    if (userData) {
      setIsAdmin(userData.role === 'admin' || userData.role === 'super_admin');
    }
  }, [userData]);

  useEffect(() => {
    if (user && userData?.teamId) {
      const unsub = onSnapshot(doc(db, 'teams', userData.teamId), (docSnap) => {
        if (docSnap.exists()) {
          setUserTeam({ id: docSnap.id, ...docSnap.data() });
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, `teams/${userData.teamId}`));
      return () => unsub();
    }
  }, [user, userData?.teamId]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [userPenalties, setUserPenalties] = useState<any[]>([]);
  const [paymentBank, setPaymentBank] = useState('');
  const [paymentPayerName, setPaymentPayerName] = useState('');
  const [paymentPayerAccount, setPaymentPayerAccount] = useState('');
  const [paymentCode, setPaymentCode] = useState('');
  const [memberCode, setMemberCode] = useState('');
  const [receiptImages, setReceiptImages] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalConfig, setSuccessModalConfig] = useState({ title: '', message: '', buttonText: '' });
  const [showDeletionRequestModal, setShowDeletionRequestModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('financial');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadChat, setUnreadChat] = useState(false);
  const [upcomingDraws, setUpcomingDraws] = useState<any[]>([]);
  const [drawWinners, setDrawWinners] = useState<any[]>([]);

  const handleUpdatePassword = async () => {
    if (!auth.currentUser) return;
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      triggerError(language === 'am' ? 'ስህተት' : 'Error', language === 'am' ? 'የይለፍ ቃሎቹ አይመሳሰሉም' : 'Passwords do not match');
      return;
    }
    if (changePasswordForm.newPassword.length < 6) {
      triggerError(language === 'am' ? 'ስህተት' : 'Error', language === 'am' ? 'የይለፍ ቃል ቢያንስ 6 ፊደላት መሆን አለበት' : 'Password must be at least 6 characters');
      return;
    }
    try {
      await updatePassword(auth.currentUser, changePasswordForm.newPassword);
      triggerSuccess(language === 'am' ? 'ተሳክቷል' : 'Success', language === 'am' ? 'የይለፍ ቃል ተቀይሯል። እባክዎ እንደገና ይግቡ' : 'Password updated. Please log in again.');
      setTimeout(async () => {
        await signOut(auth);
        window.location.href = '/login';
      }, 2000);
    } catch (error: any) {
      triggerError(language === 'am' ? 'ስህተት' : 'Error', error.message || (language === 'am' ? 'የይለፍ ቃል መቀየር አልተሳካም' : 'Failed to update password'));
    }
  };

  const handleRequestDeletion = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'deletion_requests'), {
        userId: user.uid,
        userName: userData?.fullName || 'N/A',
        userPhone: userData?.phone || 'N/A',
        reason: deletionReason,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setShowDeletionRequestModal(false);
      triggerSuccess(language === 'am' ? 'ተሳክቷል' : 'Success', language === 'am' ? 'የመዝጊያ ጥያቄዎ ለአድሚን ተልኳል። አድሚን ሲፈቅድልዎ አካውንትዎ ይሰረዛል።' : 'Your deletion request has been sent to admin. Your account will be deleted once approved.');
    } catch (error: any) {
      triggerError(language === 'am' ? 'ስህተት' : 'Error', language === 'am' ? 'ጥያቄውን መላክ አልተሳካም' : 'Failed to send request');
    }
  };

  const [isOnline, setIsOnline] = useState(true);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [membersFilter, setMembersFilter] = useState<'all' | 'winners' | 'active'>('all');
  const [showGuarantorInfoModal, setShowGuarantorInfoModal] = useState(false);
  const [guarantorSubTab, setGuarantorSubTab] = useState<'hub' | 'register' | 'history'>('hub');
  const [rulesSubTab, setRulesSubTab] = useState<'general' | 'guarantor'>('general');
  const [guarantorFormData, setGuarantorFormData] = useState({
    name: '',
    phone: '',
    job: '',
    address: '',
    relationship: '',
    faydaNumber: '',
    businessLicenseNumber: '',
    profilePhoto: '',
    faydaFrontPhoto: '',
    faydaBackPhoto: '',
    businessLicensePhoto: ''
  });
  const [isSubmittingGuarantor, setIsSubmittingGuarantor] = useState(false);
  const [selectedMemberModal, setSelectedMemberModal] = useState<GroupMember | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [toasts, setToasts] = useState<{id: string, title: string, message: string}[]>([]);

  const addToast = (title: string, message: string) => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const playNotificationSound = () => {
    const audio = document.getElementById('notification-sound') as HTMLAudioElement;
    if (audio) {
      audio.play().catch(e => console.log('Audio play failed', e));
    }
  };

  const prevNotifsCountRef = useRef(0);
  useEffect(() => {
    const currentUnread = notifications.filter(n => !n.read).length;
    if (currentUnread > prevNotifsCountRef.current && prevNotifsCountRef.current !== 0) {
      playNotificationSound();
      addToast(language === 'am' ? 'ማሳወቂያ' : 'Notification', language === 'am' ? 'አዲስ ማሳወቂያ ደርሶዎታል' : 'You have a new notification');
    }
    prevNotifsCountRef.current = currentUnread;
  }, [notifications, language]);

  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [selectedReceiptImages, setSelectedReceiptImages] = useState<string[]>([]);
  const [showReceiptImagesModal, setShowReceiptImagesModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showFullProfileImg, setShowFullProfileImg] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<any>({ 
    fullName: '', 
    addressRegion: '', 
    addressZone: '', 
    addressWoreda: '', 
    addressKebele: '',
    jobTitle: '',
    ekubType: '',
    phone: '',
    password: '',
    idFront: '', 
    idBack: '', 
    faceScan: '' 
  });
  const [messages, setMessages] = useState<any[]>([]);
  
  const prevMessagesCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessagesCountRef.current && prevMessagesCountRef.current !== 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.senderId !== user?.uid) {
         playNotificationSound();
         addToast(language === 'am' ? 'አዲስ መልእክት' : 'New Message', lastMsg.senderName + ': ' + (lastMsg.text?.length > 30 ? lastMsg.text.substring(0, 30) + '...' : lastMsg.text));
      }
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages, user?.uid, language]);

  const [newMessage, setNewMessage] = useState('');
  const [chatSubTab, setChatSubTab] = useState<'group' | 'admin'>('group');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);

  const verifiedPaymentsTotal = useMemo(() => {
    return payments
      .filter((p: any) => p.status === 'verified')
      .reduce((acc: number, curr: any) => acc + (parseInt(curr.amount) || 0), 0);
  }, [payments]);

  const totalWinnersCount = useMemo(() => {
    return drawWinners.length;
  }, [drawWinners]);

  const activeMessages = useMemo(() => {
    if (chatSubTab === 'group') {
      return messages.filter(m => m.groupId === userData?.groupId || m.targetType === 'all');
    } else {
      return messages.filter(m => m.targetType === 'private' && (m.targetUserId === user?.uid || m.senderId === user?.uid));
    }
  }, [messages, chatSubTab, userData?.groupId, user?.uid]);

  const [adminForms, setAdminForms] = useState<any[]>([]);
  const [userGuarantors, setUserGuarantors] = useState<any[]>([]);
  const multiplier = useMemo(() => {
    switch (userData?.frequency) {
      case 'daily': return 10;
      case 'fivedays': return 5;
      case 'tendays': return 10;
      case 'weekly': return 1;
      case 'monthly': return 1;
      default: return 1;
    }
  }, [userData?.frequency]);
  
  const getDurationLabel = () => {
    if (language === 'am') {
      if (userData?.frequency === 'weekly') return '1 ሳምንት';
      if (userData?.frequency === 'monthly') return '1 ወር';
      return `${multiplier} ቀናት`;
    } else {
      if (userData?.frequency === 'weekly') return '1 week';
      if (userData?.frequency === 'monthly') return '1 month';
      return `${multiplier} days`;
    }
  };
  
  // Support & Loans State
  const [supportSubTab, setSupportSubTab] = useState<'support' | 'loan'>('support');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanReason, setLoanReason] = useState('');
  const [userLoans, setUserLoans] = useState<any[]>([]);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [dynamicRules, setDynamicRules] = useState<any[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubRules = onSnapshot(collection(db, 'legal_rules'), (snapshot) => {
      const rulesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDynamicRules(rulesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'legal_rules');
    });

    return () => unsubRules();
  }, [user]);

  useEffect(() => {
    if (!user || !userData?.groupId) return;
    const q = query(
      collection(db, 'guarantors'),
      where('memberId', '==', user.uid),
      where('groupId', '==', userData.groupId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserGuarantors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
       handleFirestoreError(error, OperationType.LIST, 'guarantors');
    });
    
    const unsubForms = onSnapshot(query(collection(db, 'admin_forms'), where('userId', '==', user.uid)), (snapshot) => {
      setAdminForms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'admin_forms');
    });

    return () => {
      unsubscribe();
      unsubForms();
    };
  }, [user, userData?.groupId]);

  const triggerError = (title: string, message: string) => {
    setSuccessModalConfig({
      title,
      message,
      buttonText: language === 'am' ? 'ተረዳሁ' : 'Understood'
    });
    setShowSuccessModal(true);
  };

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    triggerError(
      language === 'am' ? 'የፈቃድ ችግር' : 'Permission Error',
      language === 'am' ? 'ይቅርታ፣ ይህንን ተግባር ለማከናወን በቂ ፈቃድ የለዎትም። እባክዎ ሰብሳቢዎን ያነጋግሩ።' : 'Sorry, you do not have sufficient permissions. Please contact your coordinator.'
    );
  };

  const handleGuarantorFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setGuarantorFormData(prev => ({ ...prev, [field]: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterGuarantor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guarantorFormData.name || !guarantorFormData.phone) {
      triggerError(
        language === 'am' ? 'ያልተሟላ መረጃ' : 'Incomplete Info',
        language === 'am' ? 'እባክዎ ቢያንስ ስም እና ስልክ ቁጥር ያስገቡ።' : 'Please provide at least Name and Phone number.'
      );
      return;
    }
    
    setIsSubmittingGuarantor(true);
    try {
      if (!user || !userData?.groupId) throw new Error("Missing context");
      const guarantorRef = collection(db, 'guarantors');
      await addDoc(guarantorRef, {
        memberId: user.uid,
        groupId: userData.groupId,
        memberName: userData.fullName,
        ...guarantorFormData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      triggerSuccess(
        language === 'am' ? 'ምዝገባ ተሳክቷል' : 'Registration Success',
        language === 'am' ? `${guarantorFormData.name} በተሳካ ሁኔታ ተመዝግቧል። ሰብሳቢው ካረጋገጡት በኋላ ይታያል።` : `${guarantorFormData.name} has been registered. It will appear once the collector verifies it.`
      );
      
      setGuarantorSubTab('hub');
      setGuarantorFormData({ 
        name: '', phone: '', job: '', address: '', relationship: '', 
        faydaNumber: '', businessLicenseNumber: '', profilePhoto: '', 
        faydaFrontPhoto: '', faydaBackPhoto: '', businessLicensePhoto: '' 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'guarantors');
    } finally {
      setIsSubmittingGuarantor(false);
    }
  };

  useEffect(() => {
    if (userData?.memberCode) {
      setMemberCode(userData.memberCode);
    }
  }, [userData?.memberCode]);

  const handleSendPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentBank || !paymentCode || !paymentPayerName || !paymentPayerAccount || (receiptImages.length === 0)) {
      triggerError(
        language === 'am' ? 'ያልተሟላ መረጃ' : 'Incomplete Info',
        language === 'am' ? 'ባንክ፣ ኮድ፣ የከፋይ ስም፣ የከፋይ ሂሳብ ቁጥር እና የደረሳኝ ፎቶ መሞላት አለባቸው።' : 'Please provide all details including payer name and account.'
      );
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (!user || !userData?.groupId) throw new Error("Missing context");
      const paymentRef = collection(db, 'payments');
      const calculatedAmount = userData?.totalPerSlot ? (userData.totalPerSlot * (userData.slots || 1)) : ((group?.amount || 0) * 1.1 * (userData?.slots || 1));
      await addDoc(paymentRef, {
        userId: user.uid,
        userName: userData.fullName || 'Unknown User',
        groupId: userData.groupId,
        groupName: group?.name || 'Unknown Group',
        amount: calculatedAmount,
        bank: paymentBank,
        payerName: paymentPayerName,
        payerAccount: paymentPayerAccount,
        transactionCode: paymentCode,
        receiptImages: receiptImages,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      triggerSuccess(
        language === 'am' ? ' ክፍያ ተልኳል' : 'Payment Sent',
        language === 'am' ? 'ክፍያዎ በተሳካ ሁኔታ ተልኳል። አድሚን እስኪያረጋግጥ ይጠብቁ።' : 'Payment sent successfully. Awaiting admin verification.'
      );
      
      setPaymentBank('');
      setPaymentCode('');
      setPaymentPayerName('');
      setPaymentPayerAccount('');
      // setMemberCode(''); // Keep member code
      setReceiptImages([]);
      setActiveTab('overview');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'payments');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerSuccess = (title: string, message: string, btnText?: string) => {
    setSuccessModalConfig({
      title,
      message,
      buttonText: btnText || (language === 'am' ? 'እሺ' : 'Close')
    });
    setShowSuccessModal(true);
  };
  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadChat(false);
      setTimeout(() => {
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [messages, activeTab]);

  const sendNotificationForMessage = async (msgText: string, targetType: string, targetId: string) => {
    try {
      if (targetType === 'private' && targetId === 'admin') {
        await addDoc(collection(db, 'notifications'), {
          recipientId: 'admin',
          title: language === 'am' ? `አዲስ መልእክት ከ ${userData?.fullName || 'አባል'}` : `New Message from ${userData?.fullName || 'Member'}`,
          message: msgText.length > 80 ? msgText.substring(0, 80) + '...' : msgText,
          createdAt: new Date().toISOString(),
          read: false
        });
      } else if (targetType === 'group' || targetId) {
        const grpId = targetId || userData?.groupId;
        if (grpId) {
          const otherMembers = members.filter(m => m.uid !== user?.uid);
          for (const member of otherMembers) {
            await addDoc(collection(db, 'notifications'), {
              recipientId: member.uid,
              title: language === 'am' ? `አዲስ መልእክት በ ${group?.name || 'ቡድን'}` : `New message in ${group?.name || 'Group'}`,
              message: msgText.length > 80 ? msgText.substring(0, 80) + '...' : msgText,
              createdAt: new Date().toISOString(),
              read: false
            });
          }
          await addDoc(collection(db, 'notifications'), {
            recipientId: 'admin',
            title: language === 'am' ? `የቡድን ውይይት መልእክት - ${group?.name || 'ቡድን'}` : `Group Chat Message - ${group?.name || 'Group'}`,
            message: `${userData?.fullName || 'Member'}: ${msgText.length > 80 ? msgText.substring(0, 80) + '...' : msgText}`,
            createdAt: new Date().toISOString(),
            read: false
          });
        }
      }
    } catch (e) {
      console.error("Failed to send notification for message", e);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user) return;
    if (chatSubTab === 'group' && !userData?.groupId) return;
    
    try {
      if (editingMessageId) {
        await updateDoc(doc(db, 'messages', editingMessageId), {
          text: newMessage,
          isEdited: true,
          updatedAt: serverTimestamp()
        });
        setEditingMessageId(null);
      } else {
        const textToSend = newMessage;
        if (chatSubTab === 'admin') {
          await addDoc(collection(db, 'messages'), {
            targetType: 'private',
            targetUserId: 'admin',
            senderId: user.uid,
            senderName: userData?.fullName || 'Member',
            senderRole: 'member',
            text: textToSend,
            createdAt: serverTimestamp()
          });
          await sendNotificationForMessage(textToSend, 'private', 'admin');
        } else {
          await addDoc(collection(db, 'messages'), {
            groupId: userData.groupId || '',
            senderId: user.uid,
            senderName: userData.fullName || 'Member',
            senderRole: 'member',
            text: textToSend,
            createdAt: serverTimestamp()
          });
          await sendNotificationForMessage(textToSend, 'group', userData.groupId || '');
        }
      }
      setNewMessage('');
    } catch (error) {
      if (editingMessageId) {
        handleFirestoreError(error, OperationType.UPDATE, `messages/${editingMessageId}`);
      } else {
        handleFirestoreError(error, OperationType.CREATE, 'messages');
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!await confirmAction(language === 'am' ? 'ይህንን መልእክት ማጥፋት ይፈልጋሉ?' : 'Are you sure you want to delete this message?')) return;
    try {
      console.log('Attempting to delete message:', messageId);
      await deleteDoc(doc(db, 'messages', messageId));
      console.log('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      handleFirestoreError(error, OperationType.DELETE, `messages/${messageId}`);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      let chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (!user || !userData?.groupId) return;
          try {
            await addDoc(collection(db, 'messages'), {
              groupId: userData.groupId,
              senderId: user.uid,
              senderName: userData.fullName,
              senderRole: 'member',
              text: '🎤 የድምፅ መልዕክት',
              audioUrl: base64Audio,
              createdAt: serverTimestamp()
            });
            await sendNotificationForMessage('🎤 የድምፅ መልዕክት', 'group', userData.groupId);
          } catch (error) {
            console.error(error);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access error:', err);
      triggerSuccess(language === 'am' ? 'ማሳወቂያ' : 'Notice', language === 'am' ? 'ማይክሮፎን መጠቀም አልተቻለም። እባክዎ የብሮውዘር ፈቃዶችን ያረጋግጡ።' : 'Could not use microphone. Please check browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file || !user || !userData?.groupId) return;
    
    // Check file size (limit to 1MB because of Firestore limit, roughly ~750KB limit to be safe)
    if (file.size > 800 * 1024) {
      triggerSuccess(language === 'am' ? 'ማሳወቂያ' : 'Notice', language === 'am' ? 'የፋይሉ መጠን ከ800KB መብለጥ የለበትም።' : 'File size must not exceed 800KB.');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      try {
        const msgText = type === 'image' ? '📸 ፎቶ (Image)' : `📄 ፋይል (File: ${file.name})`;
        await addDoc(collection(db, 'messages'), {
          groupId: userData.groupId,
          senderId: user.uid,
          senderName: userData.fullName,
          senderRole: 'member',
          text: msgText,
          [type === 'image' ? 'imageUrl' : 'fileUrl']: base64Data,
          fileName: file.name,
          createdAt: serverTimestamp()
        });
        await sendNotificationForMessage(msgText, 'group', userData.groupId);
      } catch (error) {
        console.error(error);
        triggerSuccess(language === 'am' ? 'ማሳወቂያ' : 'Notice', language === 'am' ? 'ፋይል መላክ አልተቻለም!' : 'Failed to send file. File may be too large.');
      }
    };
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject || !supportMessage || !user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        userId: user.uid,
        userName: userData?.fullName,
        groupId: userData?.groupId || '',
        subject: supportSubject,
        message: supportMessage,
        status: 'open',
        createdAt: serverTimestamp()
      });
      triggerSuccess(
        language === 'am' ? 'ተልኳል' : 'Sent',
        language === 'am' ? 'መልእክትዎ ደርሶናል' : 'Your message has been sent'
      );
      setSupportSubject('');
      setSupportMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'support_tickets');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmergencyRequest = async (item: { title: string; desc: string }) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      // Build minimal emergency request
      const emergencyData = {
        type: 'emergency_request',
        userId: user.uid,
        userName: userData?.fullName || 'User',
        groupId: userData?.groupId || '',
        title: item.title,
        message: item.desc,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      // Check approximate size (minimal approximation)
      const dataString = JSON.stringify(emergencyData);
      if (dataString.length > 500000) { // 0.5MB limit
        throw new Error("Emergency request payload too large.");
      }

      await addDoc(collection(db, 'admin_forms'), emergencyData);
      triggerSuccess(
        language === 'am' ? 'ተልኳል' : 'Sent',
        language === 'am' ? 'የአስቸኳይ ጊዜ እርዳታ ጥያቄዎ ለአድሚን ተልኳል' : 'Your emergency help request has been sent to the admin'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'admin_forms');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanAmount || !loanReason || !user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'loans'), {
        userId: user.uid,
        userName: userData?.fullName,
        groupId: userData?.groupId || '',
        amount: Number(loanAmount),
        reason: loanReason,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      triggerSuccess(
        language === 'am' ? 'ተልኳል' : 'Sent',
        language === 'am' ? 'የብድር ጥያቄዎ ደርሶናል' : 'Your loan request has been sent'
      );
      setLoanAmount('');
      setLoanReason('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'loans');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user || !userData) return;
    setIsSubmitting(true);
    try {
      if (profileForm.password) {
        await updatePassword(user, profileForm.password);
      }

      await addDoc(collection(db, 'admin_forms'), {
        type: 'profile_update',
        userId: user.uid,
        groupId: userData.groupId || '',
        title: language === 'am' ? 'የግል ማህደር ማስተካከያ' : 'Profile Update Request',
        message: `${userData.fullName || 'User'} wants to update their profile info.`,
        previousData: {
          fullName: userData.fullName || '',
          addressRegion: userData.addressRegion || '',
          addressZone: userData.addressZone || '',
          addressWoreda: userData.addressWoreda || '',
          addressKebele: userData.addressKebele || '',
          jobTitle: userData.jobTitle || '',
          ekubType: userData.ekubType || '',
          phone: userData.phone || '',
          idFront: userData.idFront || '',
          idBack: userData.idBack || ''
        },
        newData: {
          fullName: profileForm.fullName,
          addressRegion: profileForm.addressRegion,
          addressZone: profileForm.addressZone,
          addressWoreda: profileForm.addressWoreda,
          addressKebele: profileForm.addressKebele,
          jobTitle: profileForm.jobTitle,
          ekubType: profileForm.ekubType,
          phone: profileForm.phone || '',
          idFront: profileForm.idFront,
          idBack: profileForm.idBack
        },
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setIsEditingProfile(false);
      triggerSuccess(
        language === 'am' ? 'ጥያቄ ተልኳል' : 'Request Sent',
        language === 'am' ? 'የማስተካከያ ጥያቄዎ ለአድሚን ተልኳል። አድሚን ሲያረጋግጠው መረጃዎ ይቀየራል።' : 'Your profile update request has been sent to the admin for approval.'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'admin_forms');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'idFront' | 'idBack' | 'faceScan') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setProfileForm({ ...profileForm, [field]: compressed });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadReceipt = async (payment: any) => {
    const element = document.getElementById(`receipt-${payment.id}`);
    if (!element) {
      setSelectedPayment(payment);
      setShowReceiptModal(true);
      setTimeout(() => generatePDF(payment), 100);
      return;
    }
    generatePDF(payment);
  };

  const generatePDF = (payment: any) => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
      });
      
      const receiptId = payment.receiptId || payment.id.slice(0, 8).toUpperCase();
      const userName = payment.userName || userData?.fullName || '';
      const groupName = payment.groupName || group?.name || '';
      const date = payment.createdAt?.toDate ? payment.createdAt.toDate().toLocaleDateString() : new Date(payment.createdAt).toLocaleDateString();
      const time = payment.paymentDetails?.time || (payment.createdAt?.toDate ? payment.createdAt.toDate().toLocaleTimeString() : new Date(payment.createdAt).toLocaleTimeString());
      const amount = (payment.amount || 0).toLocaleString();

      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, 148, 210, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(15, 23, 42); 
      pdf.text(t('common.appName').toUpperCase(), 20, 30);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(99, 102, 241); 
      pdf.text('OFFICIAL RECEIPT', 20, 38);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(148, 163, 184); 
      pdf.text('Receipt ID', 100, 30);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(`#${receiptId}`, 100, 35);

      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Group ID', 100, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(payment.groupId?.slice(0, 8).toUpperCase() || 'N/A', 100, 46);
      
      pdf.setDrawColor(241, 245, 249); 
      pdf.line(20, 52, 128, 52);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Member Name', 20, 60);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(userName, 20, 65);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(148, 163, 184);
      pdf.text('Group/Round', 80, 60);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(groupName, 80, 65);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(148, 163, 184);
      pdf.text('Payment Date', 20, 75);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(date, 20, 80);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(148, 163, 184);
      pdf.text('Time', 80, 75);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(time, 80, 80);

      const bankMap: Record<string, string> = {
        'cbe': 'CBE', 'boa': 'Abyssinia', 'awash': 'Awash', 'dashen': 'Dashen', 'zemen': 'Zemen', 'telebirr': 'Telebirr'
      };
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Bank', 20, 90);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(payment.bank ? (bankMap[payment.bank] || payment.bank.toUpperCase()) : 'N/A', 20, 95);

      if (payment.payerName) {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(148, 163, 184);
        pdf.text('Payer', 80, 90);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(15, 23, 42);
        pdf.text(payment.payerName.slice(0, 20), 80, 95);
      }

      if (payment.payerAccount) {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(148, 163, 184);
        pdf.text('Account', 20, 105);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(15, 23, 42);
        pdf.text(payment.payerAccount.slice(0, 20), 20, 110);
      }

      if (payment.transactionCode) {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(148, 163, 184);
        pdf.text('TXN Code', 80, 105);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(15, 23, 42);
        pdf.text(payment.transactionCode, 80, 110);
      }
      
      pdf.setFillColor(15, 23, 42); 
      pdf.roundedRect(20, 118, 108, 35, 4, 4, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Amount Paid', 25, 130);
      pdf.setFontSize(18);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${amount} ETB`, 25, 143);
      
      pdf.setFontSize(9);
      pdf.setTextColor(52, 211, 153); 
      pdf.text('Status', 100, 130);
      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255);
      pdf.text(payment.status === 'active' || payment.status === 'approved' ? 'Verified' : 'Pending', 100, 143);
      
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139); 
      pdf.text('"Thank you. Your savings are secure."', 35, 168);

      // Add a digital signature placeholder line
      pdf.setDrawColor(203, 213, 225);
      pdf.line(90, 150, 128, 150);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text('Authorized Signature', 95, 155);
      
      pdf.setDrawColor(241, 245, 249);
      pdf.line(20, 160, 128, 160);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Digital Auth Verified`, 20, 170);
      pdf.text(`© ${new Date().getFullYear()} ${t('common.appName').toUpperCase()}`, 85, 170);
      
      pdf.save(`Receipt-${receiptId}.pdf`);
      setShowReceiptModal(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      triggerSuccess(language === 'am' ? 'ማሳወቂያ' : 'Notice', 'ደረሰኝ ማመንጨት አልተሳካም: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setReceiptImage(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setProfileForm(prev => ({ ...prev, [field]: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };


  useEffect(() => {
    if (location.state?.signupSuccess) {
      setShowSuccessModal(true);
      // Clear state to prevent modal showing on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (!user) return;
    
    // Real-time user data
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        
        // If user is pending or rejected, they should not see the full dashboard
        if (data.status === 'pending' || data.status === 'rejected') {
           navigate('/pending-approval', { 
             state: { 
               registeredInfo: { 
                 name: data.fullName, 
                 phone: data.phone, 
                 group: data.groupId, 
                 memberCode: data.memberCode 
               } 
             } 
           });
           return;
        }
        
        // Fetch group data if not already fetched or if groupId changed
        if (data.groupId) {
          let unsubMembers = () => {};
          let unsubMessages = () => {};

          const setupSubscriptions = async () => {
            const groupDoc = await getDoc(doc(db, 'groups', data.groupId));
            if (groupDoc.exists()) {
              setGroup({ id: groupDoc.id, ...groupDoc.data() } as Group);
            }
            
            // Real-time group members
            const qMembers = query(collection(db, 'users'), where('groupId', '==', data.groupId));
            unsubMembers = onSnapshot(qMembers, (snapshot) => {
              const memberData = snapshot.docs.map(doc => ({
                uid: doc.id,
                fullName: doc.data().fullName,
                slots: doc.data().slots || 1,
                status: doc.data().status,
                faceScan: doc.data().faceScan,
                wonDraw: doc.data().wonDraw || false
              }));
              setMembers(memberData);
            });

            // Real-time chat messages
            const qMessages = query(
              collection(db, 'messages'),
              or(
                where('groupId', '==', data.groupId),
                where('targetType', '==', 'all'),
                where('targetUserId', '==', user.uid),
                where('senderId', '==', user.uid)
              )
            );
            unsubMessages = onSnapshot(qMessages, (snapshot) => {
              let msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
              if (user) {
                msgs = msgs.filter(m => !m.deletedFor?.includes(user.uid));
              }
              // Check if unread
              if (snapshot.docChanges().some(change => change.type === 'added') && activeTab !== 'chat') {
                 setUnreadChat(true);
              }

              setMessages(msgs.sort((a: any, b: any) => {
                const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
                const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
                return aTime - bTime;
              }));
            });
          };
          setupSubscriptions();
          
          return () => {
            unsubMembers();
            unsubMessages();
          };
        }
      } else {
        // If document doesn't exist, we should clear userData
        setUserData(null);
        console.warn("Dashboard: User document does not exist for UID:", user.uid);
      }
    }, (error) => {
      console.error("Dashboard onSnapshot Error: ", error);
      triggerSuccess(language === 'am' ? 'ማሳወቂያ' : 'Notice', "Error loading user data: " + error.message);
      signOut(auth);
    });

    // Real-time notifications
    const qNotifs = query(
      collection(db, 'notifications'), 
      where('recipientId', '==', user.uid)
    );
    const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
      const notifData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      
      // Play sound only if it's a new added notification
      if (snapshot.docChanges().some(change => change.type === 'added')) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note (crystal clear chirp)
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.start();
            osc.stop(ctx.currentTime + 0.26);
          }
        } catch (e) {
          console.error('Synthetic sound play failed', e);
        }
      }
    }, error => handleFirestoreError(error, OperationType.LIST, 'notifications'));

    // Real-time payments
    const qPayments = query(
      collection(db, 'payments'),
      where('userId', '==', user.uid)
    );
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      const paymentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayments(paymentData.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      }));
    }, error => handleFirestoreError(error, OperationType.LIST, 'payments'));

    // Real-time penalties
    const qPenalties = query(
      collection(db, 'penalties'),
      where('userId', '==', user.uid)
    );
    const unsubPenalties = onSnapshot(qPenalties, (snapshot) => {
      const penaltyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserPenalties(penaltyData.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      }));
    }, error => handleFirestoreError(error, OperationType.LIST, 'penalties'));

    // Real-time loans
    const qLoans = query(
      collection(db, 'loans'),
      where('userId', '==', user.uid)
    );
    const unsubLoans = onSnapshot(qLoans, (snapshot) => {
      const loanData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserLoans(loanData.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      }));
    }, error => handleFirestoreError(error, OperationType.LIST, 'loans'));

    // Real-time support tickets
    const qTickets = query(
      collection(db, 'support_tickets'),
      where('userId', '==', user.uid)
    );
    const unsubTickets = onSnapshot(qTickets, (snapshot) => {
      const ticketData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserTickets(ticketData.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      }));
    }, error => handleFirestoreError(error, OperationType.LIST, 'support_tickets'));

    const unsubUpcomingDraws = onSnapshot(collection(db, 'upcoming_draws'), (snapshot) => {
      setUpcomingDraws(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => handleFirestoreError(error, OperationType.LIST, 'upcoming_draws'));

    const unsubWinners = onSnapshot(collection(db, 'draw_history'), (snapshot) => {
      setDrawWinners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, error => handleFirestoreError(error, OperationType.LIST, 'draw_history'));
    
    return () => {
      unsubUser();
      unsubNotifs();
      unsubPayments();
      unsubPenalties();
      unsubLoans();
      unsubTickets();
      unsubUpcomingDraws();
      unsubWinners();
    };
  }, [user]);

  const [systemSettings, setSystemSettings] = useState({
     autoApprove: false,
     notifyRegistrations: true
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setSystemSettings(prev => ({ ...prev, ...docSnap.data() }));
      }
    }, error => handleFirestoreError(error, OperationType.GET, 'system_settings/main'));
    return () => unsub();
  }, []);

  const handleContribute = async () => {
    if (!user || !userData || !group) return;
    
    if (!receiptImage || !paymentCode || !paymentBank || !paymentPayerName || !paymentPayerAccount) {
      triggerError(
        language === 'am' ? 'ያልተሟላ መረጃ' : 'Incomplete Info',
        language === 'am' ? 'እባክዎ የክፍያ ፎቶ፣ ኮድ፣ ባንክ እና የከፋይ መረጃ ያስገቡ።' : 'Please upload receipt, enter code, bank and payer details.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const generatedReceiptId = `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      await addDoc(collection(db, 'payments'), {
        userId: user.uid,
        userName: userData.fullName,
        groupId: userData.groupId,
        groupName: group.name,
        memberCode: userData.memberCode || '',
        amount: userData?.totalPerSlot ? (userData.totalPerSlot * (userData.slots || 1)) : ((group?.amount || 0) * 1.1 * (userData?.slots || 1)),
        status: systemSettings.autoApprove ? 'approved' : 'pending',
        type: 'contribution',
        bank: paymentBank,
        payerName: paymentPayerName,
        payerAccount: paymentPayerAccount,
        receiptImage: receiptImage,
        transactionCode: paymentCode,
        receiptId: generatedReceiptId,
        createdAt: serverTimestamp()
      });
      setShowContributeModal(false);
      setReceiptImage(null);
      setPaymentCode('');
      triggerSuccess(language === 'am' ? 'ማሳወቂያ' : 'Notice', t('dashboard.payment_sent_success'));
    } catch (error) {
      console.error('Contribution error:', error);
      triggerSuccess(language === 'am' ? 'ማሳወቂያ' : 'Notice', t('dashboard.payment_sent_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNextDrawDate = () => {
    if (!group || !group.id) return { date: t('dashboard.draw_soon'), diff: '' };
    
    if (group.nextDrawDate) {
      const next = new Date(group.nextDrawDate);
      const options: Intl.DateTimeFormatOptions = { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      };
      return { 
        date: next.toLocaleString(language === 'am' ? 'am-ET' : 'en-US', options), 
        diff: t('dashboard.next_draw') 
      };
    }

    // Fallback logic
    const created = group.createdAt ? (group.createdAt.toDate ? group.createdAt.toDate() : new Date(group.createdAt)) : new Date();
    const next = new Date(created);
    
    if (group.type === 'daily') next.setDate(next.getDate() + 1);
    else if (group.type === 'weekly') next.setDate(next.getDate() + 7);
    else if (group.type === 'fivedays') next.setDate(next.getDate() + 5);
    else if (group.type === 'monthly') next.setMonth(next.getMonth() + 1);
    
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    const dateStr = next.toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', options);
    
    return { date: dateStr, diff: t('dashboard.next_draw') };
  };

  const drawInfo = getNextDrawDate();

  const userMenuSections = useMemo(() => [
    { 
      group: language === 'am' ? 'ዋና ገጽ' : 'Dashboard', 
      items: [
        { 
          id: 'overview', 
          label: language === 'am' ? 'አጠቃላይ እይታ' : t('menu.user.overview'), 
          icon: LayoutDashboard,
          description: language === 'am' ? 'የእርሶ አጠቃላይ መረጃ' : 'General overview'
        },
        { 
          id: 'members', 
          label: language === 'am' ? 'የእጣ አባላት' : t('menu.user.members'), 
          icon: Users,
          description: language === 'am' ? 'የግሩፕ አባላት ዝርዝር' : 'Group members list'
        },
        { 
          id: 'draws', 
          label: language === 'am' ? 'የእጣ አወጣጥ' : t('menu.user.draws'), 
          icon: Trophy,
          description: language === 'am' ? 'የዕጣ አሸናፊዎች መረጃ' : 'Lottery draw details',
          badge: upcomingDraws.length > 0 ? 'Live' : undefined
        },
        { 
          id: 'market', 
          label: language === 'am' ? 'ገበያ (Market)' : t('menu.user.market'), 
          icon: ShoppingBag,
          description: language === 'am' ? 'እቃዎች መግዣ ገበያ' : 'Marketplace'
        },
        {
          id: 'inspiration',
          label: language === 'am' ? 'ምክር እና አነቃቂ' : 'Inspiration',
          icon: Lightbulb,
          description: language === 'am' ? 'የዕለቱ ምክሮች እና ጹፎች' : 'Daily advice and quotes'
        },
        { 
          id: 'share',
          label: language === 'am' ? 'አጋራ (Share)' : 'Share App',
          icon: Share2,
          description: language === 'am' ? 'ለወዳጅ ዘመድ ያጋሩ' : 'Share with friends'
        },
        { 
          id: 'guarantors', 
          label: language === 'am' ? 'ዋሶች (Guarantors)' : t('menu.user.guarantors'), 
          icon: ShieldCheck,
          description: language === 'am' ? 'የዋስ መረጃ እና ምዝገባ' : 'Guarantor details'
        }
      ] 
    },
    { 
      group: language === 'am' ? 'ፋይናንስ' : 'Finance', 
      items: [
        { 
          id: 'payments', 
          label: language === 'am' ? 'የክፍያ ታሪክ' : t('menu.user.payments'), 
          icon: CreditCard,
          description: language === 'am' ? 'የእለት እና ወር ክፍያዎች' : 'Your payment history'
        },
        { 
          id: 'payment-send',
          label: language === 'am' ? 'ክፍያ ላክ' : 'Send Payment',
          icon: Send,
          description: language === 'am' ? 'ለሰብሳቢው ክፍያ ያሳውቁ' : 'Submit payment proof'
        },
        { 
          id: 'member-id', 
          label: language === 'am' ? 'የአባል መታወቂያ' : 'Member ID', 
          icon: FileSignature,
          badge: 0,
          description: language === 'am' ? 'የመታወቂያ ካርድ ማውጫ' : 'View Member ID Card'
        }
      ] 
    },
    { 
      group: language === 'am' ? 'ግንኙነት' : 'Communication', 
      items: [
        { 
          id: 'chat', 
          label: language === 'am' ? 'የቡድን ውይይት' : t('menu.user.chat'), 
          icon: MessageCircle,
          description: language === 'am' ? 'ከአባላት ጋ መወያያ' : 'Group chat / discussion'
        },
        { 
          id: 'notifications', 
          label: language === 'am' ? 'ማሳወቂያዎች' : t('menu.user.notifications'), 
          icon: Bell,
          badge: notifications.filter(n => !n.read).length,
          description: language === 'am' ? 'ከአድሚን የሚላኩ መልእክቶች' : 'Admin notifications'
        },
        { 
          id: 'support', 
          label: language === 'am' ? 'የድጋፍ እና ብድር' : 'Support & Loans', 
          icon: HelpCircle,
          description: language === 'am' ? 'ድጋፍ እና ብድር መጠየቂያ' : 'Help & loan requests'
        }
      ] 
    },
    { 
      group: language === 'am' ? 'መለያ እና ደህንነት' : 'Account', 
      items: [
        { 
          id: 'profile', 
          label: language === 'am' ? 'የግል ማህደር' : t('menu.user.profile'), 
          icon: UserIcon,
          description: language === 'am' ? 'የራስዎን መረጃ መመልከቻ' : 'Your profile details'
        },
        { 
          id: 'rules', 
          label: language === 'am' ? 'ህግና ደንብ' : t('menu.user.rules'), 
          icon: FileText,
          description: language === 'am' ? 'የእቁብ ህጎች' : 'System rules'
        },
        { 
          id: 'settings', 
          label: language === 'am' ? 'ቅንብሮች' : t('menu.user.settings'), 
          icon: Settings,
          description: language === 'am' ? 'የአፕሊኬሽን ቅንብሮች' : 'App preferences'
        }
      ] 
    }
  ], [language, t, notifications]);

  const [rejectedInfo, setRejectedInfo] = useState<any>(null);
  const [isCheckingRejected, setIsCheckingRejected] = useState(true);

  useEffect(() => {
    if (user && !userData) {
      const checkRejected = async () => {
        try {
          console.log("Checking rejected_members for UID:", user.uid);
          const docRef = doc(db, 'rejected_members', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            console.log("User is confirmed rejected:", docSnap.data());
            setRejectedInfo(docSnap.data());
          } else {
            console.log("No rejection record found for UID:", user.uid);
          }
        } catch (e) {
          console.error("Error checking rejected (Permission Error?):", e);
        } finally {
          setIsCheckingRejected(false);
        }
      };
      checkRejected();
    } else if (userData) {
      setIsCheckingRejected(false);
    }
  }, [user, userData]);

  if (!userData) {
    if (isCheckingRejected) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full mb-4" 
          />
          <p className="text-slate-500 font-bold mb-6">{t('dashboard.loading')}</p>
        </div>
      );
    }

    if (rejectedInfo) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8 text-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-8 animate-bounce shadow-lg shadow-rose-100">
            <XCircle size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-tight">
            {language === 'am' ? 'ማመልከቻዎ ውድቅ ተደርጓል' : 'Application Rejected'}
          </h2>
          <p className="text-slate-500 font-medium mb-8 text-sm leading-relaxed">
            {language === 'am' 
              ? 'ይቅርታ፣ ያቀረቡት የአባልነት ማመልከቻ በአስተዳዳሪው ውድቅ ተደርጓል።' 
              : 'Sorry, your membership application has been rejected by the administrator.'}
          </p>

          <div className="w-full p-6 bg-rose-50 rounded-3xl border border-rose-100 mb-8 text-left">
            <div className="flex items-center gap-2 mb-3 text-rose-600">
              <AlertTriangle size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">{language === 'am' ? 'ምክንያት' : 'Reason'}</span>
            </div>
            <p className="text-slate-700 font-bold text-base italic leading-relaxed">
              "{rejectedInfo.rejectionReason || (language === 'am' ? 'ምንም ምክንያት አልተሰጠም' : 'No specific reason provided')}"
            </p>
            <div className="mt-4 pt-4 border-t border-rose-200/50">
               <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">
                 {language === 'am' ? 'ውድቅ የተደረገበት ቀን' : 'Rejected At'}: {rejectedInfo.rejectedAt ? (rejectedInfo.rejectedAt.toDate ? rejectedInfo.rejectedAt.toDate().toLocaleString() : new Date(rejectedInfo.rejectedAt).toLocaleString()) : 'N/A'}
               </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <button 
              onClick={async () => { await signOut(auth); window.location.href = '/signup'; }}
              className="py-4.5 px-6 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"
            >
              <UserCheck size={18} />
              {language === 'am' ? 'እንደገና ይመዝገቡ' : 'Register Again'}
            </button>
            <button 
              onClick={async () => { await signOut(auth); window.location.href = '/login'; }}
              className="py-4.5 px-6 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all"
            >
              {language === 'am' ? 'ውጣ' : 'Logout & Exit'}
            </button>
          </div>
          
          <p className="mt-12 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            {language === 'am' 
              ? 'ተጨማሪ መረጃ ከፈለጉ እባክዎ በቀጥታ ሰብሳቢዎን ያነጋግሩ።' 
              : 'If you need more information, please contact your coordinator directly.'}
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-inner"
        >
          <UserIcon size={32} />
        </motion.div>
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">{language === 'am' ? 'መለያዎን ማግኘት አልተቻለም' : 'Account Not Found'}</h3>
        <p className="text-slate-500 font-bold mb-8 text-sm max-w-xs leading-relaxed">
          {language === 'am' 
            ? 'የአባልነት መረጃዎ አልተገኘም ወይም ገና አልጸደቀም። እባክዎ ሰብሳቢዎን ያነጋግሩ።' 
            : 'Your membership account is not found or is pending approval. Please contact coordinator.'}
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {isAdmin && (
            <button 
              onClick={() => window.location.href = '/admin'}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 text-[12px] font-black uppercase tracking-widest"
            >
              <ShieldCheck size={16} />
              <span>ቁጥጥር (Admin)</span>
            </button>
          )}
          <button 
            onClick={() => { setLanguage(language === 'am' ? 'en' : 'am'); }}
            className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"
          >
            <span className="text-[12px] font-black uppercase tracking-widest text-slate-500">{language === 'am' ? 'ባህል/ቋንቋ' : 'Language'}</span>
            <div className="flex gap-1">
               <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${language === 'am' ? 'bg-gold-500 text-white' : 'bg-slate-200 text-slate-600'}`}>አ</span>
               <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${language === 'en' ? 'bg-gold-500 text-white' : 'bg-slate-200 text-slate-600'}`}>A</span>
            </div>
          </button>
          <button onClick={async () => { await signOut(auth); window.location.href = '/'; }} className="w-full py-3 bg-rose-50 text-rose-500 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-all">
            <LogOut size={16} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex font-sans">
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] sm:hidden"
            />
            <motion.div 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white z-[51] sm:hidden flex flex-col shadow-2xl p-4"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-gold-500 shadow-lg">
                    <ShieldCheck size={18} />
                  </div>
                  <span className="text-xs font-black text-slate-900 uppercase">{t('common.appName')} Dashboard</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400"><XCircle size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6">
                 {/* Sidebar navigation cloned here for mobile */}
                 <nav className="space-y-1">
                  {userMenuSections.map((section, sIndex) => (
                    <div key={sIndex} className={sIndex > 0 ? 'mt-6' : ''}>
                      <p className="px-3 mb-2 text-[14px] font-black uppercase tracking-[0.2em] text-slate-400">{section.group}</p>
                      <div className="space-y-1">
                        {section.items.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          return (
                            <div key={tab.id}>
                              <button 
                                onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                              >
                                <Icon size={20} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
                                <span className="text-[16px] font-bold uppercase tracking-wide text-left flex-1">{tab.label}</span>
                                {tab.badge !== undefined && (
                                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isActive ? 'bg-indigo-500 text-white' : 'bg-gold-500 text-white animate-pulse'}`}>
                                    {tab.badge}
                                  </span>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                 </nav>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
                {isAdmin && (
                  <button 
                    onClick={() => window.location.href = '/admin'}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 text-[15px] font-black uppercase tracking-wide"
                  >
                    <ShieldCheck size={20} />
                    <span>ቁጥጥር (Admin)</span>
                  </button>
                )}
                <button 
                  onClick={() => { setLanguage(language === 'am' ? 'en' : 'am'); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl"
                >
                  <span className="text-[14px] font-black uppercase tracking-wide text-slate-500">{language === 'am' ? 'ባህል/ቋንቋ' : 'Language'}</span>
                  <div className="flex gap-1">
                     <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${language === 'am' ? 'bg-gold-500 text-white' : 'bg-slate-200'}`}>አ</span>
                     <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${language === 'en' ? 'bg-gold-500 text-white' : 'bg-slate-200'}`}>A</span>
                  </div>
                </button>
                <button onClick={async () => { await signOut(auth); window.location.href = '/'; }} className="w-full py-4 bg-rose-50 text-rose-500 rounded-2xl text-[15px] font-black uppercase tracking-wide flex items-center justify-center gap-2">
                  <LogOut size={20} /> {t('nav.logout')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className="w-16 md:w-60 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0 z-40 hidden sm:flex shrink-0">
        <div className="p-4 flex items-center justify-between border-b border-slate-50 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-gold-500 shadow-lg">
              <ShieldCheck size={18} />
            </div>
            <span className="text-[13px] font-black text-slate-900 tracking-tighter uppercase hidden md:block">{t('common.appName')} Portal</span>
          </div>
          {/* Network Indicator */}
          <div className={`hidden md:block w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} title={isOnline ? 'Active Connection' : 'Offline'} />
        </div>

        <div className="p-2 border-b border-slate-50 mb-2">
          <button 
            onClick={() => setLanguage(language === 'am' ? 'en' : 'am')}
            className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${language === 'am' ? 'bg-gold-500 text-white' : 'bg-slate-200 text-slate-500'}`}>አ</div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${language === 'en' ? 'bg-gold-500 text-white' : 'bg-slate-200 text-slate-500'}`}>A</div>
            <span className="text-[11px] font-black uppercase tracking-widest hidden md:block">
              {language === 'am' ? 'English' : 'አማርኛ'}
            </span>
          </button>
        </div>
        
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar no-scrollbar">
          {userMenuSections.map((section, sIndex) => (
            <div key={sIndex} className={sIndex > 0 ? 'mt-4 pt-4 border-t border-slate-100/50' : ''}>
              <p className="px-3 mb-2 text-[13px] md:text-[14px] font-black uppercase tracking-[0.2em] text-slate-400 hidden md:block">{section.group}</p>
              <div className="space-y-0.5">
                {section.items.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <div key={tab.id}>
                      <button 
                        onClick={() => { setActiveTab(tab.id as any); if(tab.id === 'chat') setUnreadChat(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all relative group ${isActive ? 'bg-slate-900 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                      >
                        <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500'} />
                        <span className="text-[15px] md:text-[16px] font-black uppercase tracking-wide hidden md:block truncate flex-1 text-left">{tab.label}</span>
                        {tab.id === 'chat' && unreadChat && !isActive && (
                          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.8)] rounded-full animate-pulse" />
                        )}
                        {tab.badge !== undefined && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md hidden md:block ${isActive ? 'bg-indigo-500 text-white' : 'bg-gold-500 text-white animate-pulse'}`}>
                            {tab.badge}
                          </span>
                        )}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-indigo-500 rounded-r-full" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 mt-auto space-y-2">
          {isAdmin && (
            <div>
              <button 
                onClick={() => window.location.href = '/admin'}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <ShieldCheck size={18} />
                <span className="text-[14px] md:text-[15px] font-black uppercase tracking-wide hidden md:block">ቁጥጥር (Admin)</span>
              </button>
            </div>
          )}
          <button 
            onClick={async () => { await signOut(auth); window.location.href = '/'; }}
            className="w-full py-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            <span className="text-[14px] md:text-[15px] font-black uppercase tracking-wide hidden md:block">{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 max-h-screen overflow-y-auto custom-scrollbar p-3 sm:p-6 lg:p-8 space-y-6 pb-24 sm:pb-8">
      <AnimatePresence>
        {/* Image Preview Lightbox */}
        <AnimatePresence>
          {showImagePreview && (
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl"
               onClick={() => setShowImagePreview(null)}
            >
               <button className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors">
                  <XCircle size={40} />
               </button>
               <motion.img 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  src={showImagePreview} 
                  className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl border border-white/10 object-contain"
                  onClick={(e) => e.stopPropagation()}
               />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Change Password Modal */}
        <AnimatePresence>
          {showChangePasswordModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[2.5rem] p-10 shadow-2xl max-w-lg w-full border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full" />
                <div className="flex items-center gap-6 mb-8 relative z-10">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Edit size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{language === 'am' ? 'የይለፍ ቃል ቀይር' : 'Change Password'}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{language === 'am' ? 'አዲስ የልፍ ቃል ያስገቡ' : 'Enter a new secure password'}</p>
                  </div>
                </div>
                <div className="space-y-6 mb-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{language === 'am' ? 'አዲስ የይለፍ ቃል' : 'New Password'}</label>
                    <input 
                      type="password" 
                      value={changePasswordForm.newPassword} 
                      onChange={(e) => setChangePasswordForm({...changePasswordForm, newPassword: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{language === 'am' ? 'የይለፍ ቃል ያረጋግጡ' : 'Confirm Password'}</label>
                    <input 
                      type="password" 
                      value={changePasswordForm.confirmPassword} 
                      onChange={(e) => setChangePasswordForm({...changePasswordForm, confirmPassword: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20" 
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowChangePasswordModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                    {language === 'am' ? 'ተመለስ' : 'Cancel'}
                  </button>
                  <button onClick={handleUpdatePassword} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20">
                    {language === 'am' ? 'አስቀምጥ' : 'Save Update'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deletion Request Modal */}
        <AnimatePresence>
          {showDeletionRequestModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[2.5rem] p-10 shadow-2xl max-w-lg w-full border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full" />
                <div className="flex items-center gap-6 mb-8 relative z-10">
                  <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{language === 'am' ? 'አካውንት ሰርዝ' : 'Delete Account'}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{language === 'am' ? 'የመዝጊያ ጥያቄ ይላኩ' : 'Request account closure'}</p>
                  </div>
                </div>
                <div className="space-y-6 mb-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{language === 'am' ? 'ምክንያት ይምረጡ' : 'Select Reason'}</label>
                    <select 
                      value={deletionReason} 
                      onChange={(e) => setDeletionReason(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20"
                    >
                      <option value="financial">{language === 'am' ? 'የፋይናንስ ችግር' : 'Financial Issues'}</option>
                      <option value="personal">{language === 'am' ? 'የግል ምክንያት' : 'Personal reasons'}</option>
                      <option value="relocation">{language === 'am' ? 'ቦታ መቀየር' : 'Relocation'}</option>
                      <option value="dissatisfied">{language === 'am' ? 'በአገልግሎቱ ደስተኛ አይደለሁም' : 'Dissatisfied with service'}</option>
                      <option value="other">{language === 'am' ? 'ሌላ' : 'Other'}</option>
                    </select>
                  </div>
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                     <p className="text-xs text-rose-700 font-medium leading-relaxed">
                        {language === 'am' ? 'አካውንትዎ እንዲሰረዝ ጥያቄዎ ለአድሚን ይላካል አድሚን ሲፈቅድልዎት ብቻ አካውንቶ ይሰረዛል።' : 'Your deletion request will be sent to admin. Your account will only be deleted once admin approves your request.'}
                     </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowDeletionRequestModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                    {language === 'am' ? 'ተመለስ' : 'Keep Account'}
                  </button>
                  <button onClick={handleRequestDeletion} className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-600/20">
                    {language === 'am' ? 'ጥያቄ ላክ' : 'Confirm & Request'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white w-full max-w-md rounded-[4rem] p-12 shadow-[0_40px_100px_rgba(0,0,0,0.1)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-blue-500" />
              <div className="mx-auto w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                <CheckCircle size={48} className="text-indigo-500" />
              </div>
              <h2 className="text-3xl font-display font-black text-slate-900 mb-4 tracking-tighter uppercase leading-none">
                {successModalConfig.title || (language === 'am' ? 'እንኳን ደስ አለዎት!' : 'Success!')}
              </h2>
              <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">
                {successModalConfig.message}
              </p>
              
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-slate-900 text-white h-16 rounded-[2rem] font-display font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
              >
                {successModalConfig.buttonText}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contribute Modal */}
      <AnimatePresence>
        {showContributeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-amber-500" />
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-6">
                <Wallet size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 text-center mb-2">{t('dashboard.contribute_title')}</h2>
              <p className="text-slate-500 text-xs text-center mb-8">{t('dashboard.contribute_desc')}</p>
              
              <div className="bg-slate-50 rounded-3xl p-6 mb-8 space-y-4 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('signup.contribution')}</span>
                  <span className="text-lg font-black text-slate-900">{(userData.totalPerSlot || 0).toLocaleString()} {t('common.etb')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('signup.slots')}</span>
                  <span className="text-xs font-black text-slate-900">{userData.slots || 1} {language === 'am' ? 'እቁብ' : 'Slots'}</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'am' ? 'የሚጠበቅ ደራሽ' : 'Expected Payout'}</span>
                  <span className="text-xl font-black text-emerald-600">{(userData?.totalPayout || (userData?.amount * multiplier * (group?.limit || 10))).toLocaleString()} {t('common.etb')}</span>
                </div>
                <p className="text-[9px] font-bold text-slate-400 italic text-right mt-2">
                   {language === 'am' 
                     ? `${userData?.amount || 0} ብር * ${getDurationLabel()} * ${group?.limit || 10} አባላት` 
                     : `${userData?.amount || 0} ETB * ${getDurationLabel()} * ${group?.limit || 10} members`}
                </p>
              </div>

              <div className="mb-4">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'am' ? 'ባንክ' : 'Bank'}</label>
                 <select 
                   value={paymentBank}
                   onChange={(e) => setPaymentBank(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                 >
                    <option value="">{language === 'am' ? 'ባንክ ይምረጡ' : 'Select Bank'}</option>
                    <option value="cbe">CBE</option>
                    <option value="boa">Abyssinia</option>
                    <option value="awash">Awash</option>
                    <option value="dashen">Dashen</option>
                    <option value="zemen">Zemen</option>
                    <option value="telebirr">Telebirr</option>
                 </select>
              </div>

              <div className="mb-4">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'am' ? 'የከፋይ ስም' : 'Payer Name'}</label>
                 <input 
                   type="text"
                   value={paymentPayerName}
                   onChange={(e) => setPaymentPayerName(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                   placeholder={language === 'am' ? 'ስም ያስገቡ...' : 'Enter name...'}
                 />
              </div>

              <div className="mb-4">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'am' ? 'የከፋይ ሂሳብ ቁጥር' : 'Payer Account Number'}</label>
                 <input 
                   type="text"
                   value={paymentPayerAccount}
                   onChange={(e) => setPaymentPayerAccount(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                   placeholder={language === 'am' ? 'ሂሳብ ቁጥር...' : 'Enter account...'}
                 />
              </div>

              <div className="mb-6">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'am' ? 'ትራንዛክሽን ኮድ' : 'Transaction Code'}</label>
                 <input 
                   type="text"
                   value={paymentCode}
                   onChange={(e) => setPaymentCode(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                   placeholder={language === 'am' ? 'ኮድ ያስገቡ...' : 'Enter code...'}
                 />
              </div>

              <div className="mb-8">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('dashboard.receipt_label')}</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${receiptImage ? 'border-gold-500 bg-gold-50' : 'border-slate-200 bg-slate-50 group-hover:bg-slate-100 group-hover:border-gold-300'}`}>
                    {receiptImage ? (
                      <div className="relative">
                        <img src={receiptImage} alt="Receipt" className="max-h-32 object-contain rounded-xl shadow-md" />
                        <button 
                          type="button" 
                          onClick={(e) => { e.preventDefault(); setReceiptImage(null); }} 
                          className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg border border-rose-400 hover:bg-rose-600 z-20 cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-gold-500">
                          <ArrowUpRight size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">{t('dashboard.receipt_upload')}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowContributeModal(false)}
                  className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all active:scale-95"
                >
                  {t('common.back')}
                </button>
                <button 
                  onClick={handleContribute}
                  disabled={isSubmitting}
                  className="py-4 bg-gold-500 text-white rounded-2xl font-black text-sm hover:bg-gold-600 transition-all active:scale-95 shadow-xl shadow-gold-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? (language === 'am' ? 'በመላክ ላይ...' : 'Sending...') : t('dashboard.submit_payment')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Member Details Modal */}
      <AnimatePresence>
        {selectedMemberModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              {/* Modal Background Decor */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-[80px]" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full -ml-32 -mb-32 blur-[80px]" />
              
              <div className="relative z-10 p-8">
                <div className="flex justify-between items-center mb-8">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                        <Users size={16} />
                     </div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{language === 'am' ? 'የአባል ዝርዝር' : 'Member Profile'}</span>
                   </div>
                   <button 
                    onClick={() => setSelectedMemberModal(null)}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
                
                <div className="flex flex-col items-center mb-10">
                  <div className="relative mb-6">
                    <div className={`w-32 h-32 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl bg-slate-50 flex items-center justify-center text-slate-300 transition-transform duration-500 hover:scale-105`}>
                      {selectedMemberModal.faceScan ? (
                        <img src={selectedMemberModal.faceScan} alt={selectedMemberModal.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={56} />
                      )}
                    </div>
                    <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center ${selectedMemberModal.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                       {selectedMemberModal.status === 'active' ? <ShieldCheck size={20} /> : <Clock size={20} />}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight text-center mb-1">{selectedMemberModal.fullName}</h3>
                  <div className="flex flex-col items-center">
                    <p className="text-slate-400 font-bold tracking-widest text-[10px] uppercase bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 mb-2">
                      {selectedMemberModal.uid === user?.uid 
                        ? (language === 'am' ? 'የኔ መለያ' : 'Personal Account') 
                        : ((selectedMemberModal.role === 'admin' || selectedMemberModal.role === 'super_admin' || selectedMemberModal.isAdmin) ? (language === 'am' ? 'አድሚን' : 'Admin') : (selectedMemberModal.phone || 'PHONE HIDDEN'))}
                    </p>
                    {selectedMemberModal.memberCode && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-lg border border-amber-100 text-amber-700">
                        <Hash size={10} className="font-black" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{selectedMemberModal.memberCode}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(selectedMemberModal.memberCode || '');
                            triggerSuccess(language === 'am' ? 'ተቀድቷል' : 'Copied', language === 'am' ? 'የአባል መለያ ተቀድቷል' : 'Member code copied to clipboard');
                          }}
                          className="hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Copy size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50/80 backdrop-blur-sm p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                     <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
                        <Layers size={18} />
                     </div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'am' ? 'የእጣ ብዛት' : 'Total Slots'}</span>
                     <span className="text-2xl font-display font-black text-slate-900">{selectedMemberModal.slots || 1}</span>
                  </div>
                  <div className="bg-slate-50/80 backdrop-blur-sm p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-xl hover:shadow-amber-500/5 transition-all">
                     <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-amber-500 mb-3 group-hover:scale-110 transition-transform">
                        <Trophy size={18} />
                     </div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'am' ? 'የእጣ ሁኔታ' : 'Won Draw'}</span>
                     <span className={`text-sm font-black ${selectedMemberModal.wonDraw ? 'text-amber-600' : 'text-slate-400'}`}>
                        {selectedMemberModal.wonDraw ? (language === 'am' ? 'አሸናፊ' : 'Winner!') : (language === 'am' ? 'ገና ነው' : 'Pending')}
                     </span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedMemberModal(null)}
                  className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-display font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
                >
                  {language === 'am' ? 'ተመለስ' : 'Close Details'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGuarantorInfoModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          >
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowGuarantorInfoModal(false)} />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-gold-400">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-black text-slate-900 uppercase tracking-tight">
                      {language === 'am' ? 'የዋስትና መረጃ ፎርም' : 'Guarantor Information Form'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: GU-2026-V.1</p>
                  </div>
                </div>
                <button onClick={() => setShowGuarantorInfoModal(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-slate-50/30">
                <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-slate-100 mx-auto max-w-[210mm] min-h-[297mm] text-slate-900 relative">
                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-45 select-none text-[8rem] font-display font-black text-slate-900">
                    {t('common.appName').split(' ')[0].toUpperCase()}
                  </div>

                  <div className="relative z-10">
                    <div className="text-center mb-10 border-b-2 border-slate-900 pb-8">
                       <h2 className="text-3xl font-display font-black tracking-tighter mb-1">{t('common.appName')}</h2>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Official Legal Guarantee Document Template</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
                       <div className="md:col-span-1 space-y-6">
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                             <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Instructions / መመሪያ</h5>
                             <ul className="space-y-4">
                                {[
                                  { am: 'ዋስትናው በጽሁፍ እና በፊርማ መረጋገጥ አለበት።', en: 'Guarantee must be verified by writing & signature.' },
                                  { am: 'ሁለቱም ዋሶች ህጋዊ መታወቂያ ሊኖራቸው ይገባል።', en: 'Both guarantors must have a valid legal ID.' },
                                  { am: 'መረጃው በሰብሳቢው መረጋገጥ ይኖርበታል።', en: 'Details must be verified by the collector.' }
                                ].map((item, i) => (
                                  <li key={i} className="space-y-1">
                                     <p className="text-[10px] font-bold leading-tight">{item.am}</p>
                                     <p className="text-[8px] text-slate-400 italic font-medium">{item.en}</p>
                                  </li>
                                ))}
                             </ul>
                          </div>
                          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                             <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Disclaimer</h5>
                             <p className="text-[9px] font-medium leading-relaxed text-amber-800">
                                {language === 'am' 
                                  ? 'ይህ ፎርም ህጋዊ ሰነድ ሲሆን፤ ማንኛውም የተሳሳተ መረጃ ለህግ ተጠያቂነትን ያስከትላል።' 
                                  : 'This form is a legal document; any false information leads to legal accountability.'}
                             </p>
                          </div>
                       </div>

                       <div className="md:col-span-2 space-y-8">
                          <div>
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                              {language === 'am' ? 'የአባሉ እና የዋሶች ስምምነት' : 'Member & Guarantor Agreement'}
                            </h4>
                            <div className="prose prose-slate max-w-none">
                               <p className="text-[11px] leading-relaxed font-medium text-slate-600">
                                  {language === 'am' 
                                    ? 'እኛ ከዚህ በታች ስማችን የተጠቀሰው ዋሶች፤ አባሉ (ባለዕቁቡ) እጣው ወጥቶለት ክፍያውን የሚቀበልበትን ጊዜ ተከትሎ፤ ቀሪውን የእጣ ክፍያ በወቅቱ እና በትክክል እንዲከፍል ዋስትና እንሆናለን። አባሉ ክፍያ ካቆመ ወይም ግዴታውን ካልተወጣ፤ እኛ ሙሉውን ክፍያ የመክፈል ኃላፊነት እንዳለብን አውቀን በፈቃዳችን ፈርመናል።'
                                    : 'We, the undersigned guarantors, hereby guarantee that the member (Ekubite) will fulfill all remaining payments on time after receiving the draw fund. In case of default, we voluntarily accept full responsibility for the balance.'}
                               </p>
                            </div>
                          </div>

                          <div className="space-y-6">
                            {[1, 2].map(i => (
                              <div key={i} className="p-8 border border-slate-100 rounded-[2.5rem] bg-slate-50/50 relative group">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Guarantor {i} / ዋስ {i}</p>
                                 <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="border-b border-slate-200 pb-2">
                                       <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-1">Full Name / ሙሉ ስም</span>
                                       <div className="h-6" />
                                    </div>
                             <div className="bg-white/5 p-1.5 rounded-md border border-white/5">
                               <span className="text-[6px] opacity-60 block uppercase mb-0.5 leading-none">{language === 'am' ? 'የመዋጮ መጠን' : 'Amount'}</span>
                               <span className="text-blue-300">{userData?.amount ? `${userData?.amount.toLocaleString()} ETB` : '---'}</span>
                             </div>
                                    <div className="border-b border-slate-200 pb-2">
                                       <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-1">Job / ስራ</span>
                                       <div className="h-6" />
                                    </div>
                                    <div className="border-b border-slate-200 pb-2">
                                       <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-1">Phone / ስልክ</span>
                                       <div className="h-6" />
                                    </div>
                                    <div className="border-b border-slate-200 pb-2">
                                       <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-1">Signature / ፊርማ</span>
                                       <div className="h-6" />
                                    </div>
                                 </div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-8 grid grid-cols-2 gap-8 items-end">
                             <div className="text-center space-y-4">
                                <div className="h-20 border border-slate-100 rounded-2xl bg-slate-50 flex items-center justify-center">
                                   <ShieldCheck size={24} className="text-slate-100" />
                                </div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Collector Stamp</p>
                             </div>
                             <div className="text-center space-y-4">
                                <div className="h-20 border border-slate-100 rounded-2xl bg-slate-50" />
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Legal Seal</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-white">
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Printer size={16} />
                  <span>A4 Portrait Optimized</span>
                </div>
                <div className="flex gap-4">
                   <button onClick={() => setShowGuarantorInfoModal(false)} className="px-8 py-4 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">Close</button>
                   <button 
                     onClick={() => triggerSuccess('Print Ready', 'Document sent to printer in A4 format')}
                     className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl active:scale-95"
                   >
                      <Printer size={16} /> Print A4
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'overview' && (
        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="space-y-6 mb-2">
           {/* Eligibility Warning */}
           {userPenalties.filter(p => p.status === 'pending').length > 0 && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-rose-900/5 mt-2"
             >
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-rose-500 shadow-sm shrink-0">
                   <AlertTriangle size={32} />
                </div>
                <div className="flex-1 text-center md:text-left">
                   <h4 className="text-sm font-black text-rose-900 uppercase tracking-widest mb-1">
                      {language === 'am' ? 'ማሳሰቢያ፡ እጣ ውስጥ አይካተቱም' : 'Alert: Draw Ineligibility'}
                   </h4>
                   <p className="text-[11px] font-bold text-rose-600/70 leading-relaxed max-w-2xl">
                      {language === 'am' 
                        ? 'ያልተጠናቀቀ ክፍያ ወይም ጎዶሎ ቀን ስላሎት በቀጣይ በሚወጡ እጣዎች ላይ መሳተፍ አይችሉም። እባክዎ ክፍያዎን በማጠናቀቅ እጣ ውስጥ ይካተቱ።' 
                        : 'Due to pending payments or missing records, you are currently excluded from upcoming draws. Please settle your dues to regain eligibility.'}
                   </p>
                </div>
                <button 
                  onClick={() => setActiveTab('payment-send')}
                  className="w-full md:w-auto px-6 py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                >
                   {language === 'am' ? 'ክፍያ አጠናቅ' : 'Settle Now'}
                </button>
             </motion.div>
           )}

           {/* Beautiful Hero Card */}
           <div className="bg-slate-900 rounded-[3rem] p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 text-white shadow-2xl shadow-indigo-900/20 mt-2">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] -mt-[250px] -mr-[250px]" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gold-500/10 rounded-full blur-[80px] -mb-[150px] -ml-[150px]" />
              
              <div className="flex items-center flex-col md:flex-row gap-6 relative z-10 w-full md:w-auto text-center md:text-left">
                 <div className="w-24 h-24 bg-white/10 rounded-full overflow-hidden border-4 border-white/10 backdrop-blur-md relative group shrink-0 shadow-xl">
                    {userData.faceScan ? (
                       <img src={userData.faceScan} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                       <UserIcon size={32} className="text-white/50 m-auto mt-7" />
                    )}
                 </div>
                 <div>
                    <div className="flex flex-col md:flex-row items-center gap-3 mb-3">
                       <h1 className="text-3xl font-display font-black tracking-tighter leading-none">
                          {language === 'am' ? 'እንኳን ደህና መጡ፣' : 'Welcome back,'} <span className="text-gold-400">{userData.fullName}</span> 
                       </h1>
                       {(group?.currentRound || 1) > 1 && (
                         <div className="bg-white/20 text-white border border-white/30 rounded-full px-4 py-1.5 text-[10px] tracking-[0.2em] font-black uppercase backdrop-blur-md shadow-xl">
                            {language === 'am' ? `ዙር ${group?.currentRound}` : `Round ${group?.currentRound}`}
                         </div>
                       )}
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-3">
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/50 bg-white/5 px-3 py-1 rounded-full">{userData.phone}</span>
                       <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                       <div className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-inner ${userData.status === 'pending' ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${userData.status === 'pending' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                          {userData.status === 'pending' ? t('common.pending') : t('common.verified')}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex items-center w-full md:w-auto gap-4 relative z-10">
                 <button 
                   onClick={() => setActiveTab('profile')}
                   className="hidden lg:block px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold tracking-widest uppercase transition-all backdrop-blur-md text-white/90"
                 >
                   {language === 'am' ? 'ማህደር' : 'Profile'}
                 </button>
                 <button 
                   onClick={() => setActiveTab('payment-send')}
                   disabled={userData.status === 'pending'}
                   className="flex-1 md:flex-none px-8 py-4 bg-gold-400 hover:bg-gold-300 text-slate-900 rounded-2xl text-xs font-black tracking-widest uppercase transition-all disabled:opacity-50 disabled:grayscale shadow-xl shadow-gold-500/20 flex items-center justify-center gap-2"
                 >
                   <Wallet size={16} /> {t('dashboard.send_payment')}
                 </button>
                 <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-4 bg-white/5 border border-white/10 text-white rounded-2xl shadow-lg">
                   <LayoutDashboard size={18} />
                 </button>
              </div>
           </div>

           {/* Financial Stats Bento Grid */}
           <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-between hover:-translate-y-1 transition-transform cursor-pointer border border-slate-100 hover:border-indigo-500/30 shadow-lg shadow-slate-200/20">
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm"><Layers size={20} /></div>
                    <span className="text-[10px] font-black uppercase text-indigo-500/50 bg-indigo-50 px-2 py-1 rounded-lg">Slots</span>
                 </div>
                 <div>
                    <h3 className="text-4xl font-display font-black text-slate-900 leading-none mb-1">{userData.slots || 1}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'የእርስዎ እጣዎች' : 'Active Slots'}</p>
                 </div>
              </div>

              <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-between hover:-translate-y-1 transition-transform cursor-pointer border border-slate-100 hover:border-emerald-500/30 shadow-lg shadow-slate-200/20">
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm"><DollarSign size={20} /></div>
                    <span className="text-[10px] font-black uppercase text-emerald-500/50 bg-emerald-50 px-2 py-1 rounded-lg">Funds</span>
                 </div>
                 <div>
                    <h3 className="text-3xl font-display font-black text-slate-900 leading-none mb-1 truncate">
                       {payments.filter(p => p.status === 'verified').reduce((a, b) => a + (b.amount || 0), 0).toLocaleString()} 
                       <span className="text-sm text-slate-300 ml-1">ETB</span>
                    </h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'ጠቅላላ ክፍያ' : 'Total Contributed'}</p>
                 </div>
              </div>

              <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-between hover:-translate-y-1 transition-transform cursor-pointer border border-slate-100 hover:border-amber-500/30 shadow-lg shadow-slate-200/20">
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm"><Trophy size={20} /></div>
                    <span className="text-[10px] font-black uppercase text-amber-500/50 bg-amber-50 px-2 py-1 rounded-lg">Status</span>
                 </div>
                 <div className="pt-2">
                    <div className="flex items-center gap-2 mb-1">
                       {userData.wonDraw && <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
                       <h3 className="text-2xl font-display font-black text-slate-900 leading-none">
                          {userData.wonDraw ? (language === 'am' ? 'አሸናፊ' : 'Winner') : (language === 'am' ? 'በመጠባበቅ' : 'Pending')}
                       </h3>
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'የእጣ ሁኔታ' : 'Draw Result'}</p>
                 </div>
              </div>

              <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-between hover:-translate-y-1 transition-transform cursor-pointer border border-slate-100 hover:border-purple-500/30 shadow-lg shadow-slate-200/20">
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center border border-purple-100 shadow-sm"><Clock size={20} /></div>
                    <span className="text-[10px] font-black uppercase text-purple-500/50 bg-purple-50 px-2 py-1 rounded-lg">Next</span>
                 </div>
                 <div>
                    <h3 className="text-xl font-display font-black text-slate-900 leading-none mb-1 truncate max-w-[150px]">{drawInfo.date}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'ቀጣይ እጣ' : 'Upcoming Draw'}</p>
                 </div>
              </div>
           </div>
        </motion.div>
      )}

      {/* Main Layout Context */}
      <div className={`gap-6 ${activeTab === 'overview' ? 'grid grid-cols-1 lg:grid-cols-5' : 'flex flex-col'}`}>
        <div className={`${activeTab === 'overview' ? 'lg:col-span-3' : 'w-full'} space-y-6`}>
          {activeTab === 'overview' && (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">

              {userData.wonDraw && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl shadow-orange-500/20"
                >
                  <div className="absolute right-0 top-0 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
                   <div className="flex items-center gap-6 relative z-10 w-full">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-inner border border-white/30 shrink-0 text-white">
                        <Trophy size={40} />
                      </div>
                      <div className="flex-1">
                         <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-2 drop-shadow-md">
                           {language === 'am' ? `እንኳን ደስ አሎት ${userData.fullName}! እጣ ደርሶዎታል` : `Congratulations ${userData.fullName}! You won the Draw!`}
                         </h3>
                         <p className="text-sm font-bold text-white/90">
                           {language === 'am' ? 'እባክዎ እጣዎን ለመረከብ የዋስ መረጃዎችን ያሟሉ።' : 'Please provide guarantor details to receive your draw.'}
                         </p>
                      </div>
                      {!userData.guarantorsSubmitted && (
                        <button 
                          onClick={() => {
                            setActiveTab('guarantors');
                            setGuarantorSubTab('register');
                          }}
                          className="shrink-0 px-8 py-4 bg-white text-orange-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all outline-none"
                        >
                          {language === 'am' ? 'የዋስ መረጃ ሙላ' : 'Fill Guarantors'}
                        </button>
                      )}
                   </div>
                </motion.div>
              )}

              {userData.status === 'pending' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gold-50 border border-gold-100 p-8 rounded-[3rem] relative overflow-hidden"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gold-50 rounded-2xl flex items-center justify-center text-gold-600 shrink-0">
                      <Info size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-black text-slate-900 mb-2">{t('dashboard.pending_title')}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        {t('dashboard.pending_desc')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}


              <div className="glass-card p-10 rounded-[3rem] relative overflow-hidden bg-white/40 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60 pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10 relative z-10">
                  <div>
                    <h3 className="text-3xl font-display font-black text-slate-900 tracking-tighter leading-none mb-4">
                      {group?.name ? (group.name.length === 1 || !group.name.toLowerCase().includes('ምድብ') && !group.name.toLowerCase().includes('group') ? (language === 'am' ? `ምድብ ${group.name}` : `Group ${group.name}`) : group.name) : '...'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                       <span className="px-4 py-2 bg-slate-900 text-gold-500 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10">
                         {group?.type || '...'} {t('common.cycle')}
                       </span>
                       <span className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 shadow-sm">
                         {language === 'am' ? 'የእቁብ መረጃ' : 'Community Info'}
                       </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('payment-send')}
                    disabled={userData.status === 'pending'}
                    className="w-full sm:w-auto btn-gold px-8 py-5 rounded-[1.5rem] text-xs font-black tracking-widest uppercase disabled:grayscale disabled:opacity-30 shadow-xl shadow-gold-500/20 hover:-translate-y-1 transition-all"
                  >
                    <Wallet size={16} /> {t('dashboard.send_payment')}
                  </button>
                </div>

                <div className="space-y-10 relative z-10">
                  <div>
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{language === 'am' ? 'የዕቁብ ሂደት' : 'Cycle Progression'}</p>
                        <p className="text-4xl font-display font-black text-slate-900 leading-none">{group?.memberCount} <span className="text-xl text-slate-300 font-bold">/ {group?.limit}</span></p>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-gold-600 mb-1 bg-gold-50 px-3 py-1 rounded-lg inline-block">{Math.round(((group?.memberCount || 0) / (group?.limit || 1)) * 100)}%</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase">{language === 'am' ? 'አጠቃላይ' : 'Filled'}</p>
                      </div>
                    </div>
                    
                    <div className="relative pt-1">
                      <div className="w-full h-5 bg-slate-100/50 rounded-full overflow-hidden border border-slate-200/50 p-1 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${((group?.memberCount || 0) / (group?.limit || 1)) * 100}%` }}
                          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full gold-gradient rounded-full shadow-lg shadow-gold-500/30 relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 animate-[shimmer_2s_infinite]" />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100 my-6" />
                  
                  {/* My Team Status (NEW) */}
                  <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden mb-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
                    <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Users size={16} className="text-indigo-400" />
                          <h4 className="text-xs font-black uppercase tracking-widest">{language === 'am' ? 'የቡድን ሁኔታ' : 'Team Status'}</h4>
                        </div>
                        <h3 className="text-xl font-black">{userTeam?.name || (language === 'am' ? 'ቡድን አልተገኘም' : 'No Team Found')}</h3>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg border border-white/10">
                            <Zap size={12} className="text-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{userTeam?.points || 0} PTS</span>
                          </div>
                          <div className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${userTeam?.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/20 text-rose-400 border-rose-500/20'}`}>
                            {userTeam?.status || 'Pending'}
                          </div>
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                           <Trophy size={32} className="text-gold-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                   <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 p-2 bg-slate-50/50 rounded-[2rem] border border-slate-100/50">
                     <div className="flex flex-col gap-2 p-5 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center mb-1"><DollarSign size={16} /></div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'መክፈያ መጠን' : 'Base Amount'}</p>
                        <p className="text-xl font-display font-black text-slate-900 leading-none">{group?.amount?.toLocaleString() || '0'} <span className="text-xs text-slate-400">ETB</span></p>
                     </div>
                     <div className="flex flex-col gap-2 p-5 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center mb-1"><Clock size={16} /></div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'ቀጣይ እጣ' : 'Next Draw'}</p>
                        <p className="text-xl font-display font-black text-slate-900 leading-none truncate">{drawInfo.date}</p>
                     </div>
                     <div className="flex flex-col gap-2 p-5 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center mb-1"><Users size={16} /></div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'አባላት' : 'Total Members'}</p>
                        <p className="text-xl font-display font-black text-slate-900 leading-none">{group?.memberCount}</p>
                     </div>
                     <div className="flex flex-col gap-2 p-5 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center mb-1"><Trophy size={16} /></div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'አሸናፊዎች' : 'Winners'}</p>
                        <p className="text-xl font-display font-black text-slate-900 leading-none">{totalWinnersCount}</p>
                     </div>
                     <div className="flex col-span-2 lg:col-span-1 flex-col gap-2 p-5 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-1 group-hover:scale-110 transition-transform"><CheckCircle size={16} /></div>
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{language === 'am' ? 'የተረጋገጠ ክፍያ' : 'Verified Payment'}</p>
                        <p className="text-xl font-display font-black text-emerald-900 leading-none">{verifiedPaymentsTotal.toLocaleString()} <span className="text-[10px] text-emerald-600">ETB</span></p>
                     </div>
                   </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 <button onClick={() => setActiveTab('members')} className="bg-white hover:-translate-y-1 transition-all p-8 rounded-[2rem] flex flex-col items-center justify-center gap-4 group text-slate-500 hover:text-indigo-600 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer">
                    <div className="w-14 h-14 rounded-[1rem] bg-indigo-50/50 flex items-center justify-center text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                       <Users size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-black tracking-widest uppercase">{language === 'am' ? 'አባላት' : 'Members'}</span>
                 </button>
                 <button onClick={() => setActiveTab('chat')} className="bg-white hover:-translate-y-1 transition-all p-8 rounded-[2rem] flex flex-col items-center justify-center gap-4 group text-slate-500 hover:text-rose-600 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-xl hover:shadow-rose-500/10 cursor-pointer">
                    <div className="w-14 h-14 rounded-[1rem] bg-rose-50/50 flex items-center justify-center text-rose-500 group-hover:scale-110 group-hover:bg-rose-100 transition-all relative">
                       <MessageCircle size={24} strokeWidth={2.5} />
                       {unreadChat && <span className="absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />}
                    </div>
                    <span className="text-xs font-black tracking-widest uppercase">{language === 'am' ? 'ውይይት' : 'Chat'}</span>
                 </button>
                 <button onClick={() => setActiveTab('payments')} className="bg-white hover:-translate-y-1 transition-all p-8 rounded-[2rem] flex flex-col items-center justify-center gap-4 group text-slate-500 hover:text-emerald-600 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer">
                    <div className="w-14 h-14 rounded-[1rem] bg-emerald-50/50 flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
                       <History size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-black tracking-widest uppercase">{language === 'am' ? 'ታሪክ' : 'History'}</span>
                 </button>
                 <button onClick={() => setActiveTab('market')} className="bg-white hover:-translate-y-1 transition-all p-8 rounded-[2rem] flex flex-col items-center justify-center gap-4 group text-slate-500 hover:text-amber-600 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer">
                    <div className="w-14 h-14 rounded-[1rem] bg-amber-50/50 flex items-center justify-center text-amber-500 group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                       <ShoppingBag size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-black tracking-widest uppercase">{language === 'am' ? 'ገበያ' : 'Market'}</span>
                 </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'members' && (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">
              {/* Members Hero Header */}
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-10 rounded-[3rem] relative overflow-hidden text-white shadow-2xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[80px] -mt-[200px] -mr-[200px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[60px] -mb-[150px] -ml-[150px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div>
                    <h2 className="text-4xl font-display font-black tracking-tighter mb-3 drop-shadow-sm flex items-center gap-3">
                      {language === 'am' ? 'የእጣ አባላት ስብስብ' : 'Community Members'}
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse delay-75" />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-150" />
                      </div>
                    </h2>
                    <p className="text-sm font-medium text-indigo-200 mb-6">
                      {language === 'am' ? 'ሁሉንም የዕቁብ አባላት እና የእጣ ብዛት መረጃ እዚህ ያገኛሉ' : 'Explore the members of your current cycle and their slots'}
                    </p>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => triggerSuccess(
                          language === 'am' ? 'አዲስ አባል' : 'New Member',
                          language === 'am' ? 'አዲስ አባል ለመመዝገብ እባክዎ ሰብሳቢውን ያነጋግሩ።' : 'Please contact the collector to register a new member.'
                        )}
                        className="px-8 py-4 bg-white text-indigo-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 hover:scale-105 transition-transform active:scale-95"
                      >
                        {language === 'am' ? 'አባል ጨምር' : 'Add New Member'}
                      </button>
                      <button 
                        onClick={() => setActiveTab('draws')}
                        className="px-8 py-4 bg-indigo-500/30 backdrop-blur-md text-white border border-white/10 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-500/40 transition-colors"
                      >
                        {language === 'am' ? 'የእጣ ዘገባ' : 'Draw Report'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                    <div className="flex flex-col px-8 py-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-lg min-w-[140px] hover:bg-white/15 transition-all group">
                      <div className="flex justify-between items-center mb-3">
                        <Users size={18} className="text-indigo-300 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest bg-indigo-900/50 px-2 py-0.5 rounded-full">{language === 'am' ? 'አባላት' : 'Total'}</span>
                      </div>
                      <span className="text-4xl font-display font-black text-white leading-none">{members.length}</span>
                      <div className="mt-2 text-[8px] font-bold text-indigo-300/60 uppercase tracking-widest">{language === 'am' ? 'ንቁ አባላት' : 'Active Members'}</div>
                    </div>
                    <div className="flex flex-col px-8 py-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-lg min-w-[140px] hover:bg-white/15 transition-all group">
                      <div className="flex justify-between items-center mb-3">
                        <Layers size={18} className="text-emerald-300 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest bg-emerald-900/50 px-2 py-0.5 rounded-full">{language === 'am' ? 'እጣዎች' : 'Slots'}</span>
                      </div>
                      <span className="text-4xl font-display font-black text-white leading-none">{members.reduce((acc, m) => acc + (m.slots || 1), 0)}</span>
                      <div className="mt-2 text-[8px] font-bold text-emerald-300/60 uppercase tracking-widest">{language === 'am' ? 'ጠቅላላ እጣ' : 'Total Slots'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { icon: ShieldCheck, label: language === 'am' ? 'የተረጋገጡ' : 'Verified', val: members.filter(m => m.status === 'active').length, color: 'emerald' },
                   { icon: Trophy, label: language === 'am' ? 'አሸናፊዎች' : 'Winners', val: members.filter(m => m.wonDraw).length, color: 'amber' },
                   { icon: Layers, label: language === 'am' ? 'ባለብዙ እጣ' : 'Multi-Slots', val: members.filter(m => (m.slots || 1) > 1).length, color: 'indigo' }
                 ].map((stat, i) => (
                   <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:shadow-slate-500/5 transition-all">
                      <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
                         <stat.icon size={24} />
                      </div>
                      <div>
                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                         <div className="text-2xl font-display font-black text-slate-900">{stat.val}</div>
                      </div>
                   </div>
                 ))}
              </div>



              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="group relative flex-1 w-full">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                     <Search size={20} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input 
                     type="text" 
                     placeholder={language === 'am' ? "የአባላትን ስም ይፈልጉ..." : "Search members by name..."}
                     value={memberSearchQuery}
                     onChange={(e) => setMemberSearchQuery(e.target.value)}
                     className="w-full bg-white pl-14 pr-6 py-5 rounded-[2rem] text-slate-700 font-bold placeholder:font-medium placeholder:text-slate-400 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all text-sm"
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                   <button 
                     onClick={() => setMembersFilter('all')}
                     className={`px-6 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap shadow-sm ${membersFilter === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100'}`}
                   >
                      {language === 'am' ? 'ሁሉም አባላት' : 'All Members'}
                   </button>
                   <button 
                     onClick={() => setMembersFilter('winners')}
                     className={`px-6 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap shadow-sm ${membersFilter === 'winners' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-slate-100 text-slate-400 hover:text-amber-600 hover:border-amber-100'}`}
                   >
                      {language === 'am' ? 'አሸናፊዎች' : 'Winners'}
                   </button>
                   <button 
                     onClick={() => setMembersFilter('active')}
                     className={`px-6 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap shadow-sm ${membersFilter === 'active' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-100'}`}
                   >
                      {language === 'am' ? 'ንቁ አባላት' : 'Active'}
                   </button>
                </div>
              </div>

              {/* Members Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {members
                  .filter(m => {
                    const matchesSearch = m.fullName?.toLowerCase().includes(memberSearchQuery.toLowerCase());
                    const matchesFilter = 
                      membersFilter === 'all' ? true :
                      membersFilter === 'winners' ? m.wonDraw === true :
                      membersFilter === 'active' ? m.status === 'active' : true;
                    return matchesSearch && matchesFilter;
                  })
                  .map((member, idx) => (
                  <motion.div 
                    key={member.uid}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                    onClick={() => setSelectedMemberModal(member)}
                    className={`cursor-pointer rounded-[2rem] transition-all duration-300 group relative overflow-hidden flex flex-col bg-white border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 ${member.uid === user.uid ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                  >
                    {/* Background Pattern */}
                    <div className="h-24 bg-slate-50 w-full absolute top-0 left-0 border-b border-slate-100 group-hover:bg-indigo-50/50 transition-colors" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 z-10">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1.5 backdrop-blur-md ${member.status === 'active' ? 'bg-emerald-100/90 text-emerald-700' : 'bg-slate-200/90 text-slate-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          {member.status === 'active' ? (language === 'am' ? 'የነቃ' : 'Active') : (language === 'am' ? 'በመጠባበቅ' : 'Pending')}
                       </span>
                    </div>

                    <div className="p-6 pt-10 relative z-10 flex flex-col items-center flex-1">
                      {/* Avatar */}
                      <div className={`w-24 h-24 rounded-full overflow-hidden flex flex-shrink-0 items-center justify-center border-4 shadow-lg mb-4 transition-transform duration-500 group-hover:scale-105 ${member.uid === user.uid ? 'bg-indigo-50 text-indigo-500 border-white' : 'bg-slate-100 text-slate-400 border-white'}`}>
                        {(member.faceScan && (isAdmin || member.uid === user.uid)) ? (
                          <img src={member.faceScan} alt={member.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon size={32} />
                        )}
                      </div>
                      
                      {/* Name */}
                      <h4 className="text-lg font-black tracking-tight text-slate-900 mb-1 text-center truncate w-full px-2">
                        {member.fullName}
                      </h4>
                      
                      {/* Sub-label */}
                      <div className="h-5 flex items-center justify-center mb-5">
                         {member.uid === user.uid ? (
                           <span className="px-3 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100">
                             {language === 'am' ? 'ይህ የእርስዎ ፕሮፋይል ነው' : 'This is You'}
                           </span>
                         ) : (member.role === 'admin' || member.role === 'super_admin' || member.isAdmin) ? (
                           <span className="text-xs text-indigo-400 font-black uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">{language === 'am' ? 'አድሚን' : 'Admin'}</span>
                         ) : (isAdmin || member.uid === user.uid) ? (
                           <span className="text-xs text-slate-400 font-medium">{member.phone?.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3') || '···'}</span>
                         ) : (
                           <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{language === 'am' ? 'ስልክ ተደብቋል' : 'Phone Hidden'}</span>
                         )}
                      </div>
                      
                      <div className="w-full h-px bg-slate-100 mb-5" />
                      
                      {/* Stats */}
                      <div className="flex w-full justify-between items-center mt-auto">
                         <div className="flex flex-col items-center flex-1">
                            <Layers size={14} className="text-slate-400 mb-1" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{language === 'am' ? 'እጣ ብዛት' : 'Slots'}</span>
                            <span className="text-base font-black text-slate-900">{member.slots || 1}</span>
                         </div>
                         <div className="w-px h-8 bg-slate-100 mx-2" />
                         <div className="flex flex-col items-center flex-1">
                            <Trophy size={14} className={member.wonDraw ? "text-amber-500 mb-1" : "text-slate-300 mb-1"} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{language === 'am' ? 'አሸናፊ' : 'Winner'}</span>
                            <span className={`text-sm font-black ${member.wonDraw ? "text-amber-600" : "text-slate-900"}`}>
                               {member.wonDraw ? (language === 'am' ? 'አዎ' : 'Yes') : (language === 'am' ? 'አይ' : 'No')}
                            </span>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {members.filter(m => {
                  const matchesSearch = m.fullName?.toLowerCase().includes(memberSearchQuery.toLowerCase());
                  const matchesFilter = 
                    membersFilter === 'all' ? true :
                    membersFilter === 'winners' ? m.wonDraw === true :
                    membersFilter === 'active' ? m.status === 'active' : true;
                  return matchesSearch && matchesFilter;
                }).length === 0 && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="col-span-1 md:col-span-2 lg:col-span-3 py-20 text-center flex flex-col items-center bg-white rounded-[3rem] border border-slate-100 border-dashed">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                       <Search size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">{language === 'am' ? 'ምንም አባል አልተገኘም' : 'No members found'}</h3>
                    <p className="text-sm font-medium text-slate-400">
                       {language === 'am' ? 'እባክዎ የተለየ የፍለጋ ቃል ይሞክሩ' : 'Please try a different search term'}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <div className="glass-card p-6 rounded-3xl flex flex-col min-h-[400px] relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-display font-black text-slate-900 uppercase tracking-[0.2em] mb-1">Financials</h3>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">የክፍያ ታሪክ ዝርዝር</p>
                </div>
                <button 
                  onClick={() => setActiveTab('payment-send')}
                  className="w-10 h-10 bg-gold-50 text-gold-600 rounded-xl flex items-center justify-center hover:bg-gold-100 border border-gold-100"
                >
                  <CreditCard size={18} />
                </button>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {payments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <History size={32} className="text-slate-200 mb-4" />
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">ምንም የክፍያ ታሪክ የለም</p>
                  </div>
                ) : (
                  payments.map((payment, idx) => (
                    <motion.div 
                      key={payment.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`flex flex-col p-3 bg-white rounded-xl border shadow-sm transition-all group ${payment.status === 'rejected' ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${payment.status === 'active' ? 'bg-gold-500/10 text-gold-600' : payment.status === 'rejected' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
                            {payment.status === 'rejected' ? <XCircle size={16} /> : <ArrowUpRight size={16} />}
                          </div>
                          <div>
                            <p className="text-[12px] font-black text-slate-900 tracking-tight leading-none mb-1">
                              {(payment.amount || 0).toLocaleString()} <span className="text-[8px] text-slate-400">ETB</span>
                            </p>
                            <div className="flex items-center gap-1">
                              <Clock size={8} className="text-slate-300" />
                              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                                {payment.createdAt?.toDate ? payment.createdAt.toDate().toLocaleDateString('am-ET') : new Date(payment.createdAt).toLocaleDateString('am-ET')}
                                {payment.transactionCode && <span className="ml-2 font-mono text-indigo-600 font-black">TXN: {payment.transactionCode}</span>}
                                {payment.receiptId && <span className="ml-2 font-mono opacity-50">#{payment.receiptId}</span>}
                              </p>
                            </div>
                          </div>
                        </div>
                          <div className="flex items-center gap-2">
                            {(payment.receiptImage || (payment.receiptImages && payment.receiptImages.length > 0)) && (
                              <button 
                                onClick={() => {
                                  const images = payment.receiptImages || (payment.receiptImage ? [payment.receiptImage] : []);
                                  setSelectedReceiptImages(images);
                                  setShowReceiptImagesModal(true);
                                }}
                                className="p-2 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all shadow-sm group-hover:bg-amber-50 group-hover:border-amber-200 group-hover:text-amber-700"
                                title={language === 'am' ? 'የተከፈለበትን ደረሰኝ ማረጋገጫ (ፎቶ) እይ' : 'View Uploaded Receipt'}
                              >
                                <ImageIcon size={14} />
                              </button>
                            )}
                            {(payment.status === 'active' || payment.status === 'pending') && (
                              <button 
                                onClick={() => handleDownloadReceipt(payment)}
                                className="p-2 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all shadow-sm"
                                title="Download Receipt"
                              >
                                <FileText size={14} />
                              </button>
                            )}
                          {(payment.status === 'pending' || payment.status === 'rejected') && (
                            <button 
                              onClick={async () => {
                                if (await confirmAction(language === 'am' ? 'ይህን ክፍያ ማጥፋት ይፈልጋሉ?' : 'Delete this payment?')) {
                                  try {
                                    await deleteDoc(doc(db, 'payments', payment.id));
                                    triggerSuccess(language === 'am' ? 'ማሳወቂያ' : 'Notice', language === 'am' ? 'ተሰርዟል' : 'Deleted successfully');
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.DELETE, `payments/${payment.id}`);
                                  }
                                }
                              }}
                              className="p-2 bg-rose-50 text-rose-500 rounded-lg border border-rose-100 hover:bg-rose-100 transition-all shadow-sm"
                              title={language === 'am' ? 'አጥፋ' : 'Delete'}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest ${payment.status === 'active' ? 'bg-green-50 text-green-600' : payment.status === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-300'}`}>
                            {payment.status === 'active' ? 'Paid' : payment.status === 'rejected' ? 'Rejected' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Inline receipt photos display (instantly visible both before and after approval) */}
                      {(() => {
                        const listImages = payment.receiptImages && payment.receiptImages.length > 0
                          ? payment.receiptImages
                          : (payment.receiptImage ? [payment.receiptImage] : (payment.receiptUrl ? [payment.receiptUrl] : []));
                        
                        if (listImages.length === 0) return null;
                        
                        return (
                          <div className="mt-3 w-full border-t border-slate-50 pt-3 flex flex-col gap-1.5">
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">
                              {language === 'am' ? 'የተላከ ደረሰኝ ፎቶ(ዎች)' : 'Uploaded Receipt Photo(s)'} ({listImages.length})
                            </p>
                            <div className={`grid ${listImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                              {listImages.map((imgUrl: string, idx: number) => (
                                <img 
                                  key={idx}
                                  src={imgUrl} 
                                  alt={`Receipt ${idx + 1}`} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-32 object-cover rounded-2xl border border-slate-100 cursor-pointer hover:opacity-90 transition-opacity" 
                                  onClick={() => {
                                    setSelectedReceiptImages(listImages);
                                    setShowReceiptImagesModal(true);
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {payment.status === 'rejected' && payment.reviewMessage && (
                        <div className="mt-2 text-[10px] font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100 border-dashed">
                          <span className="font-black text-[8px] uppercase tracking-widest block mb-1 opacity-70">Admin Note:</span>
                          {payment.reviewMessage}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto pb-20">
              {/* Header */}
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-lg shadow-indigo-900/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="w-24 h-24 bg-white/10 p-1 rounded-[2rem] shadow-xl border border-white/20 shrink-0 relative">
                          {(userData.faceScan && (isAdmin || userData.uid === user.uid)) ? (
                            <img src={userData.faceScan} alt="Profile" className="w-full h-full object-cover rounded-[1.75rem]" />
                          ) : (
                            <div className="w-full h-full bg-slate-800 rounded-[1.75rem] flex items-center justify-center text-slate-500">
                               <UserIcon size={40} />
                            </div>
                          )}
                        </div>
                        <div className="text-center sm:text-left mt-2 sm:mt-0">
                          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                            <h2 className="text-3xl font-display font-black tracking-tight">
                              {userData.fullName}
                            </h2>
                            <div className="bg-gold-500/20 text-gold-200 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-gold-500/30">
                              {userData.memberCode || `M-${userData.uid?.slice(-5).toUpperCase()}`}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                              <PhoneIcon size={14} className="text-indigo-200" />
                              <span className="text-xs font-bold tracking-widest text-indigo-50">
                                {(isAdmin || userData.uid === user.uid) ? (userData.phone || '---') : 'PHONE HIDDEN'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                               <MapPin size={14} className="text-indigo-200" />
                               <span className="text-xs font-bold tracking-widest text-indigo-50">{userData.addressRegion || '---'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                  <div className="flex self-center sm:self-auto bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10">
                    {!isEditingProfile ? (
                       <button 
                         onClick={() => {
                           setProfileForm({ 
                             fullName: userData.fullName || '', 
                             addressRegion: userData.addressRegion || '', 
                             addressZone: userData.addressZone || '',
                             addressWoreda: userData.addressWoreda || '',
                             addressKebele: userData.addressKebele || '',
                             jobTitle: userData.jobTitle || '',
                             ekubType: userData.ekubType || '',
                             phone: userData.phone || '',
                             password: '',
                             idFront: userData.idFront || '', 
                             idBack: userData.idBack || '', 
                             faceScan: userData.faceScan || '' 
                           });
                           setIsEditingProfile(true);
                         }}
                         className="px-6 py-3 bg-white text-indigo-900 rounded-xl text-sm font-black shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                       >
                        <Edit size={16} /> 
                        {language === 'am' ? 'ፕሮፋይል አስተካክል' : 'Edit Profile'}
                       </button>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsEditingProfile(false)}
                          className="px-5 py-3 text-white hover:bg-white/10 rounded-xl text-sm font-bold transition-all"
                        >
                          {language === 'am' ? 'ሰርዝ' : 'Cancel'}
                        </button>
                        <button 
                          onClick={handleProfileUpdate}
                          disabled={isSubmitting}
                          className="px-6 py-3 bg-white text-indigo-900 rounded-xl text-sm font-black shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                          <CheckCircle size={16} /> 
                          {isSubmitting ? '...' : (language === 'am' ? 'አስቀምጥ' : 'Save')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Alert */}
              {isEditingProfile && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-[1.5rem] flex items-start gap-4">
                  <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                     <AlertOctagon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">
                      {language === 'am' ? 'ማስተካከያ ጥያቄ' : 'Update Request'}
                    </h4>
                    <p className="text-xs font-semibold text-amber-700 leading-relaxed">
                      {language === 'am' ? 'የሚያስተካክሉት መረጃ በቀጥታ አይቀየርም። ለአድሚን ይላክና ሲጸድቅ ብቻ ይቀየራል። የይለፍቃል ካስገቡ ሲጸድቅ ይለወጣል።' : 'Your changes will not be applied immediately. They will be sent to the administration for approval. If you enter a new password, it will be changed upon approval.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Form Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Personal Info */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8 space-y-6">
                   <div className="flex items-center gap-3 mb-2">
                     <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                       <UserIcon size={20} />
                     </div>
                     <h3 className="text-lg font-black text-slate-900 tracking-tight">
                       {language === 'am' ? 'የግል መረጃ' : 'Personal Info'}
                     </h3>
                   </div>

                   <div className="space-y-4">
                     <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                         {language === 'am' ? 'ሙሉ ስም' : 'Full Name'}
                       </label>
                       <input 
                         type="text" 
                         disabled={!isEditingProfile}
                         value={isEditingProfile ? profileForm.fullName : (userData.fullName || '')}
                         onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-75 disabled:bg-slate-50/50"
                       />
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                         {language === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'}
                       </label>
                       <input 
                         type="tel" 
                         disabled={!isEditingProfile}
                         value={isEditingProfile ? profileForm.phone : (userData.phone || '')}
                         onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-75 disabled:bg-slate-50/50"
                       />
                     </div>
                     {isEditingProfile && (
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                           <span>{language === 'am' ? 'አዲስ የይለፍቃል (አማራጭ)' : 'New Password (Optional)'}</span>
                         </label>
                         <input 
                           type="password" 
                           value={profileForm.password}
                           onChange={(e) => setProfileForm({...profileForm, password: e.target.value})}
                           placeholder="••••••••"
                           className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                         />
                         <p className="text-[9px] text-slate-400 font-medium ml-1">
                           {language === 'am' ? 'ካልፈለጉ ባዶ ይተዉት።' : 'Leave empty if you don\'t want to change it.'}
                         </p>
                       </div>
                     )}
                   </div>
                </div>

                {/* Address Info */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8 space-y-6">
                   <div className="flex items-center gap-3 mb-2">
                     <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                       <MapPin size={20} />
                     </div>
                     <h3 className="text-lg font-black text-slate-900 tracking-tight">
                       {language === 'am' ? 'አድራሻ' : 'Address'}
                     </h3>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          {language === 'am' ? 'ክልል' : 'Region'}
                        </label>
                        <input type="text" disabled={!isEditingProfile} value={isEditingProfile ? profileForm.addressRegion : (userData.addressRegion || '')} onChange={(e) => setProfileForm({...profileForm, addressRegion: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-75 disabled:bg-slate-50/50" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          {language === 'am' ? 'ዞን' : 'Zone'}
                        </label>
                        <input type="text" disabled={!isEditingProfile} value={isEditingProfile ? profileForm.addressZone : (userData.addressZone || '')} onChange={(e) => setProfileForm({...profileForm, addressZone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-75 disabled:bg-slate-50/50" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          {language === 'am' ? 'ወረዳ' : 'Woreda'}
                        </label>
                        <input type="text" disabled={!isEditingProfile} value={isEditingProfile ? profileForm.addressWoreda : (userData.addressWoreda || '')} onChange={(e) => setProfileForm({...profileForm, addressWoreda: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-75 disabled:bg-slate-50/50" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          {language === 'am' ? 'ቀበሌ / የቤት ቁጥር' : 'Kebele / House No'}
                        </label>
                        <input type="text" disabled={!isEditingProfile} value={isEditingProfile ? profileForm.addressKebele : (userData.addressKebele || '')} onChange={(e) => setProfileForm({...profileForm, addressKebele: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-75 disabled:bg-slate-50/50" />
                     </div>
                   </div>
                </div>

                {/* ID Documents */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8 space-y-6 md:col-span-2">
                   <div className="flex items-center gap-3 mb-2">
                     <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                       <CreditCard size={20} />
                     </div>
                     <h3 className="text-lg font-black text-slate-900 tracking-tight">
                       {language === 'am' ? 'የመታወቂያ መረጃ' : 'ID Documents'}
                     </h3>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                         {language === 'am' ? 'የመታወቂያ ፊት' : 'ID Front'}
                       </label>
                       <div className="aspect-[1.58/1] bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200 relative overflow-hidden group/id">
                          {isEditingProfile ? (
                            <>
                               {profileForm.idFront ? (
                                 <img src={profileForm.idFront} alt="Front" className="w-full h-full object-cover" />
                               ) : userData.idFront ? (
                                 <img src={userData.idFront} alt="Front" className="w-full h-full object-cover opacity-50 grayscale" />
                               ) : (
                                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                   <CreditCard size={32} className="mb-2 opacity-50" />
                                 </div>
                               )}
                             </>
                          ) : (
                            userData.idFront ? (
                              <img src={userData.idFront} alt="Front" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                <CreditCard size={32} className="mb-2 opacity-50" />
                                <span className="text-xs font-bold uppercase tracking-widest">No ID Front</span>
                              </div>
                            )
                          )}
                          {isEditingProfile && (
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/id:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-all backdrop-blur-sm">
                              <Upload size={24} className="mb-2" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Upload Front</span>
                              <input type="file" accept="image/*" onChange={(e) => handleProfileImageChange(e, 'idFront')} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                          )}
                       </div>
                     </div>

                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                         {language === 'am' ? 'የመታወቂያ ጀርባ' : 'ID Back'}
                       </label>
                       <div className="aspect-[1.58/1] bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200 relative overflow-hidden group/id">
                          {isEditingProfile ? (
                            <>
                               {profileForm.idBack ? (
                                 <img src={profileForm.idBack} alt="Back" className="w-full h-full object-cover" />
                               ) : userData.idBack ? (
                                 <img src={userData.idBack} alt="Back" className="w-full h-full object-cover opacity-50 grayscale" />
                               ) : (
                                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                   <CreditCard size={32} className="mb-2 opacity-50" />
                                 </div>
                               )}
                             </>
                          ) : (
                            userData.idBack ? (
                              <img src={userData.idBack} alt="Back" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                <CreditCard size={32} className="mb-2 opacity-50" />
                                <span className="text-xs font-bold uppercase tracking-widest">No ID Back</span>
                              </div>
                            )
                          )}
                          {isEditingProfile && (
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/id:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-all backdrop-blur-sm">
                              <Upload size={24} className="mb-2" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Upload Back</span>
                              <input type="file" accept="image/*" onChange={(e) => handleProfileImageChange(e, 'idBack')} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                          )}
                          {isEditingProfile && profileForm.idBack && (
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setProfileForm({...profileForm, idBack: ''}); }}
                              className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full hover:bg-rose-600 transition-colors z-20 shadow-md"
                              title="Remove"
                            >
                              <X size={14} />
                            </button>
                          )}
                       </div>
                     </div>
                   </div>
                </div>

              </div>
            </motion.div>
          )}
          
          {/* Removed redundant duplicate block to keep the updated one at the end */}


          {activeTab === 'member-id' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Member ID Card Rendering */}
              <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 max-w-2xl mx-auto">
                <h3 className="text-2xl font-black mb-8 text-slate-900 uppercase tracking-tight">
                    {language === 'am' ? 'የአባልነት መታወቂያ ካርድ' : 'Membership ID Card'}
                </h3>
  
              <div className="overflow-x-auto pb-8 w-full -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                <div id="id-card-content" className="flex flex-row gap-6 w-max mx-auto p-2 bg-transparent relative">
                  
                  {/* Front Side */}
                  <div className="w-[520px] aspect-[1.586/1] shrink-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 border-[4px] border-white/30 text-white rounded-[2rem] p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(168,85,247,0.4)] relative overflow-hidden backdrop-blur-sm">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-[80px] -translate-y-1/2 pointer-events-none" />
                     <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-300/20 rounded-full blur-[80px] translate-y-1/2 pointer-events-none" />
                     
                     <div className="flex justify-between items-start z-10 relative">
                         <div className="flex items-center gap-3 min-w-0">
                           <div className="w-10 h-10 shrink-0 rounded-xl bg-white flex items-center justify-center p-[2px] shadow-lg">
                              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-pink-500 rounded-[10px] flex items-center justify-center">
                                <span className="font-display font-black text-white text-lg drop-shadow-md">{t('common.appName').charAt(0).toUpperCase()}</span>
                              </div>
                           </div>
                           <div className="min-w-0">
                             <span className="font-black text-sm tracking-tight text-white mb-0.5 block leading-none drop-shadow-md">
                               {group?.name ? (group.name.length === 1 || !group.name.toLowerCase().includes('ምድብ') && !group.name.toLowerCase().includes('group') ? (language === 'am' ? `ምድብ ${group.name}` : `Group ${group.name}`) : group.name) : (language === 'am' ? 'መሊቅ እቁብ' : 'MELIQ EKUB')}
                             </span>
                             <h4 className="text-[8px] uppercase tracking-widest text-pink-200 font-black leading-none mt-1 drop-shadow-sm">{language === 'am' ? 'የአባልነት መታወቂያ' : 'Membership ID Card'}</h4>
                           </div>
                         </div>
                         <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-xl border border-white/50">
                           <QRCode value={JSON.stringify({uid: user?.uid, code: userData?.memberCode || `M-${user?.uid.substring(0, 5).toUpperCase()}`})} size={48} bgColor="transparent" fgColor="#0f172a" level="M" />
                         </div>
                     </div>

                     <div className="z-10 relative flex gap-5 items-center mt-auto mb-4 bg-white/10 p-3 rounded-3xl border border-white/20 backdrop-blur-md shadow-inner">
                        <div 
                          className="w-24 h-24 rounded-2xl border-[3px] border-white/40 overflow-hidden shrink-0 shadow-2xl cursor-pointer hover:border-white transition-all bg-indigo-900/50"
                          onClick={() => {
                            if (userData?.faceScan) setShowFullProfileImg(userData.faceScan);
                          }}
                        >
                           {userData?.faceScan ? (
                             <img src={userData.faceScan} alt="Profile" className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center">
                               <UserIcon size={32} className="text-white/50" />
                             </div>
                           )}
                        </div>
                        <div className="flex-1 space-y-2 min-w-0 h-full flex flex-col justify-center">
                            <div className="bg-white/10 rounded-xl p-2 border border-white/10 shadow-sm">
                              <span className="text-[8px] text-white/70 uppercase tracking-widest font-black inline-block mb-1">{language === 'am' ? 'ሙሉ ስም / Full Name' : 'Full Name'}</span>
                              <p className="font-display font-black text-sm tracking-tight leading-tight text-white break-words drop-shadow-sm">{userData?.fullName || '---'}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                               <div className="bg-white/10 rounded-xl p-2 border border-white/20 shadow-sm col-span-1">
                                  <span className="text-[7px] text-emerald-300 uppercase tracking-widest font-black inline-block mb-1">{language === 'am' ? 'ምድብ / GROUP' : 'GROUP'}</span>
                                  <p className="font-black text-[10px] tracking-tighter text-white leading-none truncate drop-shadow-sm">{group?.name || '---'}</p>
                               </div>
                               <div className="bg-white/10 rounded-xl p-2 border border-white/20 shadow-sm col-span-1">
                                  <span className="text-[7px] text-amber-300 uppercase tracking-widest font-black inline-block mb-1">{language === 'am' ? 'መለያ / CODE' : 'CODE'}</span>
                                  <p className="font-black text-[10px] tracking-tighter text-white leading-none uppercase drop-shadow-sm">{userData?.memberCode || '---'}</p>
                               </div>
                               <div className="bg-white/10 rounded-xl p-2 border border-white/20 shadow-sm col-span-1">
                                  <span className="text-[7px] text-blue-300 uppercase tracking-widest font-black inline-block mb-1">{language === 'am' ? 'መዋጮ / AMOUNT' : 'AMOUNT'}</span>
                                  <p className="font-black text-[10px] tracking-tighter text-white leading-none uppercase drop-shadow-sm">{userData?.amount ? `${userData?.amount.toLocaleString()}` : '---'}</p>
                               </div>
                            </div>
                        </div>
                     </div>

                     <div className="z-10 relative flex justify-between items-end border-t border-white/20 pt-3">
                         <div className="flex gap-4">
                            <div>
                               <span className="text-[8px] text-white/70 uppercase tracking-widest font-black mb-1 block">{language === 'am' ? 'ልዩ ኮድ' : 'Unique Code'}</span>
                               <p className="font-black tracking-widest text-sm text-pink-200 drop-shadow-sm">
                                 {userData?.memberCode || `M-${user?.uid.substring(0, 5).toUpperCase()}`}
                               </p>
                            </div>
                            <div className="border-l border-white/20 pl-4">
                               <span className="text-[8px] text-white/70 uppercase tracking-widest font-black mb-1 block">{language === 'am' ? 'የተመዘገቡበት' : 'Joined Date'}</span>
                               <p className="font-bold text-xs tracking-widest text-white drop-shadow-sm">
                                 {userData?.createdAt?.toDate ? userData.createdAt.toDate().toLocaleDateString() : 'N/A'}
                               </p>
                            </div>
                         </div>
                         <div className="text-right">
                            <span className="text-[8px] text-white/70 uppercase tracking-widest font-black mb-0.5 block">{language === 'am' ? 'የመዋጮ መጠን' : 'Amount'}</span>
                            <p className="font-black text-sm tracking-tighter text-white drop-shadow-md">
                                {group?.amount?.toLocaleString() || '---'} <span className="text-[8px] text-amber-300">ETB</span>
                            </p>
                         </div>
                     </div>
                  </div>
  
                  {/* Back Side */}
                  <div className="w-[520px] aspect-[1.586/1] shrink-0 bg-gradient-to-br from-teal-500 via-emerald-600 to-indigo-600 border-[4px] border-white/30 text-white rounded-[2rem] p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(16,185,129,0.4)] relative overflow-hidden backdrop-blur-sm">
                     <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-300/20 rounded-full blur-[80px] pointer-events-none" />
                     <div className="absolute top-0 left-0 w-64 h-64 bg-white/20 rounded-full blur-[80px] pointer-events-none" />
                     
                     <div className="flex items-center gap-2 border-b-2 border-dashed border-white/30 pb-3 relative z-10">
                       <Shield size={16} className="text-white drop-shadow-md" />
                       <span className="font-black text-white text-xs uppercase tracking-widest drop-shadow-md">{language === 'am' ? 'ማረጋገጫ (BACK)' : 'Verification'}</span>
                     </div>

                     <div className="space-y-4 flex-1 relative z-10 pt-3">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-inner">
                           <p className="text-[8px] text-white/80 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 drop-shadow-sm">
                             <MapPin size={10} />
                             {language === 'am' ? 'ሙሉ አድራሻ / Full Address' : 'Full Address'}
                           </p>
                           <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[10px] font-bold text-white leading-none">
                             <div className="bg-white/5 p-2 rounded-lg border border-white/10 shadow-sm">
                                <span className="block text-[7px] text-white/60 font-black mb-1 uppercase tracking-widest">{language === 'am' ? 'ክልል / Region' : 'Region'}</span>
                                <span className="drop-shadow-sm">{userData?.addressRegion || '---'}</span>
                             </div>
                             <div className="bg-white/5 p-2 rounded-lg border border-white/10 shadow-sm">
                                <span className="block text-[7px] text-white/60 font-black mb-1 uppercase tracking-widest">{language === 'am' ? 'ዞን / ወረዳ (Zone/Woreda)' : 'Zone/Woreda'}</span>
                                <span className="drop-shadow-sm">{userData?.addressZone || userData?.addressWoreda || '---'}</span>
                             </div>
                             <div className="bg-white/5 p-2 rounded-lg border border-white/10 shadow-sm">
                                <span className="block text-[7px] text-white/60 font-black mb-1 uppercase tracking-widest">{language === 'am' ? 'ቀበሌ / Kebele' : 'Kebele'}</span>
                                <span className="drop-shadow-sm">{userData?.addressKebele || '---'}</span>
                             </div>
                             <div className="bg-white/5 p-2 rounded-lg border border-white/10 shadow-sm">
                                <span className="block text-[7px] text-white/60 font-black mb-1 uppercase tracking-widest">{language === 'am' ? 'የቤት ቁጥር / House No.' : 'House No.'}</span>
                                <span className="drop-shadow-sm">{userData?.addressHouseNumber || userData?.houseNumber || '---'}</span>
                             </div>
                           </div>
                        </div>

                        {/* Birth Place Section */}
                        <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-inner">
                           <p className="text-[7px] text-white/60 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5 leading-none">
                             <Home size={10} className="text-emerald-200" />
                             {language === 'am' ? 'የትውልድ ቦታ / Birth Place' : 'Birth Place'}
                           </p>
                           <div className="grid grid-cols-3 gap-2 text-[8px] font-bold text-white/90">
                              <div className="truncate bg-white/5 p-1 rounded-md border border-white/5">
                                <span className="text-[5px] opacity-60 block uppercase mb-0.5 leading-none">{language === 'am' ? 'ክልል' : 'Reg.'}</span>
                                {userData?.birthRegion || '---'}
                              </div>
                              <div className="truncate bg-white/5 p-1 rounded-md border border-white/5">
                                <span className="text-[5px] opacity-60 block uppercase mb-0.5 leading-none">{language === 'am' ? 'ዞን' : 'Zone'}</span>
                                {userData?.birthZone || '---'}
                              </div>
                              <div className="truncate bg-white/5 p-1 rounded-md border border-white/5">
                                <span className="text-[5px] opacity-60 block uppercase mb-0.5 leading-none">{language === 'am' ? 'ወረዳ' : 'Wor.'}</span>
                                {userData?.birthWoreda || '---'}
                              </div>
                           </div>
                        </div>

                      {/* Professional & Ekub Info */}
                      <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-inner">
                         <p className="text-[7px] text-white/60 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5 leading-none">
                           <FileSignature size={10} className="text-blue-200" />
                           {language === 'am' ? 'ተጨማሪ መረጃ / Additional Info' : 'Additional Info'}
                         </p>
                         <div className="grid grid-cols-2 gap-2 text-[8px] font-bold text-white/90">
                            <div className="bg-white/5 p-1.5 rounded-md border border-white/5">
                              <span className="text-[6px] opacity-60 block uppercase mb-0.5 leading-none">{language === 'am' ? 'የስራ አይነት' : 'Job Title'}</span>
                              {userData?.jobTitle || '---'}
                            </div>
                            <div className="bg-white/5 p-1.5 rounded-md border border-white/5">
                              <span className="text-[6px] opacity-60 block uppercase mb-0.5 leading-none">{language === 'am' ? 'የእቁብ ምድብ' : 'Ekub Type'}</span>
                              <span className="text-emerald-300">{userData?.ekubType || '---'}</span>
                            </div>
                            <div className="bg-white/5 p-1.5 rounded-md border border-white/5">
                              <span className="text-[6px] opacity-60 block uppercase mb-0.5 leading-none">{language === 'am' ? 'የመለያ ኮድ' : 'Member Code'}</span>
                              <span className="text-amber-300 font-black">{userData?.memberCode || '---'}</span>
                            </div>
                            <div className="bg-white/5 p-1.5 rounded-md border border-white/5">
                              <span className="text-[6px] opacity-60 block uppercase mb-0.5 leading-none">{language === 'am' ? 'የመዋጮ መጠን' : 'Amount'}</span>
                              <span className="text-blue-300">{userData?.amount ? `${userData?.amount.toLocaleString()} ETB` : '---'}</span>
                            </div>
                            <div className="bg-white/5 p-1.5 rounded-md border border-white/5">
                              <span className="text-[6px] opacity-60 block uppercase mb-0.5 leading-none">{language === 'am' ? 'የአባልነት ደረጃ' : 'Member Level'}</span>
                              <span className="text-purple-300 font-black">{(userData?.amount || 0) > 5000 ? 'GOLD' : 'SILVER'}</span>
                            </div>
                            <div className="bg-white/5 p-1.5 rounded-md border border-white/5">
                              <span className="text-[6px] opacity-60 block uppercase mb-0.5 leading-none">{language === 'am' ? 'የሚያበቃበት ቀን' : 'Valid Until'}</span>
                              <span className="text-rose-300">
                                {userData?.createdAt?.toDate ? new Date(userData.createdAt.toDate().getFullYear() + 1, userData.createdAt.toDate().getMonth(), userData.createdAt.toDate().getDate()).toLocaleDateString() : '---'}
                              </span>
                            </div>
                         </div>
                      </div>

                        <div className="text-[8px] text-white font-bold leading-relaxed bg-black/20 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-start gap-2 shadow-inner">
                          <AlertTriangle size={12} className="text-amber-300 shrink-0 mt-0.5 drop-shadow-md" />
                          <p className="drop-shadow-sm">
                            {language === 'am' ? 'ይህ መታወቂያ ካርድ ለሌላ አካል አሳልፎ መስጠት የተከለከለ ነው። ይህ ካርድ አባል መሆንዎን ያረጋግጣል። ካርዱ ቢጠፋ በአፋጣኝ ለዕቁቡ አስተዳደር ማሳወቅ የርስዎ ግዴታ ነው።' : 'This ID card is strictly non-transferable and verifies your active membership. If lost or misplaced, you must notify the administration immediately.'}
                          </p>
                        </div>
                     </div>

                     <div className="mt-auto relative z-10 bg-white/90 backdrop-blur-md rounded-xl overflow-hidden p-2 pt-3 pb-1 shadow-2xl flex flex-col items-center justify-center border border-white/50 mx-4">
                        <div className="text-[7px] font-black uppercase tracking-widest text-slate-800 mb-1 leading-none text-center">
                           {language === 'am' ? 'ባርኮዷን ስካን በማድረግ ያረጋግጡ / Scan to Verify' : 'Scan to Verify Authenticity'}
                        </div>
                        <Barcode 
                          value={user?.uid ? user.uid.substring(0, 18).toUpperCase() : 'PENDING'} 
                          format="CODE128"
                          width={1.2} 
                          height={24} 
                          displayValue={true} 
                          fontSize={8} 
                          background="transparent" 
                          lineColor="#0f172a" 
                          margin={0}
                        />
                     </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                 <button 
                   onClick={async () => {
                     const element = document.getElementById('id-card-content');
                     if (!element) return;
                     const canvas = await htmlToImage.toCanvas(element, { pixelRatio: 4, backgroundColor: null });
                     const imgData = canvas.toDataURL('image/png');
                     // Since aspect ratio is roughly ~1000x300, landscape A4 is ideal
                     const pdf = new jsPDF('l', 'mm', 'a4');
                     // A4 Landscape: 297mm x 210mm
                     // Try to fit the width to somewhat centered
                     pdf.addImage(imgData, 'PNG', 15, 40, 267, 85);
                     pdf.save(`${userData?.fullName || 'Member'}_ID.pdf`);
                   }}
                   className="w-full max-w-sm py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2"
                 >
                    <Download size={16} /> {language === 'am' ? 'ካርዱን ያውርዱ' : 'Download ID Card'}
                 </button>
              </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'payment-send' && (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl max-w-2xl mx-auto space-y-8">
               <div className="text-center space-y-2">
                 <h2 className="text-2xl font-black uppercase tracking-tighter">{language === 'am' ? 'ክፍያ ላክ' : 'Send Payment'}</h2>
                 <p className="text-slate-400 text-xs font-medium">{language === 'am' ? 'ባንክ ሂሳብ ቁጥሮች እና ለክፍያ ማረጋገጫ ፎቶ ይላኩ' : 'Send us bank account details and receipt screenshot/photo'}</p>
               </div>
               
               {/* Bank Selector */}
               <form onSubmit={handleSendPayment} className="space-y-8">
                 {/* Amount */}
                 <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{language === 'am' ? 'የክፍያ መጠን' : 'Amount to Pay'}</label>
                      <div className="w-full h-14 bg-slate-100 border border-slate-200 rounded-2xl px-5 flex items-center shadow-inner">
                        <span className="text-lg font-black text-slate-900">{(userData?.totalPerSlot ? (userData.totalPerSlot * (userData.slots || 1)) : ((group?.amount || 0) * 1.1 * (userData?.slots || 1))).toLocaleString()} ETB</span>
                      </div>
                   </div>
                 </div>

                 {/* Bank Selector */}
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{language === 'am' ? 'ባንክ ይምረጡ' : 'Select Bank'}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { 
                          id: 'cbe', 
                          name: 'CBE',
                          acc: '1000082143134 (SULTAN KEDIR HUSSEN)',
                          activeClass: 'border-purple-600 bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        },
                        { 
                          id: 'telebirr', 
                          name: 'Telebirr',
                          acc: '0986204981 (KEDIR HUSSEN)',
                          activeClass: 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        },
                        { 
                          id: 'boa', 
                          name: 'BOA',
                          acc: '151045774 (SULTAN KEDIR HUSSEN)',
                          activeClass: 'border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                        }
                      ].map((bank) => (
                        <div key={bank.id} className="flex flex-col gap-2">
                           <button
                             type="button"
                             onClick={() => setPaymentBank(bank.id)}
                             className={`p-4 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${
                               paymentBank === bank.id
                                 ? bank.activeClass
                                 : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:-translate-y-1'
                             }`}
                           >
                             <span className="text-sm font-black uppercase tracking-wider">{bank.name}</span>
                           </button>
                           {paymentBank === bank.id && (
                             <motion.div 
                               initial={{ opacity: 0, height: 0 }}
                               animate={{ opacity: 1, height: 'auto' }}
                               className="text-center bg-slate-50 rounded-xl border border-slate-200 p-3"
                             >
                               <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{language === 'am' ? 'የሂሳብ ቁጥር' : 'Account Details'}</p>
                               <p className="text-xs font-bold text-slate-800 break-words">{bank.acc}</p>
                             </motion.div>
                           )}
                        </div>
                      ))}
                    </div>
                 </div>
                 
                 {/* Transaction Code */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{language === 'am' ? 'ትራንዛክሽን ኮድ' : 'Transaction Code'}</label>
                    <input 
                      type="text" 
                      required
                      value={paymentCode}
                      onChange={(e) => setPaymentCode(e.target.value)}
                      placeholder={language === 'am' ? 'ትራንዛክሽን ኮድ ያስገቡ' : 'Enter transaction code'}
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-200 outline-none" 
                    />
                 </div>

                 {/* Payer Account Name */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{language === 'am' ? 'የከፋይ ስም' : 'Payer Name'}</label>
                    <input 
                      type="text" 
                      required
                      value={paymentPayerName}
                      onChange={(e) => setPaymentPayerName(e.target.value)}
                      placeholder={language === 'am' ? 'የከፋይ ስም ያስገቡ' : 'Enter payer name'}
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-200 outline-none" 
                    />
                 </div>

                 {/* Payer Account Number */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{language === 'am' ? 'የከፋይ ሂሳብ ቁጥር' : 'Payer Account Number'}</label>
                    <input 
                      type="text" 
                      required
                      value={paymentPayerAccount}
                      onChange={(e) => setPaymentPayerAccount(e.target.value)}
                      placeholder={language === 'am' ? 'የከፋይ ሂሳብ ቁጥር ያስገቡ' : 'Enter payer account number'}
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-200 outline-none" 
                    />
                 </div>

                 {/* Screenshot / File Upload */}
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{language === 'am' ? 'የክፍያ ማረጋገጫ ፎቶዎች' : 'Payment Receipt Screenshots'}</label>
                    <div className="flex flex-wrap gap-4">
                        {receiptImages.map((img, idx) => (
                           <div key={idx} className="w-20 h-20 rounded-xl border border-slate-200 overflow-hidden relative">
                              <img src={img} alt="Receipt" className="w-full h-full object-cover" />
                              <button type="button" onClick={() => setReceiptImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                                 <XCircle size={12} />
                              </button>
                           </div>
                        ))}
                        <div className="w-20 h-20 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 cursor-pointer hover:border-slate-400 transition-all bg-slate-50">
                           <input 
                              type="file" 
                              multiple
                              onChange={(e) => {
                                 if (e.target.files) {
                                    const files = Array.from(e.target.files);
                                    const promises = files.map((file) => {
                                       return new Promise<string>((resolve, reject) => {
                                          const reader = new FileReader();
                                          reader.onloadend = async () => {
                                             try {
                                                const compressed = await compressImage(reader.result as string);
                                                resolve(compressed);
                                             } catch (err) {
                                                reject(err);
                                             }
                                          };
                                          reader.onerror = (err) => reject(err);
                                          reader.readAsDataURL(file);
                                       });
                                    });
                                    Promise.all(promises)
                                       .then((base64Images) => {
                                          setReceiptImages(prev => [...prev, ...base64Images]);
                                       })
                                       .catch((err) => console.error("Error compressing receipt files: ", err));
                                 }
                              }}
                              className="hidden"
                              id="receipt-upload"
                           />
                           <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center">
                              <Camera size={20} />
                           </label>
                        </div>
                    </div>
                 </div>

                 <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-[0.98]">
                    {isSubmitting ? (language === 'am' ? 'በመላክ ላይ' : 'Sending...') : (language === 'am' ? 'ክፍያ ይላኩ' : 'Send Payment')}
                 </button>
               </form>
            </motion.div>
          )}

          {activeTab === 'draws' && (
            <DrawsView upcomingDraws={upcomingDraws} winners={drawWinners} group={group} />
          )}

          {activeTab === 'notifications' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-3xl mx-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-lg shadow-indigo-900/10 mb-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2 pointer-events-none" />
                <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                  <Bell size={180} />
                </div>
                
                <div className="relative z-10 flex flex-col items-start gap-4">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                    <Bell size={28} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight mb-2">
                      {language === 'am' ? 'ማሳወቂያዎች' : 'Notifications'}
                    </h2>
                    <p className="text-indigo-100 font-medium max-w-md">
                      {language === 'am' ? 'የሲስተም መልእክቶች፣ እጣዎች እና አዳዲስ መረጃዎች።' : 'System alerts, draw results, and important updates.'}
                    </p>
                  </div>
                  {notifications.filter(n => !n.read).length > 0 && (
                     <div className="mt-4 px-4 py-2 bg-rose-500 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm shadow-rose-500/20">
                       <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                       {language === 'am' ? `${notifications.filter(n => !n.read).length} አዲስ ማሳወቂያዎች አሉ` : `${notifications.filter(n => !n.read).length} Unread Alerts`}
                     </div>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                 <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                   <div>
                     <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                       {language === 'am' ? 'የመልእክቶች ዝርዝር' : 'Notification List'}
                     </h3>
                   </div>
                   {notifications.some(n => !n.read) && (
                     <button className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 active:scale-95 transition-all bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-xl shadow-sm"
                       onClick={async () => {
                         try {
                           const unread = notifications.filter(n => !n.read);
                           for (const n of unread) {
                             await updateDoc(doc(db, 'notifications', n.id), { read: true });
                           }
                         } catch (error) {
                           console.error(error);
                         }
                       }}
                     >
                       {language === 'am' ? 'ሁሉንም እንዳነበብኩ አድርግ' : 'Mark all as read'}
                     </button>
                   )}
                 </div>

                 <div className="divide-y divide-slate-100">
                   {notifications.length === 0 ? (
                      <div className="text-center py-20 flex flex-col items-center opacity-60">
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                           <Bell size={32} className="text-slate-300" />
                         </div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed max-w-[250px] mb-2">
                           {language === 'am' ? 'ምንም ማሳወቂያ የለም' : 'No notifications'}
                         </p>
                         <p className="text-xs font-medium text-slate-500 max-w-xs">
                           {language === 'am' ? 'አሁን ላይ ምንም አይነት ማሳወቂያ የለዎትም። አዲስ መልእክት ሲኖር እዚህ ይደርስዎታል።' : 'You have no notifications yet. We will alert you here.'}
                         </p>
                      </div>
                   ) : (
                      notifications.map(n => (
                         <div key={n.id} className={`p-6 md:p-8 flex flex-col md:flex-row gap-4 md:gap-6 transition-colors relative group ${!n.read ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}>
                            {/* Blue dot absolute for unread */}
                            {!n.read && (
                              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                            )}
                            
                            <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center shrink-0 border ${!n.read ? 'bg-indigo-100 text-indigo-600 border-indigo-200 shadow-inner' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                               <Bell size={20} className={!n.read ? 'animate-bounce' : ''} />
                            </div>
                            
                            <div className="flex-1 w-full">
                               <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 mb-2">
                                 <h4 className={`text-base font-black ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>{n.title}</h4>
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mt-1 sm:mt-0 flex items-center gap-2">
                                    {new Date(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt).toLocaleDateString()}
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    {new Date(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 </span>
                               </div>
                               
                               <p className={`text-[13px] leading-relaxed mb-4 md:pr-10 ${!n.read ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                                 {n.message}
                               </p>
                               
                               {!n.read && (
                                 <button 
                                   onClick={() => updateDoc(doc(db, 'notifications', n.id), { read: true })} 
                                   className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 active:scale-95 transition-all bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-xl border border-indigo-200/50 flex items-center gap-1.5 w-fit"
                                 >
                                   <CheckCircle size={14} />
                                   {language === 'am' ? 'እንደተነበበ አድርግ' : 'Mark as read'}
                                 </button>
                               )}
                            </div>
                         </div>
                      ))
                   )}
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'support' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto pb-20">
              {/* Header */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-lg shadow-slate-900/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                      <HelpCircle size={28} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-display font-black tracking-tight mb-1">
                        {language === 'am' ? 'የድጋፍ እና ብድር ማዕከል' : 'Support & Loans'}
                      </h2>
                      <p className="text-slate-300 font-medium">
                        {language === 'am' ? 'ያሉበትን ሁኔታ ያሳውቁ፣ ብድር ይጠይቁ።' : 'Get help or request a financial loan.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 overflow-x-auto no-scrollbar">
                    <button 
                      onClick={() => setSupportSubTab('support')} 
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${supportSubTab === 'support' ? 'bg-white text-slate-900 shadow-md scale-105' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                    >
                      {language === 'am' ? 'የድጋፍ ማዕከል' : 'Support'}
                    </button>
                    <button 
                      onClick={() => setSupportSubTab('loan')} 
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${supportSubTab === 'loan' ? 'bg-white text-slate-900 shadow-md scale-105' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                    >
                      {language === 'am' ? 'የብድር ማዕከል' : 'Loan Center'}
                    </button>
                    <button 
                      onClick={() => setSupportSubTab('emergency' as any)} 
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${supportSubTab === ('emergency' as any) ? 'bg-white text-slate-900 shadow-md scale-105' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                    >
                      {language === 'am' ? 'አስቸኳይ እርዳታ' : 'Emergency Help'}
                    </button>
                  </div>
                </div>
              </div>

              {supportSubTab === 'support' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Ticket Form */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden p-10 transform transition-all hover:shadow-2xl">
                    <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tighter flex items-center gap-3">
                      <MessageCircle className="text-indigo-600" />
                      {language === 'am' ? 'አዲስ መልእክት ይላኩ' : 'Open Ticket'}
                    </h3>
                    <form onSubmit={handleSupportSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          {language === 'am' ? 'ርዕስ' : 'Subject'}
                        </label>
                        <input 
                          type="text" 
                          value={supportSubject} 
                          onChange={(e) => setSupportSubject(e.target.value)} 
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans"
                          placeholder={language === 'am' ? 'የችግሩ አይነት...' : 'Issue subject...'}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          {language === 'am' ? 'መልእክት' : 'Message'}
                        </label>
                        <textarea 
                          value={supportMessage} 
                          onChange={(e) => setSupportMessage(e.target.value)} 
                          rows={6}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-6 py-4 text-sm font-medium text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none font-sans"
                          placeholder={language === 'am' ? 'ችግሮትን በዝርዝር ያስረዱ...' : 'Describe your issue details...'}
                          required
                        ></textarea>
                      </div>
                      <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/30 active:scale-[0.98] transition-all disabled:opacity-50">
                        {isSubmitting ? (language === 'am' ? 'በመላክ ላይ...' : 'Sending...') : (language === 'am' ? 'መልእክት ላክ' : 'Send Ticket')}
                      </button>
                    </form>
                  </div>

                  {/* Past Tickets */}
                  <div className="bg-slate-900 rounded-[2.5rem] p-10 flex flex-col h-full shadow-2xl">
                    <h3 className="text-2xl font-black text-white mb-8 uppercase tracking-tighter flex items-center justify-between">
                      {language === 'am' ? 'ያለፉ መልእክቶች' : 'History'}
                      <span className="text-xs font-black bg-white/10 text-white px-4 py-1.5 rounded-full">{userTickets.length}</span>
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-4 min-h-[300px]">
                      {userTickets.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40 text-white">
                          <MessageCircle size={48} className="text-white/20 mb-4" />
                          <p className="text-sm font-black text-white uppercase tracking-widest">
                            {language === 'am' ? 'ምንም መልእክት የለም' : 'No Tickets'}
                          </p>
                        </div>
                      ) : (
                        userTickets.map(ticket => (
                          <div key={ticket.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl shadow-inner hover:bg-white/10 transition-all">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-black text-white text-md tracking-tight">{ticket.subject}</h4>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${
                                  ticket.status === 'open' ? 'bg-amber-500/20 text-amber-300' :
                                  ticket.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-300'
                                }`}>
                                  {ticket.status}
                                </span>
                                <button 
                                  onClick={async () => {
                                    if (await confirmAction(language === 'am' ? 'ይህን መልእክት ማጥፋት ይፈልጋሉ?' : 'Delete this ticket?')) {
                                      try {
                                        await deleteDoc(doc(db, 'support_tickets', ticket.id));
                                        triggerSuccess(language === 'am' ? 'ማሳወቂያ' : 'Notice', language === 'am' ? 'ተሰርዟል' : 'Deleted successfully');
                                      } catch (error) {
                                        handleFirestoreError(error, OperationType.DELETE, `support_tickets/${ticket.id}`);
                                      }
                                    }
                                  }}
                                  className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-slate-300 line-clamp-2 mb-4 font-medium leading-relaxed">{ticket.message}</p>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-t border-white/5 pt-4">
                              {new Date(ticket.createdAt?.toDate ? ticket.createdAt.toDate() : ticket.createdAt).toLocaleString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {supportSubTab === 'loan' && (() => {
                const totalC = userData?.totalContributed || 0;
                let msLevel = { title: 'Bronze', icon: UserIcon, color: 'text-orange-500', bg: 'bg-orange-50', limit: 5000, next: 3000, max: 500000 };
                if (totalC >= 50000) msLevel = { title: 'Platinum', icon: Trophy, color: 'text-slate-400', bg: 'bg-slate-100', limit: 150000, next: 50000, max: 500000 };
                else if (totalC >= 10000) msLevel = { title: 'Gold', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50', limit: 50000, next: 50000, max: 50000 };
                else if (totalC >= 3000) msLevel = { title: 'Silver', icon: Trophy, color: 'text-slate-400', bg: 'bg-slate-100', limit: 15000, next: 10000, max: 15000 };
                
                const progress = Math.min(100, (totalC / msLevel.next) * 100);

                return (
                  <div className="space-y-6">
                    {/* Membership Tier Banner */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                      
                      <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shrink-0 border border-white/50 shadow-xl ${msLevel.bg}`}>
                        <msLevel.icon size={40} className={msLevel.color} />
                      </div>
                      
                      <div className="flex-1 text-center md:text-left z-10 w-full">
                        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 mb-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                              {language === 'am' ? 'የእርስዎ ደረጃ' : 'Your Tier'}
                            </p>
                            <h3 className={`text-3xl font-black uppercase tracking-tight ${msLevel.color}`}>
                              {msLevel.title}
                            </h3>
                          </div>
                          <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-lg border border-slate-800 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                              {language === 'am' ? 'መጠየቅ የሚችሉት (ብር)' : 'Max Loan Limit'}
                            </p>
                            <p className="text-xl font-black tracking-tighter">
                              {msLevel.limit.toLocaleString()} ETB
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 max-w-lg mx-auto md:mx-0">
                           <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                             <span>{totalC.toLocaleString()} ETB</span>
                             <span>{msLevel.next === msLevel.max ? 'Max' : `${msLevel.next.toLocaleString()} ETB`}</span>
                           </div>
                           <div className="h-2 md:h-3 bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full rounded-full transition-all duration-1000 ${msLevel.bg.replace('bg-', 'bg-').replace('50', '500').replace('100', '400')}`} style={{ width: `${progress}%` }}></div>
                           </div>
                           {msLevel.next !== msLevel.max && (
                             <p className="text-[10px] font-medium text-slate-500 text-right">
                               {language === 'am' ? `${(msLevel.next - totalC).toLocaleString()} ብር ቀሪ ለቀጣይ ደረጃ` : `${(msLevel.next - totalC).toLocaleString()} ETB more for next tier`}
                             </p>
                           )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {/* Request Loan Form */}
                       <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden p-10 transform transition-all hover:shadow-2xl">
                         <div className="mb-8">
                           <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                             <DollarSign className="text-emerald-600" />
                             {language === 'am' ? 'ብድር ይጠይቁ' : 'Request Loan'}
                           </h3>
                           <p className="text-xs text-slate-500 mt-2 font-black uppercase tracking-widest">
                             {language === 'am' ? 'እባክዎ ትክክለኛ መረጃ ይሙሉ' : 'Please provide accurate details'}
                           </p>
                         </div>
                         <form onSubmit={handleLoanSubmit} className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                {language === 'am' ? 'የብድር መጠን (ብር)' : 'Amount (ETB)'}
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                  <DollarSign size={18} className="text-slate-400" />
                                </div>
                                <input 
                                  type="number" 
                                  max={msLevel.limit}
                                  value={loanAmount} 
                                  onChange={(e) => setLoanAmount(e.target.value)} 
                                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl pl-14 pr-6 py-5 text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-mono"
                                  placeholder="0.00"
                                  required
                                />
                              </div>
                              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest ml-1 bg-emerald-50 px-2 py-1 rounded-md w-fit">
                                {language === 'am' ? `ከፍተኛ መጠን: ${msLevel.limit.toLocaleString()}` : `Max limit: ${msLevel.limit.toLocaleString()}`}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                {language === 'am' ? 'ምክንያት/ዓላማ' : 'Reason / Purpose'}
                              </label>
                              <textarea 
                                value={loanReason} 
                                onChange={(e) => setLoanReason(e.target.value)} 
                                rows={4}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-6 py-4 text-sm font-medium text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none font-sans"
                                placeholder={language === 'am' ? 'የብድር ጥያቄ ምክንያት...' : 'Loan request reason...'}
                                required
                              />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-emerald-500/30 active:scale-[0.98] transition-all disabled:opacity-50">
                                {isSubmitting ? (language === 'am' ? 'በመላክ ላይ...' : 'Sending...') : (language === 'am' ? 'ብድር ጠይቅ' : 'Request Loan')}
                            </button>
                         </form>
                       </div>

                       {/* Past Loans */}
                       <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner overflow-hidden p-8 flex flex-col h-full">
                         <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center justify-between">
                           {language === 'am' ? 'ያለፉ ጥያቄዎች' : 'Loan History'}
                           <span className="text-xs font-bold bg-slate-200 text-slate-500 px-3 py-1 rounded-full">{userLoans.length}</span>
                         </h3>
                         <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 min-h-[300px]">
                           {userLoans.length === 0 ? (
                             <div className="h-full flex flex-col items-center justify-center opacity-40">
                               <CreditCard size={32} className="text-slate-400 mb-3" />
                               <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                 {language === 'am' ? 'ምንም ጥያቄ የለም' : 'No Loans Found'}
                               </p>
                             </div>
                           ) : (
                             userLoans.map(loan => (
                               <div key={loan.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                                 <div className="flex justify-between items-start mb-2">
                                   <h4 className="font-black text-slate-900 text-lg tracking-tighter">{loan.amount?.toLocaleString()} ETB</h4>
                                   <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-lg ${
                                     loan.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                     loan.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                                     loan.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                                   }`}>
                                     {loan.status}
                                   </span>
                                   {(loan.status === 'pending' || loan.status === 'rejected') && (
                                      <button 
                                        onClick={async () => {
                                          if (await confirmAction(language === 'am' ? 'ይህን ጥያቄ ማጥፋት ይፈልጋሉ?' : 'Delete this loan request?')) {
                                            try {
                                              await deleteDoc(doc(db, 'loans', loan.id));
                                            } catch (error) {
                                              handleFirestoreError(error, OperationType.DELETE, `loans/${loan.id}`);
                                            }
                                          }
                                        }}
                                        className="ml-2 p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                                        title={language === 'am' ? 'ያጥፉ' : 'Delete'}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                   )}
                                 </div>
                                 <p className="text-xs text-slate-500 line-clamp-2 mb-3 font-medium bg-slate-50 p-2 rounded-lg">{loan.reason}</p>
                                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-3 flex justify-between">
                                   <span>{new Date(loan.createdAt?.toDate ? loan.createdAt.toDate() : loan.createdAt).toLocaleDateString()}</span>
                                   {loan.status === 'approved' && <span className="text-emerald-500">Active</span>}
                                 </div>
                               </div>
                             ))
                           )}
                         </div>
                       </div>
                    </div>
                  </div>
                );
              })()}

              {supportSubTab === ('emergency' as any) && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { icon: AlertOctagon, title: language === 'am' ? 'ድንገተኛ አደጋ' : 'Accident', desc: language === 'am' ? 'ለደረሰ ድንገተኛ አደጋ የገንዘብ ድጋፍ' : 'Financial aid for sudden accidents.', color: 'text-rose-500', bg: 'bg-rose-50' },
                      { icon: HelpCircle, title: language === 'am' ? 'ህክምና' : 'Medical', desc: language === 'am' ? 'ለድንገተኛ የህክምና ወጪዎች ድጋፍ' : 'Support for urgent medical expenses.', color: 'text-indigo-500', bg: 'bg-indigo-50' },
                      { icon: ShieldCheck, title: language === 'am' ? 'ሌሎች ማህበራዊ' : 'Other Social', desc: language === 'am' ? 'ለሌሎች ድንገተኛ ማህበራዊ ጉዳዮች' : 'Help for other social emergency cases.', color: 'text-amber-500', bg: 'bg-amber-50' }
                    ].map((item, i) => (
                      <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                        <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                          <item.icon size={28} />
                        </div>
                        <h4 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">{item.title}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">{item.desc}</p>
                        <button 
                          onClick={() => handleEmergencyRequest(item)}
                          className={`w-full py-3 ${item.bg} ${item.color} rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-95 transition-all`}
                        >
                          {language === 'am' ? 'ጥያቄ አቅርብ' : 'Request Now'}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -translate-x-1/4 -translate-y-1/4" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                      <div className="w-32 h-32 bg-white/10 rounded-[2.5rem] flex items-center justify-center border border-white/20 shrink-0">
                        <Info size={48} className="text-gold-400" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">
                          {language === 'am' ? 'የአስቸኳይ ጊዜ እርዳታ ደንቦች' : 'Emergency Aid Policies'}
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                          {language === 'am' ? 'የአስቸኳይ ጊዜ እርዳታ የሚሰጠው አባሉ ለገጠመው ድንገተኛ ችግር ሲሆን፣ ጥያቄው በአድሚን ተጣርቶ እና ተረጋግጦ ይፈቀዳል።' : 'Emergency aid is provided for members facing sudden challenges. All requests are verified by the administration before approval.'}
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-black uppercase tracking-widest">
                          <li className="flex items-center gap-2 text-gold-400"><CheckCircle size={14} /> {language === 'am' ? 'ፈጣን ምላሽ' : 'Fast Response'}</li>
                          <li className="flex items-center gap-2 text-gold-400"><CheckCircle size={14} /> {language === 'am' ? 'ምንም ወለድ የለውም' : 'Zero Interest'}</li>
                          <li className="flex items-center gap-2 text-gold-400"><CheckCircle size={14} /> {language === 'am' ? 'ቀጥታ ክፍያ' : 'Direct Payout'}</li>
                          <li className="flex items-center gap-2 text-gold-400"><CheckCircle size={14} /> {language === 'am' ? 'ምስጢራዊነት' : 'Confidential'}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-5xl mx-auto pb-24">
              {/* Header Header */}
              <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />
                <div className="relative z-10">
                   <div className="flex items-center gap-6 mb-4">
                      <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center text-slate-300 border border-white/10">
                        <Settings className="animate-[spin_20s_linear_infinite]" size={36} />
                      </div>
                      <div>
                        <h2 className="text-4xl font-display font-black tracking-tighter uppercase mb-1">
                          {language === 'am' ? 'ቅንብሮች' : 'Settings'}
                        </h2>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">
                          {language === 'am' ? 'የአካውንት እና የአጠቃቀም ምርጫዎች' : 'Account & App Preferences'}
                        </p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Sidebar - Options */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Appearance & Interface */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-50">
                       <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                         <Layers className="text-indigo-500" />
                         {language === 'am' ? 'ባህሪ እና መልክ' : 'Appearance'}
                       </h3>
                    </div>
                    <div className="p-8 space-y-8">
                      {/* Language Selection */}
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                            <MessageCircle size={22} />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 tracking-tight">{language === 'am' ? 'ቋንቋ' : 'Interface Language'}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{language === 'am' ? 'የሲስተሙን ቋንቋ ይቀይሩ' : 'Set your preferred language'}</p>
                          </div>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                          <button onClick={() => setLanguage('am')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${language === 'am' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>አማርኛ</button>
                          <button onClick={() => setLanguage('en')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${language === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>English</button>
                        </div>
                      </div>

                      {/* Display Mode */}
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                            <ImageIcon size={22} />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 tracking-tight">{language === 'am' ? 'ገጽታ' : 'Display Theme'}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{language === 'am' ? 'ቀላል ወይም ጥቁር ገጽታ' : 'Light or Dark visualization'}</p>
                          </div>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                           <button onClick={() => {
                              document.documentElement.classList.remove('dark');
                              localStorage.setItem('theme', 'light');
                           }} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${localStorage.getItem('theme') !== 'dark' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Light</button>
                           <button onClick={() => {
                              document.documentElement.classList.add('dark');
                              localStorage.setItem('theme', 'dark');
                           }} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${localStorage.getItem('theme') === 'dark' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Dark</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notifications & Privacy */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-50">
                       <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                         <ShieldCheck className="text-emerald-500" />
                         {language === 'am' ? 'ደህንነት እና ማሳወቂያዎች' : 'Security & Alerts'}
                       </h3>
                    </div>
                    <div className="p-8 space-y-8">
                       {[
                         { icon: Bell, title: language === 'am' ? 'የግፊት ማሳወቂያዎች' : 'Push Notifications', desc: language === 'am' ? 'አዳዲስ መረጃዎችን በአየር ላይ ያግኙ' : 'Alerts on screen', color: 'text-indigo-500', bg: 'bg-indigo-50', checked: true },
                         { icon: Hash, title: language === 'am' ? 'የአካውንት ምስጢራዊነት' : 'Account Privacy', desc: language === 'am' ? 'አካውንትዎ ለሌሎች አይታይ' : 'Hide profile from others', color: 'text-rose-500', bg: 'bg-rose-50', checked: false },
                         { icon: PhoneCall, title: language === 'am' ? 'የስልክ ጥሪ ማሳወቂያ' : 'Call Alerts', desc: language === 'am' ? 'በጥሪ ማሳወቂያ እንዲደርስዎት' : 'Alert via telephone', color: 'text-emerald-500', bg: 'bg-emerald-50', checked: true }
                       ].map((item, idx) => (
                         <div key={idx} className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center ${item.color}`}>
                                <item.icon size={22} />
                              </div>
                              <div>
                                <h4 className="font-black text-slate-900 tracking-tight">{item.title}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.desc}</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked={item.checked} />
                              <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                            </label>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Right Sidebar - Critical Actions */}
                <div className="space-y-8">
                  <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-tl-full" />
                    <h3 className="text-md font-black uppercase tracking-widest mb-6 text-gold-400">{language === 'am' ? 'የአካውንት አስተዳደር' : 'Account Hub'}</h3>
                    
                    <div className="space-y-4">
                       <button onClick={() => setShowChangePasswordModal(true)} className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col gap-3 group hover:bg-white/10 transition-all text-left">
                          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                             <Edit size={20} />
                          </div>
                          <div>
                             <h4 className="font-black text-sm uppercase tracking-tight">{language === 'am' ? 'የይለፍ ቃል ቀይር' : 'Change Password'}</h4>
                             <p className="text-[10px] text-slate-500 font-bold">{language === 'am' ? 'ምስጢራዊነትዎን ይጠብቁ' : 'Update login security'}</p>
                          </div>
                       </button>

                       <button onClick={() => signOut(auth).then(() => window.location.href = '/login')} className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col gap-3 group hover:bg-white/10 transition-all text-left">
                          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                             <LogOut size={20} />
                          </div>
                          <div>
                             <h4 className="font-black text-sm uppercase tracking-tight">{language === 'am' ? 'ውጣ' : 'Sign Out'}</h4>
                             <p className="text-[10px] text-slate-500 font-bold">{language === 'am' ? 'ከሲስተሙ ለመውጣት' : 'Logout of session'}</p>
                          </div>
                       </button>

                       <div className="pt-6">
                          <button onClick={() => setShowDeletionRequestModal(true)} className="w-full py-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">
                             {language === 'am' ? 'አካውንት ሰርዝ' : 'Delete Account'}
                          </button>
                       </div>
                    </div>
                  </div>

                  {/* App Version Info */}
                  <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 text-center">
                     <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                        <Info size={24} className="text-slate-400" />
                     </div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">IKUB Pro v2.4.0</p>
                     <p className="text-[8px] text-slate-400 font-medium tracking-widest uppercase">Digital Trust Systems</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[700px] relative max-w-4xl mx-auto"
            >
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 relative overflow-hidden shrink-0 gap-4">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
                <div className="flex items-center gap-5 relative z-10 w-full sm:w-auto overflow-x-auto no-scrollbar pb-2 sm:pb-0">
                  <button 
                    onClick={() => setChatSubTab('group')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all whitespace-nowrap min-w-max ${
                      chatSubTab === 'group' 
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 shadow-inner' 
                        : 'bg-white hover:bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    <MessageSquare size={18} />
                    <div>
                      <h3 className={`text-base font-black tracking-tight leading-none mb-1 ${chatSubTab === 'group' ? 'text-white' : 'text-slate-700'}`}>
                        {language === 'am' ? 'የቡድን ውይይት' : 'Group Chat'}
                      </h3>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${chatSubTab === 'group' ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {userData?.groupId ? 'Group ' + userData.groupId : (language === 'am' ? 'ከአባላት ጋር' : 'With members')}
                      </p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => setChatSubTab('admin')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all whitespace-nowrap min-w-max ${
                      chatSubTab === 'admin' 
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 shadow-inner' 
                        : 'bg-white hover:bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    <ShieldCheck size={18} />
                    <div>
                      <h3 className={`text-base font-black tracking-tight leading-none mb-1 ${chatSubTab === 'admin' ? 'text-white' : 'text-slate-700'}`}>
                        {language === 'am' ? 'ለአድሚን መልዕክት' : 'Admin Chat'}
                      </h3>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${chatSubTab === 'admin' ? 'text-rose-200' : 'text-slate-400'}`}>
                        {language === 'am' ? 'ከአድሚን ጋር የብቻ' : 'Direct Message'}
                      </p>
                    </div>
                  </button>
                </div>
                <div className="relative z-10 flex items-center gap-2 self-end sm:self-auto shrink-0 mt-[-20px] sm:mt-0">
                   <div className="px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-sm">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                     <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{language === 'am' ? 'በመስመር ላይ' : 'Online'}</span>
                   </div>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar bg-slate-50/50">
                {activeMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle size={32} className="text-slate-400" />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">
                      {language === 'am' ? 'ምንም መልእክት የለም' : 'No messages'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium max-w-[200px]">
                      {language === 'am' ? 'የመጀመሪያውን መልእክት አሁን ይላኩ።' : 'Be the first to send a message.'}
                    </p>
                  </div>
                ) : (
                  activeMessages.map((msg, idx) => {
                    const isMe = msg.senderId === user?.uid;
                    const isAdmin = msg.senderRole === 'admin' || msg.senderRole === 'super_admin';
                    
                    return (
                      <motion.div 
                        key={msg.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`flex flex-col mb-1.5 px-2 w-full ${isMe ? 'items-end' : 'items-start'}`}>
                           {!isMe && (
                             <div className={`text-[9px] font-black uppercase flex items-center gap-1 mt-2 tracking-widest ${isAdmin ? 'text-indigo-600' : 'text-slate-400'}`}>
                               {isAdmin ? <ShieldCheck size={10} className="inline mr-0.5" /> : null}
                               {isAdmin ? 'Admin' : msg.senderName}
                               {msg.targetType === 'all' && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-md text-[7px] ml-1 shadow-sm">All</span>}
                               {msg.targetType === 'private' && <span className="bg-indigo-500 text-white px-1.5 py-0.5 rounded-md text-[7px] ml-1 shadow-sm">Private</span>}
                             </div>
                           )}
                           <div className={`flex items-center gap-2 ${isMe ? 'justify-end w-full' : ''}`}>
                             {!isMe && (
                               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                 {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString('am-ET', {hour: '2-digit', minute:'2-digit'}) : ''}
                                 {msg.isEdited && <span className="text-slate-300">(Edited)</span>}
                               </span>
                             )}
                             {isMe && (
                               <div className="flex items-center gap-2">
                                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mr-1">
                                   {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString('am-ET', {hour: '2-digit', minute:'2-digit'}) : ''}
                                   {msg.isEdited && <span className="text-slate-300 ml-1">(Edited)</span>}
                                 </span>
                                 {!msg.audioUrl && (
                                   <button 
                                     onClick={() => { setEditingMessageId(msg.id); setNewMessage(msg.text || ''); }} 
                                     className="flex items-center gap-1 p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-indigo-500 transition-colors shadow-sm"
                                     title={language === 'am' ? 'ያስተካክሉ' : 'Edit'}
                                   >
                                     <Edit size={12} /> <span className="text-[9px] font-bold hidden sm:block uppercase">{language === 'am' ? 'ያስተካክሉ' : 'Edit'}</span>
                                   </button>
                                 )}
                                 <button 
                                   onClick={() => handleDeleteMessage(msg.id)} 
                                   className="flex items-center gap-1 p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-rose-500 transition-colors shadow-sm"
                                   title={language === 'am' ? 'ያጥፉ' : 'Delete'}
                                 >
                                   <Trash2 size={12} /> <span className="text-[9px] font-bold hidden sm:block uppercase">{language === 'am' ? 'ያጥፉ' : 'Delete'}</span>
                                 </button>
                               </div>
                             )}
                           </div>
                        </div>

                        <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-[1.5rem] text-[13px] leading-relaxed transition-all shadow-sm relative group/msg ${
                          isMe 
                            ? 'bg-slate-900 text-white rounded-tr-sm shadow-slate-900/10' 
                            : isAdmin 
                              ? 'bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-tl-sm shadow-indigo-500/5' 
                              : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                        }`}>
                          {msg.audioUrl ? (
                            <div className="flex items-center gap-3 min-w-[180px]">
                               <button 
                                 onClick={(e) => { 
                                   const audio = e.currentTarget.parentElement?.querySelector('audio'); 
                                   if (audio) audio.paused ? audio.play() : audio.pause(); 
                                 }} 
                                 className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                   isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600'
                                 }`}
                               >
                                 <Play size={14} fill="currentColor" />
                               </button>
                               <div className="flex-1 space-y-1">
                                 <div className={`h-1.5 rounded-full w-full ${isMe ? 'bg-white/20' : 'bg-indigo-100'}`}>
                                   <div className={`h-full rounded-full w-1/3 ${isMe ? 'bg-white' : 'bg-indigo-500'}`}></div>
                                 </div>
                                 <p className={`text-[8px] font-black uppercase tracking-widest ${isMe ? 'text-white/60' : 'text-indigo-400'}`}>Audio Message</p>
                               </div>
                               <audio src={msg.audioUrl} className="hidden" />
                            </div>
                          ) : msg.imageUrl ? (
                            <div className="flex flex-col gap-2">
                               <img src={msg.imageUrl} alt="Attachment" className="max-w-full h-auto rounded-xl max-h-48 object-cover border-2 border-white/10 cursor-pointer" onClick={() => setShowImagePreview(msg.imageUrl)} />
                               <a href={msg.imageUrl} download={msg.fileName || 'image'} className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}>
                                  <FileDown size={14} />
                                  {language === 'am' ? 'አውርድ' : 'Download'}
                               </a>
                               {msg.text && msg.text !== '📸 ፎቶ (Image)' && <p className="font-medium whitespace-pre-wrap mt-2 pt-2 border-t border-white/10">{msg.text}</p>}
                            </div>
                          ) : msg.fileUrl ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-3 min-w-[180px]">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                                   <FileText size={18} />
                                 </div>
                                 <div className="flex-1 overflow-hidden">
                                   <p className={`text-xs font-bold truncate ${isMe ? 'text-white' : 'text-slate-800'}`}>{msg.fileName || 'Document'}</p>
                                   <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${isMe ? 'text-white/60' : 'text-slate-500'}`}>File Attachment</p>
                                 </div>
                                 <a href={msg.fileUrl} download={msg.fileName || 'file'} className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'}`}>
                                    <FileDown size={14} />
                                 </a>
                              </div>
                              {msg.text && msg.text !== '📄 ፋይል (File)' && <p className="font-medium whitespace-pre-wrap mt-2 pt-2 border-t border-white/10">{msg.text}</p>}
                            </div>
                          ) : (
                            <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 md:p-6 bg-white border-t border-slate-100 shrink-0 z-10">
                <div className="flex gap-2 mb-3 px-1">
                   <div className="relative">
                     <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'image')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title={language === 'am' ? 'ፎቶ ላክ' : 'Send Image'} />
                     <button type="button" className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors tooltip-trigger" title={language === 'am' ? 'ፎቶ' : 'Photo'}>
                       <ImageIcon size={14} />
                     </button>
                   </div>
                   <div className="relative">
                     <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleFileSelect(e, 'file')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title={language === 'am' ? 'ፋይል ላክ' : 'Send File'} />
                     <button type="button" className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors tooltip-trigger" title={language === 'am' ? 'ፋይል' : 'Document'}>
                       <Paperclip size={14} />
                     </button>
                   </div>
                   <button type="button" onClick={() => triggerSuccess(language === 'am' ? 'ማሳወቂያ' : 'Notice', language === 'am' ? 'ይህ አገልግሎት በቅርቡ ይመጣል' : 'Feature coming soon')} className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors ml-auto tooltip-trigger" title={language === 'am' ? 'ድምጽ ጥሪ' : 'Voice Call'}>
                     <PhoneCall size={14} />
                   </button>
                   <button type="button" onClick={() => triggerSuccess(language === 'am' ? 'ማሳወቂያ' : 'Notice', language === 'am' ? 'ይህ አገልግሎት በቅርቡ ይመጣል' : 'Feature coming soon')} className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors tooltip-trigger" title={language === 'am' ? 'ቪዲዮ ጥሪ' : 'Video Call'}>
                     <VideoCall size={14} />
                   </button>
                </div>
                <div className="bg-slate-50 p-2 rounded-2xl flex items-center gap-2 border border-slate-200 shadow-sm focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                    <button 
                      type="button" 
                      onMouseDown={() => { setIsRecording(true); startRecording(); }} 
                      onMouseUp={() => { setIsRecording(false); stopRecording(); }}
                      onTouchStart={() => { setIsRecording(true); startRecording(); }}
                      onTouchEnd={() => { setIsRecording(false); stopRecording(); }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                        isRecording 
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-110' 
                          : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-100 hover:text-slate-600'
                      }`}
                    >
                      <Mic size={18} className={isRecording ? 'animate-pulse' : ''} />
                    </button>
                    
                    {editingMessageId && (
                      <button 
                        type="button" 
                        onClick={() => { setEditingMessageId(null); setNewMessage(''); }} 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-500 border border-rose-100 bg-rose-50 hover:bg-rose-100 transition-colors shrink-0"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                    
                    <input 
                      type="text" 
                      value={newMessage} 
                      onChange={(e) => setNewMessage(e.target.value)} 
                      placeholder={editingMessageId ? (language === 'am' ? "መልእክት ያርሙ..." : "Edit message...") : (language === 'am' ? "መልእክት ይጻፉ..." : "Type a message...")} 
                      className="flex-1 bg-transparent border-none px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none placeholder:text-slate-400 placeholder:font-medium" 
                    />
                    
                    <button 
                      type="submit" 
                      disabled={!newMessage.trim()} 
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20"
                    >
                      <Send size={16} className={`transform ${newMessage.trim() ? 'translate-x-0.5 -translate-y-0.5' : ''} transition-transform`} />
                    </button>
                </div>
              </form>
            </motion.div>
          )}
          {activeTab === 'market' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >

            </motion.div>
          )}
          {activeTab === 'market' && <Marketplace />}
          {activeTab === 'rules' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
              <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gold-500/10 rounded-full blur-[120px] -mr-20 -mt-20" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center text-gold-500 border border-white/10 shadow-2xl">
                      <ShieldCheck size={36} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-display font-black tracking-tighter uppercase mb-2">
                        {language === 'am' ? 'ህግ እና ደንብ' : 'Rules & Regs'}
                      </h3>
                      <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
                         {language === 'am' ? 'ማወቅ ያለብዎት ደንቦች' : 'Terms you should know'}
                      </p>
                    </div>
                  </div>

                  <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10">
                    <button 
                      onClick={() => setRulesSubTab('general')} 
                      className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${rulesSubTab === 'general' ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                    >
                      {language === 'am' ? 'የእቁብ ህግ' : 'General'}
                    </button>
                    <button 
                      onClick={() => setRulesSubTab('guarantor')} 
                      className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${rulesSubTab === 'guarantor' ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                    >
                      {language === 'am' ? 'የዋስ ህግ' : 'Guarantor'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {(rulesSubTab === 'general' ? (dynamicRules.filter(r => r.category === 'general' || !r.category).length > 0 ? dynamicRules.filter(r => r.category === 'general' || !r.category) : RULES_CONTENT) : (dynamicRules.filter(r => r.category === 'guarantor').length > 0 ? dynamicRules.filter(r => r.category === 'guarantor') : [
                  { id: 'g1', amTitle: 'ተአማኒ ዋስ', enTitle: 'Reliable Guarantor', am: 'እጣ የደረሰው ሰው በድርጅቱ ውስጥ የሚሰራ ተአማኒ ዋስ ማቅረብ አለበት።', en: 'The winner must provide a reliable guarantor who works within the organization.' },
                  { id: 'g2', amTitle: 'የዋስትና ፎርም', enTitle: 'Legal Forms', am: 'ሁሉም ዋሶች Annex 1 እና 2 ፎርሞችን መፈረም ይኖርባቸዋል።', en: 'All guarantors are required to sign Annex 1 and 2 official forms.' },
                  { id: 'g3', amTitle: 'የዋስ ቁጥር', enTitle: 'Number of Guarantors', am: 'እንደ እቁቡ መጠን 1 ወይም 2 ዋሶች ሊጠየቁ ይችላሉ።', en: 'Depending on the amount, 1 or 2 guarantors may be required.' }
                ])).map((rule, idx) => (
                  <motion.div 
                    key={rule.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-gold-500/20 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
                    
                    <div className="flex items-start gap-8 relative">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-gold-600 font-display font-black shadow-inner border border-slate-100 group-hover:bg-gold-500 group-hover:text-white transition-colors">
                        {(idx + 1).toString().padStart(2, '0')}
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="text-xl font-display font-black text-slate-900 mb-4 tracking-tight group-hover:text-gold-600 transition-colors">
                          {language === 'am' ? (rule.amTitle || rule.title) : (rule.enTitle || rule.title)}
                        </h4>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                          {language === 'am' ? (rule.am || rule.description) : (rule.en || rule.description)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {rulesSubTab === 'general' && (
                <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100 shrink-0">
                    <AlertOctagon size={32} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-amber-900 uppercase tracking-tight mb-1">{language === 'am' ? 'ማሳሰቢያ' : 'Notice'}</h4>
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                       {language === 'am' ? 'እነዚህ ደንቦች ለሁሉም አባላት እኩል ተግባራዊ ይሆናሉ። ለተጨማሪ መረጃ አድሚኑን ያነጋግሩ።' : 'These rules apply equally to all members. For further clarification, please contact the administration.'}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          {activeTab === 'guarantors' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pb-20">
              {/* Internal Sub-Tabs Navigation */}
              <div className="flex bg-slate-100 p-2 rounded-[2rem] w-fit border border-slate-200 mb-8 overflow-x-auto custom-scrollbar">
                {[
                  { id: 'hub', label: language === 'am' ? 'የዋሶች ማዕከል' : 'Guarantor Hub', icon: ShieldCheck },
                  { id: 'register', label: language === 'am' ? 'አዲስ ዋስ መዝግብ' : 'Register New', icon: Users },
                  { id: 'history', label: language === 'am' ? 'የተመዘገቡ ዋሶች' : 'Registered List', icon: History }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setGuarantorSubTab(tab.id as any)}
                    className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${guarantorSubTab === tab.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:bg-white hover:text-slate-900'}`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {guarantorSubTab === 'hub' && (
                <>
                  {/* Ultra Modern Header */}
                  <div className="bg-slate-900 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl mb-8">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-48 -mt-48" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -ml-32 -mb-32" />
                    
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
                      <div className="max-w-2xl">
                        <div className="flex items-center gap-6 mb-8">
                          <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[2.2rem] flex items-center justify-center text-gold-500 shadow-2xl border border-white/10 group hover:scale-105 transition-transform duration-500">
                            <ShieldCheck size={36} className="group-hover:rotate-12 transition-transform" />
                          </div>
                          <div>
                            <h3 className="text-4xl font-display font-black tracking-tighter uppercase leading-none mb-2">
                               {language === 'am' ? 'የዋሶች ማዕከል' : 'Guarantor Hub'}
                            </h3>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-gold-500 uppercase tracking-[0.3em] font-sans">{language === 'am' ? 'ህጋዊ ማረጋገጫ' : 'Legal Trust Center'}</span>
                              <div className="w-1.5 h-1.5 rounded-full bg-gold-500/50" />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-sans">v2.4 Ready</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-slate-300 text-base leading-relaxed font-medium mb-10">
                          {language === 'am' 
                            ? 'የእጣ አሸናፊዎች የሚገባቸዉን ክፍያ ከመውሰዳቸው በፊት አስፈላጊ የሆኑ የዋስትና ሰነዶችን በፊርማ በማረጋገጥ ማቅረብ ይኖርባቸዋል። እዚህ ጋር አስፈላጊዎቹን ህጋዊ ፎርሞች ማግኘት እና ማውረድ ይችላሉ።' 
                            : 'Draw winners are required to submit verified legal guarantee documents before fund disbursement. Access and download all official A4-ready forms here.'}
                        </p>
                        
                        <div className="flex flex-wrap gap-4">
                           <button 
                             onClick={() => setShowGuarantorInfoModal(true)}
                             className="px-8 py-4 bg-gold-500 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-gold-500/20 active:scale-95 flex items-center gap-3"
                           >
                              <FileText size={16} />
                              {language === 'am' ? 'የዋስ መረጃ ማየት' : 'View Guarantor Info'}
                           </button>
                           <div className="px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{language === 'am' ? 'A4 ፕሪንት ዝግጁ' : 'A4 Print Optimized'}</span>
                           </div>
                        </div>
                      </div>

                      <div className="hidden xl:block">
                         <div className="w-64 h-64 bg-white/5 rounded-[4rem] border border-white/10 flex flex-col items-center justify-center p-10 text-center transform rotate-3 border-dashed relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-[4rem]" />
                            <Printer size={48} className="text-gold-500/50 mb-6" />
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 leading-relaxed">
                               {language === 'am' ? 'ሁሉንም ሰነዶች በA4 መጠን ማተም ይችላሉ' : 'Print all documents in standard A4 size'}
                            </p>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Tracking Widget */}
                  <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl overflow-hidden relative mb-8">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-50 rounded-bl-full -mr-32 -mt-32 pointer-events-none" />
                    <div className="flex flex-col xl:flex-row items-center justify-between gap-10 relative z-10">
                      <div>
                        <h4 className="text-2xl font-display font-black text-slate-900 mb-2 uppercase tracking-tight">
                          {language === 'am' ? 'የዋስትና ሂደት ሁኔታ' : 'Guarantor Progress'}
                        </h4>
                        <p className="text-sm font-bold text-slate-500 mb-8 max-w-md leading-relaxed">
                           {language === 'am' ? '3 ዋሶችን አስመዝግበው በማረጋገጥ እጣዎን በአፋጣኝ ይቀበሉ። እባክዎ መረጃዎችን በትክክል ያስገቡ።' : 'Register and verify 3 guarantors to quickly claim your funds. Please provide accurate details.'}
                        </p>
                        
                        <div className="flex items-center gap-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 w-fit">
                           <div className="text-center px-4">
                             <span className="block text-4xl font-display font-black text-indigo-600 mb-1">{userGuarantors.length}</span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{language === 'am' ? 'የተመዘገቡ' : 'Registered'}</span>
                           </div>
                           <div className="w-px h-12 bg-slate-200" />
                           <div className="text-center px-4">
                             <span className="block text-4xl font-display font-black text-emerald-500 mb-1">{userGuarantors.filter(g => g.status === 'approved').length}</span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{language === 'am' ? 'የጸደቁ' : 'Approved'}</span>
                           </div>
                           <div className="w-px h-12 bg-slate-200" />
                           <div className="text-center px-4">
                             <span className="block text-4xl font-display font-black text-slate-300 mb-1">3</span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{language === 'am' ? 'የሚያስፈልግ' : 'Required'}</span>
                           </div>
                        </div>
                      </div>

                      <div className="flex-1 w-full max-w-lg">
                         <div className="space-y-4">
                           {[1, 2, 3].map((slot, i) => {
                             const guarantor = userGuarantors[i];
                             const statusColor = !guarantor ? 'bg-slate-100 text-slate-300' : 
                                                 guarantor.status === 'approved' ? 'bg-emerald-500 text-white' : 
                                                 guarantor.status === 'rejected' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white';
                             const statusBg = !guarantor ? 'bg-slate-50 border-slate-100 border-dashed' : 
                                              guarantor.status === 'approved' ? 'bg-emerald-50 border-emerald-100' : 
                                              guarantor.status === 'rejected' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100';
                                              
                             return (
                               <div key={slot} className={`flex items-center gap-4 p-4 rounded-2xl border ${statusBg} transition-all`}>
                                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black shadow-sm ${statusColor}`}>
                                   {guarantor ? (guarantor.status === 'approved' ? <CheckCircle size={24} /> : guarantor.status === 'rejected' ? <XCircle size={24} /> : <Clock size={24} />) : slot}
                                 </div>
                                 <div className="flex-1">
                                   <div className="flex items-center justify-between">
                                     <h5 className={`text-sm font-black uppercase tracking-tight ${guarantor ? 'text-slate-900' : 'text-slate-400'}`}>
                                       {guarantor ? guarantor.name : (language === 'am' ? `ዋስ ${slot} አልተመዘገበም` : `Guarantor ${slot} Pending`)}
                                     </h5>
                                     {guarantor && (
                                       <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
                                          guarantor.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 
                                          guarantor.status === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                                       }`}>
                                         {guarantor.status || 'Pending'}
                                       </span>
                                     )}
                                   </div>
                                   {guarantor && <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{guarantor.phone}</p>}
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Steps/Process Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { step: '01', title: language === 'am' ? 'ፎርም ማውረድ' : 'Download Forms', desc: language === 'am' ? 'Annex 1 እና 2 ፎርሞችን ያውርዱ' : 'Get Annex 1 & 2 forms', icon: Download, color: 'indigo' },
                      { step: '02', title: language === 'am' ? 'መረጃ መሙላት' : 'Fill Details', desc: language === 'am' ? 'የዋሶችን መረጃ በትክክል ይሙሉ' : 'Enter guarantor info accurately', icon: Edit, color: 'blue' },
                      { step: '03', title: language === 'am' ? 'ፊርማ' : 'Signatures', desc: language === 'am' ? 'በሰብሳቢው እና በዋሶቹ ያስፈርሙ' : 'Get collector & witness signs', icon: FileSignature, color: 'emerald' },
                      { step: '04', title: language === 'am' ? 'ክፍያ መቀበል' : 'Disbursement', desc: language === 'am' ? 'የእቁብ ብርዎን ይቀበሉ' : 'Receive your ekub funds', icon: Wallet, color: 'amber' }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative group hover:shadow-xl transition-all cursor-default">
                        <div className={`w-12 h-12 rounded-2xl bg-${idx % 2 === 0 ? 'indigo' : 'emerald'}-50 flex items-center justify-center text-${idx % 2 === 0 ? 'indigo' : 'emerald'}-500 mb-6 group-hover:scale-110 transition-transform`}>
                          <item.icon size={24} />
                        </div>
                        <span className="absolute top-8 right-8 text-4xl font-display font-black text-slate-50">{item.step}</span>
                        <h5 className="text-lg font-display font-black text-slate-900 mb-2">{item.title}</h5>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Visual Document Download Cards */}
                    <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {[
                        { 
                          id: 1, 
                          label: language === 'am' ? 'የዋስ ማረጋገጫ ፎርም' : 'Guarantor Annex-1', 
                          code: 'ANNEX-01/VER',
                          color: 'indigo',
                          icon: <UserCheck size={32} />,
                          description: language === 'am' ? 'የዋሶች የግል መረጃ እና የማረጋገጫ ፊርማ የሚሰፍርበት ሰነድ።' : 'Primary form for guarantor personal details and legal authorization signatures.'
                        },
                        { 
                          id: 2, 
                          label: language === 'am' ? 'የውል ስምምነት ሰነድ' : 'Contract Annex-2', 
                          code: 'ANNEX-02/LGL',
                          color: 'emerald',
                          icon: <FileSignature size={32} />,
                          description: language === 'am' ? 'በአባሉ እና በሰብሳቢው መካከል የሚደረግ የመጨረሻ የክፍያ ውል ስምምነት።' : 'Final binding contract between the member and collector for fund release.'
                        },
                        { 
                          id: 3, 
                          label: language === 'am' ? 'የክፍያ ቃልኪዳን' : 'Payment Commitment', 
                          code: 'ANNEX-03/PMT',
                          color: 'amber',
                          icon: <CreditCard size={32} />,
                          description: language === 'am' ? 'የዕቁብ ክፍያ በወቅቱ እንደሚፈፀም የሚገባ የጽሁፍ ቃልኪዳን።' : 'Written commitment ensuring timely future ekub payments until the cycle ends.'
                        }
                      ].map((form) => (
                        <motion.div 
                          key={form.id}
                          whileHover={{ y: -12 }}
                          className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden group flex flex-col h-full border-b-[8px] border-b-slate-950"
                        >
                          <div className="p-10 flex-1">
                            <div className="flex justify-between items-start mb-12">
                              <div className={`w-16 h-16 rounded-[1.8rem] bg-white shadow-2xl border border-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all duration-700`}>
                                {form.icon}
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="px-3 py-1 bg-slate-100 rounded-full text-[8px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 mb-2">
                                  {form.code}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">A4 Printed</span>
                              </div>
                            </div>
                            
                            <h5 className="text-2xl font-display font-black text-slate-900 mb-3 leading-none">{form.label}</h5>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-10">{form.description}</p>
                            
                            <div className="flex gap-3">
                              <button 
                                onClick={() => triggerSuccess(
                                  language === 'am' ? 'ሰነዱ ዝግጁ ነው' : 'File Ready',
                                  language === 'am' ? `${form.label} በተሳካ ሁኔታ ወርዷል` : `${form.label} has been successfully downloaded.`
                                )}
                                className="flex-1 h-14 bg-slate-50 hover:bg-slate-950 hover:text-white rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest group/btn shadow-inner"
                              >
                                 <Download size={18} className="text-slate-400 group-hover/btn:text-white transition-all" />
                                 {language === 'am' ? 'አውርድ' : 'Download'}
                              </button>
                              <button 
                                onClick={() => triggerSuccess(
                                  language === 'am' ? 'ለህትመት ዝግጁ ነው' : 'Print Ready',
                                  language === 'am' ? `${form.label} በA4 ሳይዝ ለመታተም ወደ ፕሪንተር ተልኳል።` : `${form.label} has been sent to printer in A4 format.`
                                )}
                                className="w-14 h-14 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-2xl flex items-center justify-center transition-all group/btn shadow-inner"
                              >
                                 <Printer size={18} className="text-slate-400 group-hover/btn:text-white" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Integrated Rules Section */}
                    <div className="lg:col-span-12">
                      <div className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-xl overflow-hidden relative">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
                         
                         <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
                            <div>
                               <div className="flex items-center gap-6 mb-10">
                                  <div className="w-16 h-16 bg-slate-950 rounded-3xl flex items-center justify-center text-gold-500 shadow-2xl">
                                     <ShieldCheck size={32} />
                                  </div>
                                  <div>
                                     <h4 className="text-3xl font-display font-black text-slate-900 tracking-tight">{language === 'am' ? 'የዋስትና ህጎች' : 'Guarantor Rules'}</h4>
                                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">{language === 'am' ? 'ህጋዊ ድንጋጌዎች' : 'Legal Framework'}</p>
                                  </div>
                               </div>

                               <div className="space-y-4">
                                  {RULES_CONTENT.map((rule) => (
                                    <div key={rule.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-start gap-6 group hover:bg-white hover:border-indigo-200 transition-all">
                                      <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-900 font-black shadow-sm border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                        {rule.id}
                                      </div>
                                      <div>
                                        <h5 className="font-display font-black text-slate-900 mb-1">{language === 'am' ? rule.amTitle : rule.enTitle}</h5>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                          {language === 'am' ? rule.am : rule.en}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                               </div>
                            </div>

                            <div className="space-y-8">
                               <div className="p-10 bg-slate-950 rounded-[3.5rem] text-white shadow-2xl shadow-slate-900/40 border border-white/5 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/10 rounded-full blur-[60px]" />
                                  <h4 className="text-xl font-display font-black mb-8 flex items-center gap-4">
                                     <Info className="text-gold-500" />
                                     {language === 'am' ? 'ተጨማሪ ማብራሪያ' : 'Further Clarification'}
                                  </h4>
                                  <div className="space-y-6">
                                     <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                        {language === 'am' 
                                          ? `እያንዳንዱ አባል እጣ ሲወጣለት ቢያንስ 2 ዋሶችን ማቅረብ ይኖርበታል። ዋሶቹ የግዴታ የ${t('common.appName').replace(' ', '_')} አባል መሆን አይጠበቅባቸውም፤ ነገርገን ቋሚ መታወቂያ እና ህጋዊ ስራ ያላቸው መሆን ይኖርባቸዋል።`
                                          : `Every member must present at least 2 guarantors upon winning a draw. Guarantors are not required to be ${t('common.appName').replace(' ', '_')} members but must possess valid IDs and stable legal employment.`}
                                     </p>
                                     <div className="p-6 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                                        <h6 className="text-[10px] font-black uppercase text-gold-500 tracking-widest mb-2">Requirement Checklist</h6>
                                        <ul className="space-y-3">
                                           {[
                                             language === 'am' ? 'የነዋሪነት መታወቂያ ኮፒ' : 'Valid Residence ID Copy',
                                             language === 'am' ? 'የስራ ቅጥር ማስረጃ ወይም የንግድ ፈቃድ' : 'Employment Proof or Business License',
                                             language === 'am' ? 'የዋሶቹ የቅርብ ጊዜ ፎቶግራፍ' : 'Recent Passport Photo of Guarantors'
                                           ].map((item, i) => (
                                             <li key={i} className="flex items-center gap-4 text-xs font-bold text-slate-300">
                                                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                                                {item}
                                             </li>
                                           ))}
                                        </ul>
                                     </div>
                                  </div>
                               </div>

                               <div className="p-10 bg-gold-500 rounded-[3.5rem] text-slate-900 shadow-xl shadow-gold-500/10 border border-gold-400 relative group overflow-hidden">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-xl translate-x-8 -translate-y-8" />
                                  <h4 className="text-xl font-display font-black mb-4 tracking-tight">{language === 'am' ? 'ማስጠንቀቂያ' : 'Legal Warning'}</h4>
                                  <p className="text-sm font-black leading-relaxed opacity-70">
                                     {language === 'am' 
                                       ? 'በዋስትና ሰነድ ላይ የተጭበረበረ መረጃ ማቅረብ በህግ ያስቀጣል። እንዲሁም ሰብሳቢው መረጃውን ባረጋገጡ በ 24 ሰዓት ውስጥ ክፍያ ይፈፀማል።'
                                       : 'Submitting fraudulent information on legal forms is a criminal offense. Fund disbursement occurs within 24 hours of successful verification.'}
                                  </p>
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {guarantorSubTab === 'register' && (
                <div className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-30" />
                  
                  <div className="flex flex-col xl:flex-row gap-16 items-start">
                    <div className="xl:w-1/3">
                       <div className="w-20 h-20 bg-slate-950 rounded-[2rem] flex items-center justify-center text-white shadow-2xl mb-8">
                          <Users size={32} />
                       </div>
                       <h3 className="text-3xl font-display font-black text-slate-900 tracking-tight mb-4">
                          {language === 'am' ? 'አዲስ ዋስ መዝገብ' : 'Guarantor Registration'}
                       </h3>
                       <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
                          {language === 'am' 
                            ? 'የዋስዎን መረጃ እዚህ ጋር በመመዝገብ ለሰብሳቢው እንዲደርስ ያድርጉ። ለምዝገባው አስፈላጊ የሆኑትን መረጃዎች በትክክል መሙላትዎን ያረጋግጡ።' 
                            : 'Submit your guarantor details here for coordinator verification. Ensure all fields are filled accurately to avoid disbursement delays.'}
                       </p>
                       
                       <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                          <div className="flex items-center gap-4 mb-4">
                             <div className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center">
                                <Info size={16} className="text-slate-400" />
                             </div>
                             <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Support</span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                             {language === 'am' 
                               ? 'ጥያቄ ካለዎት የድጋፍ ማዕከላችንን በድጋፍ (Support) ገፅ በኩል ማነጋገር ይችላሉ።' 
                               : 'If you have questions, please use the Support page to contact our support desk.'}
                          </p>
                       </div>
                    </div>

                    <div className="flex-1 w-full bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100">
                      <form onSubmit={handleRegisterGuarantor} className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Name / ሙሉ ስም</label>
                               <div className="relative">
                                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                    type="text" 
                                    required
                                    value={guarantorFormData.name}
                                    onChange={(e) => setGuarantorFormData({...guarantorFormData, name: e.target.value})}
                                    placeholder="Enter guarantor's full name"
                                    className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-12 pr-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                                  />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Phone Number / ስልክ </label>
                               <div className="relative">
                                  <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                    type="tel" 
                                    required
                                    value={guarantorFormData.phone}
                                    onChange={(e) => setGuarantorFormData({...guarantorFormData, phone: e.target.value})}
                                    placeholder="09..."
                                    className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-12 pr-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                                  />
                               </div>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Job Title / ስራ</label>
                               <div className="relative">
                                  <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                    type="text" 
                                    value={guarantorFormData.job}
                                    onChange={(e) => setGuarantorFormData({...guarantorFormData, job: e.target.value})}
                                    placeholder="Occupation"
                                    className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-12 pr-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                                  />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Relationship / ዝምድና</label>
                               <div className="relative">
                                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                    type="text" 
                                    value={guarantorFormData.relationship}
                                    onChange={(e) => setGuarantorFormData({...guarantorFormData, relationship: e.target.value})}
                                    placeholder="Family / Friend / Other"
                                    className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-12 pr-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                                  />
                               </div>
                            </div>
                         </div>

                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Permanent Address / አድራሻ</label>
                            <div className="relative">
                               <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                               <textarea 
                                 rows={3}
                                 value={guarantorFormData.address}
                                 onChange={(e) => setGuarantorFormData({...guarantorFormData, address: e.target.value})}
                                 placeholder="Region, City, Sub-city, Woreda, QR..."
                                 className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" 
                               />
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Fayda Number / የፋይዳ ቁጥር</label>
                               <div className="relative">
                                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                    type="text" 
                                    value={guarantorFormData.faydaNumber}
                                    onChange={(e) => setGuarantorFormData({...guarantorFormData, faydaNumber: e.target.value})}
                                    placeholder="Enter Fayda Number"
                                    className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-12 pr-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                                  />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Business License / ንግድ ፍቃድ ቁጥር</label>
                               <div className="relative">
                                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                    type="text" 
                                    value={guarantorFormData.businessLicenseNumber}
                                    onChange={(e) => setGuarantorFormData({...guarantorFormData, businessLicenseNumber: e.target.value})}
                                    placeholder="Enter Business License No."
                                    className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-12 pr-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                                  />
                               </div>
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Guarantor Photo / የዋስ ፎቶ</label>
                               <input type="file" accept="image/*" onChange={(e) => handleGuarantorFileChange(e, 'profilePhoto')} className="w-full h-12 bg-white border border-slate-100 rounded-2xl px-6 pt-2.5 text-xs font-bold text-slate-600 focus:outline-none" />
                               {guarantorFormData.profilePhoto && <div className="text-[10px] text-emerald-500 font-bold ml-2">Photo uploaded</div>}
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Business License Doc / ንግድ ፍቃድ ፎቶ</label>
                               <input type="file" accept="image/*" onChange={(e) => handleGuarantorFileChange(e, 'businessLicensePhoto')} className="w-full h-12 bg-white border border-slate-100 rounded-2xl px-6 pt-2.5 text-xs font-bold text-slate-600 focus:outline-none" />
                               {guarantorFormData.businessLicensePhoto && <div className="text-[10px] text-emerald-500 font-bold ml-2">License uploaded</div>}
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Fayda Front / የፋይዳ የፊት ፎቶ</label>
                               <input type="file" accept="image/*" onChange={(e) => handleGuarantorFileChange(e, 'faydaFrontPhoto')} className="w-full h-12 bg-white border border-slate-100 rounded-2xl px-6 pt-2.5 text-xs font-bold text-slate-600 focus:outline-none" />
                               {guarantorFormData.faydaFrontPhoto && <div className="text-[10px] text-emerald-500 font-bold ml-2">Front uploaded</div>}
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Fayda Back / የፋይዳ የዋላ ፎቶ</label>
                               <input type="file" accept="image/*" onChange={(e) => handleGuarantorFileChange(e, 'faydaBackPhoto')} className="w-full h-12 bg-white border border-slate-100 rounded-2xl px-6 pt-2.5 text-xs font-bold text-slate-600 focus:outline-none" />
                               {guarantorFormData.faydaBackPhoto && <div className="text-[10px] text-emerald-500 font-bold ml-2">Back uploaded</div>}
                            </div>
                         </div>

                         <button 
                           type="submit"
                           disabled={isSubmittingGuarantor}
                           className="w-full h-16 bg-slate-900 text-white rounded-2xl font-display font-black text-xs uppercase tracking-[0.4em] hover:bg-slate-800 transition-all active:scale-[0.98] shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-4 disabled:opacity-50"
                         >
                            {isSubmittingGuarantor ? (
                              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <Users size={16} />
                                {language === 'am' ? 'ዋስ መዝግብ' : 'Register Guarantor'}
                              </>
                            )}
                         </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {guarantorSubTab === 'history' && (
                <div className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-2xl relative overflow-hidden min-h-[500px]">
                   <div className="flex items-center justify-between mb-12">
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400">
                            <History size={28} />
                         </div>
                         <div>
                            <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">{language === 'am' ? 'የተመዘገቡ ዋሶች ዝርዝር' : 'Guarantor List'}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total: {userGuarantors.length}</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => setGuarantorSubTab('register')}
                        className="px-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                      >
                         + Add New
                      </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                       {userGuarantors.length === 0 ? (
                          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200 mb-6 text-slate-200">
                                <Users size={48} />
                             </div>
                             <h4 className="text-lg font-display font-black text-slate-900 mb-2">{language === 'am' ? 'ምንም ዋስ አልተገኘም' : 'No Guarantors Found'}</h4>
                             <p className="text-sm font-medium text-slate-500 max-w-sm">
                                {language === 'am' ? 'እስካሁን ምንም ዋስ አልመዘገቡም። ዋስ ለመመዝገብ "አዲስ ዋስ መዝግብ" የሚለውን ይጫኑ።' : 'You have not registered any guarantors. Click "Register New" to add one.'}
                             </p>
                          </div>
                       ) : (
                         userGuarantors.map((g) => (
                           <div key={g.id} className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-xl group hover:shadow-2xl transition-all relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full translate-x-8 -translate-y-8 opacity-50" />
                              <div className="flex items-center gap-4 mb-6">
                                 <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-gold-500">
                                    <UserIcon size={24} />
                                 </div>
                                 <div>
                                    <h5 className="font-display font-black text-slate-900 uppercase tracking-tight">{g.name}</h5>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{g.relationship || 'Relationship N/A'}</p>
                                 </div>
                              </div>
                              <div className="space-y-3 mb-8">
                                 <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                    <PhoneIcon size={14} className="text-slate-300" />
                                    {g.phone}
                                 </div>
                                 <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                    <ShoppingBag size={14} className="text-slate-300" />
                                    {g.job || 'No Job'}
                                 </div>
                                 <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                    <MapPin size={14} className="text-slate-300" />
                                    <span className="truncate">{g.address || 'No Address'}</span>
                                 </div>
                                 <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                    <Hash size={14} className="text-slate-300" />
                                    <span className="truncate">Fayda: {g.faydaNumber || 'N/A'}</span>
                                 </div>
                                 <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                    <FileText size={14} className="text-slate-300" />
                                    <span className="truncate">License: {g.businessLicenseNumber || 'N/A'}</span>
                                 </div>
                                 <div className="grid grid-cols-4 gap-2 pt-2 mt-2 border-t border-slate-50">
                                    {g.profilePhoto && <img src={g.profilePhoto} className="w-8 h-8 rounded border border-slate-200 object-cover" title="Photo" />}
                                    {g.faydaFrontPhoto && <img src={g.faydaFrontPhoto} className="w-8 h-8 rounded border border-slate-200 object-cover" title="Fayda Front" />}
                                    {g.faydaBackPhoto && <img src={g.faydaBackPhoto} className="w-8 h-8 rounded border border-slate-200 object-cover" title="Fayda Back" />}
                                    {g.businessLicensePhoto && <img src={g.businessLicensePhoto} className="w-8 h-8 rounded border border-slate-200 object-cover" title="License" />}
                                 </div>
                              </div>
                              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                 <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                   g.status === 'approved' ? 'bg-emerald-50 text-emerald-500' : 
                                   g.status === 'rejected' ? 'bg-rose-50 text-rose-500' : 
                                   'bg-amber-50 text-amber-500'
                                 }`}>
                                    {g.status || 'Pending'}
                                 </span>
                                 <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                    {g.createdAt?.toDate ? g.createdAt.toDate().toLocaleDateString() : 'Recent'}
                                 </span>
                              </div>
                           </div>
                         ))
                       )}
                   </div>
                </div>
              )}
            </motion.div>
          )}
          {activeTab === 'inspiration' && <Inspiration />}
          {activeTab === 'share' && (
            <div className="max-w-4xl mx-auto pb-24 px-4 md:px-0">
               <ShareApp />
            </div>
          )}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto pb-20">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden p-8 md:p-10">
                <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-gold-500 shadow-xl">
                      <Bell size={28} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-display font-black tracking-tight">{language === 'am' ? 'ማሳወቂያዎች' : 'Notifications'}</h2>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{language === 'am' ? 'ያሉዎት ማሳወቂያዎች ዝርዝር' : 'All your activity alerts'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   {notifications.length === 0 ? (
                     <div className="py-20 text-center opacity-40">
                        <Bell size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="text-sm font-black uppercase tracking-widest text-slate-400">{language === 'am' ? 'ምንም ማሳወቂያ የለም' : 'All caught up!'}</p>
                     </div>
                   ) : (
                     notifications.map((n) => (
                       <div key={n.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-gold-500/20 transition-all group flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm group-hover:bg-gold-50 group-hover:text-gold-500 transition-colors">
                             <Bell size={18} />
                          </div>
                          <div className="flex-1">
                             <div className="flex justify-between items-start mb-1">
                                <h4 className="font-black text-slate-900 tracking-tight">{n.title}</h4>
                                <span className="text-[8px] font-black text-slate-400 uppercase">{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : 'Today'}</span>
                             </div>
                             <p className="text-xs text-slate-500 font-medium leading-relaxed">{n.message}</p>
                          </div>
                       </div>
                     ))
                   )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar Only Visible on Overview */}
        {activeTab === 'overview' && (
        <div className="lg:col-span-2 space-y-6">
          {/* Notifications Section */}
          <div className="glass-card p-6 rounded-[2.5rem] relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-gold-500 shadow-xl shadow-slate-900/10">
                  <Bell size={16} />
                </div>
                <div>
                   <h3 className="text-[10px] font-display font-black text-slate-900 uppercase tracking-widest leading-none">{t('dashboard.notifications')}</h3>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('dashboard.recent_notifications')}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 rounded-[1.5rem] border border-dashed border-slate-200">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                    <Clock size={16} className="text-slate-300" />
                  </div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('dashboard.no_notifications')}</p>
                </div>
              ) : (
                notifications.map((notif, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={notif.id} 
                    className="p-4 bg-white rounded-[1.5rem] border border-slate-100 hover:border-gold-500/20 hover:shadow-xl hover:shadow-gold-500/5 transition-all group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="text-xs font-display font-black text-slate-900 tracking-tight group-hover:text-gold-600 transition-colors">{notif.title}</h4>
                       <span className="text-[7px] font-black text-slate-300 uppercase bg-slate-50 px-1.5 py-0.5 rounded-full">
                         {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleTimeString('am-ET', {hour:'2-digit', minute:'2-digit'}) : 'Just now'}
                       </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium mb-3">{notif.message}</p>
                    <div className="flex items-center justify-between">
                       <p className="text-[8px] font-black text-gold-600/40 uppercase tracking-widest">System Broadcast</p>
                       <ChevronRight size={12} className="text-slate-200 group-hover:text-gold-500 transition-all" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Quick Support */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/10 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2 group-hover:bg-gold-500/20 transition-all duration-700" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/10 mb-6 shadow-inner">
                <ShieldCheck size={24} className="text-gold-500" />
              </div>
              <h3 className="text-xl font-display font-black mb-3 tracking-tight leading-none italic uppercase">{t('dashboard.core_support')}</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-8 font-medium">
                {t('dashboard.support_desc')}
              </p>
              <button className="w-full py-4 bg-gold-500 text-white rounded-2xl font-display font-black text-[10px] uppercase tracking-[0.3em] hover:bg-gold-400 transition-all active:scale-95 shadow-xl shadow-gold-500/20 border-b-2 border-gold-700">
                {t('dashboard.contact_support')}
              </button>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Mobile Bottom Navigation - Sticky */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-100 px-4 pt-2 pb-safe-offset-2 flex items-center justify-around z-[45] mobile-bottom-nav">
        {[
          { id: 'home', icon: Home, label: language === 'am' ? 'ቤት' : 'Home' },
          { id: 'draws', icon: Zap, label: language === 'am' ? 'እጣ' : 'Draws' },
          { id: 'pay', icon: CreditCard, label: language === 'am' ? 'ክፍያ' : 'Pay' },
          { id: 'chat', icon: MessageSquare, label: language === 'am' ? 'ወሬ' : 'Chat' },
          { id: 'menu', icon: Menu, label: language === 'am' ? 'ዝርዝር' : 'Menu' }
        ].map((item) => {
          const isActive = activeTab === item.id || (item.id === 'menu' && isMobileMenuOpen);
          const Icon = item.icon;
          return (
            <button 
              key={item.id}
              onClick={() => {
                if (item.id === 'menu') {
                  setIsMobileMenuOpen(true);
                } else {
                  setActiveTab(item.id as any);
                  if (item.id === 'chat') setUnreadChat(false);
                }
              }}
              className={`flex flex-col items-center gap-1.5 p-2 transition-all relative ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              <div className={`relative ${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {item.id === 'chat' && unreadChat && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
                )}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
              {isActive && item.id !== 'menu' && (
                <motion.div layoutId="activeMobileTab" className="absolute -top-2 w-1 h-1 bg-indigo-600 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {showFullProfileImg && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowFullProfileImg(null)}>
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative max-w-4xl w-full flex justify-center items-center">
             <button onClick={() => setShowFullProfileImg(null)} className="absolute -top-12 right-0 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/25 transition-colors">
               <X size={20} />
             </button>
             <img src={showFullProfileImg} alt="Profile" className="max-w-full max-h-[80vh] rounded-3xl object-contain shadow-2xl" />
           </motion.div>
        </div>
      )}

      {/* Uploaded Receipt Image Modal */}
      {showReceiptImagesModal && selectedReceiptImages.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-[120]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col w-full max-w-2xl h-full max-h-[85vh] relative"
          >
            <div className="flex justify-between items-center mb-4">
               <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">{language === 'am' ? 'የተላከ ደረሰኝ' : 'Uploaded Receipt'}</h3>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest">{selectedReceiptImages.length} {language === 'am' ? 'ፎቶዎች' : 'Photos'}</p>
               </div>
               <button 
                  onClick={() => setShowReceiptImagesModal(false)}
                  className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors border border-white/20"
               >
                 <X size={20} />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto w-full bg-black/50 rounded-3xl border border-white/10 flex flex-col items-center p-4 gap-4">
              {selectedReceiptImages.map((imgUrl, idx) => (
                 <img 
                   key={idx} 
                   src={imgUrl} 
                   alt={`Receipt ${idx + 1}`} 
                   referrerPolicy="no-referrer"
                   className="max-w-full rounded-xl object-contain shadow-2xl" 
                 />
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Receipt Modal (Shared with logic for PDF generation) */}
      {showReceiptModal && selectedPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-3 rounded-[2rem] w-full max-w-[260px] shadow-2xl overflow-hidden mx-auto"
          >
            <div className="flex justify-between items-center mb-3 px-1">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{language === 'am' ? 'የክፍያ ደረሰኝ' : 'Payment Receipt'}</h3>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="p-1.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <XCircle size={14} />
              </button>
            </div>

            <div 
              id={`receipt-${selectedPayment.id}`}
              className="bg-white p-4 border-2 border-slate-50 rounded-2xl relative overflow-hidden"
            >
              <div className="absolute -right-6 -top-6 opacity-[0.03] transform rotate-12 pointer-events-none">
                <ShieldCheck size={120} />
              </div>
              <div className="absolute -left-6 -bottom-6 opacity-[0.02] transform -rotate-12 pointer-events-none">
                <FileText size={100} />
              </div>

              <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100 relative z-10">
                <div>
                  <h1 className="text-sm font-black text-slate-900 tracking-tighter mb-0.5">{t('common.appName')}</h1>
                  <p className="text-[6px] font-black text-indigo-500 uppercase tracking-[0.2em]">{language === 'am' ? 'ህጋዊ ደረሰኝ' : 'Official Receipt'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Receipt ID</p>
                  <p className="text-[8px] font-black text-slate-900 font-mono">#{selectedPayment.receiptId || selectedPayment.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{language === 'am' ? 'የአባል ስም' : 'Member Name'}</p>
                    <p className="text-[9px] font-black text-slate-900 uppercase truncate">{selectedPayment.userName || userData?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{language === 'am' ? 'እቁብ/ምድብ' : 'Group/Round'}</p>
                    <p className="text-[9px] font-black text-slate-900 truncate">{selectedPayment.groupName || group?.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{language === 'am' ? 'የተከፈለበት ቀን' : 'Payment Date'}</p>
                    <p className="text-[8px] font-black text-slate-900">
                      {selectedPayment.createdAt?.toDate ? selectedPayment.createdAt.toDate().toLocaleDateString() : new Date(selectedPayment.createdAt).toLocaleDateString()}
                    </p>
                    {selectedPayment.paymentDetails?.time && (
                      <p className="text-[7px] font-black text-slate-500 mt-0.5">
                        {selectedPayment.paymentDetails.time}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{language === 'am' ? 'የክፍያ መንገድ/ባንክ' : 'Bank Method'}</p>
                    <p className="text-[8px] font-black text-slate-900 font-mono leading-tight">
                      {selectedPayment.bank ? selectedPayment.bank.toUpperCase() : (selectedPayment.paymentDetails?.method || 'Bank Transfer')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{language === 'am' ? 'የከፋይ ስም' : 'Payer Name'}</p>
                    <p className="text-[8px] font-black text-slate-900 font-mono leading-tight">
                      {selectedPayment.payerName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{language === 'am' ? 'የከፋይ ሂሳብ' : 'Account/TXN'}</p>
                    <p className="text-[8px] font-black text-slate-900 font-mono leading-tight">
                      Acc: {selectedPayment.payerAccount || 'N/A'}
                    </p>
                    <p className="text-[7px] font-black text-slate-500 mt-0.5">
                      TXN: {selectedPayment.transactionCode || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[1rem] flex justify-between items-center text-white mt-4 shadow-inner">
                  <div>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-shadow-sm">{language === 'am' ? 'የተከፈለው መጠን' : 'Amount Paid'}</p>
                    <p className="text-sm font-black text-shadow">{(selectedPayment.amount || 0).toLocaleString()} <span className="text-[8px] font-bold text-slate-400">ETB</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] font-black text-emerald-400 uppercase tracking-widest mb-0.5 text-shadow-sm">{language === 'am' ? 'ሁኔታ' : 'Status'}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest">{language === 'am' ? 'ተረጋግጧል' : 'Verified'}</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-end relative z-10">
                  <div className="inline-block px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[6px] font-bold text-slate-500 italic max-w-[120px] leading-relaxed">
                      {language === 'am' ? '"እናመሰግናለን። ቁጠባዎ ደህንነቱ የተጠበቀ ነው።"' : '"Thank you. Your savings are secure with us."'}
                    </p>
                  </div>
                  <div className="text-center w-16">
                     <div className="border-b border-slate-300 w-full mb-1"></div>
                     <p className="text-[5px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'ፊርማ' : 'Signature'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-1">
                  <ShieldCheck size={9} className="text-indigo-500" />
                  <p className="text-[5px] font-black text-slate-400 uppercase tracking-widest">Digital Auth Verified</p>
                </div>
                <div className="text-right text-[5px] font-black text-slate-300 uppercase tracking-widest">
                  © {new Date().getFullYear()} {t('common.appName').toUpperCase()}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 px-1">
              <button 
                onClick={() => generatePDF(selectedPayment)}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
              >
                <FileText size={12} /> {language === 'am' ? 'አውርድ (PDF)' : 'Download PDF'}
              </button>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="w-full py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95"
              >
                {language === 'am' ? 'ተመለስ' : 'Go Back'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Global Notifications UI */}
      <audio id="notification-sound" src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto"></audio>
      <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-start gap-3 max-w-xs"
            >
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <Bell size={20} className="animate-bounce" />
              </div>
              <div className="flex-1">
                <h4 className="text-[11px] font-black tracking-tight text-slate-800 uppercase leading-none">{toast.title}</h4>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">{toast.message}</p>
              </div>
              <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-slate-300 hover:text-slate-500">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
    </div>
  );
}
