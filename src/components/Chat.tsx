import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './FirebaseProvider';

export default function Chat({ receiverId }: { receiverId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!user || !receiverId) return;
    const q = query(
      collection(db, 'messages'),
      where('senderId', 'in', [user.uid, receiverId]),
      where('receiverId', 'in', [user.uid, receiverId]),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user, receiverId]);

  const sendMessage = async () => {
    if (!text.trim() || !user) return;
    await addDoc(collection(db, 'messages'), {
      senderId: user.uid,
      receiverId,
      text,
      timestamp: serverTimestamp()
    });
    setText('');
  };

  return (
    <div className="flex flex-col h-96 border p-4">
      <div className="flex-1 overflow-y-auto">
        {messages.map(msg => (
          <div key={msg.id} className={`p-2 ${msg.senderId === user?.uid ? 'text-right' : 'text-left'}`}>
            <p className="bg-slate-200 p-2 rounded">{msg.text}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 border p-2" />
        <button onClick={sendMessage} className="bg-emerald-600 text-white p-2">ላክ</button>
      </div>
    </div>
  );
}
