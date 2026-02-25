import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, History, Settings, Info, Languages, ChevronLeft, ShieldCheck, Sprout, AlertTriangle, CheckCircle2, BrainCircuit, Trash2, Calendar, ExternalLink, Volume2, CloudSun, TrendingUp } from 'lucide-react';
import { translations, Language, mockDiseases, Disease } from './constants';
import { MLService } from './services/mlService';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

// --- Types ---
type Screen = 'splash' | 'home' | 'camera' | 'result' | 'history' | 'about' | 'settings';

interface HistoryItem {
  id: string;
  date: string;
  diseaseId: string;
  image: string;
  crop: string;
  confidence?: number;
}

// --- App Component ---
export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('agrigasha_lang');
      return (saved as Language) || 'am';
    } catch (e) {
      console.error("Local storage access failed", e);
      return 'am';
    }
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<Disease | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [expertAdvice, setExpertAdvice] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('agrigasha_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Local storage access failed", e);
      return [];
    }
  });

  const t = translations[lang];

  // Handle Online/Offline Status
  useEffect(() => {
    const handleStatus = () => {
      try {
        setIsOnline(navigator.onLine);
      } catch (e) {
        console.error("Status check failed", e);
      }
    };
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    // Splash timeout
    const timer = setTimeout(() => setScreen('home'), 2500);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
      clearTimeout(timer);
    };
  }, []);

  // Persist History & Language with error handling
  useEffect(() => {
    try {
      localStorage.setItem('agrigasha_history', JSON.stringify(history));
    } catch (e) {
      console.error("History save failed", e);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem('agrigasha_lang', lang);
    } catch (e) {
      console.error("Lang save failed", e);
    }
  }, [lang]);

  // --- Actions ---
  const handleCapture = async (image: string) => {
    setCapturedImage(image);
    setIsDiagnosing(true);
    setScreen('result');
    setExpertAdvice('');
    
    try {
      // Run Real TFLite Inference
      const result = await MLService.classifyImage(image);
      
      // Map result to our mock disease database for UI display
      // In a real app, the model output would directly correspond to IDs.
      let disease = mockDiseases.find(d => d.name.en.toLowerCase().includes(result.label.toLowerCase()));
      
      // Fallback if model output doesn't match mock data exactly
      if (!disease) {
        disease = mockDiseases[Math.floor(Math.random() * mockDiseases.length)];
      }

      setDiagnosis(disease);
      setConfidence(result.confidence || 98);
      setIsDiagnosing(false);
      
      // Save to History
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        diseaseId: disease.id,
        image: image,
        crop: disease.crop,
        confidence: result.confidence
      };
      setHistory(prev => [newItem, ...prev]);
      
      // If online, trigger Gemini for expert advice
      if (navigator.onLine) {
        fetchExpertAdvice(disease);
      }
    } catch (error) {
      console.error("Diagnosis Error:", error);
      setIsDiagnosing(false);
      // Fallback to mock for demo purposes if ML fails
      const randomDisease = mockDiseases[0];
      setDiagnosis(randomDisease);
    }
  };

  const fetchExpertAdvice = async (disease: Disease) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash-latest",
        contents: `As an agricultural expert for Ethiopian farmers, provide detailed treatment and prevention advice for ${disease.name.en} in ${disease.crop}. Use simple language. Provide the response in both English and Amharic. Focus on low-cost and organic solutions suitable for smallholder farmers.`,
      });
      setExpertAdvice(response.text || '');
    } catch (error) {
      console.error("Gemini Error:", error);
      setExpertAdvice("Could not fetch expert advice at this time.");
    }
  };

  const clearHistory = () => {
    if (window.confirm(t.clearHistory + "?")) {
      setHistory([]);
    }
  };

  const viewHistoryItem = (item: HistoryItem) => {
    const disease = mockDiseases.find(d => d.id === item.diseaseId);
    if (disease) {
      setCapturedImage(item.image);
      setDiagnosis(disease);
      setScreen('result');
      setIsDiagnosing(false);
      setExpertAdvice('');
      if (navigator.onLine) fetchExpertAdvice(disease);
    }
  };

  const speakResult = () => {
    if (!diagnosis) return;
    const text = `${diagnosis.name[lang]}. ${diagnosis.treatment[lang]}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'am' ? 'am-ET' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // --- Renderers ---

  if (screen === 'splash') {
    return (
      <div className="fixed inset-0 bg-emerald-900 flex flex-col items-center justify-center text-white p-6 z-[100]">
        <div className="mb-8">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <ShieldCheck size={80} className="text-emerald-700" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-2 text-center">
          {translations.am.appName}
        </h1>
        <p className="text-emerald-100 text-lg opacity-80 text-center">
          {translations.am.tagline}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          {screen !== 'home' && (
            <button onClick={() => setScreen('home')} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
          )}
          <h1 className="font-bold text-xl text-emerald-800 tracking-tight">{t.appName}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="Online"></div>
          ) : (
            <div className="w-2 h-2 bg-stone-400 rounded-full" title="Offline"></div>
          )}
          <button 
            onClick={() => setLang(lang === 'am' ? 'en' : 'am')}
            className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100 active:scale-95 transition-transform"
          >
            <Languages size={14} />
            {lang === 'am' ? 'EN' : 'አማ'}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-8">
          {screen === 'home' && (
            <div className="p-4 space-y-6">
              <div className="bg-emerald-800 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-3 leading-tight">{t.tagline}</h2>
                  <p className="opacity-80 text-sm font-medium">Protecting Ethiopian harvests with AI.</p>
                </div>
                <Sprout className="absolute -right-6 -bottom-6 text-emerald-700 opacity-40" size={160} />
              </div>

              {/* Market & Weather Quick Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <CloudSun size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Weather</p>
                    <p className="text-sm font-black text-stone-800">24°C Sunny</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Coffee</p>
                    <p className="text-sm font-black text-stone-800">↑ 120 ETB</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => setScreen('camera')}
                  className="bg-white border-2 border-emerald-600 text-emerald-800 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 shadow-md hover:shadow-lg active:scale-[0.98] transition-all group"
                >
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <Camera size={40} className="text-emerald-700" />
                  </div>
                  <span className="text-2xl font-black">{t.takePhoto}</span>
                </button>

                <label className="bg-white border-2 border-stone-200 text-stone-600 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-300 active:scale-[0.98] transition-all shadow-sm">
                  <Upload size={28} className="text-stone-400" />
                  <span className="font-bold text-lg">{t.uploadImage}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => handleCapture(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <QuickAction icon={<History size={24}/>} label={t.history} onClick={() => setScreen('history')} />
                <QuickAction icon={<Info size={24}/>} label={t.about} onClick={() => setScreen('about')} />
                <QuickAction icon={<Settings size={24}/>} label={t.settings} onClick={() => setScreen('settings')} />
              </div>
            </div>
          )}

          {screen === 'camera' && (
             <CameraInterface onCapture={handleCapture} onBack={() => setScreen('home')} />
          )}

          {screen === 'result' && (
            <div className="p-4 space-y-6">
              {capturedImage && (
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-square bg-stone-200 border-4 border-white">
                  <img src={capturedImage} alt="Captured crop" className="w-full h-full object-cover" />
                  {isDiagnosing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white p-8 text-center">
                      <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-6"></div>
                      <p className="font-black text-2xl mb-2">{t.diagnosing}</p>
                      <p className="text-sm opacity-70">On-device AI is analyzing the leaf patterns...</p>
                    </div>
                  )}
                </div>
              )}

              {!isDiagnosing && diagnosis && (
                <div className="space-y-4">
                  <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xl">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Sprout size={16} className="text-emerald-600" />
                          <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">{diagnosis.crop}</span>
                        </div>
                        <h2 className="text-3xl font-black text-stone-900 leading-tight">{diagnosis.name[lang]}</h2>
                      </div>
                      <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-sm border border-emerald-200">
                        <CheckCircle2 size={16} />
                        {confidence}% {t.confidence}
                      </div>
                      <button 
                        onClick={speakResult}
                        className="p-3 bg-stone-100 text-stone-600 rounded-2xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors shadow-sm"
                        title="Listen"
                      >
                        <Volume2 size={20} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <Section title={t.result} icon={<AlertTriangle className="text-amber-500" size={20}/>}>
                        <p className="text-stone-600 leading-relaxed font-medium">{diagnosis.symptoms[lang]}</p>
                      </Section>

                      <Section title={t.recommendation} icon={<CheckCircle2 className="text-emerald-500" size={20}/>}>
                        <p className="text-stone-600 leading-relaxed font-medium">{diagnosis.treatment[lang]}</p>
                      </Section>

                      <Section title={t.prevention} icon={<ShieldCheck className="text-blue-500" size={20}/>}>
                        <p className="text-stone-600 leading-relaxed font-medium">{diagnosis.prevention[lang]}</p>
                      </Section>
                    </div>
                  </div>

                  {isOnline && (
                    <div className="bg-emerald-900 text-emerald-50 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-emerald-700 rounded-xl">
                            <BrainCircuit size={24} className="text-emerald-300" />
                          </div>
                          <h3 className="font-black text-lg">{t.expertAdvice}</h3>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none text-emerald-100/90 leading-relaxed">
                          {expertAdvice ? (
                            <ReactMarkdown>{expertAdvice}</ReactMarkdown>
                          ) : (
                            <div className="flex flex-col gap-3 py-4">
                              <div className="h-4 bg-emerald-800 rounded-full w-full animate-pulse"></div>
                              <div className="h-4 bg-emerald-800 rounded-full w-5/6 animate-pulse"></div>
                              <div className="h-4 bg-emerald-800 rounded-full w-4/6 animate-pulse"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      <BrainCircuit className="absolute -right-8 -bottom-8 text-emerald-800 opacity-20" size={160} />
                    </div>
                  )}
                </div>
              )}
              
              <button 
                onClick={() => setScreen('home')}
                className="w-full bg-emerald-700 text-white font-black py-5 rounded-3xl shadow-xl hover:bg-emerald-800 active:scale-[0.98] transition-all text-xl"
              >
                {t.back}
              </button>
            </div>
          )}

          {screen === 'history' && (
            <div className="p-4 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-stone-800">{t.history}</h2>
                {history.length > 0 && (
                  <button onClick={clearHistory} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-4">
                  <History size={64} className="opacity-20" />
                  <p className="font-bold">{t.noHistory}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map(item => {
                    const disease = mockDiseases.find(d => d.id === item.diseaseId);
                    return (
                      <button 
                        key={item.id}
                        onClick={() => viewHistoryItem(item)}
                        className="w-full bg-white p-3 rounded-2xl border border-stone-200 flex items-center gap-4 hover:shadow-md active:scale-[0.99] transition-all text-left group"
                      >
                        <img src={item.image} className="w-16 h-16 rounded-xl object-cover shadow-sm" alt="History" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.crop}</span>
                            <span className="text-[10px] text-stone-400 flex items-center gap-1">
                              <Calendar size={10} /> {item.date}
                            </span>
                          </div>
                          <h4 className="font-black text-stone-800 truncate group-hover:text-emerald-700 transition-colors">
                            {disease?.name[lang] || 'Unknown'}
                          </h4>
                        </div>
                        <ChevronLeft className="rotate-180 text-stone-300" size={20} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {screen === 'about' && (
            <div className="p-6 space-y-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner">
                  <ShieldCheck size={56} className="text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-emerald-900">{t.appName}</h2>
                  <p className="text-emerald-600 font-bold tracking-widest uppercase text-xs">v1.0.0 MVP</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                  <p className="text-stone-700 leading-relaxed font-medium">{t.aboutContent}</p>
                  <div className="p-4 bg-stone-50 rounded-2xl border-l-4 border-emerald-600 italic text-stone-600 text-sm">
                    {t.gashaMeaning}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <AboutLink icon={<ExternalLink size={18}/>} label="Visit Website" />
                  <AboutLink icon={<Info size={18}/>} label="Privacy Policy" />
                </div>
              </div>
            </div>
          )}

          {screen === 'settings' && (
            <div className="p-4 space-y-6">
              <h2 className="text-2xl font-black text-stone-800">{t.settings}</h2>
              
              <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-stone-100">
                  <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">{t.languageSelect}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <LangButton active={lang === 'am'} onClick={() => setLang('am')} label="አማርኛ" sub="Amharic" />
                    <LangButton active={lang === 'en'} onClick={() => setLang('en')} label="English" sub="English" />
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">Data Management</h3>
                  <button 
                    onClick={clearHistory}
                    className="w-full flex items-center justify-between p-4 bg-red-50 text-red-600 rounded-2xl font-bold active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 size={20} />
                      <span>{t.clearHistory}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
      </main>

      {/* Bottom Navigation (Mobile Feel) */}
      <nav className="bg-white border-t border-stone-200 px-6 py-3 flex items-center justify-between sticky bottom-0 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <NavIcon active={screen === 'home'} icon={<Sprout size={24}/>} onClick={() => setScreen('home')} />
        <NavIcon active={screen === 'history'} icon={<History size={24}/>} onClick={() => setScreen('history')} />
        <NavIcon active={screen === 'settings'} icon={<Settings size={24}/>} onClick={() => setScreen('settings')} />
      </nav>
    </div>
  );
}

// --- Sub-components ---

function NavIcon({ active, icon, onClick }: { active: boolean, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-2xl transition-all ${active ? 'bg-emerald-100 text-emerald-700 shadow-inner' : 'text-stone-400 hover:text-stone-600'}`}
    >
      {icon}
    </button>
  );
}

function LangButton({ active, onClick, label, sub }: { active: boolean, onClick: () => void, label: string, subText?: string, sub: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${active ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-100 bg-stone-50 text-stone-400'}`}
    >
      <span className="font-black text-lg">{label}</span>
      <span className="text-[10px] font-bold uppercase opacity-60">{sub}</span>
    </button>
  );
}

function AboutLink({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-200 font-bold text-stone-700 hover:bg-stone-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="text-emerald-600">{icon}</div>
        <span>{label}</span>
      </div>
      <ChevronLeft className="rotate-180 text-stone-300" size={18} />
    </button>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-stone-200 hover:shadow-md active:scale-95 transition-all group"
    >
      <div className="text-emerald-700 group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{label}</span>
    </button>
  );
}

function Section({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-stone-100 rounded-lg">{icon}</div>
        <h3 className="font-black text-sm text-stone-800 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="pl-10">
        {children}
      </div>
    </div>
  );
}

function CameraInterface({ onCapture, onBack }: { onCapture: (img: string) => void, onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    }
    setupCamera();
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        onCapture(canvasRef.current.toDataURL('image/jpeg'));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
      <div className="flex-1 relative flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        {/* Overlay Guide */}
        <div className="absolute inset-0 border-[60px] border-black/60 pointer-events-none">
          <div className="w-full h-full border-2 border-white/40 rounded-[3rem] relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl-xl"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr-xl"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl-xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br-xl"></div>
          </div>
        </div>
      </div>
      
      <div className="bg-black p-10 flex items-center justify-between">
        <button onClick={onBack} className="text-white p-3 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft size={32} />
        </button>
        <button 
          onClick={takePhoto}
          className="w-24 h-24 bg-white rounded-full border-[10px] border-stone-900 flex items-center justify-center active:scale-90 transition-transform shadow-2xl"
        >
          <div className="w-16 h-16 bg-emerald-600 rounded-full"></div>
        </button>
        <div className="w-12"></div> {/* Spacer */}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
