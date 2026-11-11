
import { useEffect, useRef } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

import {
  FilesetResolver,
  HandLandmarker,
  type NormalizedLandmark
} from '@mediapipe/tasks-vision'

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const handLandmarkerRef = useRef<HandLandmarker | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const neutralAngleRef = useRef<number | null>(null)

  useEffect(() => {
    let active = true
    let animationFrameId = 0
    let frameCount = 0
    

    async function startCamera() {
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
           video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 60 }
          },
          audio: false
        })

        if (!active) {
          cameraStream.getTracks().forEach(track => track.stop())
          return
        }
        console.log(
  'Camera settings:',
  cameraStream.getVideoTracks()[0].getSettings()
)
        streamRef.current = cameraStream

        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream

          await new Promise<void>((resolve) => {
            videoRef.current!.onloadeddata = () => resolve()
          })
        }
      } catch (error) {
        console.error('Failed to access camera:', error)
      }
    }

    async function initializeMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
        )

        const handLandmarker = await HandLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.4,
            minHandPresenceConfidence: 0.4,
            minTrackingConfidence: 0.4
          }
        )

        if (!active) {
          handLandmarker.close()
          return
        }

        handLandmarkerRef.current = handLandmarker
      } catch (error) {
        console.error('Failed to initialize hand tracker:', error)
      }
    }

    function detectHands() {
      if (!active) return

      const video = videoRef.current
      const handLandmarker = handLandmarkerRef.current

      if (video && handLandmarker && video.readyState >= 2) {
        const startTime = performance.now()

        const results = handLandmarker.detectForVideo(
          video,
          performance.now()
        )

        const processingTime = performance.now() - startTime

        frameCount++

        if (frameCount % 60 === 0) {
          console.log('Detection time:', processingTime.toFixed(1), 'ms')
        }

        // console.log('Detected hands:', results.landmarks.length)
        // console.log('Landmarks:', results.landmarks)
        // console.log('Handedness:', results.handedness)

        let leftFinger: NormalizedLandmark | null = null
        let rightFinger: NormalizedLandmark | null = null

        for (let i = 0; i < results.handedness.length; i++) {
          const handedness = results.handedness[i][0].categoryName
          const middleFinger = results.landmarks[i][10]

          if (handedness === 'Left') {
            leftFinger = middleFinger
          } else if (handedness === 'Right') {
            rightFinger = middleFinger
          }
        }

        if (leftFinger && rightFinger) {
          const midX = (leftFinger.x + rightFinger.x) / 2
          const midY = (leftFinger.y + rightFinger.y) / 2

          const dx = rightFinger.x - leftFinger.x
          const dy = rightFinger.y - leftFinger.y
          const angle = Math.atan2(dy, -dx)
          const angleDegrees = angle * (180 / Math.PI)
          console.log('Yoke angle:', angleDegrees.toFixed(1))

          const canvas = canvasRef.current
          const ctx = contextRef.current

          if (neutralAngleRef.current === null) {
            neutralAngleRef.current = angle
          }

          const relativeAngle = angle - neutralAngleRef.current
          const relativeAngleDegrees = relativeAngle * (180 / Math.PI)

          if (canvas && ctx) {
            // Clear the previous frame
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Convert normalized coordinates (0-1) into canvas pixels
            const leftX = leftFinger.x * canvas.width
            const leftY = leftFinger.y * canvas.height

            const rightX = rightFinger.x * canvas.width
            const rightY = rightFinger.y * canvas.height

            // Draw a line between both wrists
            ctx.beginPath()
            ctx.moveTo(leftX, leftY)
            ctx.lineTo(rightX, rightY)
            ctx.strokeStyle = 'lime'
            ctx.lineWidth = 3
            ctx.stroke()

            // Draw wrist markers
            ctx.fillStyle = 'red'

            ctx.beginPath()
            ctx.arc(leftX, leftY, 8, 0, Math.PI * 2)
            ctx.fill()

            ctx.beginPath()
            ctx.arc(rightX, rightY, 8, 0, Math.PI * 2)
            ctx.fill()

            // Draw midpoint
            ctx.fillStyle = 'yellow'
            ctx.beginPath()
            ctx.arc(midX * canvas.width, midY * canvas.height, 6, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      animationFrameId = requestAnimationFrame(detectHands)
    }

    async function initialize() {
      await Promise.all([
        startCamera(),
        initializeMediaPipe()
      ])

      if (!active) return

      detectHands()
    }

  

    initialize()

    if (canvasRef.current) {
      contextRef.current = canvasRef.current.getContext('2d')
    }
    return () => {
      active = false

      cancelAnimationFrame(animationFrameId)

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close()
        handLandmarkerRef.current = null
      }
    }
  }, [])

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>

        <div>
          <h1>Video feed \/</h1>
          <div className="camera-container">
            <video ref={videoRef} autoPlay playsInline muted />

            <canvas
              ref={canvasRef}
              width={640}
              height={480}
            />
          </div>
        </div>
      </section>
    </>
  )
}

export default App
