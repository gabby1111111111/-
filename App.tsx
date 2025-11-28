import React, { useState, useRef } from 'react';
import { analyzeProfile } from './services/geminiService';
import { AnalysisResult, AnalysisStatus } from './types';
import AnalysisDashboard from './components/AnalysisDashboard';
import { Sparkles, ArrowRight, Loader2, Share2, Image as ImageIcon, X, FileJson, Upload, HelpCircle, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

// Default example text from user prompt for demo purposes
const DEFAULT_INPUT = `（不要写代码）我想在小红书和抖音做自媒体，分析一下我的账户：
我在小红书收获了3.5万次赞与收藏，来看看我的主页>> https://xhslink.com/m/3YKEMSeFMsc
0- 长按复制此条消息，打开抖音搜索，查看TA的更多作品。 https://v.douyin.com/Mws-VSOV6Fg/`;

function App() {
  const [inputText, setInputText] = useState(DEFAULT_INPUT);
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);
      let combinedData = "";
      
      let processedCount = 0;
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            // Validate if it looks like JSON
            JSON.parse(content); 
            combinedData += `\n\n--- FILE: ${file.name} ---\n${content}`;
          } catch (err) {
            combinedData += `\n\n--- FILE: ${file.name} (Raw Text) ---\n${event.target?.result}`;
          }
          processedCount++;
          if (processedCount === files.length) {
             setInputText(prev => {
                const separator = prev.trim() ? "\n\n" : "";
                return prev + separator + "--- IMPORTED SPIDER_XHS DATA ---" + combinedData;
             });
          }
        };
        reader.readAsText(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && images.length === 0) return;
    
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    
    try {
      const data = await analyzeProfile(inputText, images);
      setResult(data);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err) {
      console.error(err);
      setError("Unable to complete analysis. Please check your API key and try again.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-tr from-pink-500 to-violet-600 p-2 rounded-lg text-white">
              <Sparkles size={20} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-violet-600">
              CreatorMind
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900">How it works</a>
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900">Examples</a>
            <button className="bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
            Unlock your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">Social Potential</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Paste your bio, links OR <strong>raw JSON data</strong> from tools like Spider_XHS. <br className="hidden md:block"/>
            Our AI analyzes your metrics and aesthetics to provide a tailored strategy.
          </p>
        </div>

        {/* Input Area */}
        <div className="max-w-4xl mx-auto mb-16 relative z-10">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-2 ring-1 ring-slate-100">
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your profile intro, links, or JSON data from crawler tools here..."
                className="w-full min-h-[160px] p-6 text-lg text-slate-700 placeholder:text-slate-400 bg-transparent border-none focus:ring-0 resize-none rounded-2xl font-mono text-sm md:text-lg"
              />
              
              {/* Image Previews */}
              {images.length > 0 && (
                <div className="px-6 pb-4 flex flex-wrap gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt="preview" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col md:flex-row items-center justify-between px-6 pb-4 pt-2 gap-4 md:gap-0">
                <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                  {/* Screenshot Button */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 text-sm font-medium"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Screenshots</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                  />

                  {/* JSON Button */}
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => jsonInputRef.current?.click()}
                      className="flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-200 text-sm font-medium"
                    >
                      <FileJson className="w-4 h-4" />
                      <span>Upload Spider Data</span>
                    </button>
                     <button
                        onClick={() => setShowGuide(true)}
                        className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="How to get JSON data?"
                      >
                        <HelpCircle className="w-5 h-5" />
                      </button>
                  </div>
                  <input 
                    type="file" 
                    ref={jsonInputRef} 
                    onChange={handleJsonChange} 
                    className="hidden" 
                    accept=".json,application/json" 
                    multiple 
                  />

                  <div className="h-6 w-px bg-slate-200 mx-2 flex-shrink-0"></div>
                  <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                    <Share2 className="w-3 h-3 mr-1" /> XHS
                  </span>
                  <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-900 text-white border border-slate-700">
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.393 6.393 0 0 0-5.394 10.137 6.393 6.393 0 0 0 10.857-4.424V8.687a8.188 8.188 0 0 0 4.08 1.07v-3.42c-.056.01-.113.016-.17.023-.095.013-.19.022-.286.028-.396.025-.795.035-1.196.028l.342.27c0 .001.002.002.002.002z"/></svg>
                    Douyin
                  </span>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={status === AnalysisStatus.LOADING || (!inputText.trim() && images.length === 0)}
                  className={`w-full md:w-auto flex justify-center items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
                    status === AnalysisStatus.LOADING || (!inputText.trim() && images.length === 0)
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-slate-900/20 active:scale-95'
                  }`}
                >
                  {status === AnalysisStatus.LOADING ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Analyze Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Quick tips under input */}
          <div className="mt-4 flex flex-wrap justify-center gap-4 md:gap-6 text-sm text-slate-400">
             <span className="flex items-center"><ArrowRight className="w-3 h-3 mr-1" /> Paste share links</span>
             <span className="flex items-center"><ArrowRight className="w-3 h-3 mr-1" /> <strong>Upload Screenshots</strong></span>
             <span className="flex items-center text-indigo-500 font-medium"><Upload className="w-3 h-3 mr-1" /> Upload <strong>info.json</strong> from Spider_XHS</span>
          </div>
        </div>

        {/* Guide Modal */}
        {showGuide && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <div className="flex items-center space-x-2">
                  <Terminal className="text-indigo-600" size={24} />
                  <h3 className="text-xl font-bold text-slate-900">How to use Spider_XHS</h3>
                </div>
                <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <p className="text-slate-600">
                  Spider_XHS is a Python tool that scrapes detailed metrics from Xiaohongshu. Follow these steps to generate the <code>json</code> file needed for this app.
                </p>
                
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-semibold text-slate-800 mb-2 flex items-center"><span className="bg-slate-200 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span> Prerequisites</h4>
                    <p className="text-sm text-slate-600 mb-2">Install Python 3.7+ and Node.js (for decryption).</p>
                    <div className="flex space-x-4">
                       <a href="https://www.python.org/downloads/" target="_blank" className="text-indigo-600 text-xs font-medium flex items-center hover:underline"><ExternalLink size={12} className="mr-1"/> Python</a>
                       <a href="https://nodejs.org/" target="_blank" className="text-indigo-600 text-xs font-medium flex items-center hover:underline"><ExternalLink size={12} className="mr-1"/> Node.js</a>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-semibold text-slate-800 mb-2 flex items-center"><span className="bg-slate-200 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span> Setup</h4>
                    <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                      <li>Download the project code from GitHub.</li>
                      <li>Open a terminal in the project folder.</li>
                      <li>Run <code className="bg-white px-1 py-0.5 rounded border border-slate-200">pip install -r requirements.txt</code></li>
                      <li>Run <code className="bg-white px-1 py-0.5 rounded border border-slate-200">npm install</code></li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <h4 className="font-semibold text-amber-800 mb-2 flex items-center"><span className="bg-amber-200 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">3</span> Get Cookie (Critical)</h4>
                    <ol className="text-sm text-amber-900/80 space-y-1 list-decimal list-inside">
                      <li>Log in to <strong>xiaohongshu.com</strong> on Chrome.</li>
                      <li>Press <strong>F12</strong> (Developer Tools) → Click <strong>Network</strong> tab.</li>
                      <li>Refresh page. Click any request (e.g., <code className="text-xs">user/me</code>).</li>
                      <li>In <strong>Headers</strong>, find <code className="font-bold">cookie:</code>. Copy the value.</li>
                      <li>Create a <code className="font-bold">.env</code> file in the project folder:</li>
                    </ol>
                    <div className="mt-2 bg-white p-2 rounded border border-amber-200 text-xs font-mono text-slate-600 overflow-x-auto">
                      COOKIES="your_copied_cookie_string_here"
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-semibold text-slate-800 mb-2 flex items-center"><span className="bg-slate-200 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">4</span> Run & Upload</h4>
                    <p className="text-sm text-slate-600 mb-2">Edit <code>main.py</code> to include your profile URL, then run:</p>
                    <code className="block bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-mono mb-3">python main.py</code>
                    <p className="text-sm text-slate-600">
                      It will generate a <code>datas</code> folder. Upload the <code>info.json</code> file found there to this app!
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl text-center">
                <button onClick={() => setShowGuide(false)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                  Got it, I'm ready to upload
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Area */}
        <div className="max-w-6xl mx-auto">
          {error && (
             <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-center mb-8">
               {error}
             </div>
          )}
          
          {status === AnalysisStatus.SUCCESS && result && (
             <AnalysisDashboard data={result} />
          )}

          {status === AnalysisStatus.IDLE && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="h-48 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-full bg-slate-100" />
                    <div className="space-y-2">
                       <div className="h-4 w-3/4 bg-slate-100 rounded" />
                       <div className="h-4 w-1/2 bg-slate-100 rounded" />
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;