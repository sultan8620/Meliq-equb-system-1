const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
content = content.replace(
  /reader\.onloadend = async \(\) => \{\s*const base64Audio = reader\.result as string;\s*if \(\!user \|\| \!userData\?\.groupId\) return;\s*try \{\s*await addDoc\(collection\(db, 'messages'\), \{\s*groupId: userData\.groupId,\s*senderId: user\.uid,\s*senderName: userData\.fullName,\s*senderRole: 'member',\s*text: '🎤 የድምፅ መልዕክት',\s*audioUrl: base64Audio,\s*createdAt: serverTimestamp\(\)\s*\}\);\s*await sendNotificationForMessage\('🎤 የድምፅ መልዕክት', 'group', userData\.groupId\);\s*\} catch \(error\) \{\s*console\.error\(error\);\s*\}\s*\};/,
  `reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (!user) return;
          if (chatSubTab === 'group' && !userData?.groupId) return;

          try {
            const payload: any = {
              senderId: user.uid,
              senderName: userData?.fullName || 'Member',
              senderRole: 'member',
              text: '🎤 የድምፅ መልዕክት',
              audioUrl: base64Audio,
              createdAt: serverTimestamp()
            };

            if (chatSubTab === 'admin') {
              payload.targetType = 'private';
              payload.targetUserId = 'admin';
              await addDoc(collection(db, 'messages'), payload);
              await sendNotificationForMessage('🎤 የድምፅ መልዕክት', 'private', 'admin');
            } else {
              payload.groupId = userData.groupId;
              await addDoc(collection(db, 'messages'), payload);
              await sendNotificationForMessage('🎤 የድምፅ መልዕክት', 'group', userData.groupId);
            }
          } catch (error) {
            console.error(error);
          }
        };`
);
fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Patched");
