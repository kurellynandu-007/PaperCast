import express from 'express';
import { generateAudio } from '../services/edgeTtsService.js';
import { mergeAudioFiles } from '../services/audioMerger.js';
import { supabase } from '../services/supabaseClient.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Provide static access to the generated files
router.use('/play', express.static(path.join(process.cwd(), 'temp')));

router.post('/', async (req, res) => {
    const { sessionId, script } = req.body;

    if (!script || !script.chapters) {
        return res.status(400).json({ error: 'Invalid script format' });
    }

    try {
        // Notify "generating audio" state
        if (supabase && sessionId) {
            await supabase
                .from('sessions')
                .update({ status: 'generating_audio' })
                .eq('id', sessionId);
        }

        // Microsoft Edge TTS - completely free, no API key needed
        const alexVoiceId = 'en-US-GuyNeural';   // Deep male voice for Alex
        const samVoiceId = 'en-US-JennyNeural';  // Warm female voice for Sam

        // Collect all dialogues into a flat array
        let allDialogues = [];
        script.chapters.forEach(chapter => {
            chapter.dialogues.forEach(dialogue => {
                allDialogues.push(dialogue);
            });
        });

        // Generate audio for each dialogue
        const audioPromises = allDialogues.map(async (dialogue, idx) => {
            const voiceId = dialogue.speaker.toLowerCase() === 'alex' ? alexVoiceId : samVoiceId;
            return generateAudio(dialogue.text, voiceId, idx, sessionId || 'temp_session');
        });

        let filePaths = [];
        try {
            filePaths = await Promise.all(audioPromises);
        } catch (err) {
            // Clean up whatever successfully generated
            const tempDir = path.join(process.cwd(), 'temp', sessionId || 'temp_session');
            if (fs.existsSync(tempDir)) {
                fs.readdirSync(tempDir).forEach(file => {
                    if (file !== 'episode.mp3') fs.unlinkSync(path.join(tempDir, file));
                });
            }
            throw err;
        }

        // Merge all dialogue chunks into one episode
        const finalOutputPath = path.join(process.cwd(), 'temp', sessionId || 'temp_session', 'episode.mp3');
        if (fs.existsSync(finalOutputPath)) fs.unlinkSync(finalOutputPath);

        await mergeAudioFiles(filePaths, finalOutputPath);

        // Cleanup individual chunks
        for (const file of filePaths) {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        }

        const audioUrl = `/api/audio/play/${sessionId || 'temp_session'}/episode.mp3`;

        if (supabase && sessionId) {
            await supabase
                .from('sessions')
                .update({ status: 'done', audio_url: audioUrl })
                .eq('id', sessionId);
        }

        res.json({ audioUrl });
    } catch (error) {
        console.error('Audio generation error:', error);
        res.status(500).json({ error: 'Failed to generate audio' });
    }
});

export default router;
