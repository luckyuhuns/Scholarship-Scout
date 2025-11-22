import React, { useState } from 'react';
import { UserProfile } from '../types';
import { COUNTRIES, DOCUMENTS, EDUCATION_LEVELS, STUDY_FIELDS } from '../constants';

interface ProfileFormProps {
  onSubmit: (profile: UserProfile) => void;
  isLoading: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<UserProfile>({
    countryOfCitizenship: '',
    currentEducationLevel: '',
    currentDegreeTitle: '',
    targetDegree: '',
    fieldOfStudy: [],
    gpa: '',
    documentsAvailable: [],
    fundingPreference: 'Both',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (doc: string) => {
    setFormData(prev => {
      const docs = prev.documentsAvailable.includes(doc)
        ? prev.documentsAvailable.filter(d => d !== doc)
        : [...prev.documentsAvailable, doc];
      return { ...prev, documentsAvailable: docs };
    });
  };

  const handleFieldChange = (field: string) => {
    setFormData(prev => {
      const fields = prev.fieldOfStudy.includes(field)
        ? prev.fieldOfStudy.filter(f => f !== field)
        : [...prev.fieldOfStudy, field];
      return { ...prev, fieldOfStudy: fields };
    });
  };

  const handleFundingChange = (option: 'Fully Funded' | 'Partial Funding' | 'Both') => {
    setFormData(prev => ({ ...prev, fundingPreference: option }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.countryOfCitizenship || formData.fieldOfStudy.length === 0) {
      alert("Please fill in at least Country and select at least one Field of Study");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Tell us about yourself</h2>
        <p className="text-slate-500">We'll search for scholarships tailored to your specific profile.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Personal Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Citizenship / Country</label>
            <select
              name="countryOfCitizenship"
              value={formData.countryOfCitizenship}
              onChange={handleChange}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">Select Country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">GPA / Grade Average</label>
            <input
              type="text"
              name="gpa"
              value={formData.gpa}
              onChange={handleChange}
              placeholder="e.g. 3.8/4.0 or First Class"
              className="w-full p-3 border border-slate-300 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Academic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Current Education Level</label>
            <select
              name="currentEducationLevel"
              value={formData.currentEducationLevel}
              onChange={handleChange}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">Select Current Level</option>
              {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Current / Highest Degree Title</label>
            <input
              type="text"
              name="currentDegreeTitle"
              value={formData.currentDegreeTitle}
              onChange={handleChange}
              placeholder="e.g. BSc Computer Science, IB Diploma"
              className="w-full p-3 border border-slate-300 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Target Degree</label>
            <select
              name="targetDegree"
              value={formData.targetDegree}
              onChange={handleChange}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">Select Target Degree</option>
              {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Field of Study - Multiple Select */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Field of Study (Select all that apply)</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-60 overflow-y-auto">
            {STUDY_FIELDS.map(field => (
              <label key={field} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                <input
                  type="checkbox"
                  checked={formData.fieldOfStudy.includes(field)}
                  onChange={() => handleFieldChange(field)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-slate-700">{field}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Funding & Docs */}
        <div className="space-y-6">
           {/* Funding Preference */}
           <div className="space-y-3">
             <label className="block text-sm font-medium text-slate-700">I am interested in:</label>
             <div className="flex flex-wrap gap-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                {(['Fully Funded', 'Partial Funding', 'Both'] as const).map((option) => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.fundingPreference === option}
                      onChange={() => handleFundingChange(option)}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-slate-700 font-medium">{option}</span>
                  </label>
                ))}
             </div>
           </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Documents you have ready:</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DOCUMENTS.map(doc => (
                <div key={doc} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={doc}
                    checked={formData.documentsAvailable.includes(doc)}
                    onChange={() => handleCheckboxChange(doc)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={doc} className="text-sm text-slate-600 cursor-pointer">{doc}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all transform active:scale-[0.98]
            ${isLoading 
              ? 'bg-slate-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200'
            }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Scouting Scholarships...</span>
            </div>
          ) : (
            'Find Scholarships'
          )}
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;