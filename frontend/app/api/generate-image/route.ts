import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// NOTE: Adjust the import based on actual Google GenAI SDK (this may vary)
// Example import, confirm with your SDK documentation:
// import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
// For now, using placeholder types
interface GoogleGenAI {
  models: {
    generateContent: (params: any) => Promise<any>;
  };
}
const { GoogleGenAI, Modality } = await import("@google/genai")
export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const generateKeywords = [
  "generate",
  "create",
  "make",
  "build",
  "design",
];

const contractKeywords = [
  "code",
  "contract",
  "smart contract",
  "contract generation",
  "contract creation"
];

const promptLower = prompt.toLowerCase();

const containsGenerate = generateKeywords.some(keyword =>
  promptLower.includes(keyword)
);

const containsContract = contractKeywords.some(keyword =>
  promptLower.includes(keyword)
);

const isContractRelated = containsGenerate && containsContract;

    let imageBase64: string | null = null;
    let responseText = "";
    let generationMethod = "";
    let mermaidCode = "";

    // Initialize Gemini
    // REPLACE WITH ACTUAL INITIALIZATION PER SDK DOCS
    const genAI = new GoogleGenAI({apiKey:process.env.NEXT_PUBLIC_GEMINI_KEY || "your-api-key-here"});
    const ai = genAI; // Adjust as per actual SDK

    if (isContractRelated) {
      console.log("Contract-related prompt detected. Using Mermaid approach...");
      generationMethod = "mermaid";

      mermaidCode = await generateValidatedMermaid(ai, prompt);
      responseText = `Generated Mermaid code for contract flow: ${mermaidCode}`;

      // Step 2: Convert Mermaid to image using mermaid.ink API
      try {
        const encodedMermaid = Buffer.from(mermaidCode).toString("base64url");
        const mermaidImageUrl = `https://mermaid.ink/img/${encodedMermaid}`;

        console.log("Fetching image from mermaid.ink...");
        const imageResponse = await fetch(mermaidImageUrl);

        if (!imageResponse.ok) {
          throw new Error(`Mermaid API error: ${imageResponse.status}`);
        }

        const imageArrayBuffer = await imageResponse.arrayBuffer();
        imageBase64 = Buffer.from(imageArrayBuffer).toString("base64");
      } catch (mermaidError) {
        console.error(
          "Mermaid generation failed, falling back to Gemini image generation:",
          mermaidError
        );

        // Fallback to Gemini image generation
        const fallbackPrompt = `Create a clean contract workflow diagram: ${prompt}. Use clear English text, professional flowchart style.`;
        const imageResponse:any = await ai.models.generateContent({
          model: "gemini-2.0-flash-preview-image-generation",
          contents: [{ role: "user", parts: [{ text: fallbackPrompt }] }],
          // Adjust config as per actual SDK
        });

        for (const part of imageResponse.candidates?.[0]?.content.parts || []) {
          if (part.text) {
            responseText += ` | Fallback response: ${part.text}`;
          } else if (part.inlineData) {
            imageBase64 = part.inlineData.data;
          }
        }
        generationMethod = "mermaid_fallback_to_gemini";
      }
    } else {
      console.log("Non-contract prompt. Using Gemini image generation...");
      generationMethod = "gemini";

      const enhancedPrompt = `Create a clean, professional flowchart diagram with the following requirements:

STRICT TEXT REQUIREMENTS:
- ALL text must be in clear, readable English only
- Use simple, common English words
- No special characters, symbols, or non-Latin text
- Font should be clear and legible (Arial, Helvetica, or similar)
- Text size should be large enough to read clearly

VISUAL REQUIREMENTS:
- Clean, minimalist design with white background
- Use standard flowchart shapes (rectangles, diamonds, ovals)
- Clear, dark borders around all shapes
- Consistent spacing between elements
- Professional color scheme (blues, greens, light grays)
- Arrows should be clear and properly connected

CONTENT TO VISUALIZE:
${prompt}

IMPORTANT: This is a technical diagram that will be used in documentation. Ensure all text is perfectly readable in English with no garbled characters, foreign language text, or illegible symbols.`;

      const response:any = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
        // Adjust config as per actual SDK
      });

      for (const part of response.candidates?.[0]?.content.parts || []) {
        if (part.text) {
          responseText = part.text;
        } else if (part.inlineData) {
          imageBase64 = part.inlineData.data;
        }
      }
    }

    if (!imageBase64) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    // Save image to local filesystem
    const buffer = Buffer.from(imageBase64, "base64");
    const methodPrefix = isContractRelated ? "contract_mermaid" : "gemini_diagram";
    const fileName = `${methodPrefix}_${Date.now()}.png`;
    const filePath = path.join(process.cwd(), "public", "generated", fileName);

    // Ensure directory exists
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
    console.log(`Image saved to: ${filePath} using ${generationMethod} method`);

    return NextResponse.json({
      imageBase64,
      responseText,
      prompt,
      savedPath: `/generated/${fileName}`,
      generationMethod,
      isContractRelated,
      mermaidCode: isContractRelated ? mermaidCode : null,
      success: true,
    });
  } catch (error: any) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate image",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper function to validate Mermaid syntax
function validateMermaidSyntax(mermaidCode: string): boolean {
  const requiredPatterns = [
    /flowchart\s+(TD|LR|TB|RL)\b/i, // Must start with flowchart direction
    /-->/i, // Must have at least one connection
    /\[.*\]/, // Must have at least one node with label
  ];
  return requiredPatterns.every((pattern) => pattern.test(mermaidCode));
}

// Enhanced Mermaid generation with validation
async function generateValidatedMermaid(ai: any, prompt: string): Promise<string> {
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    const mermaidPrompt = `Generate a valid Mermaid.js flowchart for: ${prompt}

STRICT REQUIREMENTS:
1. Start with "flowchart TD" or "flowchart LR"
2. Use format: NodeID[Label Text] --> NodeID2[Label Text]
3. For decisions use: NodeID{Decision Text}
4. Keep labels under 4 words
5. Use only English characters
6. Ensure proper syntax with arrows (-->)

Example:
flowchart TD
    A[Start Process] --> B[Review Request]
    B --> C{Approved?}
    C -->|Yes| D[Execute Contract]
    C -->|No| E[Reject Request]
    D --> F[Complete]
    E --> F

Return ONLY the Mermaid syntax, no explanations.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: mermaidPrompt }] }],
    });

    const mermaidCode = response.candidates?.[0]?.content.parts?.[0]?.text?.trim();
    if (mermaidCode && validateMermaidSyntax(mermaidCode)) {
      return mermaidCode;
    }
    console.warn(`Mermaid validation failed on attempt ${i + 1}:`, mermaidCode);
  }

  // Fallback simple mermaid
  return `flowchart TD
    A[Start] --> B[Process Request]
    B --> C{Review Complete?}
    C -->|Yes| D[Approved]
    C -->|No| E[Needs Revision]
    D --> F[End]
    E --> B`;
}