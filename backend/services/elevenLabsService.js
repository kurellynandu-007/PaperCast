import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

export async function generateAudio(text, voiceId, index, sessionId) {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'xi-api-key': process.env.ELEVENLABS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ElevenLabs Error:', errorText);
            throw new Error(`ElevenLabs API error: ${response.statusText} - ${errorText}`);
        }

        const buffer = await response.arrayBuffer();
        const dir = path.join(process.cwd(), 'temp', sessionId);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // Create zero-padded index (e.g., 001.mp3) to ensure correct ordering when reading later
        const paddedIndex = String(index).padStart(3, '0');
        const filePath = path.join(dir, `${paddedIndex}.mp3`);
        fs.writeFileSync(filePath, Buffer.from(buffer));

        return filePath;
    } catch (error) {
        console.warn('generateAudio failed, using fallback mock audio:', error.message);

        // Fallback: Use a pre-existing dummy mp3 if ElevenLabs fails (quota/ban)
        const dir = path.join(process.cwd(), 'temp', sessionId);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const paddedIndex = String(index).padStart(3, '0');
        const filePath = path.join(dir, `${paddedIndex}.mp3`);

        const dummyPath = path.join(process.cwd(), 'temp', 'dummy.mp3');
        if (fs.existsSync(dummyPath)) {
            console.log(`Copying fallback audio to ${filePath}`);
            fs.copyFileSync(dummyPath, filePath);
            return filePath;
        }

        throw error;
    }
}
