import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';
import { Share2, QrCode as QRIcon, CheckCircle, Copy, Facebook, Smartphone, Send, Gift, Award, Mail, MessageCircle, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from './FirebaseProvider';
import * as htmlToImage from 'html-to-image';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export default function ShareApp() {
  const { t, language } = useLanguage();
  const { userData, isAdmin } = useAuth();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [editedLink, setEditedLink] = useState('');
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [isSavingLink, setIsSavingLink] = useState(false);
  
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const link = docSnap.data().shareLink || '';
        setShareLink(link);
        setEditedLink(link);
      }
    }, (error) => {
      console.error("Error listening to settings:", error);
    });
    return () => unsub();
  }, []);

  const handleSaveShareLink = async () => {
    setIsSavingLink(true);
    try {
      await setDoc(doc(db, 'system_settings', 'main'), {
        shareLink: editedLink.trim()
      }, { merge: true });
      setShareLink(editedLink.trim());
      setIsEditingLink(false);
      alert(language === 'am' ? 'የማጋሪያ ሊንክ በተሳካ ሁኔታ ተቀይሯል!' : 'Sharing link updated successfully!');
    } catch (e) {
      console.error("Error saving sharing link:", e);
      alert(language === 'am' ? 'ሊንኩን ለመቀየር አልተሳካም!' : 'Failed to update sharing link!');
    } finally {
      setIsSavingLink(false);
    }
  };
  
  // Create a personalized sharing URL
  const baseUrl = shareLink || window.location.origin;
  const refCode = userData?.memberCode || (isAdmin ? 'ADMIN' : '');
  const appUrl = refCode ? `${baseUrl}?ref=${refCode}` : baseUrl;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(refCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareTextAm = isAdmin 
    ? `${t('common.appName')}ን አሁኑኑ ይቀላቀሉ! አስተማማኝ እና ዘመናዊ የቁጠባ ስርዓት! ሊንኩን ተጭነው ይጎብኙን፡`
    : `${t('common.appName')}ን ይቀላቀሉ! የእኔን መጋበዣ ኮድ (${refCode}) በመጠቀም ልዩ ተጠቃሚ ይሁኑ! ሊንክ፡`;
    
  const shareTextEn = isAdmin
    ? `Join ${t('common.appName')} today! A trustworthy and modern saving system! Click link to visit:`
    : `Join ${t('common.appName')}! Use my referral code (${refCode}) to get started! Link:`;

  const shareText = language === 'am' ? shareTextAm : shareTextEn;

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(shareText + ' ' + appUrl);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };
  
  const shareViaTelegram = () => {
    const url = encodeURIComponent(appUrl);
    const text = encodeURIComponent(shareText);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const shareViaSMS = () => {
    const body = encodeURIComponent(shareText + ' ' + appUrl);
    window.open(`sms:?body=${body}`, '_blank');
  };

  const downloadQR = () => {
    const qrEl = document.getElementById('share-qr-code-final');
    if (qrEl) {
      htmlToImage.toPng(qrEl).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `Meliq-QR-${refCode || 'App'}.png`;
        link.href = dataUrl;
        link.click();
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="pb-24 max-w-4xl mx-auto space-y-4 md:space-y-6 px-4"
    >
      {/* Compact Hero Header */}
      <div className="bg-slate-900 rounded-[2rem] p-6 md:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/15 to-purple-500/10 pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-48 md:w-72 h-48 md:h-72 bg-blue-500/10 rounded-full blur-[60px] md:blur-[100px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-5 md:gap-8">
          <div className="w-16 md:w-20 h-16 md:h-20 bg-white/10 backdrop-blur-xl rounded-2xl md:rounded-3xl flex items-center justify-center border border-white/20 shadow-inner group">
            <Share2 size={24} className="md:w-10 md:h-10 group-hover:scale-110 transition-transform duration-500" />
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl md:text-4xl font-display font-black tracking-tight mb-2 leading-none">
              {language === 'am' ? 'ወዳጅዎን ይጋብዙ' : 'Invite Friends'}
            </h2>
            <p className="text-slate-400 font-medium text-xs md:text-base max-w-xl leading-relaxed">
              {language === 'am' 
                ? `${t('common.appName')}ን ለጓደኛዎ እና ለቤተሰብዎ በማጋራት አብረው ለማደግ እና ለጋራ ተጠቃሚነት የራስዎን አስተዋፅኦ ያበርክቱ።` 
                : `Share ${t('common.appName')} with friends and family to grow together and unlock mutual benefits.`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Left Column: Code & Socials */}
        <div className="lg:col-span-5 space-y-4 md:space-y-6">
          {/* Referral Code Card - More Compact */}
          {refCode && (
            <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-lg p-6 flex flex-col h-full relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-amber-100 transition-colors" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-4 shadow-sm">
                  <Gift size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {language === 'am' ? 'የመጋበዣ ኮድ' : 'Referral Code'}
                </h3>
              </div>
              
              <div className="mt-4 space-y-4 relative z-10">
                <div className="bg-slate-50 border border-slate-200 p-1.5 pl-5 rounded-2xl flex items-center gap-2 group/code shadow-inner">
                  <span className="flex-1 font-mono font-black text-xl text-slate-900 tracking-[0.15em] truncate">
                    {refCode}
                  </span>
                  <button 
                    onClick={handleCopyCode}
                    className="w-10 h-10 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center shadow-md active:scale-90"
                  >
                    {copiedCode ? <CheckCircle size={18} className="text-emerald-400" /> : <Copy size={18} />}
                  </button>
                </div>

                <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                    <Award size={16} />
                  </div>
                  <p className="text-[10px] md:text-xs font-bold text-slate-600 leading-tight">
                    {language === 'am' ? 'በእርስዎ ኮድ የተመዘገቡ አባላት ልዩ ማበረታቻ ያገኛሉ።' : 'Members joining with your code receive special platform benefits.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Social Platforms - Compact Buttons */}
          <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-lg p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Share2 size={16} className="text-slate-400" /> {language === 'am' ? 'በማህበራዊ ሚዲያ' : 'Quick Share'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
               <button onClick={shareViaTelegram} className="flex items-center justify-center gap-2 py-3 px-2 bg-[#26A5E4]/5 text-[#26A5E4] hover:bg-[#26A5E4] hover:text-white rounded-xl transition-all font-bold text-[11px]">
                  <Send size={14} /> Telegram
               </button>
               <button onClick={shareViaWhatsApp} className="flex items-center justify-center gap-2 py-3 px-2 bg-[#25D366]/5 text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-xl transition-all font-bold text-[11px]">
                  <MessageCircle size={14} /> WhatsApp
               </button>
               <button onClick={shareViaSMS} className="flex items-center justify-center gap-2 py-3 px-2 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded-xl transition-all font-bold text-[11px]">
                  <Smartphone size={14} /> SMS
               </button>
               <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`, '_blank')} className="flex items-center justify-center gap-2 py-3 px-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all font-bold text-[11px]">
                  <Facebook size={14} /> Facebook
               </button>
            </div>
          </div>
        </div>

        {/* Right Column: Link & QR */}
        <div className="lg:col-span-7 space-y-4 md:space-y-6">
          {/* Link Section - Reduced Padding */}
          <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-lg p-6 md:p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full blur-[60px] -mr-24 -mt-24 opacity-50" />
             
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">
                    /
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 leading-none mb-1">
                      {language === 'am' ? 'የመጋበዣ ሊንክ' : 'Referral Link'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Dynamic URL with code</p>
                  </div>
               </div>

               <div className="bg-slate-900 rounded-2xl p-2.5 flex flex-col md:flex-row items-center gap-2.5 shadow-xl">
                 <div className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-lg overflow-hidden w-full min-w-0">
                   <p className="text-[10px] md:text-xs font-mono text-indigo-100/70 truncate">
                     {appUrl}
                   </p>
                 </div>
                 <button 
                   onClick={handleCopyUrl}
                   className="w-full md:w-auto px-6 py-3.5 bg-white text-slate-900 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
                 >
                   {copiedUrl ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                   {copiedUrl ? (language === 'am' ? 'ተቀድቷል' : 'Copied!') : (language === 'am' ? 'ቅዳ' : 'Copy')}
                 </button>
               </div>
             </div>
          </div>

          {/* Admin Configured Base URL */}
           {isAdmin && (
             <div className="bg-amber-50 rounded-[1.5rem] border border-amber-200/50 p-6 shadow-sm relative overflow-hidden mb-6">
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-9 h-9 bg-amber-500 text-white rounded-xl flex items-center justify-center font-bold shadow-md">
                     <Share2 size={16} />
                   </div>
                   <div>
                     <h4 className="text-sm font-black text-slate-900 leading-tight">
                       {language === 'am' ? 'የማጋሪያ ሊንክ ማስተካከያ (አድሚን)' : 'Edit Sharing Link (Admin)'}
                     </h4>
                     <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                       {language === 'am' ? 'ለአባላት ማጋሪያ የሚሆን አዲስ ሊንክ እዚህ ያስገቡ' : 'Configure the sharing base domain for members.'}
                     </p>
                   </div>
                 </div>

                 {isEditingLink ? (
                   <div className="space-y-3">
                     <input
                       type="text"
                       value={editedLink}
                       onChange={(e) => setEditedLink(e.target.value)}
                       placeholder="https://example.com"
                       className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                     />
                     <div className="flex gap-2">
                       <button
                         onClick={handleSaveShareLink}
                         disabled={isSavingLink}
                         className="flex-1 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                       >
                         {isSavingLink ? '...' : (language === 'am' ? 'አስቀምጥ' : 'Save')}
                       </button>
                       <button
                         onClick={() => {
                           setEditedLink(shareLink || '');
                           setIsEditingLink(false);
                         }}
                         className="px-4 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-xs font-bold transition-all"
                       >
                         {language === 'am' ? 'ሰርዝ' : 'Cancel'}
                       </button>
                     </div>
                   </div>
                 ) : (
                   <div className="flex items-center justify-between bg-white border border-amber-200/20 p-3.5 rounded-2xl shadow-sm">
                     <div className="truncate pr-4">
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                         {language === 'am' ? 'የአሁኑ ሊንክ' : 'Current Configured Link'}
                       </p>
                       <p className="text-xs font-mono text-slate-700 font-semibold truncate">
                         {shareLink || (language === 'am' ? 'አልተዋቀረም (ከተማ ዌብሳይት)' : 'None (Using default origin)')}
                       </p>
                     </div>
                     <button
                       onClick={() => setIsEditingLink(true)}
                       className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0 active:scale-95 shadow-sm"
                     >
                       {language === 'am' ? 'ቀይር' : 'Edit'}
                     </button>
                   </div>
                 )}
                 {/* Information Notice */}
                 <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-wide">
                   {language === 'am' 
                     ? 'ማሳሰቢያ፡ እዚህ የቀየሩት ሊንክ ለአባሎች ጋር ያጋሩ በተን ላይ ወዲያውኑ ይንጸባረቃል።' 
                     : 'Note: Changing this domain will immediately update the share link for all members.'}
                 </p>
               </div>
             </div>
           )}

           {/* QR Code Section - More Efficient Layout */}
          <div className="bg-slate-50 rounded-[1.5rem] border border-slate-200 overflow-hidden flex flex-col sm:flex-row shadow-sm">
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-4">
                <QRIcon size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 leading-none">
                {language === 'am' ? 'የባርኮድ መጋበዣ' : 'QR Scan'}
              </h3>
              <p className="text-slate-600 text-[11px] font-medium leading-relaxed mb-6 max-w-[200px]">
                {language === 'am' 
                  ? 'ይህንን ባርኮድ ለጓደኛዎ በማሳየት በቀላሉ እንዲመዘገቡ ያድርጉ።' 
                  : 'Display this QR to friends for instant scanning and signup.'}
              </p>
              
              <button 
                onClick={downloadQR}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-800 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm group active:scale-95 w-fit"
              >
                <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                {language === 'am' ? 'አውርድ' : 'Download'}
              </button>
            </div>

            <div className="p-6 md:p-8 bg-white flex items-center justify-center border-l border-slate-200">
               <div className="relative group">
                 <div className="absolute -inset-3 bg-slate-100 rounded-[1.5rem] scale-95 group-hover:scale-100 transition-transform duration-500" />
                 <div 
                   id="share-qr-code-final" 
                   className="bg-white p-4 rounded-[1.2rem] shadow-lg relative z-10 border border-slate-100"
                 >
                   <QRCode 
                     value={appUrl} 
                     size={140} 
                     level="H" 
                     fgColor="#0f172a" 
                     bgColor="#ffffff" 
                     className="w-full h-full max-w-[120px] md:max-w-[140px]"
                   />
                   <div className="mt-2 pt-2 border-t border-slate-50 text-center">
                     <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                       Meliq
                     </span>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>

  );
}
