export interface HardStats {
  totalNotes: number;
  totalLikes: number;
  avgLikes: number;
  maxLikes: number;
  totalCollects: number;
  topNote: {
    title: string;
    likes: number;
    type: string;
  };
}

export interface PromisingDirection {
  title: string;
  description: string;
  rationale: string;
  actionPlan: string[];
  tags: string[]; // New: Add tags for quick context
}

export interface AnalysisResult {
  summary: string;
  // New: Unique identity tags based on specific content mix
  creatorDNA: {
    title: string; // e.g. "跨次元赛博恋爱学家"
    tags: string[]; // e.g. ["战锤40K", "Kpop", "AI工具", "梦女"]
    description: string;
  };
  strategicVerdict: string;
  
  // New: Real calculated data
  hardStats?: HardStats;

  // New: The specific "North Star" direction - NOW AN ARRAY
  promisingDirections?: PromisingDirection[];

  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  
  // New: Quantifiable SWOT data for charts
  swotAnalysisStats?: {
    label: string;
    score: number; // 0-100
    color: string;
  }[];

  // Revamped: Actionable templates
  contentStrategy: {
    category: string; // e.g. "沉浸式梦女日常"
    titleTemplate: string; // e.g. "和[角色名]谈恋爱的第[N]天，他竟然..."
    structure: string; // e.g. "场景描述(带入感) -> 互动细节(甜/虐) -> 结尾提问"
    keywords: string[];
  }[];
  
  audiencePersona: {
    ageRange: string;
    interests: string[];
    painPoints: string[];
  };

  // New: Quantifiable Audience data for charts
  audienceStats?: {
    ageDistribution: { name: string; value: number }[]; // e.g. "18-24": 60
    interestComposition: { name: string; value: number; color: string }[];
  };
  
  growthMetrics: {
    label: string;
    value: number;
    color: string;
  }[];
  metricsAnalysis: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}