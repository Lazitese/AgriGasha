
export type Language = 'am' | 'en';

export interface Translation {
  appName: string;
  tagline: string;
  takePhoto: string;
  uploadImage: string;
  diagnosing: string;
  result: string;
  recommendation: string;
  prevention: string;
  history: string;
  settings: string;
  about: string;
  confidence: string;
  expertAdvice: string;
  back: string;
  noHistory: string;
  clearHistory: string;
  aboutContent: string;
  gashaMeaning: string;
  languageSelect: string;
  saveSuccess: string;
}

export const translations: Record<Language, Translation> = {
  am: {
    appName: "AgriGasha AI",
    tagline: "የእርሻ ጋሻ – ምርትዎን ይጠብቁ",
    takePhoto: "ፎቶ አንሳ",
    uploadImage: "ምስል ጫን",
    diagnosing: "በምርመራ ላይ...",
    result: "የምርመራ ውጤት",
    recommendation: "የሕክምና ምክር",
    prevention: "የመከላከያ ዘዴዎች",
    history: "ታሪክ",
    settings: "ቅንብሮች",
    about: "ስለ መተግበሪያው",
    confidence: "እርግጠኝነት",
    expertAdvice: "የባለሙያ ምክር (Gemini)",
    back: "ተመለስ",
    noHistory: "ምንም የተቀመጠ ታሪክ የለም",
    clearHistory: "ታሪክ አጽዳ",
    aboutContent: "አግሪጋሻ AI በኢትዮጵያ የሚገኙ አነስተኛ አምራች አርሶ አደሮች የሰብል በሽታዎችን እንዲለዩና ተገቢውን ሕክምና እንዲያገኙ የሚረዳ መተግበሪያ ነው።",
    gashaMeaning: "ጋሻ ማለት በባህላዊ የኢትዮጵያ የመከላከያ መሣሪያ ሲሆን፣ ይህ መተግበሪያም ለሰብልዎ እንደ ጋሻ ሆኖ ያገለግላል።",
    languageSelect: "ቋንቋ ይምረጡ",
    saveSuccess: "በታሪክ ውስጥ ተቀምጧል"
  },
  en: {
    appName: "AgriGasha AI",
    tagline: "Shield Your Harvest",
    takePhoto: "Take Photo",
    uploadImage: "Upload Image",
    diagnosing: "Diagnosing...",
    result: "Diagnosis Result",
    recommendation: "Treatment Advice",
    prevention: "Prevention Tips",
    history: "History",
    settings: "Settings",
    about: "About",
    confidence: "Confidence",
    expertAdvice: "Expert Advice (Gemini)",
    back: "Back",
    noHistory: "No history found",
    clearHistory: "Clear History",
    aboutContent: "AgriGasha AI helps Ethiopian smallholder farmers diagnose crop diseases and get treatment recommendations instantly.",
    gashaMeaning: "'Gasha' is a traditional Ethiopian shield. This app acts as a shield for your crops, protecting your harvest.",
    languageSelect: "Select Language",
    saveSuccess: "Saved to history"
  }
};

export interface Disease {
  id: string;
  name: Record<Language, string>;
  crop: string;
  symptoms: Record<Language, string>;
  treatment: Record<Language, string>;
  prevention: Record<Language, string>;
}

export const mockDiseases: Disease[] = [
  {
    id: "coffee_rust",
    crop: "Coffee",
    name: { am: "የቡና ቅጠል ዝገት", en: "Coffee Leaf Rust" },
    symptoms: { 
      am: "በቅጠሉ ስር ቢጫ ወይም ብርቱካናማ ነጠብጣቦች ይታያሉ።", 
      en: "Yellow or orange powdery spots appear on the underside of leaves." 
    },
    treatment: { 
      am: "የተጎዱ ቅጠሎችን ያስወግዱ። ኦርጋኒክ ፈንገስ ማጥፊያ ይጠቀሙ።", 
      en: "Remove infected leaves. Apply organic copper-based fungicides." 
    },
    prevention: { 
      am: "ጥሩ የአየር ዝውውር እንዲኖር ቡናውን ይገጥግጡ።", 
      en: "Prune coffee trees to ensure good air circulation." 
    }
  },
  {
    id: "maize_streak",
    crop: "Maize",
    name: { am: "የበቆሎ መስመር ቫይረስ", en: "Maize Streak Virus" },
    symptoms: { 
      am: "በቅጠሎች ላይ ረጅም ነጭ ወይም ቢጫ መስመሮች ይታያሉ።", 
      en: "Long white or yellow streaks along the leaf veins." 
    },
    treatment: { 
      am: "በሽታው ያለባቸውን ተክሎች ነቅሎ ማቃጠል።", 
      en: "Uproot and burn infected plants immediately." 
    },
    prevention: { 
      am: "ተከላካይ የሆኑ ዝርያዎችን ይጠቀሙ።", 
      en: "Use resistant maize varieties and control leafhoppers." 
    }
  },
  {
    id: "wheat_rust",
    crop: "Wheat",
    name: { am: "የስንዴ ዝገት", en: "Wheat Rust" },
    symptoms: { 
      am: "በቅጠሎች እና በግንድ ላይ ቀይ ወይም ቡናማ ነጠብጣቦች።", 
      en: "Reddish-brown pustules on leaves and stems." 
    },
    treatment: { 
      am: "ፈንገስ ማጥፊያዎችን በወቅቱ መጠቀም።", 
      en: "Apply appropriate fungicides early in the infection cycle." 
    },
    prevention: { 
      am: "ዝገትን የሚቋቋሙ የስንዴ ዝርያዎችን መዝራት።", 
      en: "Plant rust-resistant wheat varieties and rotate crops." 
    }
  }
];
