import { doc, updateDoc, serverTimestamp, collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export const getRevertPayoutCode = () => {
  return `
  const revertPayout = async (payoutId: string, userId: string) => {
    if (!await confirmAction(language === 'am' ? 'ይህንን ክፍያ ወደተጠባባቂ መመለስ እርግጠኛ ነዎት?' : 'Confirm revert this payout to pending?')) return;
    try {
      const payoutObj = payouts.find(p => p.id === payoutId) || allPayouts.find(p => p.id === payoutId);
      const groupId = payoutObj?.groupId;
      let targetGroup = groups.find(g => g.id === groupId);

      // 1. Revert payout status
      await updateDoc(doc(db, 'payouts', payoutId), {
        status: 'pending',
        revertedAt: serverTimestamp(),
        paidAt: null
      });

      // 2. Revert user payoutStatus
      if (userId) {
        await updateDoc(doc(db, 'users', userId), {
          payoutStatus: 'pending'
        });
      }

      // 3. Revert group state
      if (groupId) {
        // Find previous active payout to restore lastPayoutAt and lastPayoutRound
        const qPrev = query(
          collection(db, 'payouts'), 
          where('groupId', '==', groupId),
          where('status', '==', 'active')
        );
        const prevSnap = await getDocs(qPrev);
        const activePayouts = prevSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(p => p.id !== payoutId)
          .sort((a, b) => {
            const timeA = a.paidAt?.toMillis?.() || 0;
            const timeB = b.paidAt?.toMillis?.() || 0;
            return timeB - timeA;
          });

        const prevPayout = activePayouts[0];
        
        const roundNum = payoutObj?.round || targetGroup?.currentRound || 1;
        // If currentRound is greater than the round we are reverting, revert it back
        let newRound = targetGroup?.currentRound || 1;
        if (targetGroup && targetGroup.currentRound > roundNum) {
          newRound = roundNum;
        }

        const updateData: any = {
          status: 'active', // Restore group to active in case it was completed
          currentRound: newRound,
          updatedAt: serverTimestamp()
        };

        if (prevPayout) {
          updateData.lastPayoutAt = prevPayout.paidAt || serverTimestamp();
          updateData.lastPayoutRound = prevPayout.round || 1;
        } else {
          updateData.lastPayoutAt = null;
          updateData.lastPayoutRound = null;
        }

        await updateDoc(doc(db, 'groups', groupId), updateData);
      }

      // 4. Audit Log
      await addDoc(collection(db, 'audit_logs'), {
        type: 'payment',
        action: \`የእጣ ክፍያ ተመልሷል (Reverted) - ዙር \${payoutObj?.round || targetGroup?.currentRound || 1}\`,
        userName: payoutObj?.userName || 'Winner',
        amount: payoutObj?.amount || 0,
        groupId: groupId || '',
        createdAt: serverTimestamp(),
        status: 'success'
      }).catch(e => console.warn(e));

      await notifyUserAdminChange(userId, 'የእጣ ክፍያ ተመልሷል', 'Payout Reverted', 'የእጣ ክፍያዎ (Cash Out) ወደ ተጠባባቂ ተመልሷል::', 'Your ekub payout has been reverted to pending.');
      triggerSuccess(language === 'am' ? 'ማሳወቂያ' : 'Notice', language === 'am' ? 'ካሽ አውት ወደ ተጠባባቂ ተመልሷል::' : 'Payout reverted successfully.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, \`payouts/\${payoutId}\`);
    }
  };
  `;
}
