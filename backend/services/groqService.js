import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Map user-facing length labels to concrete generation targets
const LENGTH_SPECS = {
  short: { minWords: 800, maxWords: 1200, dialogues: '10-15', maxTokens: 4096, duration: '5-8 minutes' },
  medium: { minWords: 2000, maxWords: 3000, dialogues: '25-35', maxTokens: 8192, duration: '12-18 minutes' },
  'deep-dive': { minWords: 4000, maxWords: 5500, dialogues: '45-60', maxTokens: 8192, duration: '25-40 minutes' },
};

export async function generateScript(pdfText, config, transformationSystemPrompt) {
  const { audience, length, focusAreas, style, introWrapup } = config;
  const spec = LENGTH_SPECS[length] || LENGTH_SPECS.medium;

  // Use the transformation's custom prompt if provided; otherwise fall back to the default
  const basePrompt = transformationSystemPrompt || `You are a podcast script writer. Convert this research paper into a natural, engaging two-host conversation. Alex explains concepts clearly, Sam asks curious questions. Balance depth with accessibility.`;

  const systemPrompt = `${basePrompt}

CRITICAL LENGTH REQUIREMENTS — you MUST follow these strictly:
- Target word count: ${spec.minWords}–${spec.maxWords} words of spoken dialogue
- Target number of dialogue turns: ${spec.dialogues} turns total
- Target duration: ${spec.duration}
- Each dialogue turn should be 2-4 sentences long (40-80 words per turn)
- DO NOT cut the conversation short. DO NOT summarise multiple sections into one brief exchange.
- Cover the paper's content thoroughly: introduce each key section, discuss methodology, results, implications, and limitations with rich detail.
- If the paper has figures, tables, or equations, describe and discuss them naturally in conversation.

Additional instructions:
- Audience level: ${audience}
- Focus areas: ${focusAreas || 'full paper'}
- Conversation style: ${style}
${introWrapup ? '- Include a welcoming intro and a concluding wrap-up.' : '- START IMMEDIATELY with the core content. DO NOT include any welcome, introduction, or concluding wrap-up remarks.'}

Host 1: Alex (Explainer) — explains concepts clearly
Host 2: Sam (Questioner) — asks smart questions, challenges ideas

Return JSON format ONLY without any markdown blocks:
{
  "title": "string",
  "chapters": [
    {
      "id": "string",
      "title": "string",
      "dialogues": [
        { "speaker": "alex" | "sam", "timestamp": "string", "text": "string" }
      ]
    }
  ],
  "totalWords": 0,
  "estimatedDuration": "string"
}

REMEMBER: You MUST produce at least ${spec.minWords} words of dialogue across at least ${spec.dialogues.split('-')[0]} dialogue turns. A short response is NOT acceptable.`;

  const userPrompt = `Paper content: ${pdfText.substring(0, 30000)}

Generate a COMPLETE, FULL-LENGTH podcast script following the instructions above. The script must have at least ${spec.minWords} words of dialogue.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: spec.maxTokens,
      response_format: { type: 'json_object' }
    });

    const responseText = chatCompletion.choices[0].message.content;
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error generating script with Groq:', error);
    throw new Error('Failed to generate script');
  }
}
