import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

target = """      const m2Result = await createSlotForMember(
        member2Type,
        member2Id,
        member2Name,
        member2Phone,
        member2Password
      );

      const addedSlots = (1 / splitFactor) * 2;
      await updateDoc(doc(db, 'groups', groupId), {"""

replacement = """      const m2Result = await createSlotForMember(
        member2Type,
        member2Id,
        member2Name,
        member2Phone,
        member2Password
      );

      let m3Result = null;
      if (splitFactor >= 3) {
        m3Result = await createSlotForMember(
          member3Type,
          member3Id,
          member3Name,
          member3Phone,
          member3Password
        );
      }

      let m4Result = null;
      if (splitFactor >= 4) {
        m4Result = await createSlotForMember(
          member4Type,
          member4Id,
          member4Name,
          member4Phone,
          member4Password
        );
      }

      const addedSlots = (1 / splitFactor) * splitFactor; // always 1 full slot
      await updateDoc(doc(db, 'groups', groupId), {"""

content = content.replace(target, replacement)

target2 = """      setJointSlotForm({
        groupId: '',
        splitFactor: 2,
        member1Type: 'existing',
        member1Id: '',
        member1Name: '',
        member1Phone: '',
        member1Password: '123456',
        member2Type: 'existing',
        member2Id: '',
        member2Name: '',
        member2Phone: '',
        member2Password: '123456'
      });

      triggerSuccess(
        language === 'am' ? 'ማሳወቂያ' : 'Notice',
        language === 'am'
          ? `የጋራ እጣ ለ${m1Result.fullName} እና ለ${m2Result.fullName} በተሳካ ሁኔታ ተፈጥሯል!`
          : `Shared joint slot successfully created for ${m1Result.fullName} and ${m2Result.fullName}!`
      );"""

replacement2 = """      setJointSlotForm({
        groupId: '',
        splitFactor: 2,
        member1Type: 'existing',
        member1Id: '',
        member1Name: '',
        member1Phone: '',
        member1Password: '123456',
        member2Type: 'existing',
        member2Id: '',
        member2Name: '',
        member2Phone: '',
        member2Password: '123456',
        member3Type: 'existing',
        member3Id: '',
        member3Name: '',
        member3Phone: '',
        member3Password: '123456',
        member4Type: 'existing',
        member4Id: '',
        member4Name: '',
        member4Phone: '',
        member4Password: '123456',
      });

      let names = `${m1Result.fullName}, ${m2Result.fullName}`;
      if (m3Result) names += `, ${m3Result.fullName}`;
      if (m4Result) names += `, ${m4Result.fullName}`;

      triggerSuccess(
        language === 'am' ? 'ማሳወቂያ' : 'Notice',
        language === 'am'
          ? `የጋራ እጣ ለ${names} በተሳካ ሁኔታ ተፈጥሯል!`
          : `Shared joint slot successfully created for ${names}!`
      );"""

content = content.replace(target2, replacement2)

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)

