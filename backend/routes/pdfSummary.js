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

function truncateWords(text, maxWords = 500) {
    const words = text.split(/\s+/).filter(Boolean);
    return words.length > maxWords ? words.slice(0, maxWords).join(' ') + '\n...[truncated]' : text;
}

router.post('/', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file provided' });
        }

        let text;
        try {
            text = await extractTextFromPdf(req.file.buffer);
        } catch (extractErr) {
            console.error('[pdf-summary] PDF extraction failed:', extractErr);
            return res.status(400).json({ error: 'Could not extract text from PDF.' });
        }

        const truncated = truncateWords(text);
        if (!truncated.trim()) {
            return res.status(400).json({ error: 'PDF appears to contain no readable text.' });
        }

        const groq = getGroq();
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a research paper summarizer. Given the text of a research paper, respond with ONLY a single sentence that captures the core finding or contribution of the paper. No preamble, no extra explanation — just one clear, concise sentence.'
                },
                {
                    role: 'user',
                    content: truncated
                }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.3,
            max_tokens: 120,
        });

        const summary = (chatCompletion.choices[0].message.content ?? '').trim();
        return res.json({ summary });
    } catch (error) {
        console.error('[pdf-summary] Error:', error);
        return res.status(500).json({ error: 'Failed to generate summary.' });
    }
});

export default router;
