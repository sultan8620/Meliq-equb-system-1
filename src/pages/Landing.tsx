import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { onSnapshot, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Users, 
  Star, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  Lock, 
  Layers,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  Youtube,
  Music,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  TrendingUp,
  Heart,
  Globe,
  Award,
  Leaf,
  Wallet,
  UserPlus,
  Gift,
  Quote,
  FileText,
  LayoutGrid,
  History,
  Home,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

const Landing = () => {
  const { language } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [landingSettings, setLandingSettings] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'landing_settings', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setLandingSettings(docSnap.data());
      }
    });
    return () => unsub();
  }, []);

  const [activeInfo, setActiveInfo] = useState<null | { title: string, titleAm: string, content: string, contentAm: string }>(null);

  const footerInfoMap: Record<string, { am: string, content: string, contentAm: string }> = {
    'About Us': {
      am: 'ስለ እኛ',
      content: 'Meliq Ekub is Ethiopia\'s premier digital savings platform, bridging centuries of tradition with modern security and transparency.',
      contentAm: 'መሊቅ እቁብ የዘመናት ባህላዊ ቁጠባን ከዘመናዊ ደህንነት እና ግልፅነት ጋር የሚያገናኝ የኢትዮጵያ ቀዳሚ የዲጂታል ቁጠባ መድረክ ነው።'
    },
    'Services': {
      am: 'አገልግሎቶቻችን',
      content: 'We offer specialized savings circles, digital contribution management, and instant payout systems.',
      contentAm: 'ልዩ የቁጠባ ቡድኖች፣ የዲጂታል ክፍያ አስተዳደር እና ፈጣን የእጣ ክፍያ ስርዓቶችን እናቀርባለን።'
    },
    'Stories': {
      am: 'የደንበኞች አስተያየት',
      content: 'Thousands of members have achieved their goals through Meliq Ekub. Join us and share your success story.',
      contentAm: 'በሺዎች የሚቆጠሩ አባላት በመሊቅ እቁብ አማካኝነት ግባቸውን አሳክተዋል። እርስዎም ይቀላቀሉን እና የስኬት ታሪክዎን ያጋሩ።'
    },
    'Payments': {
      am: 'የክፍያ አማራጮች',
      content: 'We support all major Ethiopian banks including CBE, BoA, and Awash for seamless transactions.',
      contentAm: 'ለቀጥታ ክፍያዎች እንደ ሲቢኢ (CBE)፣ ቦአ (BoA) እና አዋሽ ያሉ ዋና ዋና የኢትዮጵያ ባንኮችን እንደግፋለን።'
    },
    'Blog': {
      am: 'ብሎግ',
      content: 'Read the latest trends in digital finance and community-based saving culture in Ethiopia.',
      contentAm: 'በኢትዮጵያ ስላለው የዲጂታል ፋይናንስ and ማህበረሰብ ተኮር የቁጠባ ባህል የቅርብ ጊዜ መረጃዎችን ያንብቡ።'
    },
    'Privacy Policy': {
      am: 'የግላዊነት መመሪያ',
      content: 'Your data is encrypted and protected with bank-grade security protocols. We never share your personal information.',
      contentAm: 'መረጃዎ በባንክ ደረጃ የደህንነት ፕሮቶኮሎች የተመሰጠረ እና የተጠበቀ ነው። የግል መረጃዎን በጭራሽ አናጋራም።'
    },
    'Terms & Conditions': {
      am: 'ውልና ደንቦች',
      content: 'Our fair-use policy ensures every member has an equal opportunity and protected rights within our circles.',
      contentAm: 'ፍትሃዊ የአጠቃቀም መመሪያችን እያንዳንዱ አባል በእቁብ ቡድናችን ውስጥ እኩል ዕድል እና የተጠበቀ መብት እንዳለው ያረጋግጣል።'
    },
    'Cookie Policy': {
      am: 'የኩኪ አጠቃቀም',
      content: 'We use essential cookies to provide you with the best and most secure app experience possible.',
      contentAm: 'ምርጥ እና አስተማማኝ የአፕሊኬሽን ተሞክሮ እንዲኖርዎት አስፈላጊ ኩኪዎችን እንጠቀማለን።'
    },
    'Security Guide': {
      am: 'የደህንነት መመሪያ',
      content: 'Learn how to keep your account safe, including two-factor authentication and secure payment habits.',
      contentAm: 'ባለሁለት ደረጃ ማረጋገጫ (2FA) እና አስተማማኝ የክፍያ ልምዶችን ጨምሮ መለያዎን እንዴት ደህንነቱ የተጠበቀ ማድረግ እንደሚችሉ ይወቁ።'
    },
    'Help Center': {
      am: 'እርዳታ ለማግኘት',
      content: 'Our support team is available 24/7 to answer your questions and resolve any technical issues.',
      contentAm: 'የደንበኞች ድጋፍ ቡድናችን ጥያቄዎችዎን ለመመለስ እና ቴክኒካዊ ችግሮችን ለመፍታት በቀን 24 ሰዓት በሳምንት 7 ቀን ዝግጁ ነው።'
    }
  };

  const handleFooterClick = (slug: string) => {
    // Check dynamic settings first
    const dynamicInfo = landingSettings?.footerInfoMap?.[slug];
    if (dynamicInfo) {
      setActiveInfo({
        title: slug,
        titleAm: dynamicInfo.am,
        content: dynamicInfo.content,
        contentAm: dynamicInfo.contentAm
      });
      return;
    }

    const info = footerInfoMap[slug];
    if (info) {
      setActiveInfo({
        title: slug,
        titleAm: info.am,
        content: info.content,
        contentAm: info.contentAm
      });
    }
  };

  // Map icons from string to Lucide components
  const IconMap: Record<string, React.ReactNode> = {
    'ShieldCheck': <ShieldCheck size={32} />,
    'Zap': <Zap size={32} />,
    'BarChart3': <BarChart3 size={32} />,
    'Users': <Users size={32} />,
    'Star': <Star size={32} />,
    'Clock': <Clock size={32} />,
    'TrendingUp': <TrendingUp size={32} />,
    'Award': <Award size={32} />,
    'Phone': <Phone size={32} />,
    'Leaf': <Leaf size={32} />,
    'Wallet': <Wallet size={32} />,
    'Smartphone': <Smartphone size={32} />,
    'Lock': <Lock size={32} />,
    'Layers': <Layers size={32} />,
    'Globe': <Globe size={32} />,
    'FileText': <FileText size={32} />,
    'Gift': <Gift size={32} />,
    'UserPlus': <UserPlus size={32} />,
    'LayoutGrid': <LayoutGrid size={32} />,
    'History': <History size={32} />,
  };

  const slides = landingSettings?.sliderImages?.length > 0 
    ? landingSettings.sliderImages.map((img: string, idx: number) => ({
        image: img,
        titleAm: idx === 0 ? (landingSettings.heroTitleAm || "ስማርት እቁብ") : (landingSettings.heroTitleModernAm || "ብሩህ ተስፋ"),
        titleEn: idx === 0 ? (landingSettings.heroTitle || "Smart Ekub") : (landingSettings.heroTitleModern || "Bright Future"),
        descAm: landingSettings.heroSubtitleAm || "ሁሌም የእርስዎ የሆነውን የገንዘብ ማሳደጊያ ጥበብ በአዲስ እና ዘመናዊ ቴክኖሎጂ አዘምነን ይዘንልዎት መጥተናል።",
        descEn: landingSettings.heroSubtitle || "We bring you the traditional art of growing your money, perfectly modernized with smart technology."
      }))
    : [
        {
          image: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?ixlib=rb-4.0.3&auto=format&fit=crop&q=80&w=2000",
          titleAm: "ስማርት እቁብ፣ ብሩህ ተስፋ",
          titleEn: "Smart Ekub, Bright Future",
          descAm: "ሁሌም የእርስዎ የሆነውን የገንዘብ ማሳደጊያ ጥበብ በአዲስ እና ዘመናዊ ቴክኖሎጂ አዘምነን ይዘንልዎት መጥተናል። ባህላችንን ሳንለቅ ወደፊት እንራመድ!",
          descEn: "We bring you the traditional art of growing your money, perfectly modernized with smart technology."
        },
        {
          image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&q=80&w=2000",
          titleAm: "በአንድነት ከፍ እንበል",
          titleEn: "Rise Together",
          descEn: "Increase your financial capacity by saving together. Start a transparent and highly secure journey today.",
          descAm: "በጋራ በመቆጠብ የፋይናንስ አቅምዎን አሳድገው የነገ ህልምዎን እውን ያድርጉ። ከተረጋገጠ ደህንነት ጋር የጋራ ጉዞ ዛሬውኑ ይጀምሩ。"
        }
      ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Secondary Dynamic Color handling
  const primaryBg = landingSettings?.primaryColor ? `bg-${landingSettings.primaryColor.split('-')[0]}-600` : 'bg-emerald-800';
  const primaryText = landingSettings?.primaryColor ? `text-${landingSettings.primaryColor.split('-')[0]}-800` : 'text-emerald-800';
  const primaryShadow = landingSettings?.primaryColor ? `shadow-${landingSettings.primaryColor.split('-')[0]}-900/20` : 'shadow-emerald-900/20';

  return (
    <div className={`flex flex-col min-h-screen bg-[#FAFAF8] font-sans selection:bg-emerald-200 selection:text-emerald-950 overflow-x-clip relative`}>
      {/* Background Subtle Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-700 ${scrolled ? 'bg-[#FAFAF8]/95 border-b border-emerald-900/10 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.03)]' : 'bg-transparent py-8'}`}>
        <div className="max-w-[90rem] mx-auto px-6 sm:px-12 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transform group-hover:rotate-[15deg] transition-all duration-500 shadow-xl ${scrolled ? (landingSettings?.primaryColor ? `bg-${landingSettings.primaryColor.split('-')[0]}-800` : 'bg-emerald-800') : 'bg-white shadow-black/10'}`}>
               <Leaf className={scrolled ? 'text-amber-400' : (landingSettings?.primaryColor ? `text-${landingSettings.primaryColor.split('-')[0]}-800` : 'text-emerald-800')} size={24} />
            </div>
            <div className="flex flex-col">
              <span className={`text-2xl font-black tracking-tighter uppercase leading-none ${scrolled ? 'text-emerald-950' : 'text-white'}`}>Meliq Ekub</span>
              <span className={`text-[10px] font-bold tracking-[0.3em] uppercase mt-1 ${scrolled ? 'text-emerald-600' : 'text-emerald-100'}`}>መሊቅ እቁብ</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-12">
            <div className="flex items-center gap-10">
               {['Services', 'About', 'Contact'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase()}`} className={`text-[12px] font-bold uppercase tracking-[0.2em] transition-all hover:scale-110 ${scrolled ? 'text-slate-600 hover:text-emerald-700' : 'text-white/90 hover:text-white'}`}>
                     {item}
                  </a>
               ))}
            </div>
            <div className={`h-4 w-px ${scrolled ? 'bg-emerald-900/10' : 'bg-white/30'}`} />
            <Link to="/login" className={`text-[12px] font-bold uppercase tracking-[0.2em] transition-all ${scrolled ? 'text-emerald-900 hover:text-amber-500' : 'text-white hover:text-amber-300'}`}>
              {language === 'am' ? 'ግባ' : 'Login'}
            </Link>
            <Link to="/signup" className={`px-10 py-4 rounded-full font-bold uppercase text-[11px] tracking-widest transition-all hover:scale-105 active:scale-95 ${scrolled ? 'bg-emerald-800 text-white shadow-[0_10px_30px_rgba(6,78,59,0.3)] hover:bg-emerald-900' : 'bg-white text-emerald-900 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:bg-amber-400'}`}>
              {language === 'am' ? 'ጀምር' : 'Get Started'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Slider Section */}
      <section className="relative h-[95vh] min-h-[700px] w-full overflow-hidden bg-emerald-950 rounded-b-[3rem] lg:rounded-b-[5rem] shadow-2xl">
        <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out opacity-100">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-950/60 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-transparent to-transparent z-10" />
          
          <img 
            src={slides[currentSlide]?.image} 
            alt="Ethiopian Landscape" 
            className="w-full h-full object-cover origin-center animate-slow-zoom"
          />
          
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="max-w-[90rem] mx-auto px-6 sm:px-12 w-full pt-20">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-amber-500/20 rounded-full mb-8 border border-amber-500/30 animate-fade-in-up">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[11px] font-black text-amber-200 uppercase tracking-[0.4em]">
                    {language === 'am' ? 'የኢትዮጵያ ኩራት' : 'The Pride of Ethiopia'}
                  </span>
                </div>

                <h1 className={`text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[7rem] text-white font-black tracking-tighter leading-[0.9] mb-6 drop-shadow-2xl ${language === 'am' ? 'font-am' : 'font-display'}`}>
                  {language === 'am' ? slides[currentSlide]?.titleAm : slides[currentSlide]?.titleEn}
                </h1>

                <p className="text-xl md:text-2xl text-emerald-100/90 mb-12 leading-relaxed font-medium max-w-xl border-l-4 border-amber-500 pl-6">
                  {language === 'am' ? slides[currentSlide]?.descAm : slides[currentSlide]?.descEn}
                </p>

                <div className="flex flex-col gap-10">
                  <div className="flex flex-wrap gap-6">
                      <Link to="/signup" className="group relative bg-amber-500 text-emerald-950 px-14 py-5 md:py-6 rounded-full text-[16px] md:text-[18px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-[0_0_40px_rgba(251,191,36,0.6)] border border-amber-300 hover:bg-amber-400 hover:scale-[1.03] transition-all ring-4 ring-amber-500/20">
                          <span>{language === 'am' ? 'አሁኑኑ ጀምር' : 'Start Saving Now'}</span>
                          <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform duration-500 bg-white/20 rounded-full p-1" />
                          <div className="absolute inset-0 rounded-full border-2 border-white/20 scale-105 group-hover:scale-110 transition-transform duration-500 opacity-50" />
                      </Link>
                      
                      <button className="flex items-center gap-4 px-10 py-5 text-white text-[14px] md:text-[15px] font-bold uppercase tracking-[0.2em] border-2 border-emerald-400/50 rounded-full hover:bg-emerald-500/30 transition-all hover:border-emerald-300">
                        <span>{language === 'am' ? 'ተጨማሪ እወቅ' : 'Learn More'}</span>
                      </button>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-12 right-12 z-30 flex flex-col gap-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-1.5 transition-all duration-700 rounded-full ${currentSlide === i ? 'h-16 bg-amber-400' : 'h-6 bg-white/20 hover:bg-white/50'}`}
            />
          ))}
        </div>
      </section>

      {/* Value Proposition */}
      <section id="services" className="py-40 relative z-10 -mt-20">
        <div className="max-w-[90rem] mx-auto px-6 sm:px-12">
          
          <div className="grid lg:grid-cols-3 gap-8">
            {(landingSettings?.customFeatures || [
              { 
                title: "Green Legacy", 
                titleAm: "የአረንጓዴው ራዕይ",
                desc: "Harnessing the power of Ethiopian 'Ekub' with fresh digital precision.", 
                descAm: "ባህላዊውን የእቁብ ስርዓት በዘመናዊ ቴክኖሎጂ አቀናጅተን አቅርበናል።",
                color: "bg-emerald-600",
                shadowColor: "shadow-emerald-600/30",
                icon: "Leaf",
                accent: "text-emerald-600"
              },
              { 
                title: "Golden Standard", 
                titleAm: "የወርቅ ደረጃ",
                desc: "Premium wealth management tools designed for your peace of mind.", 
                descAm: "ለእርስዎ በሚመች መልኩ የተዘጋጀ ከፍተኛ የገንዘብ አስተዳደር ስርዓት።",
                color: "bg-amber-500",
                shadowColor: "shadow-amber-500/40",
                icon: "Star",
                accent: "text-amber-500"
              },
              { 
                title: "Vibrant Growth", 
                titleAm: "ፈጣን እድገት",
                desc: "Real-time tracking and vibrant community analytics for all members.", 
                descAm: "የአባላት የቁጠባ ሒደት እና እድገት በግልጽ የሚገኝበት ስርዓት።",
                color: "bg-rose-600",
                shadowColor: "shadow-rose-600/30",
                icon: "TrendingUp",
                accent: "text-rose-600"
              }
            ]).map((prop: any, i: number) => (
              <div
                key={i}
                className="group relative"
              >
                <div className={`h-full p-10 lg:p-12 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 relative z-10`}>
                  <div className={`absolute -right-10 -top-10 w-40 h-40 ${prop.color} opacity-5 rounded-full group-hover:opacity-10 transition-opacity duration-700`} />
                  
                  <div className={`w-16 h-16 ${prop.color} rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl ${prop.shadowColor} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                    {IconMap[prop.icon] || <Zap size={32} />}
                  </div>
                  
                  <h3 className={`text-2xl font-black text-emerald-950 mb-5 uppercase tracking-tight`}>
                    {language === 'am' ? prop.titleAm : prop.title}
                  </h3>
                  
                  <p className="text-slate-500 leading-relaxed font-medium">
                    {language === 'am' ? prop.descAm : prop.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 bg-white relative border-b border-slate-100 overflow-hidden">
        <div className="max-w-[90rem] mx-auto px-6 sm:px-12">
          <div className="text-center mb-20">
            <span className="text-amber-500 text-[12px] font-black uppercase tracking-[0.5em] mb-4 block">Simple Process</span>
            <h2 className={`text-4xl md:text-6xl font-black text-emerald-950 tracking-tighter ${language === 'am' ? 'font-am' : ''}`}>
              {language === 'am' ? 'መሊቅ እቁብ እንዴት ይሰራል?' : 'How Meliq Ekub Works'}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(landingSettings?.howItWorksSteps || [
              {
                title: "Register",
                titleAm: "ተመዝገቡ",
                desc: "Create your account gracefully and complete verification effortlessly.",
                descAm: "በቀላሉ እና በጥንቃቄ መለያዎን ይፍጠሩ እና ማረጋገጫ ያግኙ።",
                icon: "UserPlus",
                color: "bg-emerald-50 text-emerald-600 border-emerald-100"
              },
              {
                title: "Join a Circle",
                titleAm: "እቁብ ይምረጡ",
                desc: "Find and join a vibrant saving circle that fits your financial goals.",
                descAm: "ከእርስዎ የፋይናንስ አቅም ጋር የሚስማማ ማራኪ እቁብ ይቀላቀሉ።",
                icon: "Layers",
                color: "bg-amber-50 text-amber-500 border-amber-100"
              },
              {
                 title: "Contribute",
                 titleAm: "በወቅቱ ይቆጥቡ",
                 desc: "Make your scheduled payments securely through our advanced platform.",
                 descAm: "ክፍያዎን በተያዘለት ጊዜ ደህንነቱ በተጠበቀ እና እምነት በሚጣልበት መንገድ ይክፈሉ።",
                 icon: "Wallet",
                 color: "bg-rose-50 text-rose-500 border-rose-100"
              },
              {
                 title: "Get Payout",
                 titleAm: "እጣዎትን ይውሰዱ",
                 desc: "Receive your accumulated pool and celebrate financial freedom.",
                 descAm: "የሚጠብቁትን የእጣ ሰዓት በደስታ ይቀበሉ እና ህልምዎን እውን ያድርጉ።",
                 icon: "Gift",
                 color: "bg-blue-50 text-blue-500 border-blue-100"
              }
            ]).map((step: any, i: number) => {
               const Icons: any = { Zap, UserPlus, Layers, Wallet, Gift, ShieldCheck };
               const Icon = Icons[step.icon] || Zap;
               return (
                  <div key={i} className={`bg-white p-8 rounded-[2.5rem] border ${step.color.split(' ')[2]} shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative`}>
                    <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full ${step.color.split(' ')[0]} opacity-10 transition-all`} />
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 group-hover:-rotate-3 shadow-lg ${step.color.split(' ')[0]} ${step.color.split(' ')[1]}`}>
                       <Icon size={28} />
                    </div>
                    <h3 className="text-xl font-black text-emerald-950 mb-4 tracking-tight flex items-center gap-2">
                      <span className="text-slate-300 font-serif text-sm">0{i+1}</span>
                      {language === 'am' ? step.titleAm : step.title}
                    </h3>
                    <p className="text-slate-500 font-medium text-[15px] leading-relaxed relative z-10">
                      {language === 'am' ? step.descAm : step.desc}
                    </p>
                  </div>
               )
            })}
          </div>
        </div>
      </section>

      {/* Premium Equb Categories with Colorful Glow Shadows and Beautiful Imagery */}
      <section className="py-32 bg-[#FAF9F5] relative overflow-hidden">
        {/* Subtle decorative glowing background circles */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-400/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[90rem] mx-auto px-6 sm:px-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
            <div className="max-w-2xl">
              <span className="inline-block px-5 py-2 bg-amber-100 text-amber-800 rounded-full font-black uppercase tracking-[0.4em] text-[10px] mb-6 border border-amber-200/50">
                {language === 'am' ? 'የቁጠባ ዓይነቶች' : 'Vibrant Schemes'}
              </span>
              <h2 className={`text-4xl md:text-5xl lg:text-6xl font-black text-emerald-950 tracking-tighter leading-none ${language === 'am' ? 'font-am' : ''}`}>
                {language === 'am' ? 'የእቁብ ዓይነቶች እና የቁጠባ ዕቅዶች' : 'Our Specialized Equb Schemes'}
              </h2>
            </div>
            <p className="max-w-md text-slate-500 font-medium text-lg border-l-4 border-amber-500 pl-6">
              {language === 'am' 
                ? 'ለእያንዳንዱ የቁጠባ ዓላማ ከተለየ የቀለም-ብርሃን እና የሻዶው አጨራረስ ጋር የተዘጋጁ ማራኪ የእቁብ አማራጮችን እዚህ ያግኙ።'
                : 'Discover unique tailored saving categories decorated with vibrant shadow borders, customized timers, and high-impact visual design.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Dream Home Equb",
                titleAm: "የቤት እቅድ እቁብ",
                tag: "Real Estate",
                tagAm: "ሪል ስቴት",
                desc: "Raise structured capital to build or purchase family real estate without exhausting loans.",
                descAm: "ያለ ከፍተኛ የባንክ ወለድ የዕቅዶትን የመኖሪያ ቤት ለመገንባት ወይም ለመግዛት የሚያስችል አስተማማኝ እቁብ።",
                img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
                icon: <Home size={22} />,
                glowColor: "group-hover:shadow-[0_30px_60px_-10px_rgba(16,185,129,0.3)]",
                borderColor: "border-emerald-100/50 group-hover:border-emerald-500/40",
                accentColor: "text-emerald-600",
                badgeBg: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
                iconBg: "bg-emerald-50 text-emerald-600",
                stats: [
                  { labelAm: "ክፍያ", labelEn: "Cycles", value: "Monthly" },
                  { labelAm: "ዓይነት", labelEn: "Category", value: "Property" }
                ],
                tagColor: "from-emerald-600 to-teal-500"
              },
              {
                title: "Business Growth",
                titleAm: "የንግድና ስራ እቁብ",
                tag: "Seed Capital",
                tagAm: "ጅማሬ ካፒታል",
                desc: "Accelerate your restaurant, tech development, or import venture with seamless seed funds.",
                descAm: "ለንግድ ስራ ማስፋፊያ፣ ጥሬ እቃ መግዣ ወይም ለአዲስ ስራዎች መጀመሪያ ፈጣን ካፒታል ማሰባሰቢያ እቁብ።",
                img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800",
                icon: <Briefcase size={22} />,
                glowColor: "group-hover:shadow-[0_30px_60px_-10px_rgba(245,158,11,0.35)]",
                borderColor: "border-amber-100/50 group-hover:border-amber-500/40",
                accentColor: "text-amber-600",
                badgeBg: "bg-amber-500/10 text-amber-700 border-amber-500/20",
                iconBg: "bg-amber-50 text-amber-600",
                stats: [
                  { labelAm: "ክፍያ", labelEn: "Cycles", value: "Bi-weekly" },
                  { labelAm: "ዓይነት", labelEn: "Category", value: "Commercial" }
                ],
                tagColor: "from-amber-500 to-orange-400"
              },
              {
                title: "Automobile & Transit",
                titleAm: "የመኪና መግዣ እቁብ",
                tag: "Transport",
                tagAm: "ተሽከርካሪ",
                desc: "Upgrade or acquire commercial vehicles or personal transport under certified escrow guidance.",
                descAm: "የመኪና ባለቤት ለመሆን ወይም ለድርጅትዎ የትራንስፖርት አገልግሎት የሚሆኑ ተሽከርካሪዎችን ለመግዛት።",
                img: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800",
                icon: <Layers size={22} />,
                glowColor: "group-hover:shadow-[0_30px_60px_-10px_rgba(59,130,246,0.3)]",
                borderColor: "border-blue-100/50 group-hover:border-blue-500/40",
                accentColor: "text-blue-600",
                badgeBg: "bg-blue-500/10 text-blue-700 border-blue-500/20",
                iconBg: "bg-blue-50 text-blue-600",
                stats: [
                  { labelAm: "ክፍያ", labelEn: "Cycles", value: "Monthly" },
                  { labelAm: "ዓይነት", labelEn: "Category", value: "Transit" }
                ],
                tagColor: "from-blue-600 to-cyan-500"
              },
              {
                title: "Lifestyle & Safety",
                titleAm: "የዕለት ኑሮ እቁብ",
                tag: "Micro Savings",
                tagAm: "ፈጣን ቁጠባ",
                desc: "Covers crucial event planning, school tuitions, wedding support, or micro emergency funds.",
                descAm: "ለያንዴ ዝግጅቶች፣ ለልጆች የትምህርት ቤት ክፍያ፣ ለሰርግ ወይም ለአይነተኛ ፈጣን ጉዳዮች።",
                img: "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&q=80&w=800",
                icon: <Sparkles size={22} />,
                glowColor: "group-hover:shadow-[0_30px_60px_-10px_rgba(168,85,247,0.3)]",
                borderColor: "border-purple-100/50 group-hover:border-purple-500/40",
                accentColor: "text-purple-600",
                badgeBg: "bg-purple-500/10 text-purple-700 border-purple-500/20",
                iconBg: "bg-purple-50 text-purple-600",
                stats: [
                  { labelAm: "ክፍያ", labelEn: "Cycles", value: "Weekly" },
                  { labelAm: "ዓይነት", labelEn: "Category", value: "Lifestyle" }
                ],
                tagColor: "from-purple-600 to-pink-500"
              }
            ].map((plan: any, idx: number) => (
              <div 
                key={idx}
                className="group relative cursor-pointer"
              >
                {/* Visual hover color backglow */}
                <div className={`absolute inset-0 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white z-0 ${plan.glowColor}`} />

                {/* Main Card container */}
                <div className={`h-full bg-white relative rounded-[2.5rem] border ${plan.borderColor} p-6 shadow-[0_15px_40px_rgba(0,0,0,0.02)] transition-all duration-500 hover:-translate-y-2 z-10 flex flex-col justify-between overflow-hidden`}>
                  
                  <div>
                    {/* Picture Header with Gradient Overlay */}
                    <div className="relative h-48 w-full rounded-[1.8rem] overflow-hidden mb-6">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                      <img 
                        src={plan.img} 
                        alt={plan.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        referrerPolicy="no-referrer"
                      />
                      {/* Colorful Floating Badge Tag */}
                      <span className={`absolute top-4 left-4 z-20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r shadow-md ${plan.tagColor}`}>
                        {language === 'am' ? plan.tagAm : plan.tag}
                      </span>
                    </div>

                    {/* Icon + Title Block */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan.iconBg} font-bold shadow-sm`}>
                        {plan.icon}
                      </div>
                      <h3 className={`text-xl font-black text-emerald-950 tracking-tight`}>
                        {language === 'am' ? plan.titleAm : plan.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-slate-500 text-[14px] leading-relaxed font-semibold mb-6">
                      {language === 'am' ? plan.descAm : plan.desc}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100/80 pt-5 mt-auto">
                    {/* Stats Layout */}
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      {plan.stats.map((stat: any, sIdx: number) => (
                        <div key={sIdx} className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                            {language === 'am' ? stat.labelAm : stat.labelEn}
                          </span>
                          <span className={`text-[12px] font-black ${plan.accentColor}`}>
                            {stat.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Highly interactive visual link indicating action */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-emerald-800 transition-colors">
                        {language === 'am' ? 'ዝርዝር እይ' : 'Explore Scheme'}
                      </span>
                      <div className={`w-8 h-8 rounded-full ${plan.iconBg} flex items-center justify-center group-hover:scale-110 group-hover:translate-x-1 transition-all`}>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Digital Advantage (Bento Items) */}
      <section id="about" className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-[90rem] mx-auto px-6 sm:px-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
             <div className="max-w-2xl">
                <span className="inline-block px-5 py-2 bg-emerald-100 text-emerald-800 rounded-full font-black uppercase tracking-[0.4em] text-[10px] mb-6 border border-emerald-200/50">Our Edge</span>
                <h2 className={`text-4xl md:text-6xl font-black text-emerald-950 tracking-tighter leading-tight ${language === 'am' ? 'font-am' : ''}`}>
                   {language === 'am' ? 'ለምን መሊቅ እቁብን ይመርጣሉ?' : 'The Digital Ekub Advantage'}
                </h2>
             </div>
             <p className="max-w-md text-slate-500 font-medium text-lg border-l-4 border-emerald-500 pl-6">
                {language === 'am' 
                  ? 'ቴክኖሎጂን ከባህል ጋር አቀናጅተን ለሁላችሁም ተደራሽ እና እምነት የሚጣልበት የእቁብ አገልግሎት እናቀርባለን።'
                  : 'We blend deep-rooted tradition with cutting-edge technology to create a seamless saving experience for everyone.'}
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {(landingSettings?.footerInfoItems || [
               { title: "Instant Payouts", titleAm: "ፈጣን ክፍያ", icon: "Zap", color: "from-amber-400 to-amber-600", slug: 'Payments' },
               { title: "Member Verification", titleAm: "አባላት ማረጋገጫ", icon: "ShieldCheck", color: "from-emerald-400 to-emerald-600", slug: 'Security Guide' },
               { title: "Smart Analytics", titleAm: "ብልህ ትንተና", icon: "BarChart3", color: "from-blue-400 to-blue-600", slug: 'Stories' },
               { title: "Auto-Reminders", titleAm: "አውቶማቲክ ማሳሰቢያ", icon: "Clock", color: "from-rose-400 to-rose-600", slug: 'Help Center' },
               { title: "Low Fees", titleAm: "ዝቅተኛ ክፍያ", icon: "Award", color: "from-purple-400 to-purple-600", slug: 'About Us' },
               { title: "Dedicated Support", titleAm: "የማይቋረጥ ድጋፍ", icon: "Phone", color: "from-indigo-400 to-indigo-600", slug: 'Help Center' }
             ]).map((card: any, i: number) => (
               <div key={i} className="group relative cursor-pointer" onClick={() => handleFooterClick(card.slug || card.title)}>
                  <div className={`h-full p-10 rounded-[3rem] bg-white border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden`}>
                     <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.color || 'from-emerald-400 to-emerald-600'} flex items-center justify-center text-white mb-8 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                        {IconMap[card.icon] || <Zap size={32} />}
                     </div>
                     <h3 className={`text-2xl font-black text-emerald-950 mb-4 tracking-tight ${language === 'am' ? 'font-am' : ''}`}>
                        {language === 'am' ? (card.titleAm || card.am) : card.title}
                     </h3>
                     <p className="text-slate-500 font-medium">The best digital tools to manage your Ekub cycles efficiently and securely.</p>
                  </div>
               </div>
             ))}
          </div>

          <div className="mt-24 order-1 lg:order-2 grid lg:grid-cols-2 gap-24 items-center">
             <div className="relative z-10 w-full">
                <span className="inline-flex items-center gap-3 px-5 py-2 bg-emerald-50 rounded-full mb-8 border border-emerald-100 font-black uppercase tracking-[0.3em] text-emerald-700 text-[11px]">
                   {language === 'am' ? 'ከባህል የመነጨ' : 'Rooted in Tradition'}
                </span>
                <h2 className={`text-4xl md:text-5xl lg:text-6xl font-black text-emerald-950 mb-8 tracking-tighter leading-[1.2] ${language === 'am' ? 'font-am' : ''}`}>
                  {language === 'am' ? 'የአባቶቻችንን የቁጠባ ጥበብ፣ በዘመናዊ ገጽታ አስውበን አቅርበናል' : 'Honoring the Past, Building the Future'}
                </h2>
                <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
                  {language === 'am' 
                    ? 'የኢትዮጵያን ባህላዊ የእቁብ ስርዓት ወስደን በዘመናዊ ቴክኖሎጂ አማካኝነት ደህንነቱ የተጠበቀ፣ ግልጽ እና ምቹ አድርገን አቅርበናል።'
                    : 'We took the traditional Ethiopian Ekub system and modernized it to deliver a highly secure, completely transparent, and beautifully convenient saving experience.'}
                </p>
             </div>

             <div className="relative bg-[#081a12] p-8 md:p-10 rounded-[3rem] shadow-xl text-white">
                <div className="space-y-4">
                    {[
                        { en: 'New Member Registered', am: 'አዲስ አባል ተመዘገቡ', info: 'Just now' },
                        { en: 'Safe Transaction', am: 'አስተማማኝ ክፍያ', info: 'Bank integration' }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-5 p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40">
                            <div className="w-12 h-12 bg-emerald-900 rounded-full flex items-center justify-center text-amber-500 ring-1 ring-emerald-800">
                                <Award size={20} />
                            </div>
                            <div className="flex-1">
                                <h5 className="text-white font-bold text-[15px]">{language === 'am' ? item.am : item.en}</h5>
                                <p className="text-emerald-500 text-[12px] uppercase">{item.info}</p>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative flex items-center justify-center m-6 lg:m-12 rounded-[3rem] lg:rounded-[4rem] bg-emerald-900 overflow-hidden shadow-lg">
         <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className={`text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[1.1] mb-8 md:mb-12 ${language === 'am' ? 'font-am' : ''}`}>
               {language === 'am' ? 'ዛሬውኑ ይቀላቀሉን' : 'READY TO START YOUR JOURNEY?'}
            </h2>
            <p className="text-xl md:text-2xl text-emerald-100 mb-16 max-w-2xl mx-auto font-medium">
               {language === 'am' ? 'ቁጠባዎን በማሳደግ የነገ ህልምዎን እውን ያድርጉ።' : 'Join thousands of members who are already building their financial future with Meliq Ekub.'}
            </p>
            <Link to="/signup" className="inline-flex items-center gap-6 bg-amber-400 text-emerald-950 px-14 py-6 rounded-full text-[14px] font-black uppercase tracking-[0.3em] shadow-lg hover:scale-105 transition-all">
               <span>{language === 'am' ? 'አሁን ይቀላቀሉ' : 'Join Now'}</span>
               <ArrowRight size={22} className="bg-emerald-950/20 rounded-full p-1" />
            </Link>
         </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#0f2118] pt-20 pb-10 text-emerald-50 mt-12 relative border-t-8 border-amber-500 shadow-xl overflow-hidden">
         <div className="max-w-[90rem] mx-auto px-6 sm:px-12 relative z-10">
            <div className="grid md:grid-cols-12 gap-16 mb-20">
               <div className="col-span-12 lg:col-span-4">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-16 h-16 bg-emerald-800 rounded-3xl flex items-center justify-center text-amber-500 shadow-xl ring-1 ring-emerald-700">
                        <Leaf size={32} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-4xl font-black tracking-tighter uppercase text-white">
                           {landingSettings?.footerBrandName || 'Meliq Ekub'}
                        </span>
                        <span className="text-xs font-bold tracking-[0.3em] text-emerald-500 uppercase">Premium Savings</span>
                     </div>
                  </div>
                  <p className="text-xl text-emerald-100/60 font-medium leading-relaxed mb-10 max-w-md">
                     {language === 'am' 
                        ? (landingSettings?.footerDescriptionAm || 'የአባቶቻችንን የቁጠባ ባህል ወደ ዲጂታል ዓለም በማሸጋገር ማህበረሰባችንን በአስተማማኝ መሠረት ላይ እናበለጽጋለን።')
                        : (landingSettings?.footerDescription || 'Revolutionizing the traditional culture of saving through digital excellence and unparalleled community trust.')}
                  </p>
                  
                  <div className="flex gap-4">
                     {(landingSettings?.socialLinks || [
                        { platform: 'Facebook', url: '#' },
                        { platform: 'Twitter', url: '#' },
                        { platform: 'Instagram', url: '#' },
                        { platform: 'LinkedIn', url: '#' }
                     ]).map((link: any, i: number) => {
                        const IconMap: any = { Facebook, Twitter, Instagram, LinkedIn: Linkedin, GitHub: Github, Youtube: Youtube, TikTok: Music };
                        const Icon = IconMap[link.platform] || Globe;
                        return (
                          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-2xl bg-emerald-900 flex items-center justify-center text-emerald-400 hover:bg-amber-400 hover:text-emerald-950 transition-all shadow-lg ring-1 ring-emerald-800">
                            <Icon size={20} />
                          </a>
                        );
                     })}
                  </div>
               </div>
               
               <div className="col-span-12 lg:col-span-8 flex flex-wrap gap-12 gap-y-20 lg:justify-between">
                  {(landingSettings?.footerSections || [
                    {
                      title: 'Quick Links',
                      titleAm: 'ፈጣን አገናኞች',
                      links: [
                        { am: 'ስለ እኛ', label: 'About Us', slug: 'About Us' },
                        { am: 'አገልግሎቶቻችን', label: 'Services', slug: 'Services' },
                        { am: 'የደንበኞች አስተያየት', label: 'Stories', slug: 'Stories' },
                        { am: 'የክፍያ አማራጮች', label: 'Payments', slug: 'Payments' }
                      ]
                    },
                    {
                      title: 'Resources',
                      titleAm: 'ጠቃሚ መረጃዎች',
                      links: [
                        { am: 'የግላዊነት መመሪያ', label: 'Privacy Policy', slug: 'Privacy Policy' },
                        { am: 'ውልና ደንቦች', label: 'Terms & Conditions', slug: 'Terms & Conditions' },
                        { am: 'የደህንነት መመሪያ', label: 'Security Guide', slug: 'Security Guide' },
                        { am: 'እርዳታ ለማግኘት', label: 'Help Center', slug: 'Help Center' }
                      ]
                    }
                  ]).map((section: any, sIdx: number) => (
                    <div key={sIdx} className="min-w-[160px]">
                      <h4 className="text-sm font-black text-white uppercase tracking-[0.4em] mb-8 pb-4 border-b border-emerald-800">
                         {language === 'am' ? section.titleAm : section.title}
                      </h4>
                      <ul className="space-y-6">
                        {section.links.map((link: any, lIdx: number) => (
                           <li key={lIdx}>
                              <button 
                                onClick={() => handleFooterClick(link.slug || link.label)}
                                className="text-emerald-100/50 hover:text-amber-400 transition-all font-bold text-lg flex items-center gap-2 group"
                              >
                                 <ChevronRight size={16} className="text-amber-500 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                 {language === 'am' ? link.am : link.label}
                              </button>
                           </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <div className="min-w-[240px]">
                    <h4 className="text-sm font-black text-white uppercase tracking-[0.4em] mb-8 pb-4 border-b border-emerald-800">
                       {language === 'am' ? 'ያግኙን' : 'Contact Us'}
                    </h4>
                    <div className="space-y-6">
                       <a href={`mailto:${landingSettings?.footerEmail || 'support@melikekub.com'}`} className="flex items-start gap-4 group">
                          <div className="w-12 h-12 rounded-xl bg-emerald-900 flex items-center justify-center text-amber-500 group-hover:bg-amber-400 group-hover:text-emerald-950 transition-all flex-shrink-0">
                             <Mail size={18} />
                          </div>
                          <div>
                             <p className="text-emerald-100/40 text-xs font-black uppercase mb-1">Email Us</p>
                             <p className="text-emerald-50 font-bold">{landingSettings?.footerEmail || 'support@melikekub.com'}</p>
                          </div>
                       </a>
                       <a href={`tel:${landingSettings?.footerPhone || '+251 911 234 567'}`} className="flex items-start gap-4 group">
                          <div className="w-12 h-12 rounded-xl bg-emerald-900 flex items-center justify-center text-amber-500 group-hover:bg-amber-400 group-hover:text-emerald-950 transition-all flex-shrink-0">
                             <Phone size={18} />
                          </div>
                          <div>
                             <p className="text-emerald-100/40 text-xs font-black uppercase mb-1">Call Us</p>
                             <p className="text-emerald-50 font-bold">{landingSettings?.footerPhone || '+251 911 234 567'}</p>
                          </div>
                       </a>
                    </div>
                  </div>
               </div>
            </div>
            
            <div className="pt-10 border-t border-emerald-800 flex flex-col md:flex-row justify-between items-center gap-8">
               <p className="text-emerald-100/30 text-sm font-medium">
                  © {new Date().getFullYear()} {landingSettings?.footerBrandName || 'Meliq Ekub'}. All rights reserved under Ethiopian Law.
               </p>
               <div className="flex items-center gap-8">
                  <Heart className="text-rose-500 animate-pulse" size={16} />
                  <span className="text-emerald-100/30 text-sm font-medium tracking-widest uppercase">Built with Pride in Addis</span>
               </div>
            </div>
         </div>
      </footer>

      {/* Info Modal */}
      {activeInfo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-md" onClick={() => setActiveInfo(null)} />
          <div className="relative bg-[#FAFAF8] w-full max-w-lg rounded-[3rem] p-10 shadow-2xl border border-emerald-900/10 animate-scale-in">
            <button onClick={() => setActiveInfo(null)} className="absolute top-8 right-8 text-slate-400 hover:text-emerald-900"><ArrowRight className="rotate-45" size={24} /></button>
            <div className="mb-8 items-center flex gap-4">
               <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-800"><Leaf size={28} /></div>
               <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-amber-600 mb-1">Information Guide</h4>
                  <h3 className={`text-2xl font-black text-emerald-950 tracking-tight ${language === 'am' ? 'font-am' : ''}`}>
                    {language === 'am' ? activeInfo.titleAm : activeInfo.title}
                  </h3>
               </div>
            </div>
            <p className={`text-lg text-slate-600 leading-relaxed font-medium mb-10 ${language === 'am' ? 'font-am leading-loose' : ''}`}>
              {language === 'am' ? activeInfo.contentAm : activeInfo.content}
            </p>
            <button onClick={() => setActiveInfo(null)} className="w-full bg-emerald-800 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-emerald-900 transition-all">
              {language === 'am' ? 'ዝጋ' : 'Close Guide'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
