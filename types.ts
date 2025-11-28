export interface AnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  contentStrategy: {
    title: string;
    description: string;
    examples: string[];
  }[];
  audiencePersona: {
    ageRange: string;
    interests: string[];
    painPoints: string[];
  };
  growthMetrics: {
    label: string;
    value: number;
    color: string;
  }[];
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}