import React from 'react';
import { Camera } from 'lucide-react';

export const ProfileEditFields = ({ profileForm, setProfileForm, isEditingProfile, language, userData }: { 
  profileForm: any, 
  setProfileForm: any, 
  isEditingProfile: boolean, 
  language: string,
  userData: any
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'am' ? 'ክልል' : 'Region'}</label>
          <input type="text" disabled={!isEditingProfile} value={isEditingProfile ? profileForm.addressRegion : (userData.addressRegion || '')} onChange={(e) => setProfileForm({...profileForm, addressRegion: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'am' ? 'ዞን' : 'Zone'}</label>
          <input type="text" disabled={!isEditingProfile} value={isEditingProfile ? profileForm.addressZone : (userData.addressZone || '')} onChange={(e) => setProfileForm({...profileForm, addressZone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'am' ? 'ወረዳ' : 'Woreda'}</label>
          <input type="text" disabled={!isEditingProfile} value={isEditingProfile ? profileForm.addressWoreda : (userData.addressWoreda || '')} onChange={(e) => setProfileForm({...profileForm, addressWoreda: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'am' ? 'ቀበሌ' : 'Kebele'}</label>
          <input type="text" disabled={!isEditingProfile} value={isEditingProfile ? profileForm.addressKebele : (userData.addressKebele || '')} onChange={(e) => setProfileForm({...profileForm, addressKebele: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700" />
        </div>
      </div>
      
      {isEditingProfile && (
        <div className="space-y-4">
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
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'am' ? 'መታወቂያ ፊት' : 'ID Front'}</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500">
                  <Camera className="text-slate-400 mb-2" size={20} />
                  <span className="text-[9px] font-black text-slate-400 uppercase">Upload</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'am' ? 'መታወቂያ ጀርባ' : 'ID Back'}</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500">
                  <Camera className="text-slate-400 mb-2" size={20} />
                  <span className="text-[9px] font-black text-slate-400 uppercase">Upload</span>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
