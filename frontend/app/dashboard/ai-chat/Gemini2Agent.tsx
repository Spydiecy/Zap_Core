
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_KEY2,
});

const IMPORTANT_INFO_PROMPT = `
You are an assistant that extracts only the most important information from a given dataset or text. 

Instructions:
- If the data contains prices or numeric values related to tokens, extract all of them.
- Summarize the extracted information into a concise user prompt, for example: "The price of this token is 3.00".
- If multiple tokens or prices are present, include all relevant prices clearly.
- Do NOT include recommendations, explanations, or unrelated details.
- If no important information is found, return a general informative message.
- Return ONLY the final user prompt text as a plain string, without any extra formatting or metadata.

Example inputs and outputs:

Input:
{
  "token": "ExampleToken",
  "price_usd": 3.00,
  "volume": 1000000,
  "recommendation": "Buy now"
}

Output:
"The price of ExampleToken is 3.00"

Input:
{
  "tokens": [
    {"name": "TokenA", "price": 2.5},
    {"name": "TokenB", "price": 4.1}
  ],
  "note": "Market is volatile"
}

Output:
"The price of TokenA is 2.5 and the price of TokenB is 4.1"

Input:
{
  "message": "No price information available"
}

Output:
"General information: No important price data found."
if it is general msg then return the message only not general information written also.
`;

/**
 * Calls Gemini API to extract important information (like prices) from the given data.
 * @param data - The input data object to extract info from.
 * @returns The concise user prompt string containing extracted important info.
 */
export async function extractImportantInfoFromData(data: any): Promise<string> {
  const prompt = `${IMPORTANT_INFO_PROMPT}\n\nInput:\n${JSON.stringify(data, null, 2)}\n\nOutput:`;

  try {
    const response:any = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    // Return the trimmed text response (expected to be a plain string)
    return response.text.trim();
  } catch (error: any) {
    console.error("Error extracting important info from data:", error);
    return "General information: Unable to extract important data.";
  }
}
