const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const chatUiStr = `          {activeTab === 'chat' && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[80vh] flex flex-col bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40 relative">
               <div className="flex bg-slate-50 border-b border-slate-100 p-2">
                 <button onClick={() => setChatSubTab('group')} className={\`flex-1 py-3 font-bold rounded-2xl transition-colors \${chatSubTab === 'group' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:bg-slate-100/50'}\`}>{language === 'am' ? 'የቡድን ውይይት (Group)' : 'Group Chat'}</button>
                 <button onClick={() => setChatSubTab('admin')} className={\`flex-1 py-3 font-bold rounded-2xl transition-colors \${chatSubTab === 'admin' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:bg-slate-100/50'}\`}>{language === 'am' ? 'አድሚን (Admin)' : 'Admin'}</button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
                 {messages.filter(m => chatSubTab === 'group' ? (m.groupId === userData?.groupId || m.targetType === 'all') : (m.targetType === 'private' && (m.targetUserId === user?.uid || m.senderId === user?.uid))).map(msg => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                      <div key={msg.id} className={\`flex \${isMe ? 'justify-end' : 'justify-start'}\`}>
                        <div className={\`max-w-[85%] sm:max-w-[70%] p-4 rounded-[2rem] shadow-sm \${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'}\`}>
                          <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{msg.senderName}</div>
                          {msg.text && msg.text !== '🎤 የድምፅ መልዕክት' && msg.text !== '📸 ፎቶ (Image)' && !msg.text.startsWith('📄 ፋይል (File:') && <p className="mb-2 leading-relaxed text-[15px]">{msg.text}</p>}
                          {msg.audioUrl && (
                             <div className="mt-2 bg-black/10 rounded-xl p-2 w-full min-w-[200px]">
                               <audio controls src={msg.audioUrl} className="w-full h-8" />
                             </div>
                          )}
                          {msg.imageUrl && <img src={msg.imageUrl} alt="attached" className="max-w-full rounded-2xl mt-3 shadow-sm cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setShowImagePreview(msg.imageUrl)} />}
                          {msg.fileUrl && <a href={msg.fileUrl} download={msg.fileName} className={\`underline text-sm mt-3 flex items-center gap-2 p-3 rounded-xl \${isMe ? 'bg-indigo-500/30' : 'bg-slate-50'} transition-colors\`}>📄 {msg.fileName}</a>}
                          <div className="text-[9px] font-black opacity-40 mt-3 text-right">
                             {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString('am-ET', {hour: '2-digit', minute:'2-digit'}) : ''}
                          </div>
                        </div>
                      </div>
                    );
                 })}
                 <div ref={chatEndRef} />
               </div>

               <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
                  <input type="file" id="chatUploadImg" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />
                  <label htmlFor="chatUploadImg" className="p-3.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 bg-slate-50 rounded-2xl cursor-pointer transition-all"><ImageIcon size={20} /></label>
                  
                  <input type="file" id="chatUploadFile" accept="*" className="hidden" onChange={(e) => handleFileSelect(e, 'file')} />
                  <label htmlFor="chatUploadFile" className="p-3.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 bg-slate-50 rounded-2xl cursor-pointer transition-all"><Paperclip size={20} /></label>
                  
                  <button onClick={isRecording ? stopRecording : startRecording} className={\`p-3.5 rounded-2xl transition-all shadow-sm \${isRecording ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse' : 'bg-slate-50 text-slate-400 hover:text-amber-500 hover:bg-amber-50'}\`}>
                    <Mic size={20} />
                  </button>

                  <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
                    <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={language === 'am' ? 'መልእክት ይጻፉ...' : 'Type a message...'} className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3.5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium" />
                    <button type="submit" disabled={!newMessage.trim()} className="bg-indigo-600 text-white p-3.5 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all active:scale-95"><Send size={20} /></button>
                  </form>
               </div>
             </motion.div>
          )}
`;

content = content.replace(
  /(\{\s*activeTab === 'support' && \()/,
  chatUiStr + "$1"
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Patched UI");
