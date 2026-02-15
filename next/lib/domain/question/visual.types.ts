/**
 * Types for question visual generation (3D/2D scenes via Three.js)
 */

/** A single 3D/2D object in the scene */
export interface SceneObject {
    /** Unique id for React keys */
    id: string;
    /** Geometry type: box, sphere, cylinder, cone, torus, plane, circle, ring, text3d */
    geometry: string;
    /** Geometry args (e.g. [width, height, depth] for box, [radius] for sphere) */
    geometryArgs?: number[];
    /** Material type: standard, basic, phong, lambert */
    material?: string;
    /** Hex color string e.g. "#ff6600" */
    color: string;
    /** [x, y, z] */
    position?: [number, number, number];
    /** [x, y, z] in radians */
    rotation?: [number, number, number];
    /** [x, y, z] or uniform number */
    scale?: [number, number, number] | number;
    /** Opacity 0-1 */
    opacity?: number;
    /** Whether material is transparent */
    transparent?: boolean;
    /** Wireframe mode */
    wireframe?: boolean;
    /** Optional text label displayed near the object */
    label?: string;
    /** Label color */
    labelColor?: string;
    /** Child objects (for grouping) */
    children?: SceneObject[];
}

/** Light configuration */
export interface SceneLight {
    /** Light type: ambient, directional, point, spot */
    type: string;
    /** Hex color */
    color?: string;
    /** Intensity 0-10 */
    intensity?: number;
    /** [x, y, z] position (for directional/point/spot) */
    position?: [number, number, number];
}

/** Camera configuration */
export interface SceneCamera {
    /** perspective or orthographic */
    type: "perspective" | "orthographic";
    /** [x, y, z] */
    position?: [number, number, number];
    /** Field of view (perspective only) */
    fov?: number;
    /** Zoom level (orthographic only) */
    zoom?: number;
}

/** Animation definition */
export interface SceneAnimation {
    /** Target object id */
    targetId: string;
    /** Property to animate: rotation, position, scale */
    property: "rotation" | "position" | "scale";
    /** Axis: x, y, z */
    axis: "x" | "y" | "z";
    /** Speed multiplier */
    speed: number;
}

/** The full visual data stored in the DB */
export interface QuestionVisualData {
    /** Version for future migrations */
    version: 1;
    /** 3d or 2d */
    mode: "3d" | "2d";
    /** Human-readable title/description of the visual */
    title: string;
    /** Scene background color */
    backgroundColor?: string;
    /** Camera settings */
    camera: SceneCamera;
    /** Lights */
    lights: SceneLight[];
    /** Scene objects */
    objects: SceneObject[];
    /** Animations */
    animations?: SceneAnimation[];
    /** Whether to show grid helper */
    showGrid?: boolean;
    /** Whether to show axes helper */
    showAxes?: boolean;
    /** Gemini model used */
    generatedBy?: string;
    /** Timestamp of generation */
    generatedAt?: string;
}

/** Input for visual generation API */
export interface VisualGenerationInput {
    mode: "3d" | "2d";
    questionText: string;
    subjectName?: string;
    topicName?: string;
    language?: string;
}
