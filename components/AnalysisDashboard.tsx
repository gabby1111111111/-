import React from 'react';
import { AnalysisResult } from '../types';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { Activity, Users, TrendingUp, AlertCircle, CheckCircle, Zap } from 'lucide-react';

interface AnalysisDashboardProps {
  data: AnalysisResult;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ data }) => {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header Summary */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <div className="flex items-start space-x-4">
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
            <Activity size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Executive Summary</h2>
            <p className="text-slate-600 leading-relaxed text-lg">{data.summary}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SWOT Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <TrendingUp className="mr-2 text-emerald-500" /> Strategic Audit
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <h4 className="font-semibold text-emerald-800 mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" /> Strengths
                  </h4>
                  <ul className="space-y-2">
                    {data.strengths.map((item, i) => (
                      <li key={i} className="text-sm text-emerald-700 flex items-start">
                        <span className="mr-2">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                   <h4 className="font-semibold text-amber-800 mb-3 flex items-center">
                    <Zap className="w-4 h-4 mr-2" /> Opportunities
                  </h4>
                  <ul className="space-y-2">
                    {data.opportunities.map((item, i) => (
                      <li key={i} className="text-sm text-amber-700 flex items-start">
                         <span className="mr-2">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                   <h4 className="font-semibold text-rose-800 mb-3 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" /> Weaknesses
                  </h4>
                  <ul className="space-y-2">
                    {data.weaknesses.map((item, i) => (
                      <li key={i} className="text-sm text-rose-700 flex items-start">
                         <span className="mr-2">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audience Persona */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
           <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <Users className="mr-2 text-blue-500" /> Target Audience
          </h3>
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Age Range</span>
              <p className="text-2xl font-bold text-slate-900">{data.audiencePersona.ageRange}</p>
            </div>
            
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Core Interests</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {data.audiencePersona.interests.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pain Points</span>
              <ul className="mt-2 space-y-2">
                {data.audiencePersona.painPoints.map((point, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start">
                    <span className="text-blue-400 mr-2">➜</span> {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Content Strategy Cards */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Recommended Content Pillars</h3>
          <div className="space-y-4">
            {data.contentStrategy.map((strategy, i) => (
              <div key={i} className="group p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                <h4 className="font-bold text-slate-900 mb-1">{strategy.title}</h4>
                <p className="text-sm text-slate-600 mb-3">{strategy.description}</p>
                <div className="flex flex-wrap gap-2">
                  {strategy.examples.map((ex, j) => (
                    <span key={j} className="text-xs bg-white text-slate-500 border border-slate-200 px-2 py-1 rounded shadow-sm">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Metrics Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Niche Potential Analysis</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.growthMetrics}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Potential"
                  dataKey="value"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fill="#6366f1"
                  fillOpacity={0.5}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
           <div className="mt-4 grid grid-cols-2 gap-4">
            {data.growthMetrics.map((metric, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-slate-600">{metric.label}</span>
                <span className="font-bold text-slate-900">{metric.value}/100</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;