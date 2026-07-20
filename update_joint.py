import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

target = """  const handleCreateJointSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      groupId,
      splitFactor,
      member1Type,
      member1Id,
      member1Name,
      member1Phone,
      member1Password,
      member2Type,
      member2Id,
      member2Name,
      member2Phone,
      member2Password,
    } = jointSlotForm;

    if (!groupId) {"""

replacement = """  const handleCreateJointSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      groupId,
      splitFactor,
      member1Type,
      member1Id,
      member1Name,
      member1Phone,
      member1Password,
      member2Type,
      member2Id,
      member2Name,
      member2Phone,
      member2Password,
      member3Type,
      member3Id,
      member3Name,
      member3Phone,
      member3Password,
      member4Type,
      member4Id,
      member4Name,
      member4Phone,
      member4Password,
    } = jointSlotForm;

    if (!groupId) {"""

content = content.replace(target, replacement)

target2 = """    if (member2Type === 'new' && (!member2Name || !member2Phone)) {
      triggerSuccess(
        language === 'am' ? 'ስህተት' : 'Error',
        language === 'am' ? 'እባክዎ ለአባል 2 ሙሉ ስምና ስልክ ቁጥር ያስገቡ!' : 'Please provide Name and Phone for Member 2!'
      );
      return;
    }

    if (member1Type === 'existing' && member2Type === 'existing' && member1Id === member2Id) {
      triggerSuccess(
        language === 'am' ? 'ስህተት' : 'Error',
        language === 'am' ? 'ተመሳሳይ አባልን ከራሱ ጋር ማጣመር አይቻልም!' : 'Cannot pair a member with themselves!'
      );
      return;
    }"""

replacement2 = """    if (member2Type === 'new' && (!member2Name || !member2Phone)) {
      triggerSuccess(
        language === 'am' ? 'ስህተት' : 'Error',
        language === 'am' ? 'እባክዎ ለአባል 2 ሙሉ ስምና ስልክ ቁጥር ያስገቡ!' : 'Please provide Name and Phone for Member 2!'
      );
      return;
    }

    if (splitFactor >= 3) {
      if (member3Type === 'existing' && !member3Id) {
        triggerSuccess(language === 'am' ? 'ስህተት' : 'Error', language === 'am' ? 'እባክዎ አባል 3 ይምረጡ!' : 'Please select Member 3!');
        return;
      }
      if (member3Type === 'new' && (!member3Name || !member3Phone)) {
        triggerSuccess(language === 'am' ? 'ስህተት' : 'Error', language === 'am' ? 'እባክዎ ለአባል 3 ሙሉ ስምና ስልክ ቁጥር ያስገቡ!' : 'Please provide Name and Phone for Member 3!');
        return;
      }
    }

    if (splitFactor >= 4) {
      if (member4Type === 'existing' && !member4Id) {
        triggerSuccess(language === 'am' ? 'ስህተት' : 'Error', language === 'am' ? 'እባክዎ አባል 4 ይምረጡ!' : 'Please select Member 4!');
        return;
      }
      if (member4Type === 'new' && (!member4Name || !member4Phone)) {
        triggerSuccess(language === 'am' ? 'ስህተት' : 'Error', language === 'am' ? 'እባክዎ ለአባል 4 ሙሉ ስምና ስልክ ቁጥር ያስገቡ!' : 'Please provide Name and Phone for Member 4!');
        return;
      }
    }

    const existingIds = [
      member1Type === 'existing' ? member1Id : null,
      member2Type === 'existing' ? member2Id : null,
      splitFactor >= 3 && member3Type === 'existing' ? member3Id : null,
      splitFactor >= 4 && member4Type === 'existing' ? member4Id : null
    ].filter(Boolean);

    if (new Set(existingIds).size !== existingIds.length) {
      triggerSuccess(
        language === 'am' ? 'ስህተት' : 'Error',
        language === 'am' ? 'ተመሳሳይ አባልን ከራሱ ጋር ማጣመር አይቻልም!' : 'Cannot pair a member with themselves!'
      );
      return;
    }"""

content = content.replace(target2, replacement2)

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)

