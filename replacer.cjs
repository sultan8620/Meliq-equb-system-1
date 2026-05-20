const fs = require('fs');

const file = 'src/pages/Signup.tsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/step === 1/g, "stepConfig[step - 1]?.id === 'personal'");
  content = content.replace(/step === 2/g, "stepConfig[step - 1]?.id === 'birthplace'");
  content = content.replace(/step === 3/g, "stepConfig[step - 1]?.id === 'address'");
  content = content.replace(/step === 4/g, "stepConfig[step - 1]?.id === 'ekub_group'");
  content = content.replace(/step === 5/g, "stepConfig[step - 1]?.id === 'kyc_photo'");
  content = content.replace(/step === 6/g, "stepConfig[step - 1]?.id === 'confirmation'");
  
  // also modify stepConfig definition
  const oldConfig = `  const stepConfig = useMemo(() => [
    { title: t('signup.personal'), color: 'bg-amber-500', icon: User },
    { title: t('signup.birthplace'), color: 'bg-blue-500', icon: Baby },
    { title: t('signup.address'), color: 'bg-purple-500', icon: MapPin },
    { title: t('signup.ekub_group'), color: 'bg-orange-500', icon: Calendar },
    { title: t('signup.kyc_photo'), color: 'bg-rose-500', icon: CreditCard },
    { title: t('signup.confirmation'), color: 'bg-amber-500', icon: CheckCircle },
  ], [t]);`;
  
  const newConfig = `  const stepConfig = useMemo(() => {
    const config = [];
    config.push({ id: 'personal', title: t('signup.personal'), color: 'bg-amber-500', icon: User });
    if (systemSettings.signupShowBirthplace !== false) config.push({ id: 'birthplace', title: t('signup.birthplace'), color: 'bg-blue-500', icon: Baby });
    if (systemSettings.signupShowAddress !== false) config.push({ id: 'address', title: t('signup.address'), color: 'bg-purple-500', icon: MapPin });
    if (systemSettings.signupShowGroup !== false) config.push({ id: 'ekub_group', title: t('signup.ekub_group'), color: 'bg-orange-500', icon: Calendar });
    if (systemSettings.signupShowKYC !== false) config.push({ id: 'kyc_photo', title: t('signup.kyc_photo'), color: 'bg-rose-500', icon: CreditCard });
    config.push({ id: 'confirmation', title: t('signup.confirmation'), color: 'bg-amber-500', icon: CheckCircle });
    return config;
  }, [t, systemSettings]);`;
  
  content = content.replace(oldConfig, newConfig);

  // We should also replace the progress dot math.
  content = content.replace(/stepConfig\.map\(\(s, i\)/g, "stepConfig.map((s: any, i: number)");

  fs.writeFileSync(file, content);
  console.log('Replaced steps in ' + file);
}
