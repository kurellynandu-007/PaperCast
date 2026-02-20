import express from 'express';
import { generateAudio } from '../services/edgeTtsService.js';
import { mergeAudioFiles } from '../services/audioMerger.js';
import { supabase } from '../services/supabaseClient.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// ── In-memory job tracking for progress ──────────────────────────────────────
const jobs = new Map();

// Provide static access to the generated files
router.use('/play', express.static(path.join(process.cwd(), 'temp')));

// ── GET progress for a job ──────────────────────────────────────────────────
router.get('/progress/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
});

// ── POST: start audio generation (returns jobId immediately) ─────────────────
router.post('/', async (req, res) => {
    const { sessionId, script } = req.body;

    if (!script || !script.chapters) {
        return res.status(400).json({ error: 'Invalid script format' });
    }

    const jobId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    jobs.set(jobId, { progress: 0, status: 'processing', url: null });

    // Return the jobId immediately so the frontend can start polling
    res.json({ jobId });

    // ── Run audio generation asynchronously ──────────────────────────────
    (async () => {
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

            const totalBlocks = allDialogues.length;
            let completed = 0;
            let filePaths = [];

            // Generate audio for each dialogue sequentially for progress tracking
            for (const dialogue of allDialogues) {
                const voiceId = dialogue.speaker.toLowerCase() === 'alex' ? alexVoiceId : samVoiceId;
                const idx = completed;
                try {
                    const filePath = await generateAudio(dialogue.text, voiceId, idx, sessionId || 'temp_session');
                    filePaths.push(filePath);
                } catch (err) {
                    // Clean up whatever successfully generated
                    const tempDir = path.join(process.cwd(), 'temp', sessionId || 'temp_session');
                    if (fs.existsSync(tempDir)) {
                        fs.readdirSync(tempDir).forEach(file => {
                            if (file !== 'episode.mp3') {
                                try { fs.unlinkSync(path.join(tempDir, file)); } catch { }
                            }
                        });
                    }
                    jobs.set(jobId, { progress: 0, status: 'error', url: null, error: err.message || 'Audio generation failed' });
                    return;
                }
                completed++;
                // Scale progress: 0-80% for dialogue generation
                const progress = Math.round((completed / totalBlocks) * 80);
                jobs.set(jobId, { progress, status: 'processing', url: null });
            }

            // Merge audio (80-95%)
            jobs.set(jobId, { progress: 85, status: 'merging', url: null });

            const finalOutputPath = path.join(process.cwd(), 'temp', sessionId || 'temp_session', 'episode.mp3');
            if (fs.existsSync(finalOutputPath)) fs.unlinkSync(finalOutputPath);

            await mergeAudioFiles(filePaths, finalOutputPath);

            // Cleanup individual chunks
            for (const file of filePaths) {
                if (fs.existsSync(file)) fs.unlinkSync(file);
            }

            const audioUrl = `/api/audio/play/${sessionId || 'temp_session'}/episode.mp3`;

            // Finalize (95-100%)
            jobs.set(jobId, { progress: 100, status: 'complete', url: audioUrl });

            if (supabase && sessionId) {
                await supabase
                    .from('sessions')
                    .update({ status: 'done', audio_url: audioUrl })
                    .eq('id', sessionId);
            }

            // Clean up the job entry after 10 minutes
            setTimeout(() => jobs.delete(jobId), 10 * 60 * 1000);

        } catch (error) {
            console.error('Audio generation error:', error);
            jobs.set(jobId, { progress: 0, status: 'error', url: null, error: error.message || 'Audio generation failed' });
        }
    })();
});

export default router;
