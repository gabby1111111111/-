import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Activity, Users, TrendingUp, AlertCircle, CheckCircle, Zap, Download, Printer, Quote, Fingerprint, Calculator, Copy, Wand2, Loader2, Target, Hash, Sparkles, Compass, Rocket, Footprints, Lightbulb } from 'lucide-react';
import { generateCustomTemplate } from '../services/geminiService';

interface AnalysisDashboardProps {
  data: AnalysisResult;
}

const EmptyState = ({ text }: { text: string }) => (
  <p className="text-sm text-slate-400 italic py-2">{text}</p>
);

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ data }) => {
  const [customTopic, setCustomTopic] = useState('');
  const [customTemplate, setCustomTemplate] = useState<{titles: string[], structure: string} | null>(null);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateCustom = async () => {
    if (!customTopic.trim()) return;
    setIsGeneratingTemplate(true);
    setCustomTemplate(null);
    try {
        const res = await generateCustomTemplate(data.creatorDNA, customTopic);
        setCustomTemplate(res);
    } catch (e) {
        alert("AI 生成失败，请稍后重试");
    } finally {
        setIsGeneratingTemplate(false);
    }
  };

  const handleDownloadMarkdown = () => {
    let md = `# Social Media Architect - 账号诊断报告\n\n`;
    md += `## 摘要\n${data.summary}\n\n`;
    md += `## 创作者 DNA\n**${data.creatorDNA.title}**\n${data.creatorDNA.description}\n\n`;
    
    if (data.promisingDirections && data.promisingDirections.length > 0) {
        md += `## 核心潜力方向 (North Star Metrics)\n`;
        data.promisingDirections.forEach((dir, index) => {
            md += `### ${index + 1}. ${dir.title}\n`;
            md += `${dir.description}\n`;
            md += `> ${dir.rationale}\n\n`;
            md += `**下一步行动:**\n`;
            dir.actionPlan.forEach(action => {
                md += `- ${action}\n`;
            });
            md += `\n`;
        });
    }

    if (data.hardStats) {
        md += `## 实测数据 (Hard Stats)\n`;
        md += `- 总笔记: ${data.hardStats.totalNotes}\n`;
        md += `- 平均点赞: ${data.hardStats.avgLikes}\n`;
        md += `- 最高赞: ${data.hardStats.maxLikes}\n`;
    }

    md += `## 战略定调\n> ${data.strategicVerdict}\n\n`;
    
    md += `## 内容策略 (爆款模版)\n`;
    data.contentStrategy.forEach(c => {
      md += `### ${c.category}\n`;
      md += `**标题公式**: ${c.titleTemplate}\n`;
      md += `**结构**: ${c.structure}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'social-media-strategy.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      alert("已复制！");
    }
  };

  const copyFullStrategy = (strategy: any, index: number) => {
    const text = `【${strategy.category}】\n标题：${strategy.titleTemplate}\n结构：${strategy.structure}\n关键词：${strategy.keywords.join(' ')}`;
    copyToClipboard(text, index);
  };

  return (
    <div className="space-y-8 print-content animate-fade-in-up">
      {/* Action Toolbar */}
      <div className="flex justify-end space-x-3 no-print">
        <button 
          onClick={handlePrint}
          className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4 mr-2" />
          导出 PDF / 打印
        </button>
        <button 
          onClick={handleDownloadMarkdown}
          className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          保存 Markdown
        </button>
      </div>

      {/* 1. Hard Stats Data Grid (Top Level) */}
      {data.hardStats && data.hardStats.totalNotes > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">平均点赞 (Avg Likes)</span>
                <span className="text-3xl font-black text-indigo-600 tracking-tight">{data.hardStats.avgLikes}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">总互动量 (Total)</span>
                <span className="text-3xl font-black text-indigo-600 tracking-tight">{(data.hardStats.totalLikes + data.hardStats.totalCollects).toLocaleString()}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">最高赞笔记</span>
                <span className="text-3xl font-black text-emerald-500 tracking-tight">{data.hardStats.maxLikes}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">爆款率 (Top 10%)</span>
                <span className="text-3xl font-black text-amber-500 tracking-tight">
                    {Math.round((data.hardStats.totalNotes > 0 ? (data.hardStats.totalNotes * 0.1) : 0))}% 
                </span>
            </div>
        </div>
      )}

      {/* 2. Creator DNA - Redesigned Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white to-indigo-50/50 rounded-2xl p-0 shadow-sm border border-indigo-100 print:shadow-none print:border">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Fingerprint size={200} className="text-indigo-900" />
        </div>
        
        <div className="p-8 relative z-10 flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
                <div className="flex items-center space-x-2 mb-4">
                    <span className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded">Creator DNA</span>
                    <div className="h-px bg-indigo-200 flex-1"></div>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-600 mb-4 leading-tight">
                    {data.creatorDNA.title}
                </h2>
                
                <p className="text-slate-600 text-lg leading-relaxed mb-6">
                    {data.creatorDNA.description}
                </p>

                <div className="flex flex-wrap gap-2">
                    {data.creatorDNA.tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center px-3 py-1 bg-white border border-indigo-100 text-indigo-600 rounded-full text-xs font-bold shadow-sm">
                            <Hash size={12} className="mr-1" />
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            <div className="w-full md:w-1/3 bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">核心洞察 Summary</h3>
                <p className="text-sm text-slate-700 leading-relaxed text-justify">
                    {data.summary}
                </p>
            </div>
        </div>
      </div>

      {/* NEW: Promising Directions (Dual Module) */}
      {data.promisingDirections && data.promisingDirections.length > 0 && (
        <div className="space-y-4">
            <div className="flex items-center space-x-2 px-1">
                 <Compass className="w-5 h-5 text-indigo-600" />
                 <h3 className="text-lg font-bold text-slate-800">The North Star • 最具潜力发展方向</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.promisingDirections.map((direction, idx) => (
                    <div key={idx} className={`rounded-2xl p-1 shadow-lg flex flex-col h-full transition-transform hover:-translate-y-1 ${idx === 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-indigo-200/50' : 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-pink-200/50'}`}>
                        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl h-full flex flex-col relative overflow-hidden">
                            {/* Header */}
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded text-white ${idx === 0 ? 'bg-indigo-500' : 'bg-pink-500'}`}>
                                        {idx === 0 ? 'Direction A: 顺势而为 (Current Best)' : 'Direction B: 目标转型 (Strategic Pivot)'}
                                    </span>
                                    {direction.tags && (
                                        <div className="flex gap-1">
                                            {direction.tags.map((tag, tIdx) => (
                                                <span key={tIdx} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-slate-900 leading-tight">
                                    {direction.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed text-sm mb-5 min-h-[60px]">
                                    {direction.description}
                                </p>
                            </div>

                            {/* Rationale Box */}
                            <div className={`rounded-lg p-4 mb-5 text-sm flex items-start space-x-3 ${idx === 0 ? 'bg-indigo-50 text-indigo-900' : 'bg-pink-50 text-pink-900'}`}>
                                <Lightbulb className={`w-5 h-5 flex-shrink-0 mt-0.5 ${idx === 0 ? 'text-indigo-500' : 'text-pink-500'}`} />
                                <div>
                                    <span className={`block font-bold mb-1 uppercase text-[10px] ${idx === 0 ? 'text-indigo-400' : 'text-pink-400'}`}>Why This Works</span>
                                    <span className="leading-snug opacity-90 italic">"{direction.rationale}"</span>
                                </div>
                            </div>

                            {/* Action List - Pushed to bottom */}
                            <div className="mt-auto">
                                <h4 className="flex items-center font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
                                    <Footprints className="w-3 h-3 mr-2 text-slate-400" />
                                    Next Steps
                                </h4>
                                <ul className="space-y-2">
                                    {direction.actionPlan.map((step, sIdx) => (
                                        <li key={sIdx} className="flex items-start text-sm group">
                                            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold mr-3 flex-shrink-0 transition-colors ${idx === 0 ? 'bg-indigo-200 group-hover:bg-indigo-600' : 'bg-pink-200 group-hover:bg-pink-600'}`}>
                                                {sIdx + 1}
                                            </span>
                                            <span className="text-slate-700 leading-snug pt-0.5 text-xs">{step}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block print:space-y-8">
        {/* SWOT Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full print:shadow-none print:border">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                    <TrendingUp className="mr-2 text-emerald-500 print:hidden" /> 战略审计 (SWOT)
                </h3>
            </div>
            
            {/* Strategic Verdict Banner */}
            <div className="mb-8 p-5 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-l-4 border-l-indigo-500 border-slate-200 relative">
              <div className="pl-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">STRATEGIC VERDICT</h4>
                <p className="text-lg font-bold text-slate-800 leading-snug">
                  "{data.strategicVerdict || "数据分析中，暂无定调..."}"
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Visual Chart for SWOT */}
                <div className="w-full md:w-1/3 min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                        <BarChart data={data.swotAnalysisStats} layout="vertical" margin={{ left: 0 }}>
                            <XAxis type="number" hide domain={[0, 100]} />
                            <YAxis dataKey="label" type="category" width={50} tick={{fontSize: 11, fontWeight: 600, fill: '#64748b'}} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24} background={{ fill: '#f8fafc' }}>
                                {data.swotAnalysisStats?.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Text Lists */}
                <div className="flex-1 grid grid-cols-1 gap-4">
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                        <h4 className="font-bold text-emerald-800 mb-3 flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 mr-2" /> 核心优势 (Strengths)
                        </h4>
                        <ul className="space-y-2">
                            {data.strengths?.length > 0 ? (
                            data.strengths.map((item, i) => (
                                <li key={i} className="text-sm text-emerald-900/80 flex items-start leading-snug">
                                <span className="mr-2 mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span> {item}
                                </li>
                            ))
                            ) : <EmptyState text="未检测到显著优势" />}
                        </ul>
                    </div>
                    <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                        <h4 className="font-bold text-rose-800 mb-3 flex items-center text-sm">
                            <AlertCircle className="w-4 h-4 mr-2" /> 潜在劣势 (Weaknesses)
                        </h4>
                        <ul className="space-y-2">
                            {data.weaknesses?.length > 0 ? (
                            data.weaknesses.map((item, i) => (
                                <li key={i} className="text-sm text-rose-900/80 flex items-start leading-snug">
                                <span className="mr-2 mt-1 w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0"></span> {item}
                                </li>
                            ))
                            ) : <EmptyState text="未发现明显劣势" />}
                        </ul>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Audience Persona */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 print:shadow-none print:border print:break-inside-avoid">
           <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <Users className="mr-2 text-blue-500 print:hidden" /> 目标受众
          </h3>
          
          {/* Charts Area */}
          <div className="mb-6 space-y-6">
             {/* Age Bar */}
             <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">年龄分布预估</span>
                <div style={{ width: '100%', height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.audienceStats?.ageDistribution}>
                            <XAxis dataKey="name" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}} />
                            <Bar dataKey="value" fill="#93c5fd" radius={[4, 4, 4, 4]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             </div>

             {/* Interest Pie */}
             <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">兴趣构成</span>
                <div style={{ width: '100%', height: 180 }} className="flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.audienceStats?.interestComposition}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={65}
                                paddingAngle={4}
                                dataKey="value"
                            >
                                {data.audienceStats?.interestComposition.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{borderRadius: '8px'}} />
                            <Legend iconSize={8} wrapperStyle={{fontSize: '11px', fontWeight: 500}} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">核心标签</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {data.audiencePersona?.interests?.length > 0 ? (
                  data.audiencePersona.interests.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-semibold">
                      {tag}
                    </span>
                  ))
                ) : <EmptyState text="数据不足" />}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">用户痛点</span>
              <ul className="mt-2 space-y-2">
                {data.audiencePersona?.painPoints?.length > 0 ? (
                  data.audiencePersona.painPoints.map((point, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start">
                      <Target className="w-3 h-3 text-blue-400 mr-2 flex-shrink-0 mt-0.5" /> 
                      <span>{point}</span>
                    </li>
                  ))
                ) : <EmptyState text="数据不足" />}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Actionable Content Strategy (Template Cards + AI Generator) */}
      <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100 print:break-before-page">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <Zap className="mr-2 text-indigo-600" /> 实操爆款模版 (Ready to Post)
        </h3>
        
        {/* Existing Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {data.contentStrategy?.map((strategy, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-2">
                             <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                {i + 1}
                             </div>
                             <h4 className="text-lg font-bold text-slate-800">{strategy.category}</h4>
                        </div>
                        <button 
                            onClick={() => copyFullStrategy(strategy, i)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded bg-slate-50 hover:bg-indigo-50"
                        >
                            {copiedIndex === i ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                            <span>{copiedIndex === i ? 'Copied' : 'Copy All'}</span>
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Title Formula</span>
                            <p className="text-slate-900 font-semibold text-sm leading-relaxed">{strategy.titleTemplate}</p>
                        </div>

                        <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Content Structure</span>
                            <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-indigo-200 pl-3">
                                {strategy.structure}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                            {(strategy.keywords || []).map((kw, j) => (
                                <span key={j} className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">#{kw}</span>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* NEW: AI Custom Template Generator */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-200 ring-4 ring-indigo-50/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-800 flex items-center">
                    <Wand2 className="mr-2 text-amber-500 w-5 h-5" />
                    AI 灵感生成器 (AI Spark Generator)
                </h4>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full mt-2 sm:mt-0 font-medium">Based on your DNA</span>
            </div>
            
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="输入你想做的主题，例如：'我用Gemini开发了一个小红书爆款分析'..."
                    className="flex-1 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateCustom()}
                />
                <button 
                    onClick={handleGenerateCustom}
                    disabled={isGeneratingTemplate || !customTopic}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-medium transition-colors flex items-center shadow-lg shadow-indigo-200"
                >
                    {isGeneratingTemplate ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </button>
            </div>

            {/* Generated Result Display */}
            {customTemplate && (
                <div className="mt-6 animate-fade-in-up">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                            <span className="text-xs text-amber-700 font-bold uppercase block mb-2">推荐爆款标题</span>
                            <ul className="space-y-2">
                                {customTemplate.titles.map((t, idx) => (
                                    <li key={idx} className="flex items-center text-sm font-medium text-slate-800 bg-white p-2 rounded border border-amber-200 shadow-sm cursor-pointer hover:border-amber-400 group" onClick={() => copyToClipboard(t)}>
                                        <span className="flex-1">{t}</span>
                                        <Copy size={12} className="text-slate-300 group-hover:text-amber-500" />
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <span className="text-xs text-indigo-700 font-bold uppercase block mb-2">建议文案结构</span>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{customTemplate.structure}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* 4. Radar Chart & Metrics */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 print:shadow-none print:border print:break-inside-avoid">
        <div className="w-full md:w-1/2 block">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <Calculator className="mr-2 text-indigo-500" /> 赛道潜力雷达
            </h3>
            <p className="text-sm text-slate-500 mb-4">基于内容质量与互动数据的综合评分</p>
            {/* 
                Fixed height container for ResponsiveContainer 
            */}
            <div style={{ width: '100%', height: 320 }} className="relative">
                {data.growthMetrics && data.growthMetrics.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.growthMetrics}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                        name="潜力指数"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={4} 
                        fill="#818cf8"
                        fillOpacity={0.6}
                        isAnimationActive={true} 
                        />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    </RadarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        暂无维度数据
                    </div>
                )}
            </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center space-y-6">
           <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-base font-bold text-slate-800 mb-2 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-indigo-600" /> 数据深度解读
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed text-justify">
                  {data.metricsAnalysis || "各项指标均衡，具备良好的成长潜力。建议持续监测互动率变化。"}
              </p>
           </div>

           {data.hardStats && data.hardStats.topNote.title !== "暂无数据" && (
                <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start space-x-4">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Highest Performing Note</h4>
                        <p className="text-sm text-emerald-900 font-bold line-clamp-1 mb-1">"{data.hardStats.topNote.title}"</p>
                        <div className="flex gap-4 text-xs text-emerald-700">
                            <span>Likes: <strong>{data.hardStats.topNote.likes}</strong></span>
                            <span>Type: {data.hardStats.topNote.type}</span>
                        </div>
                    </div>
                </div>
           )}

           <div className="grid grid-cols-2 gap-y-3 text-sm pt-2">
            {(data.growthMetrics || []).map((metric, i) => (
              <div key={i} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0">
                <span className="text-slate-500 font-medium">{metric.label}</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;