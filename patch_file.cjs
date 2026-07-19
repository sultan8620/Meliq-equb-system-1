const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
content = content.replace(
  /reader\.onloadend = async \(\) => \{\s*const base64Data = reader\.result as string;\s*try \{\s*const msgText = type === 'image' \? '📸 ፎቶ \(Image\)' : `📄 ፋይል \(File: \$\{file\.name\}\)`;\s*await addDoc\(collection\(db, 'messages'\), \{\s*groupId: userData\.groupId,\s*senderId: user\.uid,\s*senderName: userData\.fullName,\s*senderRole: 'member',\s*text: msgText,\s*\[type === 'image' \? 'imageUrl' : 'fileUrl'\]: base64Data,\s*fileName: file\.name,\s*createdAt: serverTimestamp\(\)\s*\}\);\s*await sendNotificationForMessage\(msgText, 'group', userData\.groupId\);\s*\} catch \(error\) \{\s*console\.error\(error\);\s*triggerSuccess\(language === 'am' \? 'ማሳወቂያ' : 'Notice', language === 'am' \? 'ፋይል መላክ አልተቻለም!' : 'Failed to send file\. File may be too large\.'\);\s*\}\s*\};/,
  `reader.onloadend = async () => {
      const base64Data = reader.result as string;
      try {
        const msgText = type === 'image' ? '📸 ፎቶ (Image)' : \`📄 ፋይል (File: \${file.name})\`;
        const payload: any = {
          senderId: user.uid,
          senderName: userData?.fullName || 'Member',
          senderRole: 'member',
          text: msgText,
          [type === 'image' ? 'imageUrl' : 'fileUrl']: base64Data,
          fileName: file.name,
          createdAt: serverTimestamp()
        };

        if (chatSubTab === 'admin') {
          payload.targetType = 'private';
          payload.targetUserId = 'admin';
          await addDoc(collection(db, 'messages'), payload);
          await sendNotificationForMessage(msgText, 'private', 'admin');
        } else {
          payload.groupId = userData.groupId;
          await addDoc(collection(db, 'messages'), payload);
          await sendNotificationForMessage(msgText, 'group', userData.groupId);
        }
      } catch (error) {
        console.error(error);
        triggerSuccess(language === 'am' ? 'ማሳወቂያ' : 'Notice', language === 'am' ? 'ፋይል መላክ አልተቻለም!' : 'Failed to send file. File may be too large.');
      }
    };`
);
fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Patched");
