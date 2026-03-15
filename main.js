import * as THREE from "three";
import {mergeGeometries} from "three/addons/utils/BufferGeometryUtils.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { ACESFilmicToneMapping } from "three";
import { createRoadMaterial } from "./createRoadMaterial.js";

console.clear();

// Set up 3D world
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
let renderer = new THREE.WebGLRenderer({ antialias: true });

scene.background = new THREE.Color("#27221E");
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

let roadMaterial = createRoadMaterial(THREE);

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
let travelDistance = curveLen * 0.12;
let targetTravelDistance = travelDistance;
let scrollTravelStep = 0.02;
let travelLerp = 0.08;

window.addEventListener("wheel", (event) => {
    event.preventDefault();
    targetTravelDistance = (targetTravelDistance + event.deltaY * scrollTravelStep) % curveLen;

    if (targetTravelDistance < 0) {
        targetTravelDistance += curveLen;
    }
}, { passive: false });

renderer.setAnimationLoop(() => {
    let elapsed = clock.getElapsedTime();

    if (roadMaterial.userData.shader) {
        roadMaterial.userData.shader.uniforms.uTime.value = elapsed;
    }

    let distanceToTarget = targetTravelDistance - travelDistance;

    if (distanceToTarget > curveLen * 0.5) {
        distanceToTarget -= curveLen;
    } else if (distanceToTarget < -curveLen * 0.5) {
        distanceToTarget += curveLen;
    }

    travelDistance = (travelDistance + distanceToTarget * travelLerp + curveLen) % curveLen;

    let t = travelDistance / curveLen;
    curve.getPointAt(t, camera.position);

    camera.setRotationFromMatrix(mat.lookAt(
        camera.position,
        curve.getPointAt((t + 0.01) % 1),
        new THREE.Vector3(0, 1, 0)
    ));

    renderer.render(scene, camera);
});
