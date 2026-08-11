import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SHIPMENT_SCHEMA = `
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "awb_number": { "type": "string" },
      "client_id": { "type": "string" },
      "sender_name": { "type": "string" },
      "sender_phone": { "type": "string" },
      "sender_address": { "type": "string" },
      "receiver_name": { "type": "string" },
      "receiver_phone": { "type": "string" },
      "receiver_address": { "type": "string" },
      "city": { "type": "string" },
      "state": { "type": "string" },
      "pincode": { "type": "string" },
      "origin": { "type": "string" },
      "destination": { "type": "string" },
      "service_type": { "type": "string" },
      "package_type": { "type": "string" },
      "number_of_pieces": { "type": "number" },
      "actual_weight": { "type": "number" },
      "volumetric_weight": { "type": "number" },
      "cod_amount": { "type": "number" },
      "declared_value": { "type": "number" }
    },
    "required": ["awb_number"]
  }
}
`;

export async function parseDeliverySheetWithAI(rawText: string) {
  try {
    const prompt = `You are a logistics data extraction AI. Extract the shipment records from the following unstructured delivery sheet/manifest data. Return a valid JSON array of shipments matching this JSON schema:
${SHIPMENT_SCHEMA}

If a field is missing, omit it or use null. Normalize names and addresses if possible.
Here is the data:
${rawText}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("AI returned empty response");
    }

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("AI parsing error:", error);
    throw new Error("Failed to parse delivery sheet with AI");
  }
}
