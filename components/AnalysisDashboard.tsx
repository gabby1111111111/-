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
} from 'recharts';
import { Activity, Users, TrendingUp, AlertCircle, CheckCircle, Zap, Download, Printer, Quote, Fingerprint, Calculator, Copy, Wand2, Loader2 } from 'lucide-react';
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("已复制！");
  };

  return (
    <div className="space-y-8 print-content">
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
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">平均点赞 (Avg Likes)</span>
                <span className="text-3xl font-extrabold text-indigo-600">{data.hardStats.avgLikes}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">总互动量 (Total)</span>
                <span className="text-3xl font-extrabold text-indigo-600">{(data.hardStats.totalLikes + data.hardStats.totalCollects).toLocaleString()}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">最高赞笔记</span>
                <span className="text-3xl font-extrabold text-emerald-500">{data.hardStats.maxLikes}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">爆款率 (Top 10%)</span>
                <span className="text-3xl font-extrabold text-amber-500">
                    {Math.round((data.hardStats.totalNotes > 0 ? (data.hardStats.totalNotes * 0.1) : 0))}% 
                </span>
            </div>
        </div>
      )}

      {/* 2. Creator DNA & Summary */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 print:shadow-none print:border">
        {/* Creator DNA Banner */}
        <div className="mb-6 flex items-center space-x-3">
            <div className="bg-violet-100 p-2 rounded-lg text-violet-600">
                <Fingerprint className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900">{data.creatorDNA.title}</h2>
                <div className="flex gap-2 mt-1">
                    {data.creatorDNA.tags.map((tag, i) => (
                        <span key={i} className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded border border-violet-100">#{tag}</span>
                    ))}
                </div>
            </div>
        </div>
        <p className="text-slate-600 leading-relaxed text-lg border-t border-slate-100 pt-4">{data.summary}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block print:space-y-8">
        {/* SWOT Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full print:shadow-none print:border">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <TrendingUp className="mr-2 text-emerald-500 print:hidden" /> 战略审计 (SWOT)
            </h3>
            
            {/* Strategic Verdict Banner */}
            <div className="mb-8 p-5 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 relative">
              <Quote className="absolute top-4 left-4 w-6 h-6 text-indigo-200 opacity-50" />
              <div className="pl-8">
                <h4 className="text-sm font-bold text-indigo-800 uppercase tracking-wide mb-1">战略定调 (STRATEGIC VERDICT)</h4>
                <p className="text-lg font-medium text-indigo-900 leading-snug">
                  {data.strategicVerdict || "数据分析中，暂无定调..."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
              <div className="space-y-4">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 print:bg-white print:border-emerald-200">
                  <h4 className="font-semibold text-emerald-800 mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" /> 核心优势 (Strengths)
                  </h4>
                  <ul className="space-y-2">
                    {data.strengths?.length > 0 ? (
                      data.strengths.map((item, i) => (
                        <li key={i} className="text-sm text-emerald-700 flex items-start">
                          <span className="mr-2">•</span> {item}
                        </li>
                      ))
                    ) : <EmptyState text="未检测到显著优势" />}
                  </ul>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 print:bg-white print:border-amber-200">
                   <h4 className="font-semibold text-amber-800 mb-3 flex items-center">
                    <Zap className="w-4 h-4 mr-2" /> 增长机会 (Opportunities)
                  </h4>
                  <ul className="space-y-2">
                    {data.opportunities?.length > 0 ? (
                      data.opportunities.map((item, i) => (
                        <li key={i} className="text-sm text-amber-700 flex items-start">
                           <span className="mr-2">•</span> {item}
                        </li>
                      ))
                    ) : <EmptyState text="暂无建议机会" />}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 print:bg-white print:border-rose-200">
                   <h4 className="font-semibold text-rose-800 mb-3 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" /> 潜在劣势 (Weaknesses)
                  </h4>
                  <ul className="space-y-2">
                    {data.weaknesses?.length > 0 ? (
                      data.weaknesses.map((item, i) => (
                        <li key={i} className="text-sm text-rose-700 flex items-start">
                           <span className="mr-2">•</span> {item}
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
            <Users className="mr-2 text-blue-500 print:hidden" /> 目标受众画像
          </h3>
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">预估年龄层</span>
              <p className="text-2xl font-bold text-slate-900">{data.audiencePersona?.ageRange || '未知'}</p>
            </div>
            
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">核心兴趣</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {data.audiencePersona?.interests?.length > 0 ? (
                  data.audiencePersona.interests.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium print:border print:border-blue-200">
                      {tag}
                    </span>
                  ))
                ) : <EmptyState text="数据不足" />}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">用户痛点</span>
              <ul className="mt-2 space-y-2">
                {data.audiencePersona?.painPoints?.length > 0 ? (
                  data.audiencePersona.painPoints.map((point, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start">
                      <span className="text-blue-400 mr-2 print:hidden">➜</span> 
                      <span className="print:list-item print:ml-4">{point}</span>
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
            <Quote className="mr-2 text-indigo-600" /> 实操爆款模版 (Copy & Paste)
        </h3>
        
        {/* Existing Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {data.contentStrategy?.map((strategy, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-bold text-indigo-900">{strategy.category}</h4>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 group relative">
                            <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">标题公式</span>
                            <p className="text-slate-800 font-medium font-mono text-sm">{strategy.titleTemplate}</p>
                            <button 
                                onClick={() => copyToClipboard(strategy.titleTemplate)}
                                className="absolute top-2 right-2 p-1.5 bg-white rounded-md border border-slate-200 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="复制标题"
                            >
                                <Copy size={14} />
                            </button>
                        </div>

                        <div>
                            <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">文案结构</span>
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
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full mt-2 sm:mt-0">Based on your Creator DNA</span>
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
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-medium transition-colors flex items-center"
                >
                    {isGeneratingTemplate ? <Loader2 className="animate-spin w-4 h-4" /> : "生成"}
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
                                    <li key={idx} className="flex items-center text-sm font-medium text-slate-800 bg-white p-2 rounded border border-amber-200 shadow-sm cursor-pointer hover:border-amber-400" onClick={() => copyToClipboard(t)}>
                                        {t}
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
                CRITICAL FIX: 
                Use fixed height (h-[320px]) and explicit style width to '100%'.
                ResponsiveContainer needs a defined parent size. 
                Using a block div instead of flex item for the container avoids the width(-1) race condition.
            */}
            <div style={{ width: '100%', height: 320 }} className="relative">
                {data.growthMetrics && data.growthMetrics.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.growthMetrics}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                        name="潜力指数"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fill="#818cf8"
                        fillOpacity={0.4}
                        isAnimationActive={false} // Disable animation to prevent width calc errors
                        />
                        <Tooltip />
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
              <p className="text-sm text-slate-600 leading-relaxed">
                  {data.metricsAnalysis || "各项指标均衡，具备良好的成长潜力。"}
              </p>
           </div>

           {data.hardStats && data.hardStats.topNote.title !== "暂无数据" && (
                <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                    <h4 className="text-base font-bold text-emerald-800 mb-2">最高光时刻</h4>
                    <p className="text-sm text-emerald-900 font-medium line-clamp-1">"{data.hardStats.topNote.title}"</p>
                    <p className="text-xs text-emerald-600 mt-1">获赞: <span className="font-bold">{data.hardStats.topNote.likes}</span></p>
                </div>
           )}

           <div className="grid grid-cols-2 gap-y-2 text-sm pt-2">
            {(data.growthMetrics || []).map((metric, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-slate-500">{metric.label}</span>
                <span className="font-bold text-slate-900">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;