import express from 'express';
import { generateScript } from '../services/groqService.js';
import { supabase } from '../services/supabaseClient.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const { sessionId, pdfText, config, transformationSystemPrompt } = req.body;

    if (!pdfText || !config) {
        return res.status(400).json({ error: 'Missing pdfText or config' });
    }

    try {
        if (supabase && sessionId) {
            await supabase
                .from('sessions')
                .update({ status: 'generating', config })
                .eq('id', sessionId);
        }

        const script = await generateScript(pdfText, config, transformationSystemPrompt);

        if (supabase && sessionId) {
            await supabase
                .from('sessions')
                .update({ status: 'editing', script })
                .eq('id', sessionId);
        }

        res.json({ script });
    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({ error: 'Failed to generate script' });
    }
});

export default router;

// Playground endpoint for testing transformation prompts
router.post('/playground', async (req, res) => {
    const { systemPrompt, text } = req.body;
    if (!systemPrompt || !text) return res.status(400).json({ error: 'Missing systemPrompt or text' });
    try {
        const Groq = (await import('groq-sdk')).default;
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7
        });
        res.json({ result: chatCompletion.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: 'Playground failed: ' + error.message });
    }
});
