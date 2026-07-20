import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

target = """        const member1Uid = await createSlotForMember(member1Type, member1Id, member1Name, member1Phone, member1Password);
        const member2Uid = await createSlotForMember(member2Type, member2Id, member2Name, member2Phone, member2Password);

        // Record the event
        await addDoc(collection(db, 'admin_forms'), {"""

replacement = """        const member1Uid = await createSlotForMember(member1Type, member1Id, member1Name, member1Phone, member1Password);
        const member2Uid = await createSlotForMember(member2Type, member2Id, member2Name, member2Phone, member2Password);
        
        let member3Uid = null;
        if (splitFactor >= 3) {
          member3Uid = await createSlotForMember(member3Type, member3Id, member3Name, member3Phone, member3Password);
        }
        
        let member4Uid = null;
        if (splitFactor >= 4) {
          member4Uid = await createSlotForMember(member4Type, member4Id, member4Name, member4Phone, member4Password);
        }

        // Record the event
        await addDoc(collection(db, 'admin_forms'), {"""

if target in content:
    content = content.replace(target, replacement)
else:
    print("TARGET NOT FOUND. Trying regex...")
    
with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)

