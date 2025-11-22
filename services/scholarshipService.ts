import { GoogleGenAI } from "@google/genai";
import { UserProfile, SearchResult, Scholarship, GroundingSource } from "../types";

const parseScholarshipResponse = (text: string): Scholarship[] => {
  const scholarships: Scholarship[] = [];
  // We rely on the prompt to format entries with a specific delimiter
  const entries = text.split('---SCHOLARSHIP_ENTRY---');

  entries.forEach((entry, index) => {
    if (!entry.trim()) return;

    const nameMatch = entry.match(/NAME:\s*(.+)/i);
    const deadlineMatch = entry.match(/DEADLINE:\s*(.+)/i);
    const typeMatch = entry.match(/TYPE:\s*(.+)/i);
    const linkMatch = entry.match(/LINK:\s*(.+)/i);
    const descMatch = entry.match(/DESCRIPTION:\s*(.+)/i);
    const amountMatch = entry.match(/AMOUNT:\s*(.+)/i);

    if (nameMatch) {
      let fundingType: 'Fully Funded' | 'Partial Funding' | 'Unknown' = 'Unknown';
      const typeStr = typeMatch ? typeMatch[1].toLowerCase() : '';
      if (typeStr.includes('full')) fundingType = 'Fully Funded';
      else if (typeStr.includes('partial')) fundingType = 'Partial Funding';

      scholarships.push({
        id: `sch-${index}-${Date.now()}`,
        name: nameMatch[1].trim(),
        provider: "External Provider",
        deadline: deadlineMatch ? deadlineMatch[1].trim() : "Open / Varies",
        fundingType,
        amount: amountMatch ? amountMatch[1].trim() : undefined,
        applicationLink: linkMatch ? linkMatch[1].trim() : undefined,
        description: descMatch ? descMatch[1].trim() : "No description provided.",
        requirements: []
      });
    }
  });

  return scholarships;
};

export const searchScholarships = async (profile: UserProfile): Promise<SearchResult> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found. Please ensure process.env.API_KEY is set in your environment.");
    }

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
      - Only include scholarships with deadlines in the future or "Open/Varies".

      CRITICAL OUTPUT FORMAT:
      For each scholarship found, strictly output a block in the following format. Do not use Markdown tables. separate blocks with "---SCHOLARSHIP_ENTRY---".
      
      ---SCHOLARSHIP_ENTRY---
      NAME: [Scholarship Name]
      DEADLINE: [YYYY-MM-DD or specific date]
      TYPE: [Fully Funded OR Partial Funding]
      AMOUNT: [Amount covered]
      LINK: [Direct Application URL found in search]
      DESCRIPTION: [Brief summary of eligibility and coverage]
      
      IMPORTANT: 
      1. Only provide links that are actual URLs starting with http or https. If no direct link is found, leave LINK blank or put "Search Google".
      2. Ensure the link is for the specific scholarship application page if possible.
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