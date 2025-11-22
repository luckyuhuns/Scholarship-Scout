import React, { useState, useMemo } from 'react';
import { Scholarship, GroundingSource } from '../types';

interface ScholarshipListProps {
  scholarships: Scholarship[];
  sources: GroundingSource[];
  onRestart: () => void;
  fundingPreference: 'Fully Funded' | 'Partial Funding' | 'Both';
}

const ScholarshipList: React.FC<ScholarshipListProps> = ({ scholarships, sources, onRestart, fundingPreference }) => {
  const [filterType, setFilterType] = useState<'All' | 'Fully Funded' | 'Partial Funding'>(
    fundingPreference === 'Both' ? 'All' : fundingPreference
  );
  const [sortOrder, setSortOrder] = useState<'deadlineAsc' | 'deadlineDesc'>('deadlineAsc');

  const filteredAndSorted = useMemo(() => {
    let result = [...scholarships];

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
  }, [scholarships, filterType, sortOrder]);

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
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="mb-4 md:mb-0">
          <h2 className="text-xl font-bold text-slate-800">
            Found {filteredAndSorted.length} Opportunities
          </h2>
          <p className="text-sm text-slate-500">Based on your eligibility profile</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
            {fundingPreference === 'Both' ? (
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

          <button 
            onClick={onRestart}
            className="text-sm text-slate-500 hover:text-red-500 underline ml-2"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {filteredAndSorted.map(scholarship => {
          const safeLink = getSafeLink(scholarship.applicationLink);
          return (
            <div key={scholarship.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide 
                    ${scholarship.fundingType === 'Fully Funded' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {scholarship.fundingType}
                  </span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    Deadline: {scholarship.deadline}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">{scholarship.name}</h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-3">{scholarship.description}</p>
                
                {scholarship.amount && (
                  <div className="mb-4 flex items-center text-sm text-slate-700">
                    <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Value: <span className="font-semibold ml-1">{scholarship.amount}</span>
                  </div>
                )}
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
                  <span className="text-sm text-slate-500 italic">Link not available</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredAndSorted.length === 0 && (
         <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
           <p className="text-slate-500 text-lg">No scholarships found matching your specific filters.</p>
           <button onClick={() => setFilterType('All')} className="text-blue-600 font-medium mt-2 hover:underline">View all types</button>
         </div>
      )}

      {/* Sources Section */}
      {sources.length > 0 && (
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