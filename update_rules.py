import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

target = """                ] : [
                  { id: 'j1', amTitle: 'የጋራ እና የማያቋርጥ ኃላፊነት (Joint Liability)', enTitle: 'Joint & Several Liability', am: 'ሁለቱም የጋራ እጣ አጋሮች በሙሉ እጣው ላይ እኩል ኃላፊነት አለባቸው። አንዱ አጋር ክፍያ መክፈል ካልቻለ፣ ሌላኛው አጋር ክፍያውን ሙሉ በሙሉ የመሙላት ህጋዊ ግዴታ አለበት።', en: 'Both partners have solidary liability. If one fails to pay, the other is legally bound to cover the full payment.' },
                  { id: 'j2', amTitle: 'የእጣ ክፍፍል (Payout Split)', enTitle: 'Payout Distribution', am: 'በእጣው ወቅት እጣው ሲወጣ አጠቃላይ የእጣ ገንዘቡ ለአጋሮቹ እኩል ይከፈላል (አባሉ በገባበት ' + (jointSlots[0]?.splitFactor ? '1/' + jointSlots[0].splitFactor : '1/2') + ' ድርሻ መጠን መሰረት)።', en: 'Upon winning the draw, the total payout will be split and distributed proportionally according to the member\\'s share ratio.' },
                  { id: 'j3', amTitle: 'የዋስትና ግዴታ (Joint Guarantor)', enTitle: 'Guarantor Requirement', am: 'እጣው ለጋራ እጣው ሲወጣ፣ ሁለቱም አጋሮች የየራሳቸውን ታማኝ ዋስትና ማቅረብ ይኖርባቸዋል።', en: 'When the joint slot wins, both partners must supply reliable guarantors.' },
                  { id: 'j4', amTitle: 'የኮሚሽን ክፍያ (Commission Division)', enTitle: 'Commission Division', am: 'እያንዳንዱ የጋራ እጣ አጋር ለገባበት የዕቁብ መጠን 10% የድርጅቱን ኮሚሽን እኩል ተካፍለው ይከፍላሉ።', en: 'Each partner shares the 10% service commission equally based on their share fraction.' }
                ]).map((rule, idx) => ("""

replacement = """                ] : [
                  { id: 'j1', amTitle: 'የጋራ እና የማያቋርጥ ኃላፊነት (Joint Liability)', enTitle: 'Joint & Several Liability', am: 'ሁሉም የጋራ እጣ አጋሮች በሙሉ እጣው ላይ እኩል ኃላፊነት አለባቸው። አንዱ አጋር ክፍያ መክፈል ካልቻለ፣ ሌላኛው አጋር ክፍያውን የመሙላት ህጋዊ ግዴታ አለበት።', en: 'All partners have solidary liability. If one fails to pay, the others are legally bound to cover the payment.' },
                  { id: 'j2', amTitle: 'የእጣ ክፍፍል (Payout Split)', enTitle: 'Payout Distribution', am: 'በእጣው ወቅት እጣው ሲወጣ አጠቃላይ የእጣ ገንዘቡ ለአጋሮቹ እኩል ይከፈላል (አባሉ በገባበት ' + (jointSlots[0]?.splitFactor ? '1/' + jointSlots[0].splitFactor : '1/2') + ' ድርሻ መጠን መሰረት)።', en: 'Upon winning the draw, the total payout will be split and distributed proportionally according to the member\\'s share ratio.' },
                  { id: 'j3', amTitle: 'የዋስትና ግዴታ (Joint Guarantor)', enTitle: 'Guarantor Requirement', am: 'እጣው ለጋራ እጣው ሲወጣ፣ ሁሉም አጋሮች የየራሳቸውን ታማኝ ዋስትና ማቅረብ ይኖርባቸዋል።', en: 'When the joint slot wins, all partners must supply reliable guarantors.' },
                  { id: 'j4', amTitle: 'የኮሚሽን ክፍያ (Commission Division)', enTitle: 'Commission Division', am: 'እያንዳንዱ የጋራ እጣ አጋር ለገባበት የዕቁብ መጠን 10% የድርጅቱን ኮሚሽን እኩል ተካፍለው ይከፍላሉ።', en: 'Each partner shares the 10% service commission proportionally based on their share fraction.' }
                ]).map((rule, idx) => ("""

content = content.replace(target, replacement)

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)

