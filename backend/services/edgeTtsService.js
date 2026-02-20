import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function generateAudio(text, voiceName, index, sessionId) {
    const dir = path.join(process.cwd(), 'temp', sessionId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const paddedIndex = String(index).padStart(3, '0');
    const filePath = path.join(dir, `${paddedIndex}.mp3`);
    // Write text to a temp file to avoid shell quoting issues with long text
    const textFilePath = path.join(dir, `${paddedIndex}.txt`);
    fs.writeFileSync(textFilePath, text, 'utf-8');

    // console.log(`[Edge TTS] Generating voice=${voiceName} index=${index}...`);

    try {
        const cmd = `edge-tts --voice ${voiceName} -f "${textFilePath}" --write-media "${filePath}"`;
        // console.log(`Running Edge-TTS: ${cmd}`);
        await execAsync(cmd);

        // Validate the file was actually created and has content
        if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 1000) {
            throw new Error(`Edge TTS produced no audio output for index ${index}`);
        }

        // Clean up text file
        fs.unlinkSync(textFilePath);

        const stat = fs.statSync(filePath);
        // console.log(`[Edge TTS] Done: ${filePath} (${stat.size} bytes)`);
        return filePath;
    } catch (error) {
        console.error('[Edge TTS] Failed:', error.message);
        // Clean up text file if still there
        if (fs.existsSync(textFilePath)) fs.unlinkSync(textFilePath);
        throw error;
    }
}
