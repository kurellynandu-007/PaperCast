import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateScript(pdfText, config, transformationSystemPrompt) {
  const { audience, length, focusAreas, style, introWrapup } = config;

  // Use the transformation's custom prompt if provided; otherwise fall back to the default
  const basePrompt = transformationSystemPrompt || `You are a podcast script writer. Convert this research paper into a natural, engaging two-host conversation. Alex explains concepts clearly, Sam asks curious questions. Balance depth with accessibility.`;

  const systemPrompt = `${basePrompt}

Additional instructions:
- Audience level: ${audience}
- Episode length: ${length}
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
}`;

  const userPrompt = `Paper content: ${pdfText.substring(0, 30000)}

Generate a podcast script following the instructions above.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const responseText = chatCompletion.choices[0].message.content;
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error generating script with Groq:', error);
    throw new Error('Failed to generate script');
  }
}
