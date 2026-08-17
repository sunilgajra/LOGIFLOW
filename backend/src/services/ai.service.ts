import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import { ParsedRow } from './import.service';

// Initialize the Google GenAI client
// Requires GEMINI_API_KEY environment variable to be set
const ai = new GoogleGenAI({});

export class AiParserService {
  /**
   * Parse unstructured documents (PDFs, Images) using Gemini AI Vision
   */
  public static async parseUnstructuredDocument(filePath: string, mimeType: string): Promise<ParsedRow[]> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in the backend environment.');
    }

    try {
      // Read the file as base64
      const fileData = fs.readFileSync(filePath);
      const base64Data = fileData.toString('base64');

      const prompt = `
        You are a highly accurate data extraction assistant for a logistics company.
        I am providing you with an image or PDF of a courier delivery sheet.
        Extract all shipment records from this document and return them as a JSON array of objects.
        
        Use the exact column headers you see in the document as the keys in the JSON objects.
        Do not make up column names. Just extract exactly what is in the table.
        Return ONLY valid JSON without any markdown formatting, starting with '[' and ending with ']'.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                }
              }
            ]
          }
        ]
      });

      let text = response.text || '';
      
      // Clean up potential markdown formatting from AI output
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      if (!text.startsWith('[')) {
        throw new Error('AI did not return a valid JSON array');
      }

      const records: ParsedRow[] = JSON.parse(text);
      return records;
    } catch (error: any) {
      console.error('AI Parsing Error:', error);
      throw new Error(`AI Parsing failed: ${error.message}`);
    }
  }
}
