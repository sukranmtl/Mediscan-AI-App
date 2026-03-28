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
                    text: `Sen yaşlı bireylere yardımcı olan bir sağlık asistanısın. Aşağıdaki ilaç prospektüsünü yaşlı bireyler için sadeleştir ve anlaşılır hale getir. Yanıtını şu formatta ver:

NASIL KULLANILIR:
[Basit, net talimatlar. Günde kaç kez, ne zaman, yemekle mi açken mi gibi. Her maddeyi ayrı satırda yaz.]

DİKKAT EDİLECEKLER:
[Önemli uyarılar, kişinin dikkat etmesi gerekenler. Her maddeyi ayrı satırda yaz.]

YAN ETKİLER:
[Olası yan etkiler basit dille. Her yan etkiyi ayrı satırda yaz.]

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
        const errorMessage = errorData.error?.message || 'Bilinmeyen hata';
        throw new Error(`API Hatası (${response.status}): ${errorMessage}`);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;

      const sections = {
        nasil_kullanilir: '',
        dikkat_edilecekler: '',
        yan_etkiler: '',
      };

      const nasılMatch = text.match(/NASIL KULLANILIR:([\s\S]*?)(?=DİKKAT EDİLECEKLER:|$)/i);
      const dikkatMatch = text.match(/DİKKAT EDİLECEKLER:([\s\S]*?)(?=YAN ETKİLER:|$)/i);
      const yanMatch = text.match(/YAN ETKİLER:([\s\S]*?)$/i);

      sections.nasil_kullanilir = nasılMatch ? nasılMatch[1].trim() : '';
      sections.dikkat_edilecekler = dikkatMatch ? dikkatMatch[1].trim() : '';
      sections.yan_etkiler = yanMatch ? yanMatch[1].trim() : '';

      setResult(sections);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bir hata oluştu';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <header className="text-center mb-16">
          <div className="flex items-center justify-center gap-6 mb-6">
            <Pill className="w-20 h-20 text-blue-700" strokeWidth={3} />
            <h1 className="text-7xl font-extrabold text-gray-900">Mediscan AI</h1>
          </div>
          <p className="text-3xl font-semibold text-gray-700">İlaç prospektüslerini kolayca anlayın</p>
        </header>

        <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10 border-4 border-gray-200">
          <div className="mb-8">
            <label htmlFor="apiKey" className="block text-3xl font-bold text-gray-900 mb-4">
              Gemini API Anahtarı
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API anahtarınızı buraya girin"
              className="w-full px-8 py-6 text-2xl border-4 border-gray-400 rounded-2xl focus:ring-4 focus:ring-blue-600 focus:border-blue-600 transition-all font-semibold"
            />
            <p className="mt-4 text-xl text-gray-700 font-medium">
              API anahtarı almak için:{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline hover:text-blue-900 font-bold"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="mb-8">
            <label htmlFor="prospectus" className="block text-3xl font-bold text-gray-900 mb-4">
              İlaç Prospektüsü
            </label>
            <textarea
              id="prospectus"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="İlaç prospektüsünü buraya yapıştırın..."
              rows={12}
              className="w-full px-8 py-6 text-2xl border-4 border-gray-400 rounded-2xl focus:ring-4 focus:ring-blue-600 focus:border-blue-600 transition-all resize-none font-medium leading-relaxed"
            />
          </div>

          <button
            onClick={simplifyMedication}
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white text-3xl font-extrabold py-8 px-10 rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-2xl disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-10 h-10 animate-spin" />
                İşleniyor...
              </>
            ) : (
              'Sadeleştir'
            )}
          </button>

          {error && (
            <div className="mt-8 bg-red-100 border-4 border-red-500 text-red-900 px-8 py-6 rounded-2xl flex items-start gap-4">
              <AlertCircle className="w-10 h-10 flex-shrink-0 mt-1" />
              <p className="text-2xl font-bold">{error}</p>
            </div>
          )}
        </div>

        {result && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl shadow-2xl p-10 border-l-[12px] border-green-600">
              <div className="flex items-center gap-4 mb-6">
                <CheckCircle className="w-14 h-14 text-green-700" strokeWidth={3} />
                <h2 className="text-4xl font-extrabold text-gray-900">Nasıl Kullanılır?</h2>
              </div>
              <p className="text-2xl leading-[2.5rem] text-gray-900 whitespace-pre-wrap font-medium">
                {result.nasil_kullanilir}
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-10 border-l-[12px] border-yellow-600">
              <div className="flex items-center gap-4 mb-6">
                <AlertCircle className="w-14 h-14 text-yellow-700" strokeWidth={3} />
                <h2 className="text-4xl font-extrabold text-gray-900">Dikkat Edilecekler</h2>
              </div>
              <p className="text-2xl leading-[2.5rem] text-gray-900 whitespace-pre-wrap font-medium">
                {result.dikkat_edilecekler}
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-10 border-l-[12px] border-red-600">
              <div className="flex items-center gap-4 mb-6">
                <AlertCircle className="w-14 h-14 text-red-700" strokeWidth={3} />
                <h2 className="text-4xl font-extrabold text-gray-900">Yan Etkiler</h2>
              </div>
              <p className="text-2xl leading-[2.5rem] text-gray-900 whitespace-pre-wrap font-medium">
                {result.yan_etkiler}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
