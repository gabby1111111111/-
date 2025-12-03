import React, { useState, useRef, useMemo } from 'react';
import { analyzeProfile } from './services/geminiService';
import { AnalysisResult, AnalysisStatus } from './types';
import AnalysisDashboard from './components/AnalysisDashboard';
import { Sparkles, Loader2, Image as ImageIcon, X, FileJson, HelpCircle, Copy, ExternalLink, Filter, ChevronsDown, AlertTriangle, AlertCircle, FolderInput, Trash2, Database, Terminal, Calculator, Fingerprint, FileSpreadsheet, Download, Compass } from 'lucide-react';
import * as XLSX from 'xlsx';

// Default input is now empty to avoid user confusion
const DEFAULT_INPUT = ``;

function App() {
  const [inputText, setInputText] = useState(DEFAULT_INPUT);
  const [userGoal, setUserGoal] = useState(""); // New state for user goal
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  
  // New state for the downloadable cleaned Excel file
  const [downloadableData, setDownloadableData] = useState<any[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // Analyze the input text to show a live summary of what's been imported
  const dataSummary = useMemo(() => {
    const spiderMatch = inputText.match(/--- (?:BATCH )?IMPORTED SPIDER_XHS DATA(?: \(\d+ notes\))? ---/);
    const excelMatch = inputText.match(/--- IMPORTED EXCEL DATA(?: \(All Columns\))? ---/);
    const noteMatches = inputText.match(/--- NOTE: .+? ---/g);
    // Rough heuristic for meaningful JSON records or Excel array items
    const recordMatches = inputText.match(/"(liked_count|display_title|title|desc|comment_content|Likes|Description|Note_title)"/g); 

    if (!spiderMatch && !noteMatches && !excelMatch && !recordMatches) return null;

    return {
      source: excelMatch ? 'Excel 表格数据' : (spiderMatch ? 'Spider_XHS 爬虫数据' : '自定义数据'),
      noteCount: noteMatches ? noteMatches.length : (inputText.split('},{').length > 1 ? inputText.split('},{').length : 0),
      hasMetrics: !!inputText.match(/"(liked_count|likes|interaction|Likes|Note_liked_count)"/i)
    };
  }, [inputText]);

  // Helper to clean useless fields from Spider_XHS data
  const cleanSpiderData = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      // Fields to remove as requested by user to reduce noise
      const keysToRemove = [
        'xsec_token', 
        'user_id', 
        'video_addr', 
        'image_list', 
        'avatar', 
        'home_url', 
        'video_cover',
        'sec_token', 
        'note_id',
        'note_url'
      ];
      
      keysToRemove.forEach(key => delete data[key]);
      return JSON.stringify(data);
    } catch (e) {
      // If it's not valid JSON, return as is
      return jsonString;
    }
  };

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
            // Validate and clean JSON
            const cleanedContent = cleanSpiderData(content);
            combinedData += `\n\n--- FILE: ${file.name} ---\n${cleanedContent}`;
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

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON (raw rows)
          const rawRows = XLSX.utils.sheet_to_json(worksheet) as any[];

          // --- 1. DOWNLOAD DATA (EXACT COPY, NO FILTERING) ---
          setDownloadableData(rawRows);

          // --- 2. GROUPING LOGIC (Structure optimization only) ---
          // Even without filtering, we group rows by Note to prevent context window overflow
          // from repeating note details 100 times for 100 comments.
          
          const notesMap = new Map<string, any>();

          rawRows.forEach(row => {
               // A. Try to find a grouping key (Note ID or Title)
               // We look for common keys, favoring ID over Title
               const noteKey = row['Note_note_id'] || row['note_id'] || row['id'] || row['Note_title'] || row['title'] || row['Title'] || row['Note_Title'];
               
               // If no grouping key found, we can't effectively group. 
               // Treat as unique entry or fallback to index if needed, but let's use random for safety.
               const validKey = noteKey ? String(noteKey) : `UNKNOWN_${Math.random()}`;

               if (!notesMap.has(validKey)) {
                   // --- New Note Entry ---
                   // Strategy: Copy EVERYTHING from the row initially.
                   // We will later add a "Comments_List" array for grouped comments.
                   const noteEntry: any = { ...row };

                   // Optional: If we are creating a list of comments, we might want to 
                   // clear the "Comment" specific fields from the top-level object to reduce duplication,
                   // BUT the user said "No Filtering", so we keep them in the top level as the "First Comment" context.
                   // To avoid confusion, we initialize the array.
                   noteEntry.Comments_List = [];
                   
                   notesMap.set(validKey, noteEntry);
               }

               // --- Extract Comment Data ---
               // We look for columns that likely belong to comments (contain 'comment' or '评论')
               const commentData: any = {};
               let hasCommentData = false;

               Object.keys(row).forEach(key => {
                   if (key.toLowerCase().includes('comment') || key.includes('评论')) {
                       commentData[key] = row[key];
                       hasCommentData = true;
                   }
               });

               // If this row has comment data, append it to the note's comment list
               if (hasCommentData) {
                   notesMap.get(validKey).Comments_List.push(commentData);
               }
          });

          // Convert grouped map back to array
          const groupedData = Array.from(notesMap.values());
          const jsonString = JSON.stringify(groupedData, null, 2);
            
          setInputText(prev => {
                const separator = prev.trim() ? "\n\n" : "";
                return prev + separator + "--- IMPORTED EXCEL DATA (All Columns) ---" + jsonString;
          });

        } catch (err) {
          console.error("Excel parse error", err);
          alert("Excel 解析失败，请确认文件格式。");
        }
      };
      
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDownloadCleanedExcel = () => {
    if (!downloadableData || downloadableData.length === 0) return;
    try {
        const ws = XLSX.utils.json_to_sheet(downloadableData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, "imported_social_media_data.xlsx");
    } catch (e) {
        alert("下载失败，请重试");
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);
      
      // Filter only info.json files from the massive list of files in the folder structure
      const infoFiles = files.filter(f => f.name === 'info.json');

      if (infoFiles.length === 0) {
        alert("在选定的文件夹中未找到 'info.json' 文件。请确保您选择了 Spider_XHS 的输出目录（通常是 'datas' 或 'download'）。");
        return;
      }

      let combinedData = "";
      let processedCount = 0;

      infoFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            // Try to extract the folder name (usually the note title) from the path
            // webkitRelativePath is like "Download/Note_Title_ID/info.json"
            // @ts-ignore
            const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [];
            const parentFolder = pathParts.length > 1 ? pathParts[pathParts.length - 2] : "Unknown Note";

            const cleanedContent = cleanSpiderData(content);
            combinedData += `\n\n--- NOTE: ${parentFolder} ---\n${cleanedContent}`;
          } catch (err) {
            console.error("Error parsing file", file.name);
          }
          
          processedCount++;
          if (processedCount === infoFiles.length) {
             setInputText(prev => {
                const separator = prev.trim() ? "\n\n" : "";
                return prev + separator + `--- BATCH IMPORTED SPIDER_XHS DATA (${infoFiles.length} notes) ---` + combinedData;
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

  const clearAll = () => {
    if (window.confirm("确定要清空所有文本和图片吗？")) {
      setInputText("");
      setUserGoal("");
      setImages([]);
      setResult(null);
      setError(null);
      setDownloadableData(null);
    }
  }

  const handleAnalyze = async () => {
    if (!inputText.trim() && images.length === 0) return;
    
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    
    try {
      // Clean input from user prompt artifacts
      const cleanedInput = inputText.replace(/（不要写代码）|\(不要写代码\)/g, "");
      const data = await analyzeProfile(cleanedInput, images, userGoal);
      setResult(data);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err) {
      console.error(err);
      setError("分析未能完成。请检查您的输入数据是否清晰，或重试。");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <style>
        {`
          @media print {
            .no-print, .no-print * {
              display: none !important;
            }
            body, html {
              background: white;
              height: auto !important;
              overflow: visible !important;
            }
            .print-content {
              margin: 0;
              padding: 0;
              overflow: visible !important;
            }
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header - Hide on print */}
        <div className="text-center mb-12 animate-fade-in-down no-print">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-6 border border-slate-100">
            <span className="text-3xl mr-3">🚀</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Social Media <span className="text-indigo-600">Architect</span>
            </h1>
          </div>
          <p className="mt-2 max-w-2xl mx-auto text-lg text-slate-600">
            AI 驱动的小红书与抖音账号深度诊断工具
          </p>
          <button 
            onClick={() => setShowGuide(true)}
            className="mt-4 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            如何获取数据？(新手指南)
          </button>
        </div>

        {/* Main Input Section - Hide on print */}
        <div className="max-w-4xl mx-auto space-y-6 no-print">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-100/50">
            
            {/* Data Summary Banner */}
            {dataSummary && (
              <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center text-emerald-800 text-sm font-medium">
                  <Database className="w-4 h-4 mr-2" />
                  <span>
                    检测到 <strong>{dataSummary.noteCount > 0 ? dataSummary.noteCount : '若干'} 条记录</strong>，来源：{dataSummary.source}。
                    {dataSummary.hasMetrics && " 包含互动数据。"}
                  </span>
                </div>
                {downloadableData && (
                    <button 
                        onClick={handleDownloadCleanedExcel}
                        className="flex items-center text-xs bg-white text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full shadow-sm hover:bg-emerald-50 transition-colors font-medium"
                    >
                        <Download className="w-3 h-3 mr-1" />
                        下载原始数据副本
                    </button>
                )}
              </div>
            )}

            <div className="p-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="请粘贴笔记内容，或者描述您的账号现状..."
                className="w-full h-48 p-6 text-lg text-slate-700 placeholder-slate-400 bg-transparent border-none resize-none focus:ring-0 focus:outline-none font-mono text-sm leading-relaxed"
              />
              
              {/* Floating Clear Button */}
              {inputText.length > 0 && (
                <button 
                  onClick={clearAll}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="清空所有内容"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            {/* NEW: User Goal Input */}
            <div className="px-6 pb-2">
                <div className="flex items-center space-x-2 mb-2">
                    <Compass className="w-4 h-4 text-indigo-500" />
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">未来方向 / 预期目标 (Optional)</label>
                </div>
                <input 
                    type="text" 
                    value={userGoal}
                    onChange={(e) => setUserGoal(e.target.value)}
                    placeholder="例如：我想转型做知识博主，或者我想提升变现能力..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
            </div>

            {/* Image Preview Area */}
            {images.length > 0 && (
              <div className="px-6 py-4 flex flex-wrap gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={img} 
                      alt={`Upload ${index + 1}`} 
                      className="w-24 h-24 object-cover rounded-xl border-2 border-slate-100 shadow-sm"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-white text-rose-500 rounded-full p-1 shadow-md border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Toolbar */}
            <div className="bg-slate-50/50 px-6 py-4 flex flex-wrap gap-2 items-center justify-between border-t border-slate-100">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  截图
                </button>
                <button
                  onClick={() => excelInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-green-600 transition-all shadow-sm ring-1 ring-green-100"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  导入 Excel
                </button>
                <button
                  onClick={() => jsonInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-emerald-600 transition-all shadow-sm"
                >
                  <FileJson className="w-4 h-4 mr-2" />
                  导入 JSON
                </button>
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-amber-600 transition-all shadow-sm"
                >
                  <FolderInput className="w-4 h-4 mr-2" />
                  批量文件夹
                </button>
                
                {/* Hidden Inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                  multiple
                />
                <input
                  type="file"
                  ref={excelInputRef}
                  onChange={handleExcelChange}
                  className="hidden"
                  accept=".xlsx, .xls"
                />
                 <input
                  type="file"
                  ref={jsonInputRef}
                  onChange={handleJsonChange}
                  className="hidden"
                  accept=".json"
                  multiple
                />
                <input
                  type="file"
                  ref={folderInputRef}
                  onChange={handleFolderChange}
                  className="hidden"
                  // @ts-ignore - directory attributes are non-standard but supported by modern browsers
                  webkitdirectory="" 
                  directory="" 
                  multiple
                />
              </div>
              
              <button
                onClick={handleAnalyze}
                disabled={status === AnalysisStatus.LOADING || (!inputText.trim() && images.length === 0)}
                className={`
                  inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all
                  ${status === AnalysisStatus.LOADING 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95'
                  }
                `}
              >
                {status === AnalysisStatus.LOADING ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    正在分析...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    生成策略报告
                  </>
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl flex items-center animate-shake">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="mt-12">
          {result && <AnalysisDashboard data={result} />}
        </div>
      </div>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-900 flex items-center">
                <Terminal className="w-6 h-6 mr-2 text-indigo-600" />
                数据采集指南 (Spider_XHS)
              </h3>
              <button 
                onClick={() => setShowGuide(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Step 1 */}
              <div className="relative pl-8 border-l-2 border-indigo-100">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                <h4 className="text-lg font-bold text-slate-900 mb-2">1. 安装基础环境</h4>
                <p className="text-slate-600 mb-4">你需要在电脑上安装 Python 和 Node.js。</p>
                <div className="flex gap-4">
                  <a href="https://www.python.org/downloads/" target="_blank" rel="noreferrer" className="flex items-center text-sm font-medium text-indigo-600 hover:underline bg-indigo-50 px-3 py-1.5 rounded-lg">
                    下载 Python <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                  <a href="https://nodejs.org/" target="_blank" rel="noreferrer" className="flex items-center text-sm font-medium text-indigo-600 hover:underline bg-indigo-50 px-3 py-1.5 rounded-lg">
                    下载 Node.js <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>

               {/* Step 2 */}
               <div className="relative pl-8 border-l-2 border-indigo-100">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                <h4 className="text-lg font-bold text-slate-900 mb-2">2. 获取 Cookie (最关键一步)</h4>
                <div className="bg-slate-50 p-4 rounded-xl space-y-3 text-sm border border-slate-200">
                  <p className="flex items-start"><span className="font-bold mr-2">1.</span> 用浏览器打开小红书网页版并登录。</p>
                  <p className="flex items-start"><span className="font-bold mr-2">2.</span> 按下 <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-xs mx-1">F12</kbd> 打开开发者工具。</p>
                  <p className="flex items-start"><span className="font-bold mr-2">3.</span> 点击顶部的 <strong>Network (网络)</strong> 标签。</p>
                  <p className="flex items-start text-indigo-600 bg-indigo-50 p-2 rounded-lg">
                    <Filter className="w-4 h-4 mr-1 inline" />
                    <strong>过滤器:</strong> 选中 "Fetch/XHR" 或 "Doc" (不要看图片/Img)。
                  </p>
                  <p className="flex items-start"><span className="font-bold mr-2">4.</span> 刷新网页。在列表里随便点一个请求（例如以 <code>user</code> 或 <code>homefeed</code> 开头的）。</p>
                  <p className="flex items-start text-indigo-600 bg-indigo-50 p-2 rounded-lg">
                    <ChevronsDown className="w-4 h-4 mr-1 inline" />
                    <strong>往下滚:</strong> 在右侧详情面板，使劲往下滚，找到 <strong>Request Headers (请求头)</strong>。
                  </p>
                  <p className="flex items-start"><span className="font-bold mr-2">5.</span> 找到 <strong>Cookie:</strong> 这一行，复制冒号后面那一长串字符。</p>
                </div>
              </div>

               {/* Step 3 */}
               <div className="relative pl-8 border-l-2 border-indigo-100">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                <h4 className="text-lg font-bold text-slate-900 mb-2">3. 运行爬虫 & 上传数据</h4>
                <div className="space-y-2 text-slate-600 text-sm">
                   <p>1. 下载 <a href="https://github.com/cv-cat/Spider_XHS" target="_blank" className="text-indigo-600 hover:underline">Spider_XHS 项目代码</a> 并解压。</p>
                   <p>2. 在文件夹里新建一个 <code>.env</code> 文件，填入：<code>COOKIES="你刚才复制的那一长串"</code>。</p>
                   <p>3. 打开终端运行：<code>pip install -r requirements.txt</code> 然后 <code>python main.py</code>。</p>
                   <p>4. 爬取完成后，点击本网页的 <strong>“批量导入文件夹”</strong>，选择生成的 <code>datas</code> 文件夹。</p>
                </div>
              </div>

              {/* Troubleshooting */}
              <div className="bg-rose-50 rounded-xl p-5 border border-rose-100">
                 <h4 className="font-bold text-rose-700 flex items-center mb-3">
                   <AlertTriangle className="w-5 h-5 mr-2" />
                   常见报错解决 (Troubleshooting)
                 </h4>
                 <div className="space-y-4">
                    <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-sm">
                      <p className="text-sm font-semibold text-rose-800 mb-1">报错: "ModuleNotFoundError: No module named 'execjs'"</p>
                      <p className="text-xs text-slate-600 mb-2">这通常是因为你安装了多个 Python 版本，pip 安装到了错误的地方。</p>
                      <div className="bg-slate-800 text-slate-200 p-2 rounded font-mono text-xs flex justify-between items-center group">
                        <span>python -m pip install PyExecJS</span>
                        <button 
                          onClick={() => navigator.clipboard.writeText("python -m pip install PyExecJS")}
                          className="opacity-0 group-hover:opacity-100 hover:text-white"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">使用 <code>python -m pip</code> 命令可以确保安装到当前运行的 Python 环境中。</p>
                    </div>
                 </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
              <button 
                onClick={() => setShowGuide(false)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200"
              >
                我明白了，开始分析！
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;