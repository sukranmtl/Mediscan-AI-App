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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
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
[Basit, net talimatlar. Günde kaç kez, ne zaman, yemekle mi açken mi gibi]

DİKKAT EDİLECEKLER:
[Önemli uyarılar, kişinin dikkat etmesi gerekenler]

YAN ETKİLER:
[Olası yan etkiler basit dille]

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
        throw new Error('API isteği başarısız oldu');
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
      setError('Bir hata oluştu. Lütfen API anahtarınızı kontrol edin ve tekrar deneyin.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Pill className="w-16 h-16 text-blue-600" strokeWidth={2.5} />
            <h1 className="text-5xl font-bold text-gray-800">Mediscan AI</h1>
          </div>
          <p className="text-2xl text-gray-600">İlaç prospektüslerini kolayca anlayın</p>
        </header>

        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="mb-6">
            <label htmlFor="apiKey" className="block text-2xl font-semibold text-gray-700 mb-3">
              Gemini API Anahtarı
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API anahtarınızı buraya girin"
              className="w-full px-6 py-4 text-xl border-3 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <p className="mt-2 text-lg text-gray-500">
              API anahtarı almak için:{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="prospectus" className="block text-2xl font-semibold text-gray-700 mb-3">
              İlaç Prospektüsü
            </label>
            <textarea
              id="prospectus"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="İlaç prospektüsünü buraya yapıştırın..."
              rows={10}
              className="w-full px-6 py-4 text-xl border-3 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          <button
            onClick={simplifyMedication}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-2xl font-bold py-6 px-8 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                İşleniyor...
              </>
            ) : (
              'Sadeleştir'
            )}
          </button>

          {error && (
            <div className="mt-6 bg-red-100 border-3 border-red-400 text-red-800 px-6 py-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-8 h-8 flex-shrink-0 mt-1" />
              <p className="text-xl font-medium">{error}</p>
            </div>
          )}
        </div>

        {result && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-l-8 border-green-500">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
                <h2 className="text-3xl font-bold text-gray-800">Nasıl Kullanılır?</h2>
              </div>
              <p className="text-xl leading-relaxed text-gray-700 whitespace-pre-wrap">
                {result.nasil_kullanilir}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8 border-l-8 border-yellow-500">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-10 h-10 text-yellow-600" />
                <h2 className="text-3xl font-bold text-gray-800">Dikkat Edilecekler</h2>
              </div>
              <p className="text-xl leading-relaxed text-gray-700 whitespace-pre-wrap">
                {result.dikkat_edilecekler}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8 border-l-8 border-red-500">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
                <h2 className="text-3xl font-bold text-gray-800">Yan Etkiler</h2>
              </div>
              <p className="text-xl leading-relaxed text-gray-700 whitespace-pre-wrap">
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
