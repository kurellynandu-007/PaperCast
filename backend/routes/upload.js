import express from 'express';
import multer from 'multer';
import { extractTextFromPdf } from '../services/pdfExtractor.js';
import { supabase } from '../services/supabaseClient.js';
import crypto from 'crypto';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'file2', maxCount: 1 }]), async (req, res) => {
    try {
        const files = req.files;
        if (!files || !files.file) {
            return res.status(400).json({ error: 'No primary file uploaded' });
        }

        const primaryFile = files.file[0];
        if (primaryFile.mimetype !== 'application/pdf') {
            return res.status(400).json({ error: 'Primary file must be a PDF' });
        }

        let text = `--- PAPER 1: ${primaryFile.originalname} ---\n\n`;
        text += await extractTextFromPdf(primaryFile.buffer);

        if (files.file2 && files.file2[0]) {
            const secondaryFile = files.file2[0];
            if (secondaryFile.mimetype === 'application/pdf') {
                text += `\n\n--- PAPER 2: ${secondaryFile.originalname} ---\n\n`;
                text += await extractTextFromPdf(secondaryFile.buffer);
            }
        }

        // Create a new session in Supabase
        const sessionId = crypto.randomUUID();

        if (supabase) {
            const { error } = await supabase
                .from('sessions')
                .insert([{ id: sessionId, status: 'configuring' }]);

            if (error) {
                console.error('Supabase error inserting session:', error);
                // Continue even if DB insert fails for MVP local testing
            }
        }

        res.json({
            sessionId,
            textPreview: text.substring(0, 1000), // Only return a preview to frontend to save bandwidth
            textLength: text.length
        });
    } catch (error) {
        console.error('Validation/Extraction error:', error);
        res.status(500).json({ error: 'Failed to process PDF' });
    }
});

export default router;
