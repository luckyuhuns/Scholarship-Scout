export interface UserProfile {
  countryOfCitizenship: string;
  currentEducationLevel: string;
  currentDegreeTitle: string;
  targetDegree: string;
  fieldOfStudy: string[];
  gpa: string;
  documentsAvailable: string[];
  fundingPreference: 'Fully Funded' | 'Partial Funding' | 'Both';
}

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  deadline: string; // YYYY-MM-DD format if possible, or string
  fundingType: 'Fully Funded' | 'Partial Funding' | 'Unknown';
  amount?: string;
  applicationLink?: string;
  description: string;
  requirements: string[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SearchResult {
  scholarships: Scholarship[];
  sources: GroundingSource[];
  rawText: string; // For fallback display
}

export type ViewState = 'onboarding' | 'searching' | 'results' | 'error';

// Add environment type definition to avoid TS errors
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_KEY: string;
    readonly API_KEY: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
