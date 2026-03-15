import * as THREE from "three";
import {mergeGeometries} from "three/addons/utils/BufferGeometryUtils.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { ACESFilmicToneMapping } from "three";

console.clear();

// Set up 3D world
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
let renderer = new THREE.WebGLRenderer({ antialias: true });

scene.background = new THREE.Color("Black");
camera.position.set(0, 1, 1).setLength(100);
camera.lookAt(scene.position);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = /** @type {import('three').ToneMapping} */ (ACESFilmicToneMapping);
renderer.toneMappingExposure = 1.0;

// Adding it to canvas page
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", (_) => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

// Add lighting
let light = new THREE.DirectionalLight(0xffffff, 0.9);
light.position.set(12, 18, 10);
scene.add(light, new THREE.HemisphereLight(0x9ec4ff, 0x08060b, 0.35));

// Build the tube shape
let segments = 1000;
let radSegments = 10;

// Creates several CylinderGeometry pieces
let cylinderGeometries = [];
cylinderGeometries.push(
    new THREE.CylinderGeometry(
        2, 2, segments, radSegments, segments, true,
        Math.PI * 0.5 - (Math.PI * 0.4 * 0.5),
        Math.PI * 0.4
    )
);

// Combine flat plane closes part of the shape
let bufferCylinderGeometry = mergeGeometries(cylinderGeometries)
    .translate(0, -0.5 * segments, 0)
    .rotateX(Math.PI * -0.5);

// Create the material and striped colouring
let roadMaterial = new THREE.MeshStandardMaterial({
    // color: 0x0b0d16,
    color: 0xffffff,
    roughness: 0.18,
    metalness: 0.02,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide
});

// Create surface material
roadMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    roadMaterial.userData.shader = shader;

    shader.fragmentShader = `
        uniform float uTime;
        float hash21(vec2 p){
            p = fract(p * vec2(123.34, 345.45));
            p += dot(p, p + 34.345);
            return fract(p.x * p.y);
        }

        float noise21(vec2 p){
            vec2 i = floor(p);
            vec2 f = fract(p);
            float a = hash21(i);
            float b = hash21(i + vec2(1.0, 0.0));
            float c = hash21(i + vec2(0.0, 1.0));
            float d = hash21(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        vec3 hsv2rgb(vec3 c){
            vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
            rgb = rgb * rgb * (3.0 - 2.0 * rgb);
            return c.z * mix(vec3(1.0), rgb, c.y);
        }
        ${shader.fragmentShader}
    `.replace(
        `#include <color_fragment>`,
        `#include <color_fragment>
        vec2 uv = vUv;
        float centered = 1.0 - smoothstep(0.0, 0.5, abs(uv.x - 0.5));
        float coreMask = pow(centered, 5.5);
        float prismMask = pow(centered, 1.35);
        float edgeFade = smoothstep(0.0, 0.12, uv.x) * (1.0 - smoothstep(0.88, 1.0, uv.x));
        float travel = uv.y * 180.0 - uTime * 16.0;

        float sweepNoise = noise21(vec2(travel * 0.035, uv.x * 9.0));
        float fineNoise = noise21(vec2(travel * 0.17, uv.x * 38.0));
        float shardNoise = noise21(vec2(travel * 0.45, uv.x * 78.0));
        float sparkle = pow(shardNoise, 20.0) * (0.15 + prismMask * 0.6);
        float bandingA = pow(max(0.0, sin(travel * 0.78 + fineNoise * 4.5)), 28.0);
        float bandingB = pow(max(0.0, sin(travel * 0.52 - uv.x * 16.0 + sweepNoise * 3.0)), 22.0);
        float cracks = smoothstep(0.78, 0.98, noise21(vec2(travel * 0.08, uv.x * 24.0 + sweepNoise * 5.0)));

        float hue = fract(0.55 + uv.x * 0.82 + uv.y * 0.05 + sweepNoise * 0.24 - uTime * 0.018);
        vec3 rainbow = hsv2rgb(vec3(hue, 0.95, 1.0));
        // vec3 warmCore = vec3(1.0, 0.78, 0.22);

        // vec3 baseGlass = mix(vec3(0.015, 0.02, 0.05), rainbow * 0.18 + vec3(0.015, 0.018, 0.03), prismMask * 0.35);
        vec3 prismaticScatter = rainbow * (0.08 + bandingA * 1.15 + bandingB * 0.65 + cracks * 0.45);
        // vec3 centerGlow = warmCore * (0.05 + 0.42 * coreMask);

        diffuseColor.rgb = (prismaticScatter * 1.15 + sparkle * 0.9) * edgeFade;
        float visibleMask = clamp(
            max(max(diffuseColor.rgb.r, diffuseColor.rgb.g), diffuseColor.rgb.b) * 1.35,
            0.0,
            1.0
        );
        diffuseColor.a = visibleMask;
        `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
        `#include <emissivemap_fragment>`,
        `#include <emissivemap_fragment>
        vec2 uvGlow = vUv;
        float centeredGlow = 1.0 - smoothstep(0.0, 0.5, abs(uvGlow.x - 0.5));
        float coreMaskGlow = pow(centeredGlow, 7.0);
        float laneLeft = exp(-abs(uvGlow.x - 0.26) * 22.0);
        float laneMid = exp(-abs(uvGlow.x - 0.5) * 30.0);
        float laneRight = exp(-abs(uvGlow.x - 0.74) * 22.0);
        float travelGlow = uvGlow.y * 210.0 - uTime * 22.0;
        float streakA = pow(max(0.0, sin(travelGlow * 0.62 + uvGlow.x * 20.0)), 24.0);
        float streakB = pow(max(0.0, sin(travelGlow * 0.38 - uvGlow.x * 34.0 + 1.4)), 28.0);
        float sparkleGlow = pow(noise21(vec2(travelGlow * 0.25, uvGlow.x * 75.0)), 18.0);
        vec3 hueLeft = hsv2rgb(vec3(fract(0.92 + uvGlow.y * 0.03), 0.96, 1.0));
        vec3 hueMid = hsv2rgb(vec3(fract(0.14 + uvGlow.y * 0.025), 0.94, 1.0));
        vec3 hueRight = hsv2rgb(vec3(fract(0.58 + uvGlow.y * 0.03), 0.96, 1.0));
        vec3 coloredLanes =
            hueLeft * laneLeft * (0.4 + 1.6 * streakA) +
            hueMid * laneMid * (0.25 + 1.9 * (streakA + streakB)) +
            hueRight * laneRight * (0.4 + 1.6 * streakB);
        // vec3 warmCoreGlow = vec3(1.2, 0.82, 0.22) * (0.08 + 0.7 * coreMaskGlow);
        vec3 bridgeGlow = coloredLanes * 1.2 + sparkleGlow * vec3(0.5, 0.7, 1.0);
        totalEmissiveRadiance += bridgeGlow * 1.5;
        `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
        `#include <opaque_fragment>`,
        `#include <opaque_fragment>`
    );
};

// Create alternative bands
roadMaterial.defines = {"USE_UV" : ""}

// Tells the shader to use UV data
let cylinderGeometryMesh = new THREE.Mesh(bufferCylinderGeometry, roadMaterial);
scene.add(cylinderGeometryMesh);

// The up and down
const svgText = await fetch("./monaco.svg").then((res) => res.text());
const svgLoader = new SVGLoader();
const svgData = svgLoader.parse(svgText);
const subPath = svgData.paths[0].subPaths[0];
const sampled2D = subPath.getSpacedPoints(segments);

let basePts = sampled2D.map((pt) => new THREE.Vector3(
    (pt.x - 140) * 0.75,
    0,
    -(pt.y - 140) * 0.75
)).reverse();

const smoothCurve = new THREE.CatmullRomCurve3(basePts, true, "centripetal");
const curvePts = smoothCurve.getSpacedPoints(segments);
const curve = new THREE.CatmullRomCurve3(curvePts, true, "centripetal");

let bufferGeometry = new THREE.BufferGeometry().setFromPoints(curve.getSpacedPoints(segments));
let lineBasicMaterial = new THREE.LineBasicMaterial({color: "aquamarine"})
let line = new THREE.Line(bufferGeometry, lineBasicMaterial);
line.visible = false;
scene.add(line);

// Bend the tube along a curve
let curveFrames = curve.computeFrenetFrames(segments, true);
let curvePoints = curve.getSpacedPoints(segments);

let vert = new THREE.Vector3();
let normal = new THREE.Vector3();
let binormal = new THREE.Vector3();
let position2 = new THREE.Vector3();

// Moves every vertex of the original straight geometry
for(let i = 0; i < bufferCylinderGeometry.attributes.position.count; i++){
    vert.fromBufferAttribute(bufferCylinderGeometry.attributes.position, i);
    let frameIdx = Math.round(vert.z);
    normal.copy( curveFrames.normals[ frameIdx ] ).multiplyScalar( vert.x );
    binormal.copy( curveFrames.binormals[ frameIdx ] ).multiplyScalar( vert.y );

    position2.copy( curvePoints[ frameIdx ] ).add( normal ).add( binormal );
    bufferCylinderGeometry.attributes.position.setXYZ(i, position2.x, position2.y, position2.z);
}
bufferCylinderGeometry.computeVertexNormals();

let mat = new THREE.Matrix4();
let curveLen = curve.getLength();
// noinspection JSDeprecatedSymbols
let clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
    let elapsed = clock.getElapsedTime();

    if (roadMaterial.userData.shader) {
        roadMaterial.userData.shader.uniforms.uTime.value = elapsed;
    }

    let t = 0.12;
    // let t = ((elapsed * 10) % curveLen) / curveLen;
    curve.getPointAt(t, camera.position);

    camera.setRotationFromMatrix(mat.lookAt(
        camera.position,
        curve.getPointAt((t + 0.01) % 1),
        new THREE.Vector3(0, 1, 0)
    ));

    renderer.render(scene, camera);
});
