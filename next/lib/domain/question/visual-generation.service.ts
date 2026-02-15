import {
    genAI,
    safetySettings,
    GEMINI_MODELS,
} from "@/lib/integrations/google/gemini.client";
import { ConsoleLogger } from "@/lib/logging/ConsoleLogger";
import type { QuestionVisualData, VisualGenerationInput } from "./visual.types";

/**
 * VisualGenerationService — Generates 3D/2D scene graphs via Gemini for question visualization
 */
export class VisualGenerationService {
    /**
     * Generate a Three.js scene graph JSON for a question
     */
    static async generateVisual(input: VisualGenerationInput): Promise<QuestionVisualData> {
        const { mode, questionText, subjectName, topicName, language } = input;

        const prompt = this.buildPrompt(mode, questionText, subjectName, topicName, language);

        try {
            const model = genAI.getGenerativeModel({
                model: GEMINI_MODELS.FLASH_3,
                safetySettings,
                generationConfig: {
                    temperature: 0.8,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                },
            });

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            const sceneData = JSON.parse(text) as QuestionVisualData;

            // Validate and sanitize
            return this.validateAndSanitize(sceneData, mode);
        } catch (error) {
            ConsoleLogger.error("Failed to generate visual with Gemini", error);
            throw new Error("Visual generation failed. Please try again.");
        }
    }

    /**
     * Build the prompt for Gemini
     */
    private static buildPrompt(
        mode: "3d" | "2d",
        questionText: string,
        subjectName?: string,
        topicName?: string,
        language?: string,
    ): string {
        const modeDescription = mode === "3d"
            ? "a 3D scene with perspective camera, depth, and interactive rotation. Use 3D geometries like box, sphere, cylinder, cone, torus."
            : "a 2D flat scene with orthographic camera. Use flat geometries like plane, circle, ring. Keep all objects on the Z=0 plane.";

        return `You are an expert educational visual designer. Create ${modeDescription}

The visual should help students understand this question:
"${questionText}"

${subjectName ? `Subject: ${subjectName}` : ""}
${topicName ? `Topic: ${topicName}` : ""}
${language ? `Language context: ${language}` : ""}

Generate a JSON object with this EXACT structure:
{
  "version": 1,
  "mode": "${mode}",
  "title": "Brief description of what the visual shows",
  "backgroundColor": "#hex_color",
  "camera": {
    "type": "${mode === "3d" ? "perspective" : "orthographic"}",
    "position": [x, y, z],
    ${mode === "3d" ? '"fov": 75' : '"zoom": 50'}
  },
  "lights": [
    { "type": "ambient", "color": "#ffffff", "intensity": 0.6 },
    { "type": "directional", "color": "#ffffff", "intensity": 0.8, "position": [5, 5, 5] }
  ],
  "objects": [
    {
      "id": "unique_id",
      "geometry": "box|sphere|cylinder|cone|torus|plane|circle|ring",
      "geometryArgs": [number_args],
      "material": "standard|basic|phong",
      "color": "#hex_color",
      "position": [x, y, z],
      "rotation": [x, y, z],
      "scale": [x, y, z],
      "opacity": 1,
      "transparent": false,
      "wireframe": false,
      "label": "optional text label",
      "labelColor": "#hex_color"
    }
  ],
  "animations": [
    {
      "targetId": "object_id",
      "property": "rotation",
      "axis": "y",
      "speed": 0.5
    }
  ],
  "showGrid": ${mode === "3d"},
  "showAxes": false
}

RULES:
- Create 3-8 objects that clearly illustrate the question concept
- Use vibrant, distinct colors for each object
- Add labels to key objects so students can understand what they represent
- If the question involves math (geometry, algebra, fractions), create visual representations
- If the question involves science (physics, chemistry, biology), create relevant 3D models
- Add 1-2 subtle animations for engagement (e.g., slow rotation)
- Keep the scene centered around origin (0,0,0)
- Camera should have a good view of all objects
- Use descriptive IDs for objects (e.g., "earth_sphere", "triangle_base")

Return ONLY the JSON object, no other text.`;
    }

    /**
     * Validate and sanitize the generated scene data
     */
    private static validateAndSanitize(data: QuestionVisualData, mode: "3d" | "2d"): QuestionVisualData {
        // Ensure required fields
        const sanitized: QuestionVisualData = {
            version: 1,
            mode,
            title: data.title || "Generated Visual",
            backgroundColor: data.backgroundColor || (mode === "3d" ? "#1a1a2e" : "#ffffff"),
            camera: data.camera || {
                type: mode === "3d" ? "perspective" : "orthographic",
                position: mode === "3d" ? [5, 5, 5] : [0, 0, 10],
                ...(mode === "3d" ? { fov: 75 } : { zoom: 50 }),
            },
            lights: data.lights?.length ? data.lights : [
                { type: "ambient", color: "#ffffff", intensity: 0.6 },
                { type: "directional", color: "#ffffff", intensity: 0.8, position: [5, 5, 5] },
            ],
            objects: (data.objects || []).map((obj, i) => ({
                id: obj.id || `obj_${i}`,
                geometry: this.sanitizeGeometry(obj.geometry),
                geometryArgs: obj.geometryArgs,
                material: obj.material || "standard",
                color: obj.color || "#6366f1",
                position: obj.position || [0, 0, 0],
                rotation: obj.rotation || [0, 0, 0],
                scale: obj.scale || [1, 1, 1],
                opacity: obj.opacity ?? 1,
                transparent: obj.transparent ?? false,
                wireframe: obj.wireframe ?? false,
                label: obj.label,
                labelColor: obj.labelColor,
                children: obj.children,
            })),
            animations: data.animations || [],
            showGrid: data.showGrid ?? (mode === "3d"),
            showAxes: data.showAxes ?? false,
            generatedBy: GEMINI_MODELS.FLASH_3,
            generatedAt: new Date().toISOString(),
        };

        // Ensure at least 1 object
        if (sanitized.objects.length === 0) {
            sanitized.objects = [{
                id: "placeholder",
                geometry: mode === "3d" ? "sphere" : "circle",
                geometryArgs: [1],
                color: "#6366f1",
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                label: "Visual placeholder",
            }];
        }

        return sanitized;
    }

    /** Whitelist allowed geometries */
    private static sanitizeGeometry(geometry: string): string {
        const allowed = ["box", "sphere", "cylinder", "cone", "torus", "plane", "circle", "ring"];
        return allowed.includes(geometry) ? geometry : "box";
    }
}
