import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import * as THREE from "three"

type EinsteinRosenProps = {
    progress: number
    backgroundColor: string
    minimapSize: number
    showMinimap: boolean
    exposure: number
    minimapRight: number
    minimapBottom: number
}

const MONACO_TRACK_PATH =
    "M133.68,134.74c-1.14.51-2.42,3.09-3.49,3.61s-2-.14-2.93-.47a7.13,7.13,0,0,1-2.68-1.57c-.71-.74-.44-2.09-1.6-2.89s-1.57-.64-5.3-1.94-12.59-4.34-17.09-5.89-6.19-2.16-9.88-3.42-9-3.13-12.26-4.15-5-2.14-7.09-2-3.37,1.7-5.26,3-3.38,1.72-6.07,5A129.61,129.61,0,0,0,50,138.5c-2,3.66-2.16,5.17-2.07,7.52s2.5,3.64,2.57,6.55-1.33,7.69-2.12,10.93-1.86,6.09-2.62,8.54-1.17,4.37-1.88,6.12-1.11,3.27-2.43,4.35-4.16.36-5.49,2.18-1.95,6.07-2.41,8.77a34,34,0,0,0-.38,7.4,52.25,52.25,0,0,0,.82,8.69A28.68,28.68,0,0,0,36.58,217c1.25,2.47,4.2,5.42,5,7.31a3.72,3.72,0,0,1-.37,4c-.69.79-2.39.75-3.71.77a20.21,20.21,0,0,1-4.19-.68,32.17,32.17,0,0,1-5.14-1.27,13.84,13.84,0,0,1-3.43-2.23c-1-.77-2.05-1.44-2.3-2.35s.55-2,.82-3.15a13.1,13.1,0,0,0,.72-4c0-1.82-.8-4.16-1-7a74.62,74.62,0,0,1-.27-9.84c.19-3.92.81-9.27,1.42-13.63s1.32-8.37,2.22-12.56,2-8.71,3.16-12.57,2.89-8.21,3.77-10.65.94-2.58,1.56-4.07,1.34-3.09,2.15-4.88,1.36-3.32,2.69-5.81a70.52,70.52,0,0,1,5.27-9.13c2.44-3.37,6.76-8,9.36-11.12s4.39-6.33,6.22-7.55,1.27-.61,4.73.26,10.19,3.42,16,5S94.62,115,99.91,116.2s8.92,1.55,13,2.68,8.21,3.24,11.63,4.12a41.7,41.7,0,0,0,9,1.15c3.13.17,6.79-.32,9.79-.12a51.69,51.69,0,0,1,8.2,1.31c2.62.58,4.55,1.3,7.52,2.21s6.72,2.71,10.31,3.25a32.51,32.51,0,0,0,11.22,0,17.78,17.78,0,0,0,8.43-4.52c2-2.07,3-5.24,3.71-7.91a22.27,22.27,0,0,0,.38-8.06c-.31-2.53-1.69-4.8-2.25-7.07s-2.23-4.13-1.07-6.52S194,91.5,197.88,89s11.25-5.46,15.13-7.43,5.58-3,8.14-4.35,4.95-2.44,7.17-3.54,4.33-2.62,6.14-3a6.75,6.75,0,0,1,4.69.56A4.83,4.83,0,0,1,241,74.42a9.56,9.56,0,0,1-.25,4.08c-.35,1.39-1.6,2.64-1.82,4.25s.3,3.62.5,5.4.62,3.86.7,5.29-.41,2.42-.18,3.37a3.88,3.88,0,0,0,1.53,2.33,2.65,2.65,0,0,0,2.27-.23,2.46,2.46,0,0,0,1.47-1.79c.07-.84-.74-1.88-1.11-3.27s-.85-3.57-1.12-5.11a15.54,15.54,0,0,1-.45-4.14c.14-1.31.16-3,1.3-3.71s3.7-.66,5.49-.64a30.28,30.28,0,0,1,5.17.75c1.88.33,4.5.48,6.09,1.24s3.17,2.07,3.41,3.35-.71,1.77-2,4.32-4,7.91-5.68,11-2.77,5-4.14,7.33-2.76,4.55-4.16,6.51a33.38,33.38,0,0,1-4.22,5.17c-2.45,2.54-6.71,6.91-10.39,10a105.28,105.28,0,0,1-11.72,8.39,23,23,0,0,1-8.15,3.48c-3.42.77-6.9.85-12.39,1.13s-15,.57-20.54.54a114.15,114.15,0,0,1-12.66-.74A98.08,98.08,0,0,1,157.23,141c-3.57-.73-7.31-1.82-10.67-2.76s-7.4-2.33-9.55-2.91-2.19-1.09-3.33-.59"

function createRoadMaterial() {
    const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.18,
        metalness: 0.02,
        transparent: true,
        opacity: 0.82,
        side: THREE.DoubleSide,
    })

    material.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = { value: 0 }
        ;(material.userData as any).shader = shader

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
        vec3 warmCore = vec3(1.0, 0.78, 0.22);
        vec3 baseGlass = mix(
            vec3(0.015, 0.02, 0.05),
            rainbow * 0.18 + vec3(0.015, 0.018, 0.03),
            prismMask * 0.35
        );
        vec3 prismaticScatter = rainbow * (0.08 + bandingA * 1.15 + bandingB * 0.65 + cracks * 0.45);
        vec3 centerGlow = warmCore * (0.05 + 0.42 * coreMask);

        diffuseColor.rgb = (baseGlass + centerGlow + prismaticScatter * 1.15 + sparkle * 0.9) * edgeFade;
        float visibleMask = clamp(
            max(max(diffuseColor.rgb.r, diffuseColor.rgb.g), diffuseColor.rgb.b) * 1.35,
            0.0,
            1.0
        );
        diffuseColor.a = visibleMask;
        `
        )

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
        vec3 warmCoreGlow = vec3(1.2, 0.82, 0.22) * (0.08 + 0.7 * coreMaskGlow);
        vec3 bridgeGlow = warmCoreGlow + coloredLanes * 1.2 + sparkleGlow * vec3(0.5, 0.7, 1.0);
        totalEmissiveRadiance += bridgeGlow * 1.5;
        `
        )
    }

    material.defines = { USE_UV: "" }
    return material
}

function buildTrackPoints(segments: number) {
    const svgNamespace = "http://www.w3.org/2000/svg"
    const svg = document.createElementNS(svgNamespace, "svg")
    const path = document.createElementNS(svgNamespace, "path")
    path.setAttribute("d", MONACO_TRACK_PATH)
    svg.appendChild(path)

    const totalLength = path.getTotalLength()
    const sampled2D = Array.from({ length: segments + 1 }, (_, index) => {
        const point = path.getPointAtLength((index / segments) * totalLength)
        return { x: point.x, y: point.y }
    })

    return sampled2D
        .map(
            (point) =>
                new THREE.Vector3(
                    (point.x - 140) * 0.75,
                    0,
                    -(point.y - 140) * 0.75
                )
        )
        .reverse()
}

export default function EinsteinRosen(props: Partial<EinsteinRosenProps>) {
    const {
        progress = 0.12,
        backgroundColor = "#27221E",
        minimapSize = 96,
        showMinimap = true,
        exposure = 1,
        minimapRight = -6,
        minimapBottom = -18,
    } = props

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const progressRef = React.useRef(progress)
    const minimapVisibleRef = React.useRef(showMinimap)
    const minimapSizeRef = React.useRef(minimapSize)
    const exposureRef = React.useRef(exposure)
    const backgroundRef = React.useRef(backgroundColor)
    const minimapRightRef = React.useRef(minimapRight)
    const minimapBottomRef = React.useRef(minimapBottom)

    progressRef.current = progress
    minimapVisibleRef.current = showMinimap
    minimapSizeRef.current = minimapSize
    exposureRef.current = exposure
    backgroundRef.current = backgroundColor
    minimapRightRef.current = minimapRight
    minimapBottomRef.current = minimapBottom

    React.useEffect(() => {
        const container = containerRef.current

        if (!container) return

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(backgroundRef.current)

        const camera = new THREE.PerspectiveCamera(60, 1, 1, 1000)
        camera.position.set(0, 1, 1).setLength(100)
        camera.lookAt(scene.position)

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = exposureRef.current
        container.appendChild(renderer.domElement)

        const light = new THREE.DirectionalLight(0xffffff, 0.9)
        light.position.set(12, 18, 10)
        scene.add(light, new THREE.HemisphereLight(0x9ec4ff, 0x08060b, 0.35))

        const segments = 1000
        const radialSegments = 10
        const cylinderGeometry = new THREE.CylinderGeometry(
            2,
            2,
            segments,
            radialSegments,
            segments,
            true,
            Math.PI * 0.5 - (Math.PI * 0.4 * 0.5),
            Math.PI * 0.4
        )

        const roadGeometry = cylinderGeometry.clone()
            .translate(0, -0.5 * segments, 0)
            .rotateX(Math.PI * -0.5)

        const roadMaterial = createRoadMaterial()
        const tubeMesh = new THREE.Mesh(roadGeometry, roadMaterial)
        scene.add(tubeMesh)

        const basePoints = buildTrackPoints(segments)
        const smoothCurve = new THREE.CatmullRomCurve3(
            basePoints,
            true,
            "centripetal"
        )
        const curvePoints = smoothCurve.getSpacedPoints(segments)
        const curve = new THREE.CatmullRomCurve3(curvePoints, true, "centripetal")

        const bufferGeometry = new THREE.BufferGeometry().setFromPoints(
            curve.getSpacedPoints(segments)
        )
        const debugLine = new THREE.Line(
            bufferGeometry,
            new THREE.LineBasicMaterial({ color: "aquamarine" })
        )
        debugLine.visible = false
        scene.add(debugLine)

        const curveFrames = curve.computeFrenetFrames(segments, true)
        const actualCurvePoints = curve.getSpacedPoints(segments)
        const vert = new THREE.Vector3()
        const normal = new THREE.Vector3()
        const binormal = new THREE.Vector3()
        const bentPosition = new THREE.Vector3()

        for (let i = 0; i < roadGeometry.attributes.position.count; i++) {
            vert.fromBufferAttribute(roadGeometry.attributes.position, i)
            const frameIndex = Math.round(vert.z)

            normal
                .copy(curveFrames.normals[frameIndex])
                .multiplyScalar(vert.x)
            binormal
                .copy(curveFrames.binormals[frameIndex])
                .multiplyScalar(vert.y)

            bentPosition
                .copy(actualCurvePoints[frameIndex])
                .add(normal)
                .add(binormal)

            roadGeometry.attributes.position.setXYZ(
                i,
                bentPosition.x,
                bentPosition.y,
                bentPosition.z
            )
        }

        roadGeometry.computeVertexNormals()

        const bounds = basePoints.reduce(
            (acc, point) => ({
                minX: Math.min(acc.minX, point.x),
                maxX: Math.max(acc.maxX, point.x),
                minZ: Math.min(acc.minZ, point.z),
                maxZ: Math.max(acc.maxZ, point.z),
            }),
            {
                minX: Infinity,
                maxX: -Infinity,
                minZ: Infinity,
                maxZ: -Infinity,
            }
        )

        const svgNamespace = "http://www.w3.org/2000/svg"
        const minimap = document.createElement("div")
        minimap.style.position = "absolute"
        minimap.style.right = `${minimapRightRef.current}px`
        minimap.style.bottom = `${minimapBottomRef.current}px`
        minimap.style.pointerEvents = "none"
        minimap.style.zIndex = "2"
        minimap.style.overflow = "hidden"
        container.appendChild(minimap)

        const minimapSvg = document.createElementNS(svgNamespace, "svg")
        minimapSvg.setAttribute("aria-hidden", "true")
        minimapSvg.style.display = "block"
        minimap.appendChild(minimapSvg)

        const minimapGroup = document.createElementNS(svgNamespace, "g")
        const minimapTrack = document.createElementNS(svgNamespace, "path")
        const minimapOutline = document.createElementNS(svgNamespace, "path")
        const minimapMarker = document.createElementNS(svgNamespace, "circle")
        minimapGroup.append(minimapTrack, minimapOutline, minimapMarker)
        minimapSvg.appendChild(minimapGroup)

        minimapTrack.setAttribute("fill", "none")
        minimapTrack.setAttribute("stroke", "#f6f2ea")
        minimapTrack.setAttribute("stroke-width", "7")
        minimapTrack.setAttribute("stroke-linecap", "round")
        minimapTrack.setAttribute("stroke-linejoin", "round")

        minimapOutline.setAttribute("fill", "none")
        minimapOutline.setAttribute("stroke", "#221f24")
        minimapOutline.setAttribute("stroke-width", "2")
        minimapOutline.setAttribute("stroke-linecap", "round")
        minimapOutline.setAttribute("stroke-linejoin", "round")

        minimapMarker.setAttribute("r", "4")
        minimapMarker.setAttribute("fill", "#ff3b30")
        minimapMarker.setAttribute("stroke", "#ffe1db")
        minimapMarker.setAttribute("stroke-width", "1.5")

        const matrix = new THREE.Matrix4()
        const clock = new THREE.Clock()
        const minimapRotationOffset = THREE.MathUtils.degToRad(100)

        const setSize = () => {
            const width = container.clientWidth || 1
            const height = container.clientHeight || 1
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer.setSize(width, height, false)

            const mapSize = minimapSizeRef.current
            const padding = 28
            const trackWidth = bounds.maxX - bounds.minX
            const trackHeight = bounds.maxZ - bounds.minZ
            const scale = Math.min(
                (mapSize - padding * 2) / trackWidth,
                (mapSize - padding * 2) / trackHeight
            )
            const offsetX = (mapSize - trackWidth * scale) * 0.5
            const offsetY = (mapSize - trackHeight * scale) * 0.5

            const toMinimapPoint = (point: THREE.Vector3) => ({
                x: offsetX + (point.x - bounds.minX) * scale,
                y: offsetY + (bounds.maxZ - point.z) * scale,
            })

            const minimapPathData =
                basePoints
                    .map((point, index) => {
                        const mapped = toMinimapPoint(point)
                        const command = index === 0 ? "M" : "L"
                        return `${command} ${mapped.x.toFixed(2)} ${mapped.y.toFixed(2)}`
                    })
                    .join(" ") + " Z"

            minimap.style.display = minimapVisibleRef.current ? "block" : "none"
            minimap.style.right = `${minimapRightRef.current}px`
            minimap.style.bottom = `${minimapBottomRef.current}px`
            minimap.style.width = `${mapSize}px`
            minimap.style.height = `${mapSize}px`
            minimapSvg.setAttribute("viewBox", `0 0 ${mapSize} ${mapSize}`)
            minimapSvg.setAttribute("width", `${mapSize}`)
            minimapSvg.setAttribute("height", `${mapSize}`)
            minimapTrack.setAttribute("d", minimapPathData)
            minimapOutline.setAttribute("d", minimapPathData)

            return toMinimapPoint
        }

        let toMinimapPoint = setSize()
        const resizeObserver = new ResizeObserver(() => {
            toMinimapPoint = setSize()
        })

        resizeObserver.observe(container)

        let frameId = 0
        const renderFrame = () => {
            const elapsed = clock.getElapsedTime()
            scene.background = new THREE.Color(backgroundRef.current)
            renderer.toneMappingExposure = exposureRef.current

            const shader = (roadMaterial.userData as any).shader
            if (shader) {
                shader.uniforms.uTime.value = elapsed
            }

            const normalized = ((progressRef.current % 1) + 1) % 1
            const curvePoint = curve.getPointAt(normalized)
            const minimapPoint = toMinimapPoint(curvePoint)
            const forwardPoint = toMinimapPoint(
                curve.getPointAt((normalized - 0.01 + 1) % 1)
            )
            const heading = Math.atan2(
                forwardPoint.y - minimapPoint.y,
                forwardPoint.x - minimapPoint.x
            )
            const minimapRotation = heading + minimapRotationOffset

            minimap.style.display = minimapVisibleRef.current ? "block" : "none"
            minimapMarker.setAttribute("cx", minimapPoint.x.toFixed(2))
            minimapMarker.setAttribute("cy", minimapPoint.y.toFixed(2))
            minimapGroup.setAttribute(
                "transform",
                `rotate(${THREE.MathUtils.radToDeg(minimapRotation).toFixed(2)} ${minimapSizeRef.current * 0.5} ${minimapSizeRef.current * 0.5})`
            )

            camera.position.copy(curvePoint)
            camera.setRotationFromMatrix(
                matrix.lookAt(
                    camera.position,
                    curve.getPointAt((normalized + 0.01) % 1),
                    new THREE.Vector3(0, 1, 0)
                )
            )

            renderer.render(scene, camera)
            frameId = requestAnimationFrame(renderFrame)
        }

        renderFrame()

        return () => {
            cancelAnimationFrame(frameId)
            resizeObserver.disconnect()
            renderer.dispose()
            roadGeometry.dispose()
            cylinderGeometry.dispose()
            bufferGeometry.dispose()
            roadMaterial.dispose()
            scene.clear()
            if (renderer.domElement.parentNode === container) {
                container.removeChild(renderer.domElement)
            }
            if (minimap.parentNode === container) {
                container.removeChild(minimap)
            }
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background: backgroundColor,
            }}
        />
    )
}

addPropertyControls(EinsteinRosen, {
    progress: {
        type: ControlType.Number,
        title: "Progress",
        min: 0,
        max: 1,
        step: 0.001,
        defaultValue: 0.12,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#27221E",
    },
    exposure: {
        type: ControlType.Number,
        title: "Exposure",
        min: 0.2,
        max: 2,
        step: 0.01,
        defaultValue: 1,
    },
    showMinimap: {
        type: ControlType.Boolean,
        title: "Minimap",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    minimapSize: {
        type: ControlType.Number,
        title: "Map Size",
        min: 72,
        max: 320,
        step: 1,
        defaultValue: 96,
        hidden: (props) => !props.showMinimap,
    },
    minimapRight: {
        type: ControlType.Number,
        title: "Map Right",
        min: -40,
        max: 80,
        step: 1,
        defaultValue: -6,
        hidden: (props) => !props.showMinimap,
    },
    minimapBottom: {
        type: ControlType.Number,
        title: "Map Bottom",
        min: -40,
        max: 80,
        step: 1,
        defaultValue: -18,
        hidden: (props) => !props.showMinimap,
    },
})
