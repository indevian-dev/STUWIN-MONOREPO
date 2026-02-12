
import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not defined");
        return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Hack to access model list if not directly exposed, or just try a standard generation with a known model to see if it works.
    // Actually, the SDK doesn't always expose listModels directly on the instance easily in earlier versions, 
    // but let's try to just run a simple generation with 'gemini-1.5-flash' and 'gemini-1.5-flash-001' to see which one fails.

    // Better yet, let's try to use the fetch directly if SDK doesn't support it easily, 
    // but looking at the error, the SDK is making a request to v1beta.

    // Let's try 'gemini-1.5-flash-latest' and 'gemini-1.5-flash-001'
    const candidates = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-8b",
        "gemini-2.0-flash-exp",
        "gemini-pro"
    ];

    console.log("Testing models...");

    for (const modelName of candidates) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`✅ ${modelName} is working. Response: ${result.response.text().substring(0, 20)}...`);
        } catch (error: any) {
            console.log(`❌ ${modelName} failed: ${error.message.split('\n')[0]}`);
        }
    }
}

listModels();
