import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';
import { Lightbulb, Quote, Share2, Copy, CheckCircle } from 'lucide-react';

export default function Inspiration() {
  const { t, language } = useLanguage();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const quotes = [
    {
      id: 1,
      am: "ዕቁብ መጣል የነገን ብሩህ ተስፋ ለመገንባት አንዱ እና ትልቁ መሰረት ነው::",
      en: "Saving today through Ekub is the strongest foundation for building a brighter tomorrow.",
      author: `የ${t('common.appName').split(' ')[0]} አባላት (${t('common.appName').split(' ')[0]} Members)`
    },
    {
      id: 2,
      am: "ብልህ ሰው ካገኘው ላይ ከመጠቀም ይልቅ ለነገው የሚያስቀምጠውን ያስቀድማል።",
      en: "A wise person prioritizes setting aside for tomorrow before spending what they earn today.",
      author: t('traditional_wisdom') || "Traditional Wisdom"
    },
    {
      id: 3,
      am: "ከትንሽ ጅማሬ ትልቅ ለውጥ ይመጣል፤ አብሮነትህ ሀይልህ ነው::",
      en: "Great change comes from small beginnings; your togetherness is your strength.",
      author: t('hope') || "Hope"
    },
    {
      id: 4,
      am: "ትዕግስት እና ተከታታይነት በፋይናንስ ስኬት ውስጥ ቁልፍ ነገሮች ናቸው።",
      en: "Patience and consistency are the key elements in financial success.",
      author: t('advice') || "Advice"
    }
  ];

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl mb-12">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center text-amber-400 border border-white/10 shadow-2xl">
            <Lightbulb size={48} />
          </div>
          <div>
            <h2 className="text-4xl font-display font-black tracking-tighter uppercase mb-4">
              {language === 'am' ? 'ምክር እና አነቃቂ' : 'Inspiration & Advice'}
            </h2>
            <p className="text-slate-400 font-medium max-w-xl text-sm leading-relaxed">
              {language === 'am' 
                ? 'በዕለታዊ ህይወትዎ ውስጥ ሊያግዙዎት የሚችሉ የፋይናንስ አስተዳደር ምክሮች እና አነቃቂ አባባሎች።' 
                : 'Financial management tips and motivational quotes to boost your daily life.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {quotes.map((quote, idx) => (
          <motion.div 
            key={quote.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-10 bg-white rounded-[3.5rem] border border-slate-100 shadow-xl relative overflow-hidden group hover:shadow-2xl hover:-translate-y-2 transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[4rem] group-hover:bg-amber-100 transition-all translate-x-2 -translate-y-2 flex items-center justify-center">
              <Quote size={40} className="text-amber-200 -ml-8 mt-8 opacity-50" />
            </div>
            
            <div className="relative z-10 space-y-6">
               <p className="text-lg md:text-xl font-bold text-slate-800 leading-loose">
                 "{language === 'am' ? quote.am : quote.en}"
               </p>
               <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                        {quote.author.charAt(0)}
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{quote.author}</span>
                  </div>
                  <button 
                    onClick={() => handleCopy(language === 'am' ? quote.am : quote.en, quote.id)}
                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                  >
                    {copiedId === quote.id ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
