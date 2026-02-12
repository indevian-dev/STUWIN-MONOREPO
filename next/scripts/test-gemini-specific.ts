
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testSpecificModels() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not defined");
        return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const candidates = [
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-1.5-pro-latest",
        "gemini-1.0-pro"
    ];

    console.log("Testing specific models...");

    for (const modelName of candidates) {
        try {
            console.log(`Attempting ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`✅ ${modelName} SUCCESS. Response: ${result.response.text().substring(0, 20)}`);
        } catch (error: any) {
            console.log(`❌ ${modelName} FAILED: ${error.message.split('\n')[0]}`);
        }
    }
}

testSpecificModels();
