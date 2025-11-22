import React, { useState } from 'react';
import ProfileForm from './components/ProfileForm';
import ScholarshipList from './components/ScholarshipList';
import { UserProfile, SearchResult, ViewState } from './types';
import { searchScholarships } from './services/scholarshipService';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('onboarding');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [fundingPreference, setFundingPreference] = useState<'Fully Funded' | 'Partial Funding' | 'Both'>('Both');

  const handleProfileSubmit = async (profile: UserProfile) => {
    setFundingPreference(profile.fundingPreference);
    setViewState('searching');
    setErrorMsg("");

    // Support for Google AI Studio / Project IDX Environments
    if ((window as any).aistudio) {
      try {
        const aiStudio = (window as any).aistudio;
        const hasKey = await aiStudio.hasSelectedApiKey();
        if (!hasKey) {
          const success = await aiStudio.openSelectKey();
          if (!success) {
             // User cancelled the key selection dialog
             setViewState('onboarding');
             return;
          }
        }
      } catch (e) {
        console.warn("Check for AI Studio key failed:", e);
      }
    }

    try {
      const result = await searchScholarships(profile);
      setSearchResult(result);
      setViewState('results');
    } catch (error: any) {
      console.error(error);
      
      // If the error relates to the API Key in a managed env, try to prompt for re-selection
      if ((window as any).aistudio && error.message?.includes("Requested entity was not found")) {
         try {
            await (window as any).aistudio.openSelectKey();
            // If successful, we could auto-retry, but asking user to click again is safer
            setErrorMsg("API Key authorization updated. Please try searching again.");
            setViewState('error');
            return;
         } catch (e) {
            console.warn("Re-selection failed", e);
         }
      }

      setViewState('error');
      // Display the actual error message to help with debugging (e.g., Missing API Key, Quota limits)
      // If the error comes from the SDK with a generic message, give a hint.
      let msg = error.message || "We encountered an issue searching for scholarships.";
      if (msg.includes("API key") || msg.includes("403") || msg.includes("key not found")) {
         msg = "API Access Error: Please ensure your API Key is correctly configured in your environment.";
      }
      setErrorMsg(msg);
    }
  };

  const handleRestart = () => {
    setViewState('onboarding');
    setSearchResult(null);
    setFundingPreference('Both');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleRestart}>
            <div className="bg-blue-600 rounded-lg p-1.5">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Scholarship<span className="text-blue-600">Scout</span></span>
          </div>
          {viewState === 'results' && (
            <button onClick={handleRestart} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
              New Search
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow py-10 px-4">
        {viewState === 'onboarding' && (
          <div className="fade-in">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Fund Your Future
              </h1>
              <p className="text-lg text-slate-600">
                Stop searching aimlessly. Our AI scout finds scholarships you are actually eligible for, tailored to your academic profile and citizenship.
              </p>
            </div>
            <ProfileForm onSubmit={handleProfileSubmit} isLoading={false} />
          </div>
        )}

        {viewState === 'searching' && (
          <div className="flex flex-col items-center justify-center h-[60vh] fade-in">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Scouring the Web...</h2>
            <p className="text-slate-500 text-center max-w-md">
              We are analyzing global scholarship databases and university portals to find the best matches for you.
            </p>
          </div>
        )}

        {viewState === 'results' && searchResult && (
          <div className="fade-in">
             <ScholarshipList 
               scholarships={searchResult.scholarships} 
               sources={searchResult.sources}
               onRestart={handleRestart}
               fundingPreference={fundingPreference}
             />
             {/* Fallback if parsing failed completely but we have text */}
             {searchResult.scholarships.length === 0 && searchResult.rawText && (
               <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm mt-8">
                 <h3 className="font-bold text-lg mb-4">AI Search Summary</h3>
                 <div className="prose text-slate-700 whitespace-pre-wrap">
                   {searchResult.rawText}
                 </div>
               </div>
             )}
          </div>
        )}

        {viewState === 'error' && (
          <div className="max-w-lg mx-auto text-center mt-20 bg-red-50 p-8 rounded-xl border border-red-100">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-red-800 mb-2">Search Failed</h3>
            <p className="text-red-600 mb-6">{errorMsg}</p>
            <button 
              onClick={handleRestart}
              className="px-6 py-2 bg-white border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition shadow-sm"
            >
              Try Again
            </button>
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} Scholarship Scout. Powered by Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;