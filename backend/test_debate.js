import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) throw new Error('GROQ_API_KEY is not set');
const groq = new Groq({ apiKey });

const systemPrompt = `You are an academic analysis AI... Provide a JSON output.`;
const userPrompt = `Test paper 1 vs Test paper 2. Provide JSON.`;

async function test() {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            response_format: { type: 'json_object' }
        });
        console.log('Success:', chatCompletion.choices[0].message.content);
    } catch (err) {
        console.error('Groq Error:', err.message, err.error);
    }
}

test();
