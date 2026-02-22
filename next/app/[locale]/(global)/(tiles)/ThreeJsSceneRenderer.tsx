"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Grid } from "@react-three/drei";
import type {
    QuestionVisualData,
    SceneObject,
    SceneAnimation,
} from "@/lib/domain/question/Visual.types";
import * as THREE from "three";

// ─── Geometry Component ────────────────────────────────────────────────────────

function SceneGeometry({ obj, animations }: { obj: SceneObject; animations?: SceneAnimation[] }) {
    const meshRef = useRef<THREE.Mesh>(null);

    // Find animation for this object
    const animation = useMemo(
        () => animations?.find((a) => a.targetId === obj.id),
        [animations, obj.id],
    );

    useFrame((_, delta) => {
        if (!meshRef.current || !animation) return;
        const speed = animation.speed || 0.5;
        const axis = animation.axis || "y";
        if (animation.property === "rotation") {
            meshRef.current.rotation[axis] += speed * delta;
        }
    });

    const geometry = useMemo(() => {
        const args = obj.geometryArgs || [];
        switch (obj.geometry) {
            case "box": return <boxGeometry args={args.length ? args as [number, number, number] : [1, 1, 1]} />;
            case "sphere": return <sphereGeometry args={args.length ? [args[0], args[1] || 32, args[2] || 32] as [number, number, number] : [1, 32, 32]} />;
            case "cylinder": return <cylinderGeometry args={args.length ? args as [number, number, number] : [0.5, 0.5, 1]} />;
            case "cone": return <coneGeometry args={args.length ? args as [number, number] : [0.5, 1]} />;
            case "torus": return <torusGeometry args={args.length ? args as [number, number] : [1, 0.3]} />;
            case "plane": return <planeGeometry args={args.length ? args as [number, number] : [2, 2]} />;
            case "circle": return <circleGeometry args={args.length ? args as [number] : [1]} />;
            case "ring": return <ringGeometry args={args.length ? args as [number, number] : [0.5, 1]} />;
            default: return <boxGeometry args={[1, 1, 1]} />;
        }
    }, [obj.geometry, obj.geometryArgs]);

    const scale = useMemo(() => {
        if (typeof obj.scale === "number") return [obj.scale, obj.scale, obj.scale] as [number, number, number];
        return (obj.scale || [1, 1, 1]) as [number, number, number];
    }, [obj.scale]);

    return (
        <group>
            <mesh
                ref={meshRef}
                position={(obj.position || [0, 0, 0]) as [number, number, number]}
                rotation={(obj.rotation || [0, 0, 0]) as [number, number, number]}
                scale={scale}
            >
                {geometry}
                <meshStandardMaterial
                    color={obj.color || "#6366f1"}
                    opacity={obj.opacity ?? 1}
                    transparent={obj.transparent ?? false}
                    wireframe={obj.wireframe ?? false}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {obj.label && (
                <Html
                    position={[
                        (obj.position?.[0] || 0),
                        (obj.position?.[1] || 0) + 1.2,
                        (obj.position?.[2] || 0),
                    ]}
                    center
                    distanceFactor={8}
                    style={{ pointerEvents: "none" }}
                >
                    <div
                        style={{
                            background: "rgba(0,0,0,0.7)",
                            color: obj.labelColor || "#ffffff",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            whiteSpace: "nowrap",
                            userSelect: "none",
                        }}
                    >
                        {obj.label}
                    </div>
                </Html>
            )}
            {obj.children?.map((child, i) => (
                <SceneGeometry key={child.id || i} obj={child} animations={animations} />
            ))}
        </group>
    );
}

// ─── Scene Content ─────────────────────────────────────────────────────────────

function SceneContent({ data }: { data: QuestionVisualData }) {
    return (
        <>
            {/* Lights */}
            {data.lights.map((light, i) => {
                switch (light.type) {
                    case "ambient":
                        return <ambientLight key={i} color={light.color} intensity={light.intensity ?? 0.6} />;
                    case "directional":
                        return <directionalLight key={i} color={light.color} intensity={light.intensity ?? 0.8} position={(light.position || [5, 5, 5]) as [number, number, number]} />;
                    case "point":
                        return <pointLight key={i} color={light.color} intensity={light.intensity ?? 1} position={(light.position || [0, 3, 0]) as [number, number, number]} />;
                    case "spot":
                        return <spotLight key={i} color={light.color} intensity={light.intensity ?? 1} position={(light.position || [0, 5, 0]) as [number, number, number]} />;
                    default:
                        return null;
                }
            })}

            {/* Grid */}
            {data.showGrid && (
                <Grid
                    infiniteGrid
                    fadeDistance={30}
                    fadeStrength={5}
                    cellSize={1}
                    sectionSize={5}
                    cellColor="#444466"
                    sectionColor="#666688"
                />
            )}

            {/* Axes */}
            {data.showAxes && <axesHelper args={[5]} />}

            {/* Objects */}
            {data.objects.map((obj) => (
                <SceneGeometry key={obj.id} obj={obj} animations={data.animations} />
            ))}
        </>
    );
}

// ─── Main Renderer ─────────────────────────────────────────────────────────────

interface ThreeJsSceneRendererProps {
    data: QuestionVisualData;
    width?: string | number;
    height?: string | number;
    className?: string;
}

export function ThreeJsSceneRenderer({
    data,
    width = "100%",
    height = 400,
    className,
}: ThreeJsSceneRendererProps) {
    const cameraConfig = useMemo(() => {
        const cam = data.camera;
        if (cam.type === "orthographic") {
            return {
                orthographic: true,
                position: (cam.position || [0, 0, 10]) as [number, number, number],
                zoom: cam.zoom || 50,
            } as const;
        }
        return {
            fov: cam.fov || 75,
            position: (cam.position || [5, 5, 5]) as [number, number, number],
        };
    }, [data.camera]);

    return (
        <div
            className={className}
            style={{
                width,
                height,
                borderRadius: "12px",
                overflow: "hidden",
                background: data.backgroundColor || "#1a1a2e",
            }}
        >
            <Canvas
                camera={cameraConfig}
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 2]}
            >
                <color attach="background" args={[data.backgroundColor || "#1a1a2e"]} />
                <SceneContent data={data} />
                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                    enableZoom
                    enablePan
                    maxDistance={50}
                    minDistance={1}
                />
            </Canvas>
        </div>
    );
}
