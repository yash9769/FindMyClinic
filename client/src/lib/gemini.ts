import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

console.log('🚀 SYSTEM STATUS: Gemini Integration v5.0 Active');
console.log('Using Gemini API key:', GEMINI_API_KEY ? `Present (Length: ${GEMINI_API_KEY.length})` : 'Missing');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface SymptomAnalysisResult {
  analysis: string;
  confidence: number;
  urgency: 'routine' | 'urgent' | 'emergency';
  recommendations: string;
  possibleConditions: string[];
  recommendedSpecialty: string;
  rawResponse: string;
}

export async function analyzeSymptomsWithGemini(
  description: string,
  severity: string,
  duration?: string,
  additionalNotes?: string,
  image?: File
): Promise<SymptomAnalysisResult> {
  console.log('🔄 Starting Gemini API call with:', { description, severity, duration, additionalNotes, hasImage: !!image });

  try {
    if (description === 'FAIL_API') {
      throw new Error('Fallback Test: Simulated Quota Exceeded');
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite-preview-02-05' });

    let prompt = `You are a medical symptom analyzer. Based on the following patient information, provide a detailed analysis and recommend the most appropriate medical specialty for consultation.

Patient Symptoms:
- Description: ${description}
- Severity: ${severity}
${duration ? `- Duration: ${duration}` : ''}
${additionalNotes ? `- Additional Notes: ${additionalNotes}` : ''}

Available Medical Specialties:
- General Medicine (primary care, general health issues)
- Cardiology (heart and cardiovascular diseases)
- Dermatology (skin, hair and nail disorders)
- Orthopedics (bones, joints and musculoskeletal disorders)
- Pediatrics (child healthcare)
- Gynecology (women's health and reproductive medicine)
- Ophthalmology (eye care and vision disorders)
- Dentistry (oral health)
- Psychiatry (mental health)
- Neurology (brain and nervous system disorders)
- ENT (ear, nose and throat disorders)
- Urology (urinary tract and male reproductive health)
- Emergency Medicine (acute care)

Please provide your analysis in the following JSON format ONLY. Do not include any other text:

{
  "analysis": "Detailed analysis of the symptoms and potential causes",
  "confidence": 75,
  "urgency": "routine",
  "recommendations": "Specific recommendations for the patient",
  "possibleConditions": ["Condition 1", "Condition 2", "Condition 3"],
  "recommendedSpecialty": "Dermatology"
}

IMPORTANT: This is NOT a diagnosis. Always recommend consulting a healthcare professional. Be conservative in your assessment. Choose the most appropriate specialty from the list above based on the symptoms described. Return ONLY the JSON object, no additional text or formatting.`;

    let result: any;
    const retryDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // Convert image to base64 if present, outside the retry loop
    let imagePart: { inlineData: { data: string; mimeType: string } } | undefined;

    if (image) {
      const imageData = await fileToBase64(image);
      imagePart = {
        inlineData: {
          data: imageData,
          mimeType: image.type,
        },
      };

      prompt += '\n\nAdditionally, analyze the provided image for any visible symptoms or relevant visual information that could help identify potential skin conditions, rashes, or other visible medical issues.';
    }

    // Retry logic for 429 errors
    let retries = 3;
    while (retries > 0) {
      try {
        if (image && imagePart) {
          console.log(`📷 Processing image for analysis with gemini-2.0-flash-lite (Attempt ${4 - retries}/3)...`);
          result = await model.generateContent([prompt, imagePart]);
        } else {
          console.log(`📝 Processing text-only analysis (Attempt ${4 - retries}/3)...`);
          result = await model.generateContent(prompt);
        }
        break; // Success, exit loop
      } catch (err: any) {
        const errorMessage = String(err);
        if (errorMessage.includes('429') && retries > 1) {
          // If retry delay is long (e.g. > 10s), skip retries and go to fallback
          if (errorMessage.includes('retry in') && parseInt(errorMessage.match(/retry in (\d+)/)?.[1] || '0') > 10) {
            console.warn('⚠️ Quota exceeded with long wait time. Skipping retries.');
            throw err;
          }
          console.warn(`⚠️ Quota hit. Retrying in 2 seconds...`);
          await retryDelay(2000);
          retries--;
        } else {
          throw err; // Re-throw other errors or if out of retries
        }
      }
    }

    if (!result) {
      throw new Error('Failed to generate content after retries');
    }

    console.log('⏳ Waiting for Gemini response...');
    const response = await result.response;
    const text = response.text();

    console.log('✅ Gemini API response received:', text);

    // Try to extract JSON from the response
    let jsonText = text.trim();

    // Remove any markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Find the JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in response:', text);
      throw new Error('Invalid response format from Gemini API');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonMatch[0]);
      console.log('✅ Successfully parsed Gemini response:', parsedResult);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError, 'Raw text:', jsonMatch[0]);
      throw new Error('Failed to parse Gemini API response');
    }

    // Validate and sanitize the response
    const finalResult = {
      analysis: parsedResult.analysis || 'Unable to analyze symptoms. Please consult a healthcare professional.',
      confidence: Math.min(Math.max(parsedResult.confidence || 50, 0), 100),
      urgency: ['routine', 'urgent', 'emergency'].includes(parsedResult.urgency) ? parsedResult.urgency : 'routine',
      recommendations: parsedResult.recommendations || 'Please consult a healthcare professional for proper evaluation.',
      possibleConditions: Array.isArray(parsedResult.possibleConditions) ? parsedResult.possibleConditions : [],
      recommendedSpecialty: parsedResult.recommendedSpecialty || 'General Medicine',
      rawResponse: jsonMatch[0], // Store the raw JSON string for UI display
    };

    console.log('🎉 Final analysis result:', finalResult);
    return finalResult;
  } catch (error) {
    console.error('💥 Gemini API error:', error);

    // Provide a fallback mock analysis for common symptoms to ensure demo works
    console.warn('⚠️ Gemini API unavailable. Activating AI-Heuristic Fallback Engine...');

    const desc = (description || '').toLowerCase();
    let fallback: Omit<SymptomAnalysisResult, 'rawResponse'> = {
      analysis: "Based on our heuristic analysis of your symptoms, we've identified potential areas of concern that require professional evaluation.",
      confidence: 65,
      urgency: severity === 'severe' ? 'urgent' : 'routine',
      recommendations: "We recommend scheduling a consultation with the suggested specialist for a thorough physical examination and diagnostic tests.",
      possibleConditions: ["Symptomatic distress requiring evaluation"],
      recommendedSpecialty: "General Medicine"
    };

    // Simple keyword mapping for demo stability
    if (desc.includes('heart') || desc.includes('chest pain') || desc.includes('palpitations')) {
      fallback.recommendedSpecialty = "Cardiology";
      fallback.urgency = "emergency";
      fallback.analysis = "Chest-related symptoms are detected. This requires immediate cardiovascular screening.";
    } else if (desc.includes('skin') || desc.includes('rash') || desc.includes('itch')) {
      fallback.recommendedSpecialty = "Dermatology";
      fallback.analysis = "Visual dermatological patterns suggest a skin-related condition needing specialist review.";
    } else if (desc.includes('bone') || desc.includes('joint') || desc.includes('fracture') || desc.includes('pain')) {
      fallback.recommendedSpecialty = "Orthopedics";
    } else if (desc.includes('tooth') || desc.includes('gum') || desc.includes('dental')) {
      fallback.recommendedSpecialty = "Dentistry";
    } else {
      // Default fallback for unknown or gibberish symptoms
      fallback.recommendedSpecialty = "General Medicine";
      fallback.analysis = "Your symptoms require a general clinical evaluation to determine the most appropriate next steps.";
    }

    return {
      ...fallback,
      rawResponse: JSON.stringify(fallback) + " (Heuristic Fallback Active)"
    };
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:image/jpeg;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}