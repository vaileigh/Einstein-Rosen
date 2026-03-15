import * as THREE from "three";
import {mergeGeometries} from "three/addons/utils/BufferGeometryUtils.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

console.clear();

// Set up 3D world
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
let renderer = new THREE.WebGLRenderer({ antialias: true });

scene.background = new THREE.Color("transparent");
camera.position.set(0, 1, 1).setLength(100);
camera.lookAt(scene.position);
renderer.setSize(innerWidth, innerHeight);

// Adding it to canvas page
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", (_) => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

// Add lighting
let light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.setScalar(1);
scene.add(light, new THREE.AmbientLight(0xffffff, 0.5));

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
let meshLambertMaterial = new THREE.MeshLambertMaterial({
    side: THREE.DoubleSide
});

// Create surface material
meshLambertMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    meshLambertMaterial.userData.shader = shader;

    shader.fragmentShader = `
        uniform float uTime;
        ${shader.fragmentShader}
    `.replace(
        `#include <color_fragment>`,
        `#include <color_fragment>
        vec3 roadColor = vec3(0.12);
        vec3 glowColor = vec3(1.0, 0.95, 0.7);

        vec2 tUv = vUv;
        float leftTravel = fract(tUv.y * 120.0 - uTime * 3.0);
        float rightTravel = fract(tUv.y * 110.0 - uTime * 2.6 + 0.35);

        float leftLane = smoothstep(0.09, 0.10, tUv.x) * (1.0 - smoothstep(0.11, 0.12, tUv.x));
        float rightLane = smoothstep(0.88, 0.89, tUv.x) * (1.0 - smoothstep(0.90, 0.91, tUv.x));
        
        float leftDash = smoothstep(0.18, 0.28, leftTravel) * (1.0 - smoothstep(0.72, 0.84, leftTravel));
        float rightDash = smoothstep(0.30, 0.40, rightTravel) * (1.0 - smoothstep(0.62, 0.76, rightTravel));
        
        float leftPulse = 0.65 + 0.35 * sin((tUv.y - uTime * 0.8) * 18.0);
        float rightPulse = 0.65 + 0.35 * sin((tUv.y - uTime * 0.6) * 16.0 + 1.2);
        
        float dash =
            leftLane * leftDash * leftPulse +
            rightLane * rightDash * rightPulse;

        diffuseColor.rgb = mix(roadColor, glowColor, dash);
        `
    );
};

// Create alternative bands
meshLambertMaterial.defines = {"USE_UV" : ""}

// Tells the shader to use UV data
let cylinderGeometryMesh = new THREE.Mesh(bufferCylinderGeometry, meshLambertMaterial);
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

    if (meshLambertMaterial.userData.shader) {
        meshLambertMaterial.userData.shader.uniforms.uTime.value = elapsed;
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