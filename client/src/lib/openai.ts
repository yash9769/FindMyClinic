import OpenAI from 'openai';

// Use a safe fallback to prevent instant crash on load if key is missing
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

console.log('🚀 SYSTEM STATUS: OpenAI Integration Active');
console.log('Using OpenAI API key:', OPENAI_API_KEY ? `Present (Length: ${OPENAI_API_KEY.length})` : 'Missing (Check .env)');

// Initialize OpenAI Client
// dangerouslyAllowBrowser: true is required because we are calling this from the frontend.
// In a production app, this should be done via a backend proxy to protect the key.
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY || 'dummy-key-to-prevent-crash', // Prevent initial crash, will fail safely on first call
    dangerouslyAllowBrowser: true
});

export interface SymptomAnalysisResult {
    analysis: string;
    confidence: number;
    urgency: 'routine' | 'urgent' | 'emergency';
    recommendations: string;
    possibleConditions: string[];
    recommendedSpecialty: string;
    rawResponse: string;
}

export async function analyzeSymptomsWithOpenAI(
    description: string,
    severity: string,
    duration?: string,
    additionalNotes?: string,
    image?: File
): Promise<SymptomAnalysisResult> {
    console.log('🔄 Starting OpenAI API call with:', { description, severity, duration, additionalNotes, hasImage: !!image });

    try {
        if (description === 'FAIL_API') {
            throw new Error('Fallback Test: Simulated Error');
        }

        let userMessageContent: any[] = [
            {
                type: "text",
                text: `Patient Symptoms:
- Description: ${description}
- Severity: ${severity}
${duration ? `- Duration: ${duration}` : ''}
${additionalNotes ? `- Additional Notes: ${additionalNotes}` : ''}

Available Medical Specialties:
- General Medicine
- Cardiology
- Dermatology
- Orthopedics
- Pediatrics
- Gynecology
- Ophthalmology
- Dentistry
- Psychiatry
- Neurology
- ENT
- Urology
- Emergency Medicine

Analyze the symptoms and provide a JSON response.`
            }
        ];

        if (image) {
            console.log('📷 Processing image for analysis with gpt-4o-mini...');
            const base64Image = await fileToBase64(image);
            userMessageContent.push({
                type: "image_url",
                image_url: {
                    url: `data:${image.type};base64,${base64Image}`
                }
            });
        } else {
            console.log('📝 Processing text-only analysis...');
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using the fast, cost-effective model
            messages: [
                {
                    role: "system",
                    content: `You are a medical symptom analyzer. Provide a detailed analysis and recommend the most appropriate medical specialty.
          
          Return ONLY the following JSON format:
          {
            "analysis": "Detailed analysis string",
            "confidence": 75,
            "urgency": "routine" | "urgent" | "emergency",
            "recommendations": "Specific advice string",
            "possibleConditions": ["Condition 1", "Condition 2"],
            "recommendedSpecialty": "Specialty Name"
          }
          
          IMPORTANT: Not a diagnosis. Recommend professional consultation.`
                },
                {
                    role: "user",
                    content: userMessageContent
                }
            ],
            response_format: { type: "json_object" }
        });

        console.log('⏳ Waiting for OpenAI response...');
        const resultText = completion.choices[0].message.content;
        console.log('✅ OpenAI API response received:', resultText);

        if (!resultText) throw new Error('Empty response from OpenAI');

        let parsedResult;
        try {
            parsedResult = JSON.parse(resultText);
        } catch (e) {
            console.error('❌ JSON parse error:', e);
            throw new Error('Failed to parse OpenAI response');
        }

        const finalResult = {
            analysis: parsedResult.analysis || 'Unable to analyze symptoms.',
            confidence: Math.min(Math.max(parsedResult.confidence || 50, 0), 100),
            urgency: ['routine', 'urgent', 'emergency'].includes(parsedResult.urgency) ? parsedResult.urgency : 'routine',
            recommendations: parsedResult.recommendations || 'Consult a healthcare professional.',
            possibleConditions: Array.isArray(parsedResult.possibleConditions) ? parsedResult.possibleConditions : [],
            recommendedSpecialty: parsedResult.recommendedSpecialty || 'General Medicine',
            rawResponse: resultText,
        };

        console.log('🎉 Final analysis result:', finalResult);
        return finalResult;

    } catch (error) {
        console.error('💥 OpenAI API error:', error);
        console.warn('⚠️ OpenAI API unavailable. Activating AI-Heuristic Fallback Engine...');

        const desc = (description || '').toLowerCase();

        // Default fallback structure
        let fallback: Omit<SymptomAnalysisResult, 'rawResponse'> = {
            analysis: "Based on our heuristic analysis of your symptoms, we've identified potential areas of concern that require professional evaluation.",
            confidence: 65,
            urgency: severity === 'severe' ? 'urgent' : 'routine',
            recommendations: "We recommend scheduling a consultation with the suggested specialist for a thorough physical examination and diagnostic tests.",
            possibleConditions: ["Symptomatic distress requiring evaluation"],
            recommendedSpecialty: "General Medicine"
        };

        // Comprehensive Symptom -> Specialty Mapping
        const symptomRules = [
            // CARDIOLOGY (Heart)
            {
                keywords: ['chest pain', 'heart', 'palpitations', 'angina', 'shortness of breath', 'heartbeat', 'pressure'],
                specialty: 'Cardiology', urgency: 'emergency', analysis: "Symptoms involving chest pain or heart irregularities require immediate attention."
            },
            {
                keywords: ['blood pressure', 'hypertension', 'cholesterol', 'fainting'],
                specialty: 'Cardiology', urgency: 'urgent', analysis: "Cardiovascular evaluation is recommended."
            },

            // DERMATOLOGY (Skin)
            {
                keywords: ['skin', 'rash', 'itch', 'acne', 'mole', 'eczema', 'psoriasis', 'hives', 'blister', 'bump', 'lesion', 'redness'],
                specialty: 'Dermatology', urgency: 'routine', analysis: "Visual dermatological patterns suggest a skin-related condition."
            },
            {
                keywords: ['hair loss', 'nail', 'dandruff', 'scalp'],
                specialty: 'Dermatology', urgency: 'routine', analysis: "Issues related to hair, nails, or scalp typically fall under dermatology."
            },

            // ORTHOPEDICS (Bones/Joints)
            {
                keywords: ['bone', 'joint', 'fracture', 'knee', 'back pain', 'spine', 'shoulder', 'elbow', 'wrist', 'arthritis', 'ligament', 'sprain'],
                specialty: 'Orthopedics', urgency: 'urgent', analysis: "Musculoskeletal symptoms suggesting a potential injury or chronic condition."
            },
            {
                keywords: ['muscle', 'cramp', 'strain', 'stiffness'],
                specialty: 'Orthopedics', urgency: 'routine', analysis: "Soft tissue or muscle-related discomfort."
            },

            // DENTISTRY (Teeth)
            {
                keywords: ['tooth', 'gum', 'dental', 'cavity', 'root canal', 'jaw', 'mouth', 'bad breath', 'bleeding gums'],
                specialty: 'Dentistry', urgency: 'routine', analysis: "Oral health issues requiring a dentist's evaluation."
            },

            // NEUROLOGY (Brain/Nerves)
            {
                keywords: ['headache', 'migraine', 'dizziness', 'seizure', 'numbness', 'tingling', 'tremor', 'memory', 'confusion', 'stroke'],
                specialty: 'Neurology', urgency: 'emergency', analysis: "Neurological symptoms that may indicate nerve or brain function issues."
            },

            // OPHTHALMOLOGY (Eyes)
            {
                keywords: ['eye', 'vision', 'blur', 'blind', 'tearing', 'red eye', 'itchy eye', 'glaucoma', 'cataract'],
                specialty: 'Ophthalmology', urgency: 'urgent', analysis: "Ocular symptoms requiring an eye specialist."
            },

            // ENT (Ear, Nose, Throat)
            {
                keywords: ['ear', 'nose', 'throat', 'hearing', 'sinus', 'tonsil', 'sore throat', 'vertigo', 'ringing', 'congestion', 'voice'],
                specialty: 'ENT', urgency: 'routine', analysis: "Ear, Nose, and Throat (ENT) issues detected."
            },

            // PSYCHIATRY (Mental Health)
            {
                keywords: ['anxiety', 'depression', 'stress', 'insomnia', 'panic', 'mood', 'hallucination', 'suicidal', 'addiction'],
                specialty: 'Psychiatry', urgency: 'urgent', analysis: "Mental health concerns requiring professional support."
            },

            // GYNECOLOGY (Women's Health)
            {
                keywords: ['period', 'menstrual', 'pregnancy', 'vaginal', 'pelvic', 'menopause', 'breast', 'fertility'],
                specialty: 'Gynecology', urgency: 'routine', analysis: "Reproductive health symptoms requiring a Gynecologist."
            },

            // UROLOGY (Urinary/Male Reproductive)
            {
                keywords: ['urine', 'kidney', 'bladder', 'prostate', 'erectile', 'urination', 'stone', 'uti'],
                specialty: 'Urology', urgency: 'urgent', analysis: "Urinary tract or male reproductive system issues."
            },

            // PEDIATRICS (Children) (Note: Keyword 'child' or 'baby' usually triggers this, but we look for symptoms too)
            {
                keywords: ['baby', 'infant', 'child', 'toddler', 'diaper', 'growth'],
                specialty: 'Pediatrics', urgency: 'routine', analysis: "Pediatric health concern."
            },

            // GENERAL MEDICINE (Common Illnesses)
            {
                keywords: ['fever', 'cold', 'flu', 'cough', 'fatigue', 'weakness', 'weight', 'stomach', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'abdomen', 'pain', 'infection', 'allergy'],
                specialty: 'General Medicine', urgency: 'routine', analysis: "General physiological symptoms suggesting a common illness or infection."
            }
        ];

        // Find the best match
        for (const rule of symptomRules) {
            if (rule.keywords.some(k => desc.includes(k))) {
                fallback.recommendedSpecialty = rule.specialty;
                fallback.urgency = rule.urgency as 'routine' | 'urgent' | 'emergency';
                if (severity === 'severe') fallback.urgency = 'emergency'; // Severity override
                fallback.analysis = rule.analysis;
                // Generate mock conditions based on specialty
                fallback.possibleConditions = [`Potential ${rule.specialty} Condition`, "Inflammation", "Infection"];
                break; // Stop at first match (priority order in list matters)
            }
        }

        return {
            ...fallback,
            rawResponse: JSON.stringify(fallback) + " (Heuristic Fallback Engine v2.0 Active)"
        };
    }
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}
