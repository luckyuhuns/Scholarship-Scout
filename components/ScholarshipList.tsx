import React, { useState, useMemo, useEffect } from 'react';
import { Scholarship, GroundingSource } from '../types';

interface ScholarshipListProps {
  scholarships: Scholarship[];
  sources: GroundingSource[];
  onRestart: () => void;
  fundingPreference: 'Fully Funded' | 'Partial Funding' | 'Both';
}

const ScholarshipList: React.FC<ScholarshipListProps> = ({ scholarships, sources, onRestart, fundingPreference }) => {
  // State for Saved Scholarships
  const [savedScholarships, setSavedScholarships] = useState<Scholarship[]>(() => {
    const saved = localStorage.getItem('savedScholarships');
    return saved ? JSON.parse(saved) : [];
  });

  // View State: 'search' results or 'saved' items
  const [viewMode, setViewMode] = useState<'search' | 'saved'>('search');

  // Filter & Sort State
  const [filterType, setFilterType] = useState<'All' | 'Fully Funded' | 'Partial Funding'>(
    fundingPreference === 'Both' ? 'All' : fundingPreference
  );
  const [sortOrder, setSortOrder] = useState<'deadlineAsc' | 'deadlineDesc'>('deadlineAsc');
  
  // Expanded Card State for "View Details"
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Persist saved scholarships whenever they change
  useEffect(() => {
    localStorage.setItem('savedScholarships', JSON.stringify(savedScholarships));
  }, [savedScholarships]);

  const toggleSave = (scholarship: Scholarship) => {
    setSavedScholarships(prev => {
      const exists = prev.find(s => s.id === scholarship.id);
      if (exists) {
        return prev.filter(s => s.id !== scholarship.id);
      } else {
        return [...prev, scholarship];
      }
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleShare = async (scholarship: Scholarship) => {
    const shareData = {
      title: scholarship.name,
      text: `Check out this scholarship: ${scholarship.name} provided by ${scholarship.provider}.`,
      url: scholarship.applicationLink || ""
    };

    // Check if Web Share API is supported
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      if (scholarship.applicationLink) {
        try {
          await navigator.clipboard.writeText(scholarship.applicationLink);
          alert("Scholarship link copied to clipboard!");
        } catch (err) {
          console.error('Failed to copy link:', err);
          alert("Unable to copy link.");
        }
      } else {
        alert("No valid link available to share for this scholarship.");
      }
    }
  };

  const isSaved = (id: string) => savedScholarships.some(s => s.id === id);

  // Determine which list to show based on active tab
  const currentListSource = viewMode === 'search' ? scholarships : savedScholarships;

  const filteredAndSorted = useMemo(() => {
    let result = [...currentListSource];

    if (filterType !== 'All') {
      result = result.filter(s => s.fundingType === filterType);
    }

    result.sort((a, b) => {
      // Simple string comparison for dates often works if format is YYYY-MM-DD, 
      // but for "Varies" or text dates, we push them to the end.
      const dateA = new Date(a.deadline).getTime();
      const dateB = new Date(b.deadline).getTime();
      
      const valA = isNaN(dateA) ? 9999999999999 : dateA;
      const valB = isNaN(dateB) ? 9999999999999 : dateB;

      return sortOrder === 'deadlineAsc' ? valA - valB : valB - valA;
    });

    return result;
  }, [currentListSource, filterType, sortOrder]);

  const getSafeLink = (link?: string) => {
    if (!link) return null;
    let cleanLink = link.trim();
    // Remove trailing punctuation often caught by AI extraction
    cleanLink = cleanLink.replace(/[.,)]+$/, '');
    
    if (cleanLink.toLowerCase().startsWith('http')) return cleanLink;
    // Heuristic: if it looks like a domain, add https
    if (cleanLink.match(/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/)) {
      return `https://${cleanLink}`;
    }
    return null; 
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-12">
      
      {/* View Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-100 p-1 rounded-xl inline-flex shadow-inner">
          <button
            onClick={() => setViewMode('search')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              viewMode === 'search' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Search Results
          </button>
          <button
            onClick={() => setViewMode('saved')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              viewMode === 'saved' 
                ? 'bg-white text-pink-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Saved</span>
            {savedScholarships.length > 0 && (
              <span className={`text-xs py-0.5 px-2 rounded-full ${
                 viewMode === 'saved' ? 'bg-pink-100 text-pink-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {savedScholarships.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Controls Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="mb-4 md:mb-0">
          <h2 className="text-xl font-bold text-slate-800">
            {viewMode === 'search' ? `Found ${filteredAndSorted.length} Opportunities` : `Your Saved Scholarships`}
          </h2>
          <p className="text-sm text-slate-500">
            {viewMode === 'search' ? 'Based on your eligibility profile' : 'Opportunities you have bookmarked'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
            {fundingPreference === 'Both' || viewMode === 'saved' ? (
              <>
                <button 
                  onClick={() => setFilterType('All')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${filterType === 'All' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterType('Fully Funded')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${filterType === 'Fully Funded' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Fully Funded
                </button>
                <button 
                  onClick={() => setFilterType('Partial Funding')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${filterType === 'Partial Funding' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Partial
                </button>
              </>
            ) : (
              <button 
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-white text-blue-600 shadow-sm cursor-default"
                disabled
              >
                {fundingPreference}
              </button>
            )}
          </div>

          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="p-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="deadlineAsc">Deadline (Soonest)</option>
            <option value="deadlineDesc">Deadline (Latest)</option>
          </select>

          {viewMode === 'search' && (
            <button 
              onClick={onRestart}
              className="text-sm text-slate-500 hover:text-red-500 underline ml-2"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {filteredAndSorted.map(scholarship => {
          const safeLink = getSafeLink(scholarship.applicationLink);
          const saved = isSaved(scholarship.id);
          const isExpanded = expandedIds.has(scholarship.id);

          return (
            <div key={scholarship.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col h-full relative group">
              
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 z-10 flex space-x-2">
                {/* Share Button */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleShare(scholarship);
                  }}
                  className="p-2 rounded-full bg-white/80 hover:bg-white shadow-sm border border-slate-100 transition-transform active:scale-90"
                  title="Share scholarship"
                >
                   <svg className="w-6 h-6 text-slate-400 hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                   </svg>
                </button>

                {/* Save Button */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSave(scholarship);
                  }}
                  className="p-2 rounded-full bg-white/80 hover:bg-white shadow-sm border border-slate-100 transition-transform active:scale-90"
                  title={saved ? "Remove from saved" : "Save scholarship"}
                >
                  <svg 
                    className={`w-6 h-6 transition-colors ${saved ? 'text-pink-500 fill-current' : 'text-slate-400 hover:text-pink-400'}`} 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={saved ? "0" : "2"}
                    fill={saved ? "currentColor" : "none"}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              <div className="p-6 flex-grow">
                <div className="flex flex-wrap gap-2 mb-3 pr-10">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide 
                    ${scholarship.fundingType === 'Fully Funded' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {scholarship.fundingType}
                  </span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    Deadline: {scholarship.deadline}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug pr-4">{scholarship.name}</h3>
                
                <div className="text-sm text-slate-600 mb-4">
                   <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? '' : 'line-clamp-3'}`}>
                      {scholarship.description}
                   </div>

                   {isExpanded && (
                      <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        
                        {/* Provider & Value Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start space-x-3">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600 flex-shrink-0">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Provider</h4>
                              <p className="text-slate-900 font-bold text-sm md:text-base leading-tight">{scholarship.provider}</p>
                            </div>
                          </div>
                          
                          {scholarship.amount && (
                             <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-start space-x-3">
                               <div className="bg-green-100 p-2 rounded-lg text-green-600 flex-shrink-0">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                               </div>
                               <div>
                                 <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Value</h4>
                                 <p className="text-slate-900 font-bold text-sm md:text-base">{scholarship.amount}</p>
                               </div>
                             </div>
                          )}
                        </div>

                        {/* Requirements Section */}
                        {scholarship.requirements && scholarship.requirements.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-bold text-slate-800 mb-3 flex items-center text-sm uppercase tracking-wide">
                                    Eligibility & Requirements
                                </h4>
                                <ul className="space-y-2">
                                    {scholarship.requirements.map((req, i) => (
                                      <li key={i} className="flex items-start text-slate-600 text-sm bg-slate-50 p-2.5 rounded-lg border border-slate-100/50">
                                        <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
                                        <span className="leading-relaxed">{req}</span>
                                      </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                      </div>
                   )}
                </div>
                
                {/* View Details Trigger */}
                <button 
                  onClick={() => toggleExpand(scholarship.id)}
                  className="text-sm text-blue-600 font-medium hover:text-blue-800 focus:outline-none hover:underline flex items-center mt-2"
                >
                  {isExpanded ? (
                    <>
                      Show Less 
                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </>
                  ) : (
                    <>
                      View Details
                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
                <div className="text-xs text-slate-400">Source: Gemini Search</div>
                {safeLink ? (
                  <a 
                    href={safeLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Apply Now &rarr;
                  </a>
                ) : (
                  <button 
                    disabled
                    className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 text-sm font-medium rounded-md text-slate-400 bg-slate-100 cursor-not-allowed shadow-sm"
                  >
                    Application details not provided
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredAndSorted.length === 0 && (
         <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
           <p className="text-slate-500 text-lg">
             {viewMode === 'search' 
               ? 'No scholarships found matching your specific filters.' 
               : 'You haven\'t saved any scholarships yet.'}
           </p>
           {viewMode === 'saved' && (
             <button onClick={() => setViewMode('search')} className="text-blue-600 font-medium mt-2 hover:underline">
               Browse Search Results
             </button>
           )}
           {viewMode === 'search' && (
             <button onClick={() => setFilterType('All')} className="text-blue-600 font-medium mt-2 hover:underline">View all types</button>
           )}
         </div>
      )}

      {/* Sources Section - Only show in Search View */}
      {viewMode === 'search' && sources.length > 0 && (
        <div className="mt-12 border-t border-slate-200 pt-8">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Verified Sources (Grounding)</h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sources.map((source, idx) => (
              <li key={idx}>
                <a href={source.uri} target="_blank" rel="noreferrer" className="block p-3 rounded-lg border border-slate-200 hover:bg-white hover:shadow-sm transition text-sm text-blue-600 truncate">
                  <span className="block text-slate-800 font-medium text-xs mb-1 truncate">{source.title}</span>
                  {source.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ScholarshipList;