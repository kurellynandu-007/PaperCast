import express from 'express';
import multer from 'multer';
import { extractTextFromPdf } from '../services/pdfExtractor.js';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');
  return new Groq({ apiKey });
}

// Truncate to ~2500 words to stay well within token limits
function truncateWords(text, maxWords = 2500) {
  const words = text.split(/\s+/).filter(Boolean);
  return words.length > maxWords ? words.slice(0, maxWords).join(' ') + '\n...[truncated]' : text;
}

router.post('/', upload.fields([{ name: 'pdf1', maxCount: 1 }, { name: 'pdf2', maxCount: 1 }]), async (req, res) => {
  try {
    const files = req.files;
    if (!files?.pdf1?.[0] || !files?.pdf2?.[0]) {
      return res.status(400).json({ error: 'Please provide both papers to compare' });
    }

    let text1, text2;
    try {
      [text1, text2] = await Promise.all([
        extractTextFromPdf(files.pdf1[0].buffer),
        extractTextFromPdf(files.pdf2[0].buffer),
      ]);
    } catch (extractErr) {
      console.error('[debate-score] PDF extraction failed:', extractErr);
      return res.status(400).json({ error: 'Could not extract text from one or both PDFs. Make sure they are not scanned images.' });
    }

    const paper1Text = truncateWords(text1);
    const paper2Text = truncateWords(text2);

    if (!paper1Text.trim() || !paper2Text.trim()) {
      return res.status(400).json({ error: 'One or both PDFs appear to contain no readable text (may be image-based).' });
    }

    const systemPrompt = `You are an academic research analyst. Analyze these two research papers and determine how much they oppose each other. Respond with a JSON object in exactly this structure:
{
  "overallScore": <integer 0-100, where 0 = identical views, 100 = completely opposed>,
  "label": "<one of: Mostly Agree, Partially Opposing, Significantly Opposing, Strongly Opposing>",
  "paper1Title": "<title of paper 1, max 80 characters>",
  "paper2Title": "<title of paper 2, max 80 characters>",
  "breakdown": {
    "conclusions": { "score": <integer 0-100>, "explanation": "<2 sentences comparing conclusions>" },
    "methodology": { "score": <integer 0-100>, "explanation": "<2 sentences comparing methodology>" },
    "findings": { "score": <integer 0-100>, "explanation": "<2 sentences comparing findings>" },
    "recommendations": { "score": <integer 0-100>, "explanation": "<2 sentences comparing recommendations>" }
  },
  "opposingPoints": [
    {
      "topic": "<topic name in uppercase, max 40 chars>",
      "paper1Claim": "<1-2 sentences from paper 1 on this topic>",
      "paper2Claim": "<1-2 sentences from paper 2 on this topic>"
    }
  ],
  "summary": "<3 sentences summarising how these papers relate and disagree>"
}`;

    const userPrompt = `Paper 1:
${paper1Text}

Paper 2:
${paper2Text}

Include exactly 3 to 5 items in opposingPoints. Be accurate to the actual content of the papers.`;

    let rawText = '';
    try {
      const groq = getGroq();
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });
      rawText = chatCompletion.choices[0].message.content ?? '';
    } catch (groqErr) {
      console.error('[debate-score] Groq API error:', groqErr);
      return res.status(502).json({ error: 'AI analysis service unavailable. Please try again in a moment.' });
    }

    if (!rawText.trim()) {
      console.error('[debate-score] Groq returned empty response');
      return res.status(500).json({ error: 'AI returned an empty response. Please try again.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('[debate-score] JSON parse failed. Raw text:', rawText.substring(0, 500));
      return res.status(500).json({ error: 'AI returned an unexpected format. Please try again.' });
    }

    return res.json(parsed);
  } catch (error) {
    console.error('[debate-score] Unhandled error:', error);
    return res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

export default router;
