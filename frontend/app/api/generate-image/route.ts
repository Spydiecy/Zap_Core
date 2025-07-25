import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Using the Google GenAI API as provided in your documentation
    const { GoogleGenAI, Modality } = await import("@google/genai")

    const ai = new GoogleGenAI({
      apiKey: process.env.NEXT_PUBLIC_GEMINI_KEY || "your-api-key-here",
    })

    const response:any = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: "Always use English in the image. If the input mentions a memecoin or token, generate the image taken example from the given desctption of the token/memecoin. If the input is about smart contracts, blockchain flows, or historical data, generate a workflow diagram. For anything else, generate a relevant illustrative image matching the context. This is my prompt. Use English language or mermaid chart language in my flowchart."+prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    })

    // Extract the image data from the response
    let imageBase64 = null
    let responseText = ""

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        responseText = part.text
      } else if (part.inlineData) {
        imageBase64 = part.inlineData.data
      }
    }

    if (!imageBase64) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 })
    }
    // console.log();
    

    return NextResponse.json({
      imageBase64,
      responseText,
      prompt,
    })
  } catch (error: any) {
    console.error("Image generation error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate image" }, { status: 500 })
  }
}
