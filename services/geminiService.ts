
import { GoogleGenAI, Type } from "@google/genai";
import type { AssessmentType, Answers, Question, Recommendation } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    recommendations: {
      type: Type.ARRAY,
      description: 'A list of 3-5 career recommendations.',
      items: {
        type: Type.OBJECT,
        properties: {
          career: {
            type: Type.STRING,
            description: 'The name of the recommended career.',
          },
          reason: {
            type: Type.STRING,
            description: 'A brief, 1-2 sentence explanation of why this career is a good fit based on the answers.',
          },
        },
        required: ['career', 'reason'],
      },
    },
  },
  required: ['recommendations'],
};

const getAssessmentTitle = (type: AssessmentType): string => {
  switch (type) {
    case 'career': return 'Career Test';
    case 'personality': return 'Personality Test';
    case 'skills': return 'Skills Evaluation';
  }
}

export const getCareerRecommendations = async (
  testType: AssessmentType,
  questions: Question[],
  answers: Answers
): Promise<Recommendation[]> => {
  const formattedAnswers = questions
    .map((q, i) => `Question: ${q}\nAnswer: ${answers[i] || 'Not answered'}`)
    .join('\n\n');

  const prompt = `
    You are an expert career counselor AI. Your task is to provide career recommendations for a student based on their answers to an assessment.
    Analyze the following results and provide 3-5 suitable career recommendations.

    Assessment Type: ${getAssessmentTitle(testType)}

    Assessment Questions and Answers:
    ${formattedAnswers}

    Based on these answers, suggest specific careers and provide a brief, encouraging reason for each recommendation, explaining why it aligns with the student's responses.
    Return the response in the specified JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.recommendations || [];
  } catch (error) {
    console.error("Error generating recommendations:", error);
    // Return a fallback recommendation in case of an API error
    return [
      {
        career: "Error",
        reason: "Could not generate recommendations at this time. Please check your connection or API key and try again."
      }
    ];
  }
};
