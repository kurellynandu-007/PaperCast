import _pdfParse from 'pdf-parse';
const pdfParse = _pdfParse.default || _pdfParse;

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
