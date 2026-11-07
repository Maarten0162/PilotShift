
import { useEffect, useRef } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

import {
  FilesetResolver,
  HandLandmarker
} from '@mediapipe/tasks-vision'

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const handLandmarkerRef = useRef<HandLandmarker | null>(null)

  useEffect(() => {
    let active = true
    let animationFrameId = 0

    async function startCamera() {
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        })

        if (!active) {
          cameraStream.getTracks().forEach(track => track.stop())
          return
        }

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
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
            },
            runningMode: 'VIDEO',
            numHands: 2
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
        const results = handLandmarker.detectForVideo(
          video,
          performance.now()
        )

        console.log('Detected hands:', results.landmarks.length)
        console.log('Landmarks:', results.landmarks)
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
          <video ref={videoRef} autoPlay playsInline muted />
          <canvas id="output"></canvas>
        </div>
      </section>
    </>
  )
}

export default App
