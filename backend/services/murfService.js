import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

export async function generateAudio(text, voiceId, index, sessionId) {
    const url = `https://api.murf.ai/v1/speech/generate`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'api-key': process.env.MURF_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                voiceId: voiceId,
                text: text,
                style: 'Conversational'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Murf API Error:', errorText);
            throw new Error(`Murf API error: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.audioFile) {
            throw new Error('Murf API did not return an audio URL');
        }

        // Fetch the generated MP3 from the returned S3 URL
        const audioResponse = await fetch(data.audioFile);
        if (!audioResponse.ok) {
            throw new Error(`Failed to download audio buffer from Murf URL: ${audioResponse.statusText}`);
        }

        const buffer = await audioResponse.arrayBuffer();
        const dir = path.join(process.cwd(), 'temp', sessionId);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // Create zero-padded index (e.g., 001.mp3) to ensure correct ordering when reading later
        const paddedIndex = String(index).padStart(3, '0');
        const filePath = path.join(dir, `${paddedIndex}.mp3`);
        fs.writeFileSync(filePath, Buffer.from(buffer));

        return filePath;
    } catch (error) {
        console.warn('generateAudio failed, using fallback mock audio:', error.message);

        // Fallback: Use a pre-existing dummy mp3 if Murf fails (quota/ban)
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
