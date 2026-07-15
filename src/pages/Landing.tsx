import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Users, 
  Gift, 
  CheckCircle2, 
  Globe, 
  Eye, 
  Settings, 
  Lock, 
  Menu, 
  X,
  Play,
  Calculator,
  Sparkles,
  Award,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Check,
  Smartphone,
  Info,
  Calendar,
  Layers,
  HelpCircle,
  HelpCircle as FaqIcon
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
// @ts-expect-error - static asset import
import heroImg from '../assets/images/equb_hero_celebration_1782574091164.jpg';

export default function Landing() {
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Interactive Simulator States
  const [calcContribution, setCalcContribution] = useState<number>(5000);
  const [calcMembers, setCalcMembers] = useState<number>(10);
  const [calcInterval, setCalcInterval] = useState<'monthly' | 'weekly'>('monthly');

  // Interactive Spin Wheel / Lot Draw Simulator States
  const [spinning, setSpinning] = useState(false);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [drawResult, setDrawResult] = useState<string | null>(null);

  // Custom Toast System state
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'info' }>>([]);
  
  // Feature Detail Dialog State
  const [activeFeatureModal, setActiveFeatureModal] = useState<any>(null);

  // Quick Info Modal for "About" or "Video" click
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Toast helper
  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
    triggerToast(
      language === 'am' ? `ወደ ${id} ዝርዝር እየተንሸራተቱ ነው` : `Scrolling smoothly to ${id} section`,
      'info'
    );
  };

  // Spin Lot simulator function
  const handleSimulateDraw = () => {
    if (spinning) return;
    setSpinning(true);
    setDrawResult(null);
    triggerToast(
      language === 'am' ? 'ዕጣው በግልፅ እየተሽከረከረ ነው...' : 'Draw is spinning transparently...',
      'info'
    );

    const names = [
      'ቤተልሔም ካሳሁን (Bethelhem K.)',
      'ዮሐንስ አበበ (Yohannes A.)',
      'ሰለሞን በቀለ (Solomon B.)',
      'ኪያ ቶሎሳ (Kiya T.)',
      'ራሔል ታደሰ (Rahel T.)',
      'እንዳልካቸው መኮንን (Endalkachew M.)'
    ];
    
    let counter = 0;
    const interval = setInterval(() => {
      setDrawResult(names[counter % names.length]);
      counter++;
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      const finalWinner = names[Math.floor(Math.random() * names.length)];
      setDrawResult(finalWinner);
      setSpinning(false);
      triggerToast(
        language === 'am' 
          ? `🎉 እንኳን ደስ አላችሁ! የዚህ ዙር እጣ አሸናፊ: ${finalWinner}`
          : `🎉 Congratulations! This round winner is: ${finalWinner}`,
        'success'
      );
    }, 2800);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden relative selection:bg-indigo-500/20">
      
      {/* Dynamic Floating Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className={`p-4 rounded-2xl shadow-xl border flex items-center gap-3 ${
                toast.type === 'success' 
                  ? 'bg-emerald-600 text-white border-emerald-500' 
                  : 'bg-indigo-900 text-white border-indigo-800'
              }`}
            >
              <div className="p-1.5 rounded-xl bg-white/10 shrink-0">
                {toast.type === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
              </div>
              <p className="text-xs sm:text-sm font-black leading-snug">{toast.message}</p>
              <button 
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="ml-auto p-1 text-white/60 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* HEADER NAVBAR */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-6xl px-4 no-flicker">
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-[0_15px_45px_rgba(0,0,0,0.06)] rounded-[2rem] px-6 sm:px-8 py-3 flex items-center justify-between transition-all">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100 overflow-hidden shrink-0 transition-transform group-hover:rotate-3">
              <img src="/logo.png" className="w-full h-full object-contain p-0.5" alt="Logo" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black text-[#0c2340] tracking-tighter uppercase leading-none italic">
                {language === 'am' ? 'መሊቅ እቁብ' : 'MELIK EKUB'}
              </span>
              <span className="text-[8px] font-bold text-indigo-600 uppercase tracking-[0.25em] mt-0.5">
                {language === 'am' ? 'ለመለቅ እቁብ' : 'For Elite Savings'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-7">
            <button onClick={() => scrollToSection('home')} className="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer">
              {language === 'am' ? 'ዋና ገጽ' : 'Home'}
            </button>
            <button onClick={() => scrollToSection('about')} className="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer">
              {language === 'am' ? 'ስለ እኛ' : 'About Us'}
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer">
              {language === 'am' ? 'እንዴት ይሰራል' : 'How it Works'}
            </button>
            <button onClick={() => scrollToSection('simulator')} className="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer">
              {language === 'am' ? 'እቁብ ማስሊያ' : 'Calculator'}
            </button>
            <button onClick={() => scrollToSection('services')} className="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer">
              {language === 'am' ? 'አገልግሎቶች' : 'Features'}
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <button 
              onClick={() => {
                setLanguage(language === 'am' ? 'en' : 'am');
                triggerToast(
                  language === 'am' ? 'Language changed to English' : 'ቋንቋ ወደ አማርኛ ተቀይሯል',
                  'success'
                );
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest transition-all cursor-pointer border border-slate-200/20"
            >
              <Globe size={14} className="text-slate-500" />
              <span>{language === 'am' ? 'EN' : 'አማርኛ'}</span>
            </button>

            {/* CTA Signup Link */}
            <Link 
              to="/signup" 
              onClick={() => triggerToast(language === 'am' ? 'የመመዝገቢያ ገጽ በመከፈት ላይ ነው...' : 'Opening Registration portal...', 'info')}
              className="hidden sm:inline-flex bg-[#0c2340] hover:bg-indigo-900 text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              {language === 'am' ? 'ለመመዝገብ / Join Now' : 'Join Now'}
            </Link>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors border border-slate-200/50"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[99] md:hidden bg-slate-950/40 backdrop-blur-md">
          <div className="absolute top-24 left-4 right-4 bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-3 animate-scale-in">
            <button onClick={() => scrollToSection('home')} className="text-left py-2.5 px-4 rounded-xl hover:bg-slate-50 font-black text-slate-700">
              {language === 'am' ? 'ዋና ገጽ' : 'Home'}
            </button>
            <button onClick={() => scrollToSection('about')} className="text-left py-2.5 px-4 rounded-xl hover:bg-slate-50 font-black text-slate-700">
              {language === 'am' ? 'ስለ እኛ' : 'About Us'}
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-left py-2.5 px-4 rounded-xl hover:bg-slate-50 font-black text-slate-700">
              {language === 'am' ? 'እንዴት ይሰራል' : 'How It Works'}
            </button>
            <button onClick={() => scrollToSection('simulator')} className="text-left py-2.5 px-4 rounded-xl hover:bg-slate-50 font-black text-slate-700">
              {language === 'am' ? 'እቁብ ማስሊያ' : 'Calculator'}
            </button>
            <button onClick={() => scrollToSection('services')} className="text-left py-2.5 px-4 rounded-xl hover:bg-slate-50 font-black text-slate-700">
              {language === 'am' ? 'አገልግሎቶች' : 'Features'}
            </button>
            <div className="h-px bg-slate-100 my-2" />
            <Link 
              to="/signup" 
              className="w-full bg-[#0c2340] text-white text-center font-black py-4 rounded-2xl shadow-lg"
            >
              {language === 'am' ? 'ለመመዝገብ / Join Now' : 'Join Now'}
            </Link>
            <Link 
              to="/login" 
              className="w-full bg-slate-100 text-slate-700 text-center font-black py-4 rounded-2xl"
            >
              {language === 'am' ? 'ግባ' : 'Login'}
            </Link>
          </div>
        </div>
      )}

      {/* HERO SECTION - Matching the exact solid deep Navy Blue design with wave boundary */}
      <section id="home" className="relative bg-[#0c2340] text-white pt-36 sm:pt-44 pb-28 md:pb-40 px-4 sm:px-8 overflow-hidden">
        {/* Subtle grid pattern for texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        
        <div className="max-w-6xl mx-auto z-10 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column (Text & Buttons) */}
            <div className="lg:col-span-6 flex flex-col text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 text-amber-400 rounded-full font-black text-[10px] uppercase tracking-widest mb-6 border border-white/10 self-center lg:self-start">
                <Sparkles size={11} className="animate-pulse" />
                <span>{language === 'am' ? 'የማህበረሰብ ቁጠባ መድረክ' : 'Decentralized Community Platform'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] mb-6">
                {language === 'am' ? (
                  <>
                    <span className="text-amber-400 font-serif font-black block mb-2">ለመሊቅ እቁብ:</span>
                    የማህበረሰብ ቁጠባ መንገድ!
                  </>
                ) : (
                  <>
                    <span className="text-amber-400 font-serif font-black block mb-2">Melik Equb:</span>
                    The Elite Way to Save!
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-slate-300 font-medium mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {language === 'am' ? (
                  'የጋራ እድገትና ፋይናንሳዊ ነፃነትን የሚያረጋግጥ ዘመናዊ የእቁብ ስርዓት። ቴክኖሎጂን በመጠቀም ባህላዊ እቁብን አስተማማኝ እና ምቹ አድርገናል። ዛሬውኑ ይቀላቀሉን!'
                ) : (
                  'A modern savings system securing shared growth and financial independence. Combining technology with cultural heritage for safety, ease, and transparency. Join today!'
                )}
              </p>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link 
                  to="/signup" 
                  onClick={() => triggerToast(language === 'am' ? 'ቁጠባ ለመጀመር ምዝገባ እየተከፈተ ነው...' : 'Getting ready to start saving...', 'success')}
                  className="w-full sm:w-auto px-10 py-4.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-amber-400/10 active:scale-95 transition-all text-center group cursor-pointer"
                >
                  <span>{language === 'am' ? 'አሁኑኑ ይጀምሩ / Start Saving Now' : 'Start Saving Now'}</span>
                  <ArrowRight size={15} className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <button 
                  onClick={() => {
                    scrollToSection('simulator');
                    triggerToast(language === 'am' ? 'ቁጠባዎን ማስላት ይችላሉ' : 'Try our interactive simulator below!', 'info');
                  }}
                  className="w-full sm:w-auto px-10 py-4.5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-2xl border border-white/20 transition-all text-center cursor-pointer"
                >
                  {language === 'am' ? 'ዕጣ ማስሊያ' : 'Calculate Return'}
                </button>
              </div>
            </div>

            {/* Right Column - Stunning generated illustration of celebrating Ethiopian group */}
            <div className="lg:col-span-6 flex justify-center relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative w-full max-w-[500px] aspect-[4/3] rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
              >
                {/* Background backglow decoration inside container */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c2340]/90 via-transparent to-transparent z-10" />
                
                {/* Generated Image displaying Habesha Group and Mesob */}
                <img 
                  src={heroImg} 
                  alt="Ethiopian Equb Celebration" 
                  className="w-full h-full object-cover relative z-0 hover:scale-105 transition-transform duration-700" 
                  referrerPolicy="no-referrer"
                />

                {/* Sparkling floating visual badges inside image overlay */}
                <div className="absolute top-4 left-4 z-20 bg-emerald-500 text-white px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-emerald-500/30">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                  <span>{language === 'am' ? '100% ግልፅ ስርዓት' : '100% Transparent'}</span>
                </div>

                <div className="absolute bottom-4 right-4 z-20 bg-amber-400 text-slate-900 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                  <Award size={13} />
                  <span>{language === 'am' ? 'ባህላዊ እና ዘመናዊ' : 'Heritage & Tech'}</span>
                </div>
              </motion.div>
            </div>

          </div>
        </div>

        {/* Elegant curvy wave bottom cutout separator */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-12 sm:h-20 text-slate-50 fill-current">
            <path d="M0,0 C150,90 350,120 600,100 C850,80 1050,110 1200,120 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </section>

      {/* THREE INTERACTIVE FEATURES SECTIONS - Overlapping Hero exactly like image mock */}
      <section className="relative px-4 sm:px-8 max-w-6xl mx-auto z-20 -mt-16 md:-mt-24 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Easy & Fast Registration */}
          <div 
            onClick={() => {
              setActiveFeatureModal({
                title: language === 'am' ? 'ቀላል እና ፈጣን ምዝገባ' : 'Easy & Fast Registration',
                desc: language === 'am' 
                  ? 'በጥቂት ሰከንዶች ውስጥ በስልክ ቁጥርዎ ይመዝገቡ። ማንነትዎን በፍጥነት በማረጋገጥ ወዲያውኑ የሚፈልጉትን የእቁብ አይነት መምረጥ ወይም የራስዎን መፍጠር ይችላሉ።'
                  : 'Register in seconds using just your phone number. Instant identity verification lets you choose an active Equb pool or create your own circle immediately.',
                icon: 'reg'
              });
              triggerToast(language === 'am' ? 'የምዝገባ ዝርዝር መረጃ ተከፍቷል' : 'Opened Easy Registration details', 'info');
            }}
            className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_50px_rgba(12,35,64,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center cursor-pointer group"
          >
            {/* Custom SVG Icon matching mockup (ID + Check icon with yellow background plate) */}
            <div className="w-20 h-20 rounded-2xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center mb-6 shadow-inner border border-amber-100/30 shrink-0 relative">
              <svg viewBox="0 0 100 100" className="w-12 h-12 text-[#0c2340]">
                {/* ID Card outline */}
                <rect x="22" y="32" width="44" height="34" rx="4" fill="none" stroke="currentColor" strokeWidth="4" />
                <circle cx="36" cy="46" r="6" fill="currentColor" />
                <line x1="28" y1="58" x2="44" y2="58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <line x1="48" y1="44" x2="60" y2="44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <line x1="48" y1="50" x2="58" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                {/* Document checklist inside frame */}
                <rect x="52" y="48" width="28" height="32" rx="3" fill="#ffffff" stroke="currentColor" strokeWidth="3" className="drop-shadow-sm" />
                <path d="M58 64 L64 70 L74 60" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-1 rounded-full shadow-md">
                <Check size={10} strokeWidth={4} />
              </div>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-2 font-serif">
              {language === 'am' ? 'ቀላል እና ፈጣን ምዝገባ' : 'Easy Registration'}
            </h3>
            <span className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-widest">{language === 'am' ? 'የተቀላጠፈ' : 'STREAMLINED'}</span>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              {language === 'am' ? 'ቀላል የምዝገባ ሂደት፣ ፈጣን ፎቶና መታወቂያ ማረጋገጫ በጥቂት ሰከንዶች ውስጥ!' : 'Easy, fully-secured paperless signup with your phone number and instant verification.'}
            </p>
          </div>

          {/* Card 2: Safe & Secure */}
          <div 
            onClick={() => {
              setActiveFeatureModal({
                title: language === 'am' ? 'ደህንነቱ አስተማማኝ የሆነ ቁጠባ' : 'Safe & Secure Savings',
                desc: language === 'am' 
                  ? 'የእያንዳንዱ አባል ቁጠባ በታመኑ ባንኮችና በህጋዊ ውል የተጠበቀ ነው። የላቀ የኢንክሪፕሽን ቴክኖሎጂን በመጠቀም የገንዘብዎ እና የዳታዎ አስተማማኝነት ሙሉ በሙሉ የተረጋገጠ ነው።'
                  : 'Every single ETB deposited in Melik Equb is backed by trusted banking institutions and legally enforceable agreements. Safeguarded with end-to-end industry encryption.',
                icon: 'secure'
              });
              triggerToast(language === 'am' ? 'የደህንነት ዝርዝር መረጃ ተከፍቷል' : 'Opened Security details', 'info');
            }}
            className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_50px_rgba(12,35,64,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center cursor-pointer group"
          >
            {/* Custom SVG Icon with padlock and green shield plate */}
            <div className="w-20 h-20 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center mb-6 shadow-inner border border-emerald-100/30 shrink-0 relative">
              <svg viewBox="0 0 100 100" className="w-12 h-12 text-[#0c2340]">
                {/* Padlock */}
                <rect x="25" y="40" width="34" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="4" />
                <path d="M32 40 V30 C32 20, 48 20, 48 30 V40" fill="none" stroke="currentColor" strokeWidth="4" />
                <circle cx="42" cy="50" r="3" fill="currentColor" />
                <line x1="42" y1="53" x2="42" y2="59" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                {/* Green Shield overlay */}
                <path d="M52 42 C52 42, 62 38, 72 44 C72 60, 62 72, 52 76 C42 72, 32 60, 32 44" fill="#10b981" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" className="drop-shadow-sm" />
                <path d="M42 58 L48 64 L62 50" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-2 font-serif">
              {language === 'am' ? 'ደህንነቱ የተጠበቀ' : 'Secure Savings'}
            </h3>
            <span className="text-xs font-bold text-emerald-600 mb-2 uppercase tracking-widest">{language === 'am' ? 'የታመነ' : 'FULLY INSURED'}</span>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              {language === 'am' ? 'ከታመኑ የአካባቢ ባንኮች ጋር የተቆራኘ፣ የተጠበቀ እና በህግ የተደገፈ አስተማማኝ ቁጠባ!' : 'Linked with trusted commercial banks and governed by legal framework.'}
            </p>
          </div>

          {/* Card 3: Transparent Draw */}
          <div 
            onClick={() => {
              setShowDrawModal(true);
              triggerToast(language === 'am' ? 'የእጣ ማውጫ አስመሳይ ተከፍቷል' : 'Opened Draw simulator modal', 'info');
            }}
            className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_50px_rgba(12,35,64,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center cursor-pointer group"
          >
            {/* Custom SVG Icon with lottery wheel and gold coins */}
            <div className="w-20 h-20 rounded-2xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center mb-6 shadow-inner border border-amber-100/30 shrink-0 relative">
              <svg viewBox="0 0 100 100" className="w-12 h-12 text-[#0c2340]">
                {/* Lottery Spinner Wheel */}
                <circle cx="50" cy="45" r="22" fill="none" stroke="currentColor" strokeWidth="4" />
                <circle cx="50" cy="45" r="14" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="6 4" />
                <path d="M50 23 L50 67 M28 45 H72 M34 29 L66 61 M34 61 L66 29" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="50" cy="45" r="4" fill="currentColor" />
                {/* Hand and Coin */}
                <path d="M50 62 C58 62, 72 65, 78 72 C80 75, 75 80, 70 80 H45" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="42" cy="74" r="8" fill="#f59e0b" stroke="currentColor" strokeWidth="3" className="drop-shadow-sm" />
                <text x="42" y="79" fill="#92400e" fontSize="13" fontWeight="black" textAnchor="middle">$</text>
              </svg>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-2 font-serif">
              {language === 'am' ? 'ግልፅ የዕጣ ማውጣት' : 'Transparent Draw'}
            </h3>
            <span className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-widest">{language === 'am' ? 'ቅጽበታዊ ዕጣ' : 'FAIR DRAW'}</span>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              {language === 'am' ? 'ግልፅና ታማኝ የዕጣ ማውጣት ሂደት በየዙሩ! ውጤቱ በአባላት ፊት ወዲያውኑ ይገለፃል::' : 'Provably fair and automated digital draw algorithm showing live transparency.'}
            </p>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 px-4 sm:px-8 max-w-6xl mx-auto z-10 relative">
        <div className="text-center mb-16">
          <span className="text-indigo-600 text-xs font-black uppercase tracking-[0.3em] block mb-3">
            {language === 'am' ? 'ቀላል የቁጠባ ጉዞ' : 'EASY PROCESS'}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-serif">
            {language === 'am' ? 'ቁጠባ በ 3 ቀላል ደረጃዎች' : 'How it Works'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Step 1 */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col items-center relative group hover:border-indigo-100 transition-all">
            <div className="w-12 h-12 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center font-black text-lg shadow-md mb-6">
              1
            </div>
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-50 transition-colors">
              <Smartphone size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2 font-serif">
              {language === 'am' ? 'ይመዝገቡ' : 'Sign Up'}
            </h3>
            <p className="text-xs text-slate-500 font-bold text-center leading-relaxed">
              {language === 'am' ? 'በስልክ ቁጥርዎ ይመዝገቡ፣ በጥቂት ሰከንዶች ውስጥ መታወቂያዎን ያረጋግጡ::' : 'Sign up using your mobile number and pass rapid automatic KYC.'}
            </p>
            <button 
              onClick={() => {
                triggerToast(language === 'am' ? 'የመመዝገቢያ ፎርም ለመክፈት አሁኑኑ ይመዝገቡን ይጫኑ' : 'Click Join Now at top to sign up!', 'info');
              }}
              className="mt-6 text-xs font-black uppercase text-indigo-600 hover:text-indigo-700 tracking-wider flex items-center gap-1.5"
            >
              <span>{language === 'am' ? 'ለመመዝገብ' : 'Learn registration'}</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col items-center relative group hover:border-indigo-100 transition-all">
            <div className="w-12 h-12 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center font-black text-lg shadow-md mb-6">
              2
            </div>
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-50 transition-colors">
              <Layers size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2 font-serif">
              {language === 'am' ? 'እቁብ ይምረጡ' : 'Choose Equb'}
            </h3>
            <p className="text-xs text-slate-500 font-bold text-center leading-relaxed">
              {language === 'am' ? 'ለምሳሌ 200ሺህ ወይም 100ሺህ እጣ ያለውን የአባላት ቡድን ይቀላቀሉ::' : 'Select or join a savings group like 200k or 100k pools with customizable duration.'}
            </p>
            <button 
              onClick={() => {
                scrollToSection('simulator');
                triggerToast(language === 'am' ? 'እዚህ ማስሊያ ላይ መምረጥ ይችላሉ' : 'Try setting values in calculator below!', 'info');
              }}
              className="mt-6 text-xs font-black uppercase text-indigo-600 hover:text-indigo-700 tracking-wider flex items-center gap-1.5"
            >
              <span>{language === 'am' ? 'ቡድኖችን እይ' : 'Explore pools'}</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col items-center relative group hover:border-indigo-100 transition-all">
            <div className="w-12 h-12 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center font-black text-lg shadow-md mb-6">
              3
            </div>
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-50 transition-colors">
              <Gift size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2 font-serif">
              {language === 'am' ? 'ዕጣዎን ያግኙ' : 'Collect Payout'}
            </h3>
            <p className="text-xs text-slate-500 font-bold text-center leading-relaxed">
              {language === 'am' ? 'እጣው ለእርስዎ ሲደርስ በቀጥታ በባንክ አካውንትዎ ወይም በቴሌብር ይቀበሉ::' : 'On your rotating winning turn, collect the accumulated cash payout safely.'}
            </p>
            <button 
              onClick={() => {
                setShowDrawModal(true);
                triggerToast(language === 'am' ? 'የእጣ አወጣጥ አስመሳይ ተከፍቷል' : 'Opened transparent draw simulator', 'info');
              }}
              className="mt-6 text-xs font-black uppercase text-indigo-600 hover:text-indigo-700 tracking-wider flex items-center gap-1.5"
            >
              <span>{language === 'am' ? 'ዕጣውን ሞክር' : 'Simulate draw'}</span>
              <ArrowRight size={12} />
            </button>
          </div>

        </div>
      </section>

      {/* INTERACTIVE SIMULATOR WIDGET SECTION - Amazing User Engagement! */}
      <section id="simulator" className="py-20 bg-[#0c2340] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          
          <div className="text-center mb-12">
            <span className="text-amber-400 text-xs font-black uppercase tracking-[0.3em] block mb-3">
              {language === 'am' ? 'ይሞክሩት እና ያቅዱ' : 'INTERACTIVE ESTIMATOR'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black font-serif tracking-tight">
              {language === 'am' ? 'የቁጠባና የዕጣ ማስሊያ' : 'Equb Savings Estimator'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-bold mt-2 max-w-lg mx-auto">
              {language === 'am' ? 'የመዋጮ መጠንዎን እና የአባላት ብዛት በመቀየር ምን ያህል ማግኘት እንደሚችሉ ይወቁ::' : 'Drag sliders to calculate payout cycles and potential pool prizes.'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              
              {/* Sliders Area */}
              <div className="space-y-6">
                
                {/* Contribution amount */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wider">
                      {language === 'am' ? 'የመዋጮ መጠን' : 'Contribution Amount'}
                    </label>
                    <span className="text-lg font-black text-amber-400 font-serif">
                      {calcContribution.toLocaleString()} {language === 'am' ? 'ብር' : 'ETB'}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="500" 
                    max="50000" 
                    step="500"
                    value={calcContribution} 
                    onChange={(e) => {
                      setCalcContribution(Number(e.target.value));
                      triggerToast(
                        language === 'am' 
                          ? `መዋጮ ወደ ${Number(e.target.value).toLocaleString()} ብር ተቀይሯል`
                          : `Contribution adjusted to ${Number(e.target.value).toLocaleString()} ETB`,
                        'info'
                      );
                    }}
                    className="w-full accent-amber-400 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-extrabold mt-1">
                    <span>500 ብር</span>
                    <span>50,000 ብር</span>
                  </div>
                </div>

                {/* Number of Members */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wider">
                      {language === 'am' ? 'የአባላት ብዛት' : 'Number of Members'}
                    </label>
                    <span className="text-lg font-black text-amber-400 font-serif">
                      {calcMembers} {language === 'am' ? 'አባላት' : 'Members'}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    step="1"
                    value={calcMembers} 
                    onChange={(e) => {
                      setCalcMembers(Number(e.target.value));
                      triggerToast(
                        language === 'am' 
                          ? `የአባላት ቁጥር ወደ ${e.target.value} ተቀይሯል`
                          : `Members adjusted to ${e.target.value}`,
                        'info'
                      );
                    }}
                    className="w-full accent-amber-400 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-extrabold mt-1">
                    <span>5 አባላት</span>
                    <span>50 አባላት</span>
                  </div>
                </div>

                {/* Interval Buttons */}
                <div>
                  <label className="text-xs sm:text-sm font-black text-slate-200 block mb-3 uppercase tracking-wider">
                    {language === 'am' ? 'የቁጠባ ዑደት' : 'Contribution Interval'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        setCalcInterval('monthly');
                        triggerToast(language === 'am' ? 'ዑደት ወደ በየወሩ ተቀይሯል' : 'Interval set to Monthly', 'success');
                      }}
                      className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                        calcInterval === 'monthly' 
                          ? 'bg-amber-400 text-slate-950 border-amber-400' 
                          : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {language === 'am' ? 'በየወሩ' : 'Monthly'}
                    </button>
                    <button 
                      onClick={() => {
                        setCalcInterval('weekly');
                        triggerToast(language === 'am' ? 'ዑደት ወደ በየሳምንቱ ተቀይሯል' : 'Interval set to Weekly', 'success');
                      }}
                      className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                        calcInterval === 'weekly' 
                          ? 'bg-amber-400 text-slate-950 border-amber-400' 
                          : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {language === 'am' ? 'በየሳምንቱ' : 'Weekly'}
                    </button>
                  </div>
                </div>

              </div>

              {/* Calculator Results Display */}
              <div className="bg-[#0a1e36] rounded-3xl p-6 sm:p-8 border border-white/5 text-center flex flex-col justify-between h-full min-h-[280px]">
                
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    {language === 'am' ? 'ጠቅላላ የዕጣ መጠን' : 'TOTAL PAYOUT POOL'}
                  </p>
                  <h3 className="text-3xl sm:text-4xl font-black font-serif text-amber-400 tracking-tight">
                    {(calcContribution * calcMembers).toLocaleString()} <span className="text-lg">{language === 'am' ? 'ብር' : 'ETB'}</span>
                  </h3>
                  <div className="w-16 h-1 bg-amber-400/20 mx-auto my-4 rounded-full" />
                </div>

                <div className="grid grid-cols-2 gap-4 my-4 text-left">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'የዑደት ርዝመት' : 'CYCLE LENGTH'}</p>
                    <p className="text-xs sm:text-sm font-black text-white mt-1">
                      {calcMembers} {calcInterval === 'monthly' ? (language === 'am' ? 'ወራት' : 'Months') : (language === 'am' ? 'ሳምንታት' : 'Weeks')}
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{language === 'am' ? 'የአሸናፊነት ዕድል' : 'WIN CHANCE'}</p>
                    <p className="text-xs sm:text-sm font-black text-emerald-400 mt-1">
                      {(100 / calcMembers).toFixed(1)}% {language === 'am' ? 'በየዙሩ' : '/round'}
                    </p>
                  </div>
                </div>



              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-24 bg-white border-y border-slate-100 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column (Illustration / Feature Grid) */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shrink-0 shadow-inner">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="text-sm font-black text-slate-900 mb-1">{t('landing.trust_points.1')}</h4>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center shadow-sm mt-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shrink-0 shadow-inner">
                  <Zap size={24} />
                </div>
                <h4 className="text-sm font-black text-slate-900 mb-1">{t('landing.trust_points.2')}</h4>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center shadow-sm -mt-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shrink-0 shadow-inner">
                  <Lock size={24} />
                </div>
                <h4 className="text-sm font-black text-slate-900 mb-1">{t('landing.trust_points.3')}</h4>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center shadow-sm mt-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shrink-0 shadow-inner">
                  <Users size={24} />
                </div>
                <h4 className="text-sm font-black text-slate-900 mb-1">{language === 'am' ? 'ቁጠባ ማህበረሰብ' : 'Community'}</h4>
              </div>
            </div>

            {/* Right Column (Content) */}
            <div className="lg:col-span-6">
              <span className="text-indigo-600 text-xs font-black uppercase tracking-[0.3em] block mb-3">
                {language === 'am' ? 'ስለ መሊቅ እቁብ ምንነት' : 'ABOUT OUR SYSTEM'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-6 font-serif">
                {language === 'am' ? 'ባህላዊ እሴቶቻችን በዘመናዊ ቴክኖሎጂ' : 'Preserving Culture with Modern Security'}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed mb-8">
                {language === 'am' ? (
                  'እቁብ የረጅም ዘመናት ታሪክ ያለው የማህበረሰብ የጋራ ቁጠባና የገንዘብ መረዳጃ ባህላዊ ማህበር ነው። መሊቅ እቁብ ይህንን ውድ ባህል በቴክኖሎጂ በማዘመን እጅግ ግልፅ፣ ደህንነቱ የተጠበቀና ምቹ የዲጂታል እቁብ መድረክ አድርጎ አቅርቧል።'
                ) : (
                  'Equb is a traditional Ethiopian savings and credit association. Members periodically contribute a fixed amount of money, which is then given to one member at a time on a rotating basis. Meliq Equb modernizes this beautiful system with absolute transparent technology.'
                )}
              </p>

              <div 
                onClick={() => {
                  setShowVideoModal(true);
                  triggerToast(language === 'am' ? 'የመግቢያ መረጃ ፓነል ተከፍቷል' : 'Opened Video/Introduction info panel', 'info');
                }}
                className="bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex items-start gap-4 mb-8 cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Play size={16} fill="currentColor" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 mb-1">{language === 'am' ? 'መግቢያ ቪዲዮ እይ' : 'How It Works (Demo Video)'}</h4>
                  <p className="text-xs font-bold text-slate-500 leading-normal">
                    {language === 'am' ? 'ለመመዝገብ፣ መዋጮ ለመክፈልና እጣ ለመውጣት የሚከተሉትን ቀላል መንገዶች የሚያሳይ አጭር ማብራሪያ::' : 'Learn how to easily register, contribute, and track your Equb rounds.'}
                  </p>
                </div>
              </div>

              <Link 
                to="/signup" 
                onClick={() => triggerToast(language === 'am' ? 'መመዝገቢያ ገጽ ተከፍቷል' : 'Directing to Sign Up', 'success')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-[#0c2340] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-colors"
              >
                <span>{language === 'am' ? 'አሁኑኑ ይመዝገቡ / Join Now' : 'Join Now'}</span>
                <ArrowRight size={14} />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ADDITIONAL RICH DETAILS & FAQ */}
      <section className="py-24 px-4 sm:px-8 max-w-6xl mx-auto z-10 relative">
        <div className="text-center mb-16">
          <span className="text-indigo-600 text-xs font-black uppercase tracking-[0.3em] block mb-3">
            {language === 'am' ? 'ተደጋጋሚ ጥያቄዎች' : 'COMMON QUESTIONS'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-serif tracking-tight">
            {language === 'am' ? 'እውቂያ እና ጥያቄዎች' : 'FAQ & Support'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:border-indigo-100 transition-colors">
              <h4 className="text-base font-black text-slate-900 mb-2 flex items-center gap-2">
                <HelpCircle size={18} className="text-indigo-600" />
                <span>{language === 'am' ? 'ለመሊቅ እቁብ ህጋዊ ነው?' : 'Is Melik Equb legally backed?'}</span>
              </h4>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                {language === 'am' 
                  ? 'አዎ፣ እያንዳንዱ የእቁብ ቡድን በህጋዊ ውል የታሰረ ሲሆን እጣውን የማያገባ አባል ቢኖር እንኳን በዋስትና ስምምነት መሰረት የቁጠባ ዋስትናው ሙሉ በሙሉ የተጠበቀ ነው።'
                  : 'Absolutely. Every Equb cycle operates under a strict legal contract signed digitally, and all members are verified to protect the savings integrity.'
                }
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:border-indigo-100 transition-colors">
              <h4 className="text-base font-black text-slate-900 mb-2 flex items-center gap-2">
                <HelpCircle size={18} className="text-indigo-600" />
                <span>{language === 'am' ? 'ዕጣ እንዴት ነው የሚወጣው?' : 'How is the draw calculated?'}</span>
              </h4>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                {language === 'am' 
                  ? 'ዕጣው ሙሉ በሙሉ በአውቶሜትድ ዲጂታል ሲስተም የሚወጣ ሲሆን በየዙሩ በሁሉም አባላት ፊት በግልፅ የሚሽከረከርና የሚታወቅ ነው።'
                  : 'The rotating draw is fully automated through a secure algorithm, ensuring equal chance and complete visibility to every participating user.'
                }
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:border-indigo-100 transition-colors">
              <h4 className="text-base font-black text-slate-900 mb-2 flex items-center gap-2">
                <HelpCircle size={18} className="text-indigo-600" />
                <span>{language === 'am' ? 'መዋጮዎችን እንዴት ነው የምከፍለው?' : 'How do I pay my contributions?'}</span>
              </h4>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                {language === 'am' 
                  ? 'መዋጮዎችን በታመኑ የኢትዮጵያ ባንኮች (ለምሳሌ CBE Birr, Telebirr, Awash Birr, ወዘተ) በመጠቀም በቀላሉ በስልክዎ መክፈል ይችላሉ::'
                  : 'You can contribute via Telebirr, CBE Birr, Awash, or standard digital banking tools connected directly inside your account.'
                }
              </p>
            </div>


          </div>

        </div>
      </section>

      {/* SIMPLIFIED FOOTER - Cleaner, high-contrast, modern layout requested by user */}
      <footer className="bg-[#0a1523] text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-8">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl border border-slate-700 bg-white flex items-center justify-center overflow-hidden shrink-0">
              <img src="/logo.png" className="w-full h-full object-contain p-0.5" alt="Logo" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-white tracking-tighter uppercase leading-none italic">
                {language === 'am' ? 'መሊቅ እቁብ' : 'MELIK EKUB'}
              </span>
              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                {language === 'am' ? 'ለመለቅ እቁብ' : 'For Elite Savings'}
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap justify-center gap-6 text-xs font-black uppercase tracking-wider">
            <button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors cursor-pointer">{language === 'am' ? 'ዋና ገጽ' : 'Home'}</button>
            <button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors cursor-pointer">{language === 'am' ? 'ስለ እኛ' : 'About'}</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors cursor-pointer">{language === 'am' ? 'እንዴት ይሰራል' : 'How It Works'}</button>
            <button onClick={() => scrollToSection('simulator')} className="hover:text-white transition-colors cursor-pointer">{language === 'am' ? 'ዕጣ ማስሊያ' : 'Calculator'}</button>
          </div>

          {/* Copyright */}
          <div className="text-center sm:text-right text-[11px] font-bold text-slate-500">
            <p>© {new Date().getFullYear()} Melik Equb. {language === 'am' ? 'መብቱ በህግ የተጠበቀ ነው::' : 'All rights reserved.'}</p>
            <p className="mt-1 text-slate-600">Made for Elite Savers in Addis Ababa</p>
          </div>

        </div>
      </footer>

      {/* --- INTERACTIVE MODALS & PORTALS (Every Button Action feedback) --- */}

      {/* 1. Feature Detail Popup Modal */}
      <AnimatePresence>
        {activeFeatureModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] max-w-md w-full p-8 border border-slate-100 shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setActiveFeatureModal(null);
                  triggerToast(language === 'am' ? 'ፓነሉ ተዘግቷል' : 'Closed feature details', 'info');
                }}
                className="absolute top-6 right-6 w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                {activeFeatureModal.icon === 'reg' ? <Smartphone size={24} /> : <ShieldCheck size={24} />}
              </div>

              <h3 className="text-2xl font-black text-slate-900 font-serif mb-3">
                {activeFeatureModal.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed mb-6">
                {activeFeatureModal.desc}
              </p>

              <div className="flex gap-3">
                <Link 
                  to="/signup"
                  onClick={() => {
                    setActiveFeatureModal(null);
                    triggerToast(language === 'am' ? 'ምዝገባ በመከፈት ላይ ነው' : 'Opening registration form...', 'success');
                  }}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest text-center rounded-xl shadow-lg transition-all"
                >
                  {language === 'am' ? 'አሁን ተቀላቀል' : 'Join Now'}
                </Link>
                <button 
                  onClick={() => {
                    setActiveFeatureModal(null);
                    triggerToast(language === 'am' ? 'እሺ' : 'Dismissed', 'info');
                  }}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider text-center rounded-xl transition-all"
                >
                  {language === 'am' ? 'ተመለስ' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Interactive Transparency Draw Lottery Simulator Modal */}
      <AnimatePresence>
        {showDrawModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              className="bg-[#0a1523] text-white rounded-[2.5rem] max-w-lg w-full p-8 border border-white/10 shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setShowDrawModal(false);
                  triggerToast(language === 'am' ? 'የእጣ አስመሳይ ተዘግቷል' : 'Closed draw simulator', 'info');
                }}
                className="absolute top-6 right-6 w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-2 mb-6 text-amber-400">
                <Sparkles size={18} className="animate-spin duration-3000" />
                <span className="text-xs font-black uppercase tracking-wider">DEMO SPINNER WIDGET</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black font-serif mb-2 text-white">
                {language === 'am' ? 'ግልፅ የዕጣ ማውጫ አስመሳይ' : 'Transparent Draw Lottery'}
              </h3>
              <p className="text-xs text-slate-400 font-bold mb-6">
                {language === 'am' 
                  ? 'የመሊቅ እቁብ ዲጂታል ዕጣ አወጣጥ ሂደት እንዴት ሙሉ በሙሉ ግልፅና ፍትሃዊ እንደሆነ በተግባር ይሞክሩ::' 
                  : 'See how our provably fair rotating slot spinner randomly draws winners.'
                }
              </p>

              {/* Spin Display Slot Plate */}
              <div className="bg-[#0e1d2f] border border-white/5 p-6 rounded-3xl flex flex-col items-center justify-center min-h-[140px] mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a1523]/80 via-transparent to-[#0a1523]/80 pointer-events-none" />
                
                {drawResult ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center relative z-10"
                  >
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">
                      {spinning ? (language === 'am' ? 'ዕጣው እየወጣ ነው...' : 'SPINNING NOW...') : (language === 'am' ? 'የዕጣው አሸናፊ!' : 'WINNER DRAWN!')}
                    </p>
                    <h4 className="text-lg sm:text-xl font-black text-white px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                      {drawResult}
                    </h4>
                  </motion.div>
                ) : (
                  <p className="text-xs font-black text-slate-400 text-center uppercase tracking-widest relative z-10">
                    {language === 'am' ? 'ሲስተሙ ዝግጁ ነው! "ዕጣ አውጣ" የሚለውን ይጫኑ' : 'System Ready! Click "Spin Draw" to begin.'}
                  </p>
                )}
              </div>

              {/* Action */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleSimulateDraw}
                  disabled={spinning}
                  className={`flex-1 py-4 text-xs font-black uppercase tracking-widest text-center rounded-2xl shadow-lg transition-all ${
                    spinning 
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black'
                  }`}
                >
                  {spinning ? (language === 'am' ? 'በመሽከርከር ላይ...' : 'Spinning...') : (language === 'am' ? 'ዕጣ አውጣ / Spin Draw' : 'Spin Draw')}
                </button>
                <button 
                  onClick={() => {
                    setShowDrawModal(false);
                    triggerToast(language === 'am' ? 'ተመለስ' : 'Closed', 'info');
                  }}
                  className="py-4 px-6 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all"
                >
                  {language === 'am' ? 'ዝጋ' : 'Close'}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Demo Introduction Information modal */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-white rounded-[2.5rem] max-w-md w-full p-8 border border-slate-100 shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setShowVideoModal(false);
                  triggerToast(language === 'am' ? 'የመረጃ ሰሌዳው ተዘግቷል' : 'Closed info portal', 'info');
                }}
                className="absolute top-6 right-6 w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                <Play size={20} fill="currentColor" />
              </div>

              <h3 className="text-xl sm:text-2xl font-black font-serif text-slate-900 mb-2">
                {language === 'am' ? 'ስለ አገልግሎታችን ማብራሪያ' : 'How Melik Equb Works'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed mb-6">
                {language === 'am' 
                  ? 'መሊቅ እቁብ እያንዳንዱን መዋጮና ዕጣ በህግ በተደገፉ ውሎች ያስተሳስራል። መተግበሪያውን በመክፈት ማንኛውም አባል ያለ ምንም ችግር በየዙሩ መዋጮዎችን መክፈልና አሸናፊውን በቀጥታ በቴሌብር ማየት ይችላል::' 
                  : 'Melik Equb pairs financial rotation with strict automated smart algorithms. Users can monitor contributions and track them on the mobile application instantly.'
                }
              </p>

              <button 
                onClick={() => {
                  setShowVideoModal(false);
                  triggerToast(language === 'am' ? 'ስለ እቁቡ ተጨማሪ ለመማር ይመዝገቡ' : 'Sign up to read the complete rules!', 'success');
                }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest text-center rounded-xl shadow-lg transition-all"
              >
                {language === 'am' ? 'አሁን ተቀላቀል' : 'Join Now'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
