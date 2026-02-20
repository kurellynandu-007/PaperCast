import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

/**
 * Extracts text from a PDF buffer.
 * @param {Buffer} pdfBuffer 
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(pdfBuffer) {
    try {
        const data = await pdfParse(pdfBuffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to extract text from PDF');
    }
}
