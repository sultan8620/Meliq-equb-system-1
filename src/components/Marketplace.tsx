import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, Plus, Tag, Clock, Send, DollarSign, Image as ImageIcon, XCircle, Package, Trash2, Edit, CheckCircle, ChevronRight, LayoutGrid, Car, Home, Smartphone, Coffee, Layers, Filter, Activity, BarChart3, ShieldCheck, Edit3, ShoppingCart, UploadCloud } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from './FirebaseProvider';
import imageCompression from 'browser-image-compression';

import { useLanguage } from '../lib/LanguageContext';

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
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

const CATEGORIES = [
  { id: 'all', label: 'ሁሉም (All Categories)', icon: LayoutGrid },
  { id: 'Electronics', label: 'ኤሌክትሮኒክስ (Consumer Electronics)', icon: Smartphone },
  { id: 'Apparel', label: 'አልባሳት (Apparel & Accessories)', icon: ShoppingBag },
  { id: 'Machinery', label: 'ማሽነሪ (Industrial Machinery)', icon: Layers },
  { id: 'Home', label: 'የቤት እቃዎች (Home & Garden)', icon: Home },
  { id: 'Vehicles', label: 'መኪና (Vehicles & Accessories)', icon: Car },
  { id: 'Beauty', label: 'ውበት (Beauty & Personal Care)', icon: Activity },
  { id: 'Packaging', label: 'ማሸጊያ (Packaging)', icon: Package },
  { id: 'Other', label: 'ሌላ (Other)', icon: LayoutGrid },
];

export default function Marketplace() {
  const { t, language } = useLanguage();
  const { userData, user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newItem, setNewItem] = useState({ 
    title: '', 
    description: '', 
    price: '', 
    category: 'Electronics',
    customCategory: '',
    imageUrls: [''],
    customCommission: '',
    selectedSeller: null as any | null
  });
  const [members, setMembers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [marketSettings, setMarketSettings] = useState({ commission: 5 });
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [activeTab, setActiveTab] = useState<'market' | 'admin' | 'shop'>('market');
  const isAdmin = userData?.role === 'admin' || userData?.role === 'superadmin';

  // For now, marketplace is coming soon as per previous design
  const isComingSoon = true;

  if (isComingSoon) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-20 max-w-4xl mx-auto text-center pt-10 px-4">
        <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 mb-8 shadow-sm">
            <ShoppingBag size={48} />
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 font-display tracking-tight hover:scale-105 transition-transform cursor-default">
            {language === 'am' ? 'የገበያ ማዕከል' : 'Marketplace'}
          </h2>
          <p className="text-slate-500 font-medium text-lg md:text-xl mb-10 max-w-md mx-auto leading-relaxed">
            {language === 'am' 
              ? `በቅርብ ቀን ክፍት ይሆናል! የ${t('common.appName')} የገበያ ማዕከላችን ለጊዜው ዝግ ነው።` 
              : `Coming soon! The ${t('common.appName')} marketplace is temporarily closed.`}
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-50 border border-slate-100 text-slate-600 rounded-full font-bold text-sm shadow-sm hover:bg-slate-100 transition-colors">
            <Clock size={18} className="text-amber-500" /> 
            Coming Soon
          </div>
        </div>
      </motion.div>
    );
  }

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
    throw new Error(JSON.stringify(errInfo));
  };

  useEffect(() => {
    const q = query(collection(db, 'marketplace'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'marketplace');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'marketplace'), (doc) => {
      if (doc.exists()) {
        setMarketSettings(doc.data() as any);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings');
    });
    return () => unsubSettings();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      });
      return () => unsub();
    }
  }, [isAdmin]);

  const handleUpdateCommission = async (val: number) => {
    try {
      await updateDoc(doc(db, 'settings', 'marketplace'), { commission: val });
    } catch (err) {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'settings', 'marketplace'), { commission: val });
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setIsBroadcasting(true);
    try {
      const sellerIds = Array.from(new Set(items.map(i => i.sellerId)));
      const promises = sellerIds.map(uid => addDoc(collection(db, 'notifications'), {
        userId: uid,
        title: 'የገበያ መልዕክት (Marketplace Message)',
        message: broadcastMsg,
        type: 'market_update',
        createdAt: serverTimestamp(),
        read: false
      }));
      await Promise.all(promises);
      setBroadcastMsg('');
      alert('መልዕክቱ ለሁሉም ተሳታፊዎች ተልኳል (Message sent to all participants)');
    } catch (err) {
      alert('መልዕክት መላክ አልተሳካም (Failed to send message)');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress the image to keep size very small (prevents Firestore from hitting 1MB limit)
      const options = {
        maxSizeMB: 0.15,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const newUrls = [...newItem.imageUrls];
        newUrls[index] = base64String;
        
        // Auto-add new slot if we filled the last one and haven't hit limit
        if (index === newItem.imageUrls.length - 1 && newItem.imageUrls.length < 5) {
            newUrls.push('');
        }
        
        setNewItem({...newItem, imageUrls: newUrls});
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Error processing image. Please try another.');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title || !newItem.description || !newItem.price) {
      alert('እባክዎ የተሟላ መረጃ ያስገቡ (Please fill all fields)');
      return;
    }
    
    setIsSubmitting(true);
    try {
      let sellerData = {};
      
      if (!editingItem) {
         sellerData = {
           sellerId: user?.uid,
           sellerName: userData?.fullName || 'Member',
           sellerPhone: userData?.phone || '',
           sellerAddress: userData?.address || '',
           sellerEkubId: userData?.ekubId || ''
         };
         if (isAdmin && newItem.selectedSeller) {
           sellerData = {
             sellerId: newItem.selectedSeller.id,
             sellerName: newItem.selectedSeller.fullName || 'Member',
             sellerPhone: newItem.selectedSeller.phone || '',
             sellerAddress: newItem.selectedSeller.address || '',
             sellerEkubId: newItem.selectedSeller.ekubId || ''
           };
         }
      } else if (isAdmin && newItem.selectedSeller) {
         sellerData = {
           sellerId: newItem.selectedSeller.id,
           sellerName: newItem.selectedSeller.fullName || 'Member',
           sellerPhone: newItem.selectedSeller.phone || '',
           sellerAddress: newItem.selectedSeller.address || '',
           sellerEkubId: newItem.selectedSeller.ekubId || ''
         };
      }

      const commissionValue = isAdmin && newItem.customCommission 
        ? parseFloat(newItem.customCommission) 
        : (editingItem ? editingItem.commission : marketSettings.commission);

      const finalItem = {
        ...newItem,
        category: newItem.category === 'Other' ? newItem.customCategory || 'Other' : newItem.category,
        imageUrls: newItem.imageUrls.filter((url: string) => url.trim() !== ''),
        price: parseFloat(newItem.price),
        commission: commissionValue,
        status: editingItem ? editingItem.status : (isAdmin ? 'available' : 'pending'),
        ...sellerData,
      };

      if (editingItem) {
        await updateDoc(doc(db, 'marketplace', editingItem.id), {
          ...finalItem,
          updatedAt: serverTimestamp(),
        });
        setEditingItem(null);
      } else {
        await addDoc(collection(db, 'marketplace'), {
          ...finalItem,
          createdAt: serverTimestamp(),
        });
      }
      setShowAddItem(false);
      setNewItem({ 
        title: '', 
        description: '', 
        price: '', 
        category: 'Electronics', 
        customCategory: '', 
        imageUrls: [''],
        customCommission: '',
        selectedSeller: null
      });
      alert(editingItem ? 'እቃው ተስተካክሏል (Item updated)' : (isAdmin ? 'እቃው በተሳካ ሁኔታ ተመዝግቧል' : 'እቃዎ ተመዝግቧል! በአድሚን ከታየ በኋላ በገበያው ላይ ለሁሉም ይታያል። (Your item has been submitted for approval.)'));
    } catch (err: any) {
      handleFirestoreError(err, editingItem ? OperationType.UPDATE : OperationType.CREATE, 'marketplace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('ይህንን እቃ መሰረዝ እርግጠኛ ነዎት? (Confirm delete)')) return;
    try {
      await deleteDoc(doc(db, 'marketplace', id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `marketplace/${id}`);
    }
  };

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    const standardCategories = CATEGORIES.map(c => c.id);
    const isOther = !standardCategories.includes(item.category);
    
    setNewItem({
      title: item.title,
      description: item.description,
      price: item.price.toString(),
      category: isOther ? 'Other' : item.category,
      customCategory: isOther ? item.category : '',
      imageUrls: item.imageUrls?.length > 0 ? item.imageUrls : [''],
      customCommission: item.commission?.toString() || '',
      selectedSeller: members.find(m => m.id === item.sellerId) || null
    });
    setSelectedItem(null);
    setShowAddItem(true);
  };

  const filteredItems = items.filter(item => {
    const isAvailable = item.status === 'available' || !item.status;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return isAvailable && matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-[#f0f2f5] min-h-screen pb-10 -mx-4 sm:-mx-8 lg:-mx-12 xl:-mx-8 -mt-8 pt-8">
        {/* Marketplace Hero - Alibaba style banner */}
        <div className="bg-gradient-to-r from-[#FF6000] to-[#E62E04] text-white p-6 md:p-10 mb-6 flex flex-col md:flex-row items-center justify-between shadow-md">
           <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row w-full items-center gap-8 px-4">
              <div className="flex-1 space-y-4">
                 <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">Global Trade, Simplified</h1>
                 <p className="text-lg text-orange-100 max-w-2xl font-medium">
                    Source verified products from trusted community suppliers. Discover new opportunities today with Melik Ekub.
                 </p>
                 <div className="flex gap-4 pt-4">
                   <button className="bg-white text-[#FF6000] font-bold px-6 py-2.5 rounded-full text-sm hover:bg-slate-50 shadow-sm transition-colors active:scale-95">Source Now</button>
                   <button className="bg-black/10 backdrop-blur-sm text-white border border-white/20 font-bold px-6 py-2.5 rounded-full text-sm hover:bg-black/20 transition-colors active:scale-95">Supplier Services</button>
                 </div>
              </div>
              <div className="hidden md:flex w-64 h-64 relative items-center justify-center">
                 <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl animate-pulse" />
                 <ShoppingCart size={90} className="text-white drop-shadow-xl relative z-10" />
              </div>
           </div>
        </div>

        {/* Global Control Rail (Alibaba Style) */}
        <div className="sticky top-0 z-40 py-3 -mx-4 px-4 bg-white border-b border-slate-200 shadow-sm hidden md:block pointer-events-auto">
           <div className="max-w-[1400px] mx-auto flex items-center gap-6 px-4">
              
              <div className="flex items-baseline text-[#FF6000] shrink-0 cursor-pointer rounded-sm font-black text-3xl tracking-tighter">
                 Melik<span className="text-slate-900 font-medium text-2xl tracking-normal">Market</span>
                 <span className="text-xs bg-[#FF6000] text-white px-1.5 py-0.5 rounded-sm ml-2 font-bold tracking-widest align-top mt-1">B2B</span>
              </div>

              {/* Search Bar */}
              <div className="flex-1 flex h-11 rounded-full border-[3px] border-[#FF6000] overflow-hidden bg-white hover:shadow-md transition-shadow group focus-within:ring-4 focus-within:ring-[#FF6000]/20 ml-8">
                 <select 
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="bg-slate-50 border-r border-slate-200 px-4 text-sm font-medium text-slate-700 outline-none hover:bg-slate-100 cursor-pointer"
                 >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                 </select>
                 <input 
                   type="text" 
                   placeholder="What are you looking for..."
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="flex-1 px-4 py-2 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-normal"
                 />
                 <button className="bg-[#FF6000] hover:bg-[#E62E04] text-white px-8 flex items-center justify-center transition-colors font-bold text-sm">
                    Search
                 </button>
              </div>

              <div className="flex items-center gap-8 text-slate-600">
                 {!isAdmin && (
                    <button 
                       onClick={() => setActiveTab(activeTab === 'shop' ? 'market' : 'shop')}
                       className={`flex flex-col items-center transition-colors cursor-pointer group ${activeTab === 'shop' ? 'text-[#FF6000]' : 'hover:text-[#FF6000]'}`}
                    >
                       <div className="relative">
                          <Package size={22} className="mb-0.5" />
                       </div>
                       <span className="text-[11px] font-bold">My Shop</span>
                    </button>
                 )}
                 <button 
                    onClick={() => {
                       setEditingItem(null);
                       setNewItem({ 
                         title: '', description: '', price: '', category: 'Electronics', 
                         customCategory: '', imageUrls: [''], customCommission: '', selectedSeller: null
                       });
                       setShowAddItem(true);
                     }}
                    className="flex flex-col items-center hover:text-[#FF6000] transition-colors cursor-pointer group"
                 >
                    <div className="relative">
                       <Plus size={22} className="mb-0.5" />
                    </div>
                    <span className="text-[11px] font-bold">Post Product</span>
                 </button>
              </div>
           </div>
        </div>
        
        {/* Mobile Search & Categories */}
        <div className="md:hidden sticky top-0 z-40 bg-white -mx-4 px-4 py-3 space-y-3 pointer-events-auto border-b border-slate-100 shadow-sm">
            <div className="flex justify-between items-center text-[#FF6000]">
               <span className="font-black text-2xl tracking-tighter">{t('common.appName').split(' ')[0]}<span className="text-slate-900 font-medium tracking-normal text-xl">Market</span></span>
               <div className="flex items-center gap-3">
                  {!isAdmin && (
                    <button 
                       onClick={() => setActiveTab(activeTab === 'shop' ? 'market' : 'shop')}
                       className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${activeTab === 'shop' ? 'bg-[#FF6000]/10 text-[#FF6000] border-[#FF6000]' : 'border-slate-200 text-slate-600'}`}
                    >
                      My Shop
                    </button>
                  )}
                  <button 
                     onClick={() => setShowAddItem(true)}
                     className="bg-[#FF6000] px-4 py-1.5 rounded-full text-white text-xs font-bold"
                  >
                    Post
                  </button>
               </div>
            </div>
            <div className="flex h-11 rounded-full border-2 border-[#FF6000] overflow-hidden bg-white w-full">
                 <input 
                   type="text" 
                   placeholder="Search..."
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="flex-1 px-4 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                 />
                 <button className="bg-[#FF6000] px-5 flex items-center justify-center">
                    <Search className="text-white" size={18} />
                 </button>
            </div>
            <div className="flex overflow-x-auto gap-2 text-slate-600 no-scrollbar pb-1 pt-1">
               {CATEGORIES.map(cat => (
                  <button 
                    key={cat.id} 
                    onClick={() => setActiveCategory(cat.id)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-medium border ${activeCategory === cat.id ? 'bg-[#FF6000]/10 text-[#FF6000] border-[#FF6000]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                  >
                    {cat.label}
                  </button>
               ))}
            </div>
        </div>

        {/* Admin Control Center */}
        {isAdmin && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm overflow-hidden mb-6 relative"
           >
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="relative z-10">
                 <div className="flex gap-4 mb-8 border-b border-slate-100 pb-4">
                    <button 
                       onClick={() => setActiveTab('market')}
                       className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'market' ? 'bg-[#FF6000] text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                    >
                       Marketplace View
                    </button>
                    <button 
                       onClick={() => setActiveTab('admin')}
                       className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'admin' ? 'bg-[#FF6000] text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                    >
                       Admin Dashboard
                    </button>
                 </div>
                 
                 {activeTab === 'market' ? (
                   <div className="flex flex-col xl:flex-row gap-12">
                     <div className="flex-1 space-y-6">
                        <div className="flex items-center justify-between">
                       <div>
                          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">የሽያጭ ኮሚሽን (Sales Commission)</h4>
                          <p className="text-[11px] font-medium text-slate-500 mt-1">አድሚን የሚያገኘው መቶኛ (Admin Percentage)</p>
                       </div>
                       <div className="text-2xl font-black text-[#FF6000]">{marketSettings.commission}%</div>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="20" 
                      step="0.5"
                      value={marketSettings.commission}
                      onChange={(e) => {
                         const val = parseFloat(e.target.value);
                         setMarketSettings({...marketSettings, commission: val});
                         handleUpdateCommission(val);
                      }}
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#FF6000]" 
                    />
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                       <span>0%</span>
                       <span>መካከለኛ (10%)</span>
                       <span>ከፍተኛ (20%)</span>
                    </div>
                 </div>

                 <div className="flex-[1.5] space-y-4 border-l border-slate-100 pl-0 xl:pl-12">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">ለተሳታፊዎች ማሳወቂያ ላክ (Broadcast Message)</h4>
                    <div className="flex bg-white border-2 border-[#FF6000] rounded-full overflow-hidden p-1 shadow-sm focus-within:ring-4 focus-within:ring-[#FF6000]/20 transition-shadow">
                       <input 
                         type="text" 
                         placeholder="ለምሳሌ፡ ለአሸናፊዎች የሚሰጠው ሽልማት ጨምሯል..."
                         value={broadcastMsg}
                         onChange={(e) => setBroadcastMsg(e.target.value)}
                         className="flex-1 bg-transparent px-4 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                       />
                       <button 
                         onClick={handleBroadcast}
                         disabled={isBroadcasting || !broadcastMsg.trim()}
                         className="bg-[#FF6000] hover:bg-[#E62E04] text-white px-8 py-2.5 rounded-full text-sm font-bold transition-all disabled:opacity-50 flex items-center shadow-md active:scale-95"
                       >
                         <Send size={16} className="inline mr-2" />
                         {isBroadcasting ? 'በመላክ ላይ...' : 'አሁኑኑ ላክ'}
                       </button>
                    </div>
                 </div>
              </div>
              ) : (
                 <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Admin Dashboard - Member Activities</h3>
                    <div className="overflow-x-auto bg-slate-50 rounded-xl border border-slate-200">
                       <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-white border-b border-slate-200">
                             <tr>
                                <th className="px-6 py-4 font-bold text-slate-700">Product / Item</th>
                                <th className="px-6 py-4 font-bold text-slate-700">Seller</th>
                                <th className="px-6 py-4 font-bold text-slate-700">Price</th>
                                <th className="px-6 py-4 font-bold text-slate-700">Commission</th>
                                <th className="px-6 py-4 font-bold text-slate-700">Status</th>
                                <th className="px-6 py-4 font-bold text-slate-700">Actions</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {items.map(item => (
                                <tr key={item.id} className="hover:bg-orange-50/50 transition-colors">
                                   <td className="px-6 py-4 font-medium text-slate-800">
                                      <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-md bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                            {item.imageUrls?.[0] ? <img src={item.imageUrls[0]} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-400" />}
                                         </div>
                                         <div className="w-48 overflow-hidden text-ellipsis">{item.title}</div>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-slate-600 font-medium">
                                      {item.sellerName || 'Verified Member'}<br/>
                                      <span className="text-xs text-slate-400">{item.sellerPhone || '-'}</span>
                                   </td>
                                   <td className="px-6 py-4 font-bold text-slate-900">
                                      ETB {item.price ? Math.floor(item.price).toLocaleString() : '0'}
                                   </td>
                                   <td className="px-6 py-4">
                                      <span className="bg-[#FF6000]/10 text-[#FF6000] px-2 py-1 rounded font-bold">{item.commission}%</span>
                                   </td>
                                   <td className="px-6 py-4">
                                      <select 
                                         value={item.status || 'available'}
                                         onChange={async (e) => {
                                            const newStatus = e.target.value;
                                            try {
                                               await updateDoc(doc(db, 'marketplace', item.id), { status: newStatus });
                                            } catch(err) {
                                               handleFirestoreError(err, OperationType.UPDATE, 'marketplace');
                                            }
                                         }}
                                         className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-700 outline-none"
                                      >
                                         <option value="pending">Pending</option>
                                         <option value="available">Active</option>
                                         <option value="rejected">Rejected</option>
                                         <option value="sold">Sold Out</option>
                                      </select>
                                   </td>
                                   <td className="px-6 py-4 flex items-center gap-2">
                                      <button 
                                         onClick={() => { handleEditClick(item); setActiveTab('market'); setShowAddItem(true); }}
                                         className="text-[#FF6000] hover:bg-orange-100 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                                      >
                                         Edit / Set Comm.
                                      </button>
                                      <button 
                                         onClick={() => handleDeleteItem(item.id)}
                                         className="text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                                      >
                                         Delete
                                      </button>
                                   </td>
                                </tr>
                             ))}
                             {items.length === 0 && (
                                <tr>
                                   <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">No items in the marketplace.</td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              )}
           </div>
           </motion.div>
        )}

        {activeTab === 'shop' && !isAdmin ? (
           <div className="max-w-[1400px] mx-auto px-4 mt-4">
               <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-slate-900">My Virtual Shop</h2>
                  <div className="bg-orange-50 text-[#FF6000] px-4 py-2 rounded-full font-bold text-sm">
                     Total Listed: {items.filter(i => i.sellerId === user?.uid).length}
                  </div>
               </div>
               <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                     <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                           <th className="px-6 py-4 font-bold text-slate-700">Product</th>
                           <th className="px-6 py-4 font-bold text-slate-700">Price</th>
                           <th className="px-6 py-4 font-bold text-slate-700">Commission Deducted</th>
                           <th className="px-6 py-4 font-bold text-slate-700">Status</th>
                           <th className="px-6 py-4 font-bold text-slate-700">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {items.filter(i => i.sellerId === user?.uid).map(item => (
                           <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-800">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-md bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                       {item.imageUrls?.[0] ? <img src={item.imageUrls[0]} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-400" />}
                                    </div>
                                    <div className="w-48 overflow-hidden text-ellipsis">{item.title}</div>
                                 </div>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-900">
                                 ETB {item.price ? Math.floor(item.price).toLocaleString() : '0'}
                              </td>
                              <td className="px-6 py-4">
                                 <span className="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded">{item.commission}%</span>
                              </td>
                              <td className="px-6 py-4">
                                 <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                    item.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                    item.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                    item.status === 'sold' ? 'bg-slate-100 text-slate-700' :
                                    'bg-emerald-100 text-emerald-700'
                                 }`}>
                                    {(item.status || 'available').toUpperCase()}
                                 </span>
                              </td>
                              <td className="px-6 py-4 flex items-center gap-2">
                                 <button onClick={() => handleEditClick(item)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold transition-colors">
                                    Edit
                                 </button>
                                 {item.status !== 'sold' && item.status !== 'rejected' && (
                                    <button 
                                       onClick={async () => {
                                          if (confirm('Mark this item as sold?')) {
                                             await updateDoc(doc(db, 'marketplace', item.id), { status: 'sold' });
                                          }
                                       }}
                                       className="px-3 py-1.5 bg-[#FF6000] hover:bg-[#E62E04] text-white rounded-md text-xs font-bold transition-colors"
                                    >
                                       Mark Sold
                                    </button>
                                 )}
                                 <button onClick={() => handleDeleteItem(item.id)} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md text-xs font-bold transition-colors">
                                    Delete
                                 </button>
                              </td>
                           </tr>
                        ))}
                        {items.filter(i => i.sellerId === user?.uid).length === 0 && (
                           <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">You haven't posted any products yet.</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
           </div>
        ) : (
          <>
            {/* Market Stats */}
            {!searchTerm && activeCategory === 'all' && (
           <div className="max-w-[1400px] mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white border hover:border-[#FF6000]/30 p-5 rounded-2xl flex items-center gap-5 cursor-pointer shadow-sm hover:shadow transition-all group">
                 <div className="w-14 h-14 bg-red-50 group-hover:bg-[#FF6000] rounded-full flex items-center justify-center text-[#FF6000] group-hover:text-white transition-colors">
                    <Tag size={24} />
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-900 text-lg">Super Deals</h4>
                    <p className="text-[13px] text-slate-500 font-medium">B2B bulk discounts</p>
                 </div>
              </div>
              <div className="bg-white border hover:border-[#FF6000]/30 p-5 rounded-2xl flex items-center gap-5 cursor-pointer shadow-sm hover:shadow transition-all group">
                 <div className="w-14 h-14 bg-amber-50 group-hover:bg-[#FF6000] rounded-full flex items-center justify-center text-amber-600 group-hover:text-white transition-colors">
                    <ShieldCheck size={24} />
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-900 text-lg">Verified Sellers</h4>
                    <p className="text-[13px] text-slate-500 font-medium">Authentic local suppliers</p>
                 </div>
              </div>
              <div className="bg-white border hover:border-[#FF6000]/30 p-5 rounded-2xl flex items-center gap-5 cursor-pointer shadow-sm hover:shadow transition-all group">
                 <div className="w-14 h-14 bg-blue-50 group-hover:bg-[#FF6000] rounded-full flex items-center justify-center text-blue-600 group-hover:text-white transition-colors">
                    <Activity size={24} />
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-900 text-lg">Trending Now</h4>
                    <p className="text-[13px] text-slate-500 font-medium">Most requested items</p>
                 </div>
              </div>
           </div>
        )}

        {/* Market Exhibition Grid */}
        <div className="max-w-[1400px] mx-auto px-4 grid grid-cols-2 min-[500px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 md:gap-3 lg:gap-4">
          {filteredItems.length === 0 ? (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center p-6"
             >
                <Package size={64} className="text-slate-200 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No products found</h3>
                <p className="text-slate-500 text-sm mb-6">Modify your search or categories to find what you need.</p>
                <button 
                   onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}
                   className="px-8 py-2.5 bg-[#FF6000] text-white rounded-full text-sm font-bold shadow-sm hover:bg-[#E62E04] transition-all"
                >
                   Clear filters
                </button>
             </motion.div>
          ) : (
            filteredItems.map((item, idx) => {
              const isOwner = user?.uid === item.sellerId;
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx % 4 * 0.05, duration: 0.3 }}
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-white group cursor-pointer border border-slate-200 hover:border-[#FF6000] rounded-lg overflow-hidden hover:shadow-lg transition-all flex flex-col h-full"
                >
                   {/* Product Image */}
                   <div className="relative aspect-square overflow-hidden flex items-center justify-center p-2 bg-white">
                      {item.imageUrls?.[0] ? (
                        <img 
                          src={item.imageUrls[0]} 
                          alt={item.title} 
                          className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <ImageIcon size={48} className="text-slate-200" />
                      )}
                      
                      {/* Optional Top Badge */}
                      <div className="absolute top-3 left-3 px-1.5 py-0.5 bg-gradient-to-r from-[#FF6000] to-[red] text-white text-[9px] font-bold rounded shadow-md md:hidden group-hover:block transition-all tracking-wide uppercase">
                         Top Pick
                      </div>
                   </div>
                   
                   {/* Product Details */}
                   <div className="p-2.5 md:p-3 flex flex-col flex-1 bg-white">
                      {/* Title */}
                      <h3 className="text-[12px] md:text-[13px] font-medium text-slate-800 leading-snug line-clamp-2 group-hover:text-[#FF6000] transition-colors mb-1">
                          {item.title}
                      </h3>
                      
                      {/* Price Section */}
                      <div className="mb-2">
                          <div className="flex items-baseline text-slate-900 font-extrabold tracking-tight">
                             <span className="text-[10px] mr-0.5 uppercase">ETB</span>
                             <span className="text-lg md:text-xl leading-none">
                                {Math.floor(item.price || 0).toLocaleString()}
                             </span>
                          </div>
                          <div className="text-[9px] md:text-[10px] text-slate-500 mt-0.5 font-medium">Min. order: 1 piece</div>
                      </div>

                      <div className="mt-auto">
                         {/* Supplier info */}
                         <div className="border-t border-slate-100 pt-2 flex items-start gap-1">
                            <div className="text-[10px] md:text-[11px] text-slate-600 line-clamp-1 group-hover:text-[#FF6000] transition-colors">
                               {item.sellerName || 'Verified Supplier'}
                            </div>
                         </div>

                         <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-1 mb-2">
                            <span className="text-amber-600 font-bold tracking-wide">2 YRS</span>
                            <span className="opacity-70">ET</span>
                            <ShieldCheck size={10} className="text-amber-500 ml-auto" />
                         </div>

                         {/* Actions */}
                         <div className="grid grid-cols-2 gap-1.5 mt-2">
                            <button className="flex items-center justify-center border border-slate-200 hover:border-[#FF6000] hover:text-[#FF6000] text-slate-600 rounded-full py-1 text-[10px] font-medium transition-colors">
                               Contact
                            </button>
                            <button className="flex items-center justify-center border border-[#FF6000] text-[#FF6000] hover:bg-orange-50 rounded-full py-1 text-[10px] font-medium transition-colors">
                               Chat
                            </button>
                         </div>

                         {/* Admin/Owner Controls */}
                         {(isAdmin || isOwner) && (
                           <div className="flex gap-1.5 mt-2 pt-2 border-t border-slate-100">
                              <button 
                                 onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                 className="flex-1 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded text-[9px] font-bold hover:bg-slate-100 transition-colors"
                              >
                                 Edit
                              </button>
                              <button 
                                 onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                                 className="flex-1 py-1 bg-rose-50 text-rose-600 rounded text-[9px] font-bold hover:bg-rose-100 transition-colors"
                              >
                                 Delete
                              </button>
                           </div>
                         )}
                      </div>
                   </div>
                </motion.div>
              );
            })
          )}
        </div>
        </>
        )}

        {/* Item Detail Modal */}
        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-0 md:p-6 z-[100] overflow-y-auto custom-scrollbar">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white md:rounded-2xl w-full h-full md:h-auto max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
              >
                 <button 
                   onClick={() => setSelectedItem(null)}
                   className="absolute top-4 right-4 w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors z-[110]"
                 >
                   <XCircle size={24} />
                 </button>

                 {/* Image Gallery */}
                 <div className="md:w-[45%] bg-white border-b md:border-b-0 md:border-r border-slate-100 relative p-6 flex flex-col">
                    <div className="flex-1 relative min-h-[300px] flex items-center justify-center rounded-xl overflow-hidden bg-[#F7F8FA]">
                       <AnimatePresence mode="wait">
                          <motion.div 
                             key={selectedItem.currentImageIdx || 0}
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             exit={{ opacity: 0 }}
                             className="w-full h-full"
                          >
                             {selectedItem.imageUrls?.[selectedItem.currentImageIdx || 0] || selectedItem.imageUrls?.[0] ? (
                               <img 
                                 src={selectedItem.imageUrls?.[selectedItem.currentImageIdx || 0] || selectedItem.imageUrls?.[0]} 
                                 alt={selectedItem.title} 
                                 className="w-full h-full object-cover" 
                               />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-slate-200">
                                  <ImageIcon size={64} className="opacity-20" />
                               </div>
                             )}
                          </motion.div>
                       </AnimatePresence>
                    </div>

                    {selectedItem.imageUrls?.length > 1 && (
                       <div className="mt-4 flex gap-2 overflow-x-auto py-2 no-scrollbar">
                          {selectedItem.imageUrls.map((url: string, i: number) => (
                             <button 
                                key={i}
                                onClick={() => setSelectedItem({...selectedItem, currentImageIdx: i})}
                                className={`w-16 h-16 rounded-lg border-2 shrink-0 ${ (selectedItem.currentImageIdx || 0) === i ? 'border-[#FF6000]' : 'border-transparent hover:border-slate-300'} overflow-hidden bg-[#F7F8FA] p-1`}
                             >
                                <img src={url} className="w-full h-full object-cover rounded-md" alt="" />
                             </button>
                          ))}
                       </div>
                    )}
                 </div>

                 {/* Product Info & Buy Box */}
                 <div className="md:w-[55%] p-6 md:p-8 flex flex-col bg-white overflow-y-auto">
                    <div>
                       {/* Category */}
                       <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-bold text-[#FF6000] bg-orange-50 px-2 py-1 rounded-md uppercase tracking-wider">
                             {selectedItem.category}
                          </span>
                       </div>

                       <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight mb-4">
                          {selectedItem.title}
                       </h2>
                       
                       {/* Price Block */}
                       <div className="mb-6 bg-[#F7F8FA] p-4 rounded-xl border border-slate-100">
                           <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Wholesale Price</div>
                           <div className="flex items-baseline text-[#FF6000] font-black">
                              <span className="text-sm mr-2 opacity-80 uppercase">ETB</span>
                              <span className="text-4xl leading-none">
                                 {Math.floor(selectedItem.price || 0).toLocaleString()}
                              </span>
                              <span className="text-sm font-medium ml-1 text-slate-500">/ piece</span>
                           </div>
                           <div className="text-sm text-slate-600 mt-2 font-medium">Min. order: 1 piece</div>
                       </div>

                       {/* Seller Box */}
                       <div className="border border-slate-200 rounded-xl p-4 mb-6 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#FF6000]" />
                          
                          <div className="flex items-center gap-2 mb-3">
                             <ShieldCheck size={20} className="text-[#FF6000]" />
                             <span className="font-bold text-slate-900 text-lg">Verified Supplier</span>
                          </div>
                          
                          <div className="space-y-3 mb-5 text-sm text-slate-700">
                             <div className="grid grid-cols-[100px_1fr] gap-2">
                                <span className="text-slate-500 font-medium">Company</span>
                                <span className="font-medium text-slate-900">{selectedItem.sellerName}</span>
                             </div>
                             <div className="grid grid-cols-[100px_1fr] gap-2">
                                <span className="text-slate-500 font-medium">Region</span>
                                <span className="flex items-center gap-2"><span className="w-5 h-3 bg-slate-200 block overflow-hidden"><div className="bg-green-600 h-1"/><div className="bg-yellow-400 h-1"/><div className="bg-red-600 h-1"/></span> Ethiopia</span>
                             </div>
                             <div className="grid grid-cols-[100px_1fr] gap-2">
                                <span className="text-slate-500 font-medium">Experience</span>
                                <span className="font-bold text-amber-600">1+ Years Trade</span>
                             </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                             <button className="flex-1 bg-[#FF6000] hover:bg-[#E62E04] text-white py-3 rounded-full text-sm font-bold shadow-sm transition-colors shadow-orange-500/20">
                                Send Inquiry
                             </button>
                             {selectedItem.sellerPhone && (
                                <a 
                                  href={`tel:${selectedItem.sellerPhone}`}
                                  className="flex-1 bg-white hover:bg-slate-50 border-2 border-[#FF6000] text-[#FF6000] py-2.5 rounded-full text-sm font-bold shadow-sm transition-colors text-center inline-flex items-center justify-center gap-2"
                                >
                                   Call Supplier
                                </a>
                             )}
                          </div>
                          
                          {(isAdmin || user?.uid === selectedItem.sellerId) && (
                             <button 
                               onClick={() => handleEditClick(selectedItem)}
                               className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 py-2.5 rounded-full text-sm font-bold transition-colors mt-3"
                             >
                                Edit Listing Updates
                             </button>
                          )}
                          
                          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 p-2 rounded-lg">
                             <ShieldCheck size={14} className="text-emerald-500" /> Secure Payment and Trade Assurance
                          </div>
                       </div>

                       <div className="space-y-4 pt-4 border-t border-slate-100">
                          <h4 className="font-black text-slate-900 text-lg">Product Details</h4>
                          <p className="text-slate-600 text-[15px] leading-relaxed whitespace-pre-wrap">
                             {selectedItem.description}
                          </p>
                       </div>
                    </div>
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add/Edit Item Modal */}
        <AnimatePresence>
          {showAddItem && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
              >
                <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="bg-[#FF6000] text-white p-2 rounded-lg">
                        <Package size={20} />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-slate-900 leading-tight">
                           {editingItem ? 'Edit Product Form' : 'Post Product for Sourcing'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">B2B Trade Platform</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setShowAddItem(false)} 
                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-all"
                  >
                    <XCircle size={24} />
                  </button>
                </div>
                
                <form onSubmit={handleAddItem} className="p-8 space-y-6 overflow-y-auto custom-scrollbar bg-white">
                   {isAdmin && (
                     <div className="bg-orange-50/50 p-6 rounded-xl border border-[#FF6000]/20 space-y-4">
                        <div className="flex justify-between items-center">
                           <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <ShieldCheck size={16} className="text-[#FF6000]" /> 
                              Assign Supplier (Admin)
                           </h4>
                           {newItem.selectedSeller && (
                             <button 
                               type="button"
                               onClick={() => setNewItem({...newItem, selectedSeller: null})}
                               className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                             >
                               Clear Selection
                             </button>
                           )}
                        </div>

                        {!newItem.selectedSeller ? (
                           <div className="relative group">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <input 
                                type="text" 
                                placeholder="Search by name or phone..."
                                value={memberSearch}
                                onChange={e => setMemberSearch(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg pl-12 pr-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#FF6000]/50 focus:border-[#FF6000] transition-all"
                              />
                              {memberSearch.length > 1 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-xl z-[120] max-h-60 overflow-y-auto">
                                   {members.filter(m => 
                                     m.fullName?.toLowerCase().includes(memberSearch.toLowerCase()) || 
                                     m.phone?.includes(memberSearch)
                                   ).map(m => (
                                     <button
                                       key={m.id}
                                       type="button"
                                       onClick={() => {
                                         setNewItem({...newItem, selectedSeller: m});
                                         setMemberSearch('');
                                       }}
                                       className="w-full p-4 text-left hover:bg-slate-50 transition-all flex items-center gap-4 border-b border-slate-100 last:border-0"
                                     >
                                        <div className="w-8 h-8 rounded-full bg-[#FF6000] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                           {m.fullName?.charAt(0)}
                                        </div>
                                        <div>
                                           <p className="text-sm font-bold text-slate-900">{m.fullName}</p>
                                           <p className="text-xs text-slate-500">{m.phone}</p>
                                        </div>
                                     </button>
                                   ))}
                                </div>
                              )}
                           </div>
                        ) : (
                           <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                              <div className="w-10 h-10 rounded bg-[#FF6000] text-white flex items-center justify-center font-bold">
                                 {newItem.selectedSeller.fullName?.charAt(0)}
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-slate-900">{newItem.selectedSeller.fullName}</p>
                                 <p className="text-xs text-slate-500">{newItem.selectedSeller.phone}</p>
                              </div>
                           </div>
                        )}
                     </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-700">Product Name <span className="text-rose-500">*</span></label>
                         <input 
                           type="text" 
                           required 
                           value={newItem.title} 
                           onChange={e => setNewItem({...newItem, title: e.target.value})} 
                           placeholder="Enter product keyword..."
                           className="w-full bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#FF6000]/50 focus:border-[#FF6000] transition-all"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-700">Category <span className="text-rose-500">*</span></label>
                         <select 
                           required 
                           value={newItem.category} 
                           onChange={e => setNewItem({...newItem, category: e.target.value})} 
                           className="w-full bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#FF6000]/50 focus:border-[#FF6000] transition-all cursor-pointer"
                         >
                           {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                             <option key={cat.id} value={cat.id}>{cat.label}</option>
                           ))}
                         </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-700">FOB Price (ETB) <span className="text-rose-500">*</span></label>
                         <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">ETB</span>
                            <input 
                               type="number" 
                               required 
                               min="1"
                               value={newItem.price} 
                               onChange={e => setNewItem({...newItem, price: e.target.value})} 
                               className="w-full bg-white border border-slate-300 rounded-md pl-12 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#FF6000]/50 focus:border-[#FF6000] transition-all"
                            />
                         </div>
                      </div>
                      {isAdmin && (
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-indigo-700 flex items-center gap-1">Override Platform Commission (%)</label>
                           <input 
                             type="number" 
                             step="0.1"
                             placeholder={`Std: ${marketSettings.commission}%`}
                             value={newItem.customCommission} 
                             onChange={e => setNewItem({...newItem, customCommission: e.target.value})}
                             className="w-full bg-indigo-50 border border-indigo-200 rounded-md px-4 py-2.5 text-sm text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                           />
                        </div>
                      )}
                   </div>

                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-700">Product Images</label>
                      </div>
                      
                      <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        {newItem.imageUrls.map((url, i) => (
                           <div key={i} className="flex gap-3 items-center">
                              <div className="flex-1 relative">
                                 {url ? (
                                    <div className="w-full bg-emerald-50 border border-emerald-200 rounded-md px-4 py-2.5 text-sm text-emerald-700 font-bold overflow-hidden text-ellipsis whitespace-nowrap flex items-center gap-2">
                                        <CheckCircle size={16} /> Image Selected
                                    </div>
                                 ) : (
                                    <div className="w-full relative bg-white border border-slate-300 border-dashed rounded-md px-4 py-2 hover:bg-orange-50 hover:border-[#FF6000] hover:text-[#FF6000] transition-colors cursor-pointer text-sm font-medium text-slate-500 flex items-center justify-center gap-2">
                                       <UploadCloud size={18} />
                                       <span>Choose an image from gallery</span>
                                       <input 
                                         type="file" 
                                         accept="image/*"
                                         disabled={isSubmitting}
                                         onChange={(e) => handleImageUpload(e, i)}
                                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                       />
                                    </div>
                                 )}
                                 {newItem.imageUrls.length > 1 && (
                                   <button 
                                     type="button"
                                     onClick={() => setNewItem({...newItem, imageUrls: newItem.imageUrls.filter((_, idx) => idx !== i)})}
                                     className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors z-10"
                                   >
                                     <XCircle size={16} />
                                   </button>
                                 )}
                              </div>
                              <div className="w-12 h-12 rounded border border-slate-200 overflow-hidden shrink-0 bg-white flex items-center justify-center">
                                 {url ? (
                                   <img src={url} alt="" className="w-full h-full object-cover" />
                                 ) : (
                                   <ImageIcon size={20} className="text-slate-300" />
                                 )}
                              </div>
                           </div>
                        ))}
                        {newItem.imageUrls.length < 5 && !newItem.imageUrls.includes('') && (
                           <button 
                             type="button"
                             onClick={() => setNewItem({...newItem, imageUrls: [...newItem.imageUrls, '']})}
                             className="text-xs font-bold text-[#FF6000] hover:bg-orange-50 px-3 py-1.5 rounded-md transition-all border border-[#FF6000] mt-2 block w-full"
                           >
                             + Add Another Image
                           </button>
                        )}
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700">Product Details <span className="text-rose-500">*</span></label>
                      <textarea 
                        required 
                        rows={5}
                        value={newItem.description} 
                        onChange={e => setNewItem({...newItem, description: e.target.value})} 
                        placeholder="Provide detailed specifications, features, and trade details..."
                        className="w-full bg-white border border-slate-300 rounded-md px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#FF6000]/50 focus:border-[#FF6000] transition-all resize-y"
                      ></textarea>
                   </div>

                   <div className="pt-6 mt-6 border-t border-slate-200 flex justify-end gap-3">
                     <button 
                       type="button" 
                       onClick={() => setShowAddItem(false)}
                       className="px-6 py-2.5 bg-white text-slate-600 rounded-full text-sm font-bold border border-slate-300 hover:bg-slate-50 transition-all"
                     >
                       Cancel
                     </button>
                     <button 
                       type="submit"
                       disabled={isSubmitting}
                       className="px-8 py-2.5 bg-[#FF6000] text-white rounded-full text-sm font-bold shadow hover:bg-[#E62E04] transition-all disabled:opacity-50 min-w-[140px] flex items-center justify-center"
                     >
                       {isSubmitting ? 'Saving...' : (editingItem ? 'Save Changes' : 'Post Product')}
                     </button>
                   </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
}

function getTimeSinceString(createdAt: any) {
  if (!createdAt) return 'Just now';
  const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${diffInDays}d ago`;
}
