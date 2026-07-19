const admin = require('firebase-admin');
const fs = require('fs');

const blueprint = JSON.parse(fs.readFileSync('firebase-blueprint.json', 'utf8'));
const projectId = blueprint.projectId || 'ai-studio-00838a2a-ec33-4aed-a144-9f05214a6c85';

process.env.FIRESTORE_EMULATOR_HOST = undefined;

admin.initializeApp({
  projectId: projectId,
});

const db = admin.firestore();

async function run() {
  try {
    const usersSnapshot = await db.collection('users').where('email', '==', 'sefadinkedir@gmail.com').get();
    if (usersSnapshot.empty) {
      console.log('User not found');
    } else {
      for (const doc of usersSnapshot.docs) {
        await doc.ref.update({
          role: 'super_admin',
          status: 'approved'
        });
        console.log('User updated:', doc.id);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
run();
