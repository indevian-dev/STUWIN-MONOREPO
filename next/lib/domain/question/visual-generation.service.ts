import {
    genAI,
    safetySettings,
    GEMINI_MODELS,
} from "@/lib/integrations/google/gemini.client";
import { ConsoleLogger } from "@/lib/logging/ConsoleLogger";
import type { QuestionVisualData, VisualGenerationInput } from "./visual.types";

/**
 * 3 different realistic visual approaches for the same question.
 * Each uses a different proven educational visualization technique.
 */
const VISUAL_STYLES = [
    {
        key: "bar-chart-model",
        label: "Bar Chart / Value Model",
        instruction: `BUILD A 3D BAR CHART or VALUE COMPARISON MODEL.
Use tall CYLINDER or BOX shapes as bars/columns. Each bar represents a term, value, or quantity from the question.
The HEIGHT of each bar MUST be proportional to its numeric value - this is the entire point.
Place bars side by side along the X-axis with equal spacing.
Every bar MUST have a label showing what it represents and its value.
Add a flat PLANE as the "floor" / baseline.
If the question is an equation: show the left side terms as one color group and right side as another color group, so the student SEEs that both sides are equal (same total height).
If the question asks to find X: show the known values as solid bars and the unknown as a wireframe/transparent bar with "x = ?" label.`,
    },
    {
        key: "balance-scale-model",
        label: "Balance / Equation Model",
        instruction: `BUILD A BALANCE SCALE or WEIGHING MODEL.
Create a horizontal BAR (cylinder or box) as the scale beam, supported by a TRIANGLE/CONE fulcrum in the center.
Place objects on the LEFT side representing the left side of the equation/problem.
Place objects on the RIGHT side representing the right side.
The visual MUST show that both sides balance (have equal weight/value).
Use STACKED objects (boxes or spheres) where the count/size represents the numeric values.
Label each side clearly: "Left Side: 3^x + 2^(x+1)" and "Right Side: 12".
For non-equation questions: show the comparison between given values and what needs to be found.
The student should visually SEE the relationship between the quantities.`,
    },
    {
        key: "coordinate-system-model",
        label: "Coordinate System / Graph",
        instruction: `BUILD A COORDINATE SYSTEM (X-Y GRAPH) SHOWING PLOTTED FUNCTIONS.
Create TWO long thin CYLINDER or BOX shapes as the X-axis (horizontal) and Y-axis (vertical), crossing at the origin (0,0,0).
Add small BOX tick marks along each axis at regular intervals and label them with numbers.
For EQUATIONS (e.g., 3^x = 27, or 3^x + 2^(x+1) = 12):
- Plot the LEFT SIDE of the equation as a curve using a chain of small SPHERE objects placed at computed (x, y) positions. Use one color (e.g., blue). Label this curve with the function name (e.g., "y = 3^x + 2^(x+1)").
- Plot the RIGHT SIDE as a horizontal line of SPHEREs at the constant y-value. Use another color (e.g., red). Label it (e.g., "y = 12").
- Place a LARGE, bright-colored SPHERE at the INTERSECTION POINT where both curves meet. This is the SOLUTION. Label it with "Solution: x = ?" or the actual answer.
For NON-EQUATION questions: plot the relevant function or relationship and mark key values.
Compute actual y-values for x = -2, -1, 0, 1, 2, 3, 4, 5 (or whatever range covers the solution) and place spheres at those positions.
The student should SEE the curves cross and understand that the crossing point IS the answer.`,
    },
];

/**
 * VisualGenerationService — Generates 3D/2D scene graphs via Gemini Pro for question visualization
 */
export class VisualGenerationService {
    /**
     * Generate 3 realistic variant scene graphs for a question
     */
    static async generateVisualVariants(input: VisualGenerationInput): Promise<QuestionVisualData[]> {
        const { mode, questionText, subjectName, topicName, language, guidance } = input;

        // Generate all 3 variants in parallel
        const variantPromises = VISUAL_STYLES.map(async (style) => {
            const prompt = this.buildPrompt(mode, questionText, style.instruction, subjectName, topicName, language, guidance);

            try {
                const model = genAI.getGenerativeModel({
                    model: GEMINI_MODELS.PRO_3,
                    safetySettings,
                    generationConfig: {
                        temperature: 0.7,
                        topP: 0.95,
                        maxOutputTokens: 8192,
                        responseMimeType: "application/json",
                    },
                });

                const result = await model.generateContent(prompt);
                const response = result.response;
                const text = response.text();
                const sceneData = JSON.parse(text) as QuestionVisualData;

                const validated = this.validateAndSanitize(sceneData, mode);
                validated.styleType = style.key;
                return validated;
            } catch (error) {
                ConsoleLogger.error(`Failed to generate visual variant: ${style.key}`, error);
                return this.createFallbackVariant(mode, style.key, style.label);
            }
        });

        const results = await Promise.all(variantPromises);
        return results;
    }

    /**
     * Generate a single visual (backward-compatible)
     */
    static async generateVisual(input: VisualGenerationInput): Promise<QuestionVisualData> {
        const variants = await this.generateVisualVariants(input);
        return variants[0];
    }

    /**
     * Build the prompt for Gemini Pro — focused on producing genuinely educational visuals
     */
    private static buildPrompt(
        mode: "3d" | "2d",
        questionText: string,
        styleInstruction: string,
        subjectName?: string,
        topicName?: string,
        language?: string,
        guidance?: string,
    ): string {
        const modeDescription = mode === "3d"
            ? "a 3D scene with perspective camera and interactive rotation. Use 3D geometries: box, sphere, cylinder, cone, torus."
            : "a 2D flat scene with orthographic camera. Use flat geometries: plane, circle, ring. Keep all objects on Z=0.";

        return `You are an expert math and science TUTOR who creates visual aids using 3D shapes.

YOUR ONLY GOAL: Help a student UNDERSTAND and SOLVE this question through a visual model:
"${questionText}"

${subjectName ? `Subject: ${subjectName}` : ""}
${topicName ? `Topic: ${topicName}` : ""}
${language ? `Use this language for all labels: ${language}` : ""}

WHAT TO BUILD:
${styleInstruction}

${guidance ? `\nTEACHER'S SPECIFIC INSTRUCTIONS:\n${guidance}` : ""}

CRITICAL RULES — READ CAREFULLY:
1. This is NOT abstract art. Every single object MUST represent a specific value, term, or concept from the question.
2. SIZES MUST BE PROPORTIONAL TO VALUES. If one value is 9 and another is 27, the second object must be 3x taller/bigger.
3. EVERY object MUST have a label. No unlabeled objects. Labels must show the mathematical term AND its value (e.g., "3^2 = 9").
4. Use ONLY these geometries: box, sphere, cylinder, cone, torus, plane, circle, ring.
5. Use a DARK background (#0f172a) with BRIGHT, HIGH-CONTRAST colors for objects.
6. The visual must be SELF-EXPLANATORY — a student should understand the concept just by looking at it, without any other text.
7. DO NOT create random decorative objects. If an object doesn't help understand the question, remove it.

Create ${modeDescription}

Output this EXACT JSON structure:
{
  "version": 1,
  "mode": "${mode}",
  "title": "What the student will learn from this visual",
  "backgroundColor": "#0f172a",
  "camera": {
    "type": "${mode === "3d" ? "perspective" : "orthographic"}",
    "position": [x, y, z],
    ${mode === "3d" ? '"fov": 60' : '"zoom": 50'}
  },
  "lights": [
    { "type": "ambient", "color": "#ffffff", "intensity": 0.8 },
    { "type": "directional", "color": "#ffffff", "intensity": 1.0, "position": [5, 10, 5] }
  ],
  "objects": [
    {
      "id": "descriptive_name_of_what_this_represents",
      "geometry": "box|sphere|cylinder|cone|torus|plane|circle|ring",
      "geometryArgs": [args matching geometry type],
      "material": "standard",
      "color": "#hex_color",
      "position": [x, y, z],
      "rotation": [x, y, z],
      "scale": [1, 1, 1],
      "opacity": 1,
      "transparent": false,
      "wireframe": false,
      "label": "REQUIRED: What this object represents + value",
      "labelColor": "#ffffff"
    }
  ],
  "animations": [
    {
      "targetId": "object_id",
      "property": "rotation",
      "axis": "y",
      "speed": 0.2
    }
  ],
  "showGrid": true,
  "showAxes": false
}

GEOMETRY ARGS REFERENCE:
- box: [width, height, depth]
- sphere: [radius]
- cylinder: [radiusTop, radiusBottom, height, radialSegments]
- cone: [radius, height, radialSegments]
- torus: [radius, tubeRadius]
- plane: [width, height]
- circle: [radius]
- ring: [innerRadius, outerRadius]

REMEMBER: The student must look at this visual and UNDERSTAND the question better. If your visual is just random shapes with labels, you have FAILED.

Return ONLY the JSON object.`;
    }

    /**
     * Validate and sanitize the generated scene data
     */
    private static validateAndSanitize(data: QuestionVisualData, mode: "3d" | "2d"): QuestionVisualData {
        const sanitized: QuestionVisualData = {
            version: 1,
            mode,
            title: data.title || "Generated Visual",
            backgroundColor: data.backgroundColor || "#0f172a",
            camera: data.camera || {
                type: mode === "3d" ? "perspective" : "orthographic",
                position: mode === "3d" ? [5, 5, 5] : [0, 0, 10],
                ...(mode === "3d" ? { fov: 60 } : { zoom: 50 }),
            },
            lights: data.lights?.length ? data.lights : [
                { type: "ambient", color: "#ffffff", intensity: 0.8 },
                { type: "directional", color: "#ffffff", intensity: 1.0, position: [5, 10, 5] },
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
                labelColor: obj.labelColor || "#ffffff",
                children: obj.children,
            })),
            animations: data.animations || [],
            showGrid: data.showGrid ?? true,
            showAxes: data.showAxes ?? false,
            styleType: data.styleType,
            generatedBy: GEMINI_MODELS.PRO_3,
            generatedAt: new Date().toISOString(),
        };

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

    /** Create a fallback scene when generation fails for a variant */
    private static createFallbackVariant(mode: "3d" | "2d", styleKey: string, styleLabel: string): QuestionVisualData {
        return {
            version: 1,
            mode,
            title: `${styleLabel} (generation failed — try regenerating)`,
            backgroundColor: "#0f172a",
            camera: {
                type: mode === "3d" ? "perspective" : "orthographic",
                position: mode === "3d" ? [5, 5, 5] : [0, 0, 10],
                ...(mode === "3d" ? { fov: 60 } : { zoom: 50 }),
            },
            lights: [
                { type: "ambient", color: "#ffffff", intensity: 0.8 },
                { type: "directional", color: "#ffffff", intensity: 1.0, position: [5, 10, 5] },
            ],
            objects: [{
                id: "error_indicator",
                geometry: "sphere",
                geometryArgs: [1],
                color: "#ef4444",
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                label: "Generation failed — click Regenerate",
            }],
            animations: [],
            showGrid: false,
            showAxes: false,
            styleType: styleKey,
            generatedBy: GEMINI_MODELS.PRO_3,
            generatedAt: new Date().toISOString(),
        };
    }

    /** Whitelist allowed geometries */
    private static sanitizeGeometry(geometry: string): string {
        const allowed = ["box", "sphere", "cylinder", "cone", "torus", "plane", "circle", "ring"];
        return allowed.includes(geometry) ? geometry : "box";
    }
}
