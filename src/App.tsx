import { useState } from 'react';
import { Pill, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface SimplifiedMedication {
  nasil_kullanilir: string;
  dikkat_edilecekler: string;
  yan_etkiler: string;
}

function App() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<SimplifiedMedication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');

  const simplifyMedication = async () => {
    if (!inputText.trim()) {
      setError('Lütfen ilaç prospektüsünü yapıştırın');
      return;
    }

    if (!apiKey.trim()) {
      setError('Lütfen Gemini API anahtarınızı girin');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey.substring(0, 8)}***`;
      console.log('API Çağrısı:', apiUrl);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Sen yaşlı bireylere yardımcı olan bir sağlık asistanısın. Aşağıdaki ilaç prospektüsünü yaşlı bireyler için sadeleştir ve anlaşılır hale getir. Yanıtını MUTLAKA şu başlıklarla ver:

NASIL KULLANILIR:
[Basit talimatlar]

DİKKAT EDİLECEKLER:
[Önemli uyarılar]

YAN ETKİLER:
[Yan etkiler]

İlaç Prospektüsü:
${inputText}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const msg = errorData.error?.message || 'Bilinmeyen hata';
        throw new Error(`Google API Hatası (${response.status}): ${msg}`);
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0]) {
        throw new Error('API yanıt vermedi, lütfen tekrar deneyin.');
      }

      const text = data.candidates[0].content.parts[0].text;

      const sections = {
        nasil_kullanilir: '',
        dikkat_edilecekler: '',
        yan_etkiler: '',
      };

      const nasilMatch = text.match(/NASIL KULLANILIR:([\s\S]*?)(?=DİKKAT EDİLECEKLER:|$)/i);
      const dikkatMatch = text.match(/DİKKAT EDİLECEKLER:([\s\S]*?)(?=YAN ETKİLER:|$)/i);
      const yanMatch = text.match(/YAN ETKİLER:([\s\S]*?)$/i);

      sections.nasil_kullanilir = nasilMatch ? nasilMatch[1].trim() : 'Bilgi alınamadı.';
      sections.dikkat_edilecekler = dikkatMatch ? dikkatMatch[1].trim() : 'Bilgi alınamadı.';
      sections.yan_etkiler = yanMatch ? yanMatch[1].trim() : 'Bilgi alınamadı.';

      setResult(sections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir bağlantı hatası oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 font-sans">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Pill className="w-16 h-16 text-blue-700" strokeWidth={2.5} />
            <h1 className="text-6xl font-black text-gray-900 tracking-tight">Mediscan AI</h1>
          </div>
          <p className="text-2xl font-bold text-gray-600 italic">Büyüklerimizin Sağlık Rehberi</p>
        </header>

        <div className="bg-white rounded-[40px] shadow-2xl p-10 mb-10 border-8 border-white ring-2 ring-gray-100">
          <div className="mb-8">
            <label className="block text-2xl font-black text-gray-800 mb-3">1. Gemini API Anahtarı</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API anahtarınızı buraya yapıştırın"
              className="w-full px-6 py-5 text-xl border-4 border-gray-200 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-blue-800 bg-gray-50"
            />
          </div>

          <div className="mb-8">
            <label className="block text-2xl font-black text-gray-800 mb-3">2. İlaç Prospektüsü</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="İlacın üzerindeki yazıları buraya kopyalayın..."
              rows={8}
              className="w-full px-6 py-5 text-xl border-4 border-gray-200 rounded-2xl focus:border-blue-500 outline-none transition-all resize-none font-medium leading-relaxed bg-gray-50"
            />
          </div>

          <button
            onClick={simplifyMedication}
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white text-3xl font-black py-7 rounded-3xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4"
          >
            {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : 'SADELEŞTİR'}
          </button>

          {error && (
            <div className="mt-8 bg-red-50 border-4 border-red-500 text-red-700 px-6 py-5 rounded-2xl flex items-center gap-4">
              <AlertCircle className="w-8 h-8 flex-shrink-0" />
              <p className="text-xl font-black uppercase tracking-wide leading-tight">{error}</p>
            </div>
          )}
        </div>

        {result && (
          <div className="grid gap-8 animate-in fade-in slide-in-from-bottom-4">
            <Section icon={<CheckCircle className="text-green-600 w-12 h-12" />} title="Nasıl Kullanılır?" content={result.nasil_kullanilir} borderColor="border-green-500" />
            <Section icon={<AlertCircle className="text-orange-600 w-12 h-12" />} title="Dikkat Edilecekler" content={result.dikkat_edilecekler} borderColor="border-orange-500" />
            <Section icon={<AlertCircle className="text-red-600 w-12 h-12" />} title="Yan Etkiler" content={result.yan_etkiler} borderColor="border-red-500" />
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, content, borderColor }: any) {
  return (
    <div className={`bg-white rounded-[35px] shadow-xl p-8 border-t-[15px] ${borderColor}`}>
      <div className="flex items-center gap-4 mb-4">
        {icon}
        <h2 className="text-3xl font-black text-gray-900">{title}</h2>
      </div>
      <div className="text-2xl leading-relaxed text-gray-800 font-bold whitespace-pre-wrap pl-2 border-l-4 border-gray-100">
        {content}
      </div>
    </div>
  );
}

export default App;
