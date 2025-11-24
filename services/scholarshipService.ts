import { GoogleGenAI } from "@google/genai";
import { UserProfile, SearchResult, Scholarship, GroundingSource } from "../types";

// Helper to determine if a deadline is valid (future, today, or rolling)
const isDeadlineFutureOrRolling = (deadlineStr: string): boolean => {
  if (!deadlineStr) return true; // Keep if undefined to be safe
  const clean = deadlineStr.toLowerCase().trim();
  
  // 1. Explicit Allow List for non-date statuses
  const allowList = [
    'open', 'varies', 'rolling', 'ongoing', 'year-round', 
    'always', 'tba', 'tbd', 'soon', 'unknown'
  ];
  
  if (allowList.some(keyword => clean.includes(keyword))) {
    return true;
  }

  // 2. Try parsing the date
  const date = new Date(deadlineStr);
  
  // If we can't parse it as a valid date, we default to showing it 
  // (better to show valid text like "End of Spring" than hide a potential opportunity)
  if (isNaN(date.getTime())) {
    return true;
  }

  // 3. Numeric Comparison
  // We create a date object for "yesterday" to ensure deadlines appearing "today" are included.
  const yesterday = new Date();
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);
  
  return date > yesterday;
};

const parseScholarshipResponse = (text: string): Scholarship[] => {
  const scholarships: Scholarship[] = [];
  // We rely on the prompt to format entries with a specific delimiter
  const entries = text.split('---SCHOLARSHIP_ENTRY---');

  entries.forEach((entry, index) => {
    if (!entry.trim()) return;

    const nameMatch = entry.match(/NAME:\s*(.+)/i);
    const providerMatch = entry.match(/PROVIDER:\s*(.+)/i);
    const deadlineMatch = entry.match(/DEADLINE:\s*(.+)/i);
    const typeMatch = entry.match(/TYPE:\s*(.+)/i);
    const linkMatch = entry.match(/LINK:\s*(.+)/i);
    const descMatch = entry.match(/DESCRIPTION:\s*(.+)/i);
    const amountMatch = entry.match(/AMOUNT:\s*(.+)/i);
    const reqMatch = entry.match(/REQUIREMENTS:\s*(.+)/i);

    if (nameMatch) {
      const name = nameMatch[1].trim();
      let fundingType: 'Fully Funded' | 'Partial Funding' | 'Unknown' = 'Unknown';
      const typeStr = typeMatch ? typeMatch[1].toLowerCase() : '';
      if (typeStr.includes('full')) fundingType = 'Fully Funded';
      else if (typeStr.includes('partial')) fundingType = 'Partial Funding';

      // Create a deterministic ID based on the name to allow saving/bookmarks to persist across searches
      // We strip special characters and use the name as a slug
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const id = `sch-${slug}`;

      // Parse requirements splitting by semicolon if present
      const rawReqs = reqMatch ? reqMatch[1].trim() : "";
      const requirements = rawReqs ? rawReqs.split(';').map(r => r.trim()).filter(r => r.length > 0) : [];

      const deadline = deadlineMatch ? deadlineMatch[1].trim() : "Open / Varies";

      // Only add the scholarship if the deadline is valid (Future or Rolling)
      // This acts as a double-check in case the AI hallucinated a past date
      if (isDeadlineFutureOrRolling(deadline)) {
        scholarships.push({
          id, 
          name: name,
          provider: providerMatch ? providerMatch[1].trim() : "External Provider",
          deadline: deadline,
          fundingType,
          amount: amountMatch ? amountMatch[1].trim() : undefined,
          applicationLink: linkMatch ? linkMatch[1].trim() : undefined,
          description: descMatch ? descMatch[1].trim() : "No description provided.",
          requirements: requirements
        });
      }
    }
  });

  return scholarships;
};

export const searchScholarships = async (profile: UserProfile): Promise<SearchResult> => {
  try {
    // Note: We rely on the SDK to handle API key validation or the App.tsx flow to ensure it's present.
    // But we default safely to prevent crashes in non-AI-Studio environments if process.env isn't polyfilled.
    const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : ""; 
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Get current date in YYYY-MM-DD format based on user's local time
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Construct a detailed prompt for search
    const prompt = `
      I need to find active scholarships for a student with the following profile:
      - Citizenship: ${profile.countryOfCitizenship}
      - Current Level: ${profile.currentEducationLevel}
      - Current Degree Title: ${profile.currentDegreeTitle}
      - Target Degree: ${profile.targetDegree}
      - Fields of Study: ${profile.fieldOfStudy.join(', ')}
      - GPA/Grades: ${profile.gpa}
      - Funding Preference: ${profile.fundingPreference}
      
      Today's Date: ${today}

      Please use Google Search to find currently open or upcoming scholarships that match this profile.
      
      CRITICAL DEADLINE RULE: 
      - You MUST compare the scholarship deadline to Today's Date (${today}).
      - DO NOT include scholarships where the deadline has already passed (e.g. if today is 2024-11-01, do not include deadlines from 2024-10-31 or earlier).
      - Only include scholarships with deadlines in the future OR recurring deadlines labeled "Open", "Rolling", or "Varies".

      CRITICAL OUTPUT FORMAT:
      For each scholarship found, strictly output a block in the following format. Do not use Markdown tables. separate blocks with "---SCHOLARSHIP_ENTRY---".
      
      ---SCHOLARSHIP_ENTRY---
      NAME: [Scholarship Name]
      PROVIDER: [University or Organization Name]
      DEADLINE: [YYYY-MM-DD preferred. If rolling/unknown, use "Open / Varies"]
      TYPE: [Fully Funded OR Partial Funding]
      AMOUNT: [Amount covered]
      LINK: [Direct Application URL found in search]
      DESCRIPTION: [Brief summary]
      REQUIREMENTS: [Requirement 1]; [Requirement 2]; [Requirement 3] (Separated by semicolons)
      
      IMPORTANT: 
      1. Only provide links that are actual URLs starting with http or https. If no direct link is found, leave LINK blank or put "Search Google".
      2. Ensure the link is for the specific scholarship application page if possible.
      3. Extract 3-5 key eligibility requirements separate from the description.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    
    // Extract Grounding Chunks (Sources)
    const sources: GroundingSource[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    const scholarships = parseScholarshipResponse(text);
    
    return {
      scholarships,
      sources,
      rawText: text
    };

  } catch (error) {
    console.error("Error fetching scholarships:", error);
    throw error;
  }
};
