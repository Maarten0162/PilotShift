
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import './App.css'

import {
  FilesetResolver,
  HandLandmarker,
  type NormalizedLandmark
} from '@mediapipe/tasks-vision'

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const GUIDE_STEPS = [
  {
    title: 'Hold your hands up',
    text: 'Grip an imaginary yoke with both hands clearly in view of the camera.',
    icon: (
      <Icon>
        <path d="M3 9h4l2 3h6l2-3h4" />
        <circle cx="12" cy="14" r="2" />
        <path d="M12 16v5" />
      </Icon>
    )
  },
  {
    title: 'Calibrate',
    text: 'Hold a neutral position, press Calibrate and keep still during the countdown.',
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </Icon>
    )
  },
  {
    title: 'Connect to game',
    text: 'Start the game, then press Connect to game to start flying.',
    icon: (
      <Icon>
        <path d="M9 7V3M15 7V3" />
        <path d="M6 7h12v4a6 6 0 0 1-12 0z" />
        <path d="M12 17v4" />
      </Icon>
    )
  }
]

function AxisRow({
  icon,
  label,
  value,
  placeholder = false
}: {
  icon: ReactNode
  label: string
  value: number
  placeholder?: boolean
}) {
  const percent = Math.abs(value) * 50

  return (
    <div className={`axis-row${placeholder ? ' is-placeholder' : ''}`}>
      <div className="axis-label">
        <span className="axis-icon">{icon}</span>
        {label}
      </div>

      <div className="axis-track">
        <div
          className="axis-fill"
          style={{
            left: value < 0 ? `${50 - percent}%` : '50%',
            width: `${percent}%`
          }}
        />
        <div className="axis-center" />
        <div className="axis-thumb" style={{ left: `${(value + 1) * 50}%` }} />
      </div>

      <span className="axis-value">
        {placeholder ? 'soon' : value.toFixed(2)}
      </span>
    </div>
  )
}

function App() {
  
  //websocket
  const socketRef = useRef<WebSocket | null>(null)


  //tracking
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const handLandmarkerRef = useRef<HandLandmarker | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const neutralAngleRef = useRef<number | null>(null)
  const latestAngleRef = useRef<number | null>(null)
  const neutralPitchRef = useRef<number | null>(null)
  const latestPitchRef = useRef<number | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownIntervalRef = useRef<number | null>(null)
  const [roll, setRoll] = useState(0)
  const [pitch, setPitch] = useState(0)
  const [handsDetected, setHandsDetected] = useState(false)
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected')
  const [videoAspect, setVideoAspect] = useState(4 / 3)

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [activeCameraId, setActiveCameraId] = useState('')
  const [selectedCameraId, setSelectedCameraId] = useState(
    () => localStorage.getItem('cameraId') ?? ''
  )

  const [showHandOverlay, setShowHandOverlay] = useState(
    () => localStorage.getItem('showHandOverlay') !== 'false'
  )
  const showHandOverlayRef = useRef(showHandOverlay)

  const [mirrorCamera, setMirrorCamera] = useState(() => {
    const savedPreference = localStorage.getItem('mirrorCamera')

    return savedPreference === null
      ? true
      : savedPreference === 'true'
  })

  function calibrateYoke() {
    const currentAngle = latestAngleRef.current
    const currentPitch = latestPitchRef.current

    neutralPitchRef.current = currentPitch
    neutralAngleRef.current = currentAngle

    console.log('Yoke calibrated!')
  }

  function startCalibration() {
    if (countdownIntervalRef.current !== null) return

    let remaining = 3
    setCountdown(remaining)

    countdownIntervalRef.current = window.setInterval(() => {
      remaining--

      if (remaining > 0) {
        setCountdown(remaining)
      } else {
        window.clearInterval(countdownIntervalRef.current!)
        countdownIntervalRef.current = null

        calibrateYoke()
        setCountdown(null)
      }
    }, 1000)
  }

  function toggleConnection() {
    if (socketRef.current) {
      socketRef.current.close()
      return
    }

    setConnectionStatus('connecting')

    const socket = new WebSocket('ws://localhost:8080/yoke')
    socketRef.current = socket

    socket.onopen = () => {
      console.log('Connected to Unity!')
      setConnectionStatus('connected')
      socket.send('Hello from React!')
    }

    socket.onclose = () => {
      console.log('Disconnected from Unity')
      if (socketRef.current === socket) {
        socketRef.current = null
      }
      setConnectionStatus('disconnected')
    }

    socket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  function selectCamera(deviceId: string) {
    localStorage.setItem('cameraId', deviceId)
    setSelectedCameraId(deviceId)
  }

  useEffect(() => {
    return () => {
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('mirrorCamera', String(mirrorCamera))
  }, [mirrorCamera])

  useEffect(() => {
    showHandOverlayRef.current = showHandOverlay
    localStorage.setItem('showHandOverlay', String(showHandOverlay))
  }, [showHandOverlay])

  useEffect(() => {
    let active = true

    async function startCamera() {
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
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

        const settings = cameraStream.getVideoTracks()[0].getSettings()
        console.log('Camera settings:', settings)

        streamRef.current = cameraStream
        setActiveCameraId(settings.deviceId ?? '')

        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream
        }

        const devices = await navigator.mediaDevices.enumerateDevices()
        if (active) {
          setCameras(devices.filter(device => device.kind === 'videoinput'))
        }
      } catch (error) {
        console.error('Failed to access camera:', error)

        // Saved camera is no longer available: fall back to the default one
        if (active && selectedCameraId) {
          localStorage.removeItem('cameraId')
          setSelectedCameraId('')
        }
      }
    }

    startCamera()

    return () => {
      active = false

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [selectedCameraId])

  useEffect(() => {
    let active = true
    let animationFrameId = 0
    let frameCount = 0

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

        const canvas = canvasRef.current
        const ctx = contextRef.current

        if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }

        let leftFinger: NormalizedLandmark | null = null
        let rightFinger: NormalizedLandmark | null = null

        let leftWrist: NormalizedLandmark | null = null
        let leftKnuckle: NormalizedLandmark | null = null

        let rightWrist: NormalizedLandmark | null = null
        let rightKnuckle: NormalizedLandmark | null = null
        

        for (let i = 0; i < results.handedness.length; i++) {
          const handedness = results.handedness[i][0].categoryName
          const hand = results.landmarks[i]
          const middleFinger = hand[10]
          

          if (handedness === 'Left') {
            leftFinger = middleFinger
            leftWrist = hand[0]
            leftKnuckle = hand[9]
          } else if (handedness === 'Right') {
            rightFinger = middleFinger
            rightWrist = hand[0]
            rightKnuckle = hand[9]
          }
        }

        if (leftFinger && rightFinger) {
          if (leftWrist && leftKnuckle && rightWrist && rightKnuckle) {

            const leftVector = {
              x: leftKnuckle.x - leftWrist.x,
              y: leftKnuckle.y - leftWrist.y,
              z: leftKnuckle.z - leftWrist.z
            }

            const rightVector = {
              x: rightKnuckle.x - rightWrist.x,
              y: rightKnuckle.y - rightWrist.y,
              z: rightKnuckle.z - rightWrist.z
            }

            const averageY = (leftVector.y + rightVector.y) / 2;

            latestPitchRef.current = averageY
          }

          const midX = (leftFinger.x + rightFinger.x) / 2
          const midY = (leftFinger.y + rightFinger.y) / 2

          const dx = rightFinger.x - leftFinger.x
          const dy = rightFinger.y - leftFinger.y
          const angle = Math.atan2(dy, -dx)

          latestAngleRef.current = angle

          let relativeAngleDegrees: number | null = null
          let roll = 0
          let pitch = 0

          if (neutralAngleRef.current !== null) {
            const relativeAngle = angle - neutralAngleRef.current
            relativeAngleDegrees = relativeAngle * (180 / Math.PI)
          }

          if (relativeAngleDegrees !== null) {
            const maxRollAngle = 30

            roll = Math.max(
              -1,
              Math.min(1, relativeAngleDegrees / maxRollAngle)
            )
            setRoll(roll)
          }

          if (neutralPitchRef.current !== null && latestPitchRef.current !== null) {

            const relativePitch =
              latestPitchRef.current - neutralPitchRef.current

            const maxPitchUp = 0.04
            const maxPitchDown = 0.08

            if (relativePitch < 0) {
              pitch = Math.max(-1, relativePitch / maxPitchUp)
            } else {
              pitch = Math.min(1, relativePitch / maxPitchDown)
            }
          }

          setPitch(pitch)
          setHandsDetected(true)

          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              roll: roll,
              pitch: pitch,
              time: Date.now()
            }))
          }

          if (canvas && ctx && showHandOverlayRef.current) {
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
        else {
          latestAngleRef.current = null
          latestPitchRef.current = null
          setRoll(0)
          setPitch(0)
          setHandsDetected(false)
        }
      }

      animationFrameId = requestAnimationFrame(detectHands)
    }

    async function initialize() {
      await initializeMediaPipe()

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

      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close()
        handLandmarkerRef.current = null
      }

      if (countdownIntervalRef.current !== null) {
        window.clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

  const connectionLabel = {
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
    connected: 'Connected'
  }[connectionStatus]

  return (
    <div className="dashboard">
      <header className="topbar">
        <h1 className="brand">PilotShift</h1>

        <div className="status-group">
          <span className={`status-pill ${handsDetected ? 'ok' : 'warn'}`}>
            <span className="status-dot" />
            {handsDetected ? 'Both hands detected' : 'Hands not detected'}
          </span>
          <span
            className={`status-pill ${
              connectionStatus === 'connected'
                ? 'ok'
                : connectionStatus === 'connecting'
                  ? 'pending'
                  : 'off'
            }`}
          >
            <span className="status-dot" />
            Game: {connectionLabel}
          </span>
        </div>
      </header>

      <section className="guide">
        <h2 className="section-title">Guide</h2>
        <div className="guide-steps">
          {GUIDE_STEPS.map((step, index) => (
            <Fragment key={step.title}>
              {index > 0 && <div className="guide-arrow" aria-hidden="true">&rarr;</div>}
              <div className="guide-card">
                <div className="guide-icon">{step.icon}</div>
                <div>
                  <h3>
                    <span className="guide-number">{index + 1}</span>
                    {step.title}
                  </h3>
                  <p>{step.text}</p>
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </section>

      <main className="workspace">
        <section className="panel camera-panel">
          <div className="camera-frame" style={{ aspectRatio: videoAspect }}>
            <div
              className="camera-feed"
              style={{ transform: mirrorCamera ? 'scaleX(-1)' : 'none' }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(event) => {
                  const { videoWidth, videoHeight } = event.currentTarget
                  if (videoWidth && videoHeight) {
                    setVideoAspect(videoWidth / videoHeight)
                  }
                }}
              />
              <canvas ref={canvasRef} width={640} height={480} />
            </div>

            {countdown !== null && (
              <div className="countdown-overlay">
                <span key={countdown} className="countdown-number">
                  {countdown}
                </span>
                <span className="countdown-label">Hold still</span>
              </div>
            )}
          </div>

          <div className="camera-controls">
            <label className="field">
              <span className="field-label">This device</span>
              <select
                value={activeCameraId}
                onChange={(event) => selectCamera(event.target.value)}
              >
                {cameras.length === 0 && <option value="">No camera found</option>}
                {cameras.map((camera, index) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="btn btn-primary"
              onClick={startCalibration}
              disabled={countdown !== null}
            >
              {countdown !== null ? `Calibrating in ${countdown}...` : 'Calibrate'}
            </button>
          </div>

          <div className="toggles">
            <label className="toggle">
              <input
                type="checkbox"
                checked={mirrorCamera}
                onChange={(event) => setMirrorCamera(event.target.checked)}
              />
              <span className="toggle-switch" />
              Mirror camera
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={showHandOverlay}
                onChange={(event) => setShowHandOverlay(event.target.checked)}
              />
              <span className="toggle-switch" />
              Show hand tracking
            </label>
          </div>
        </section>

        <section className="panel axes-panel">
          <h2 className="section-title">Controls</h2>

          <div className="axis-list">
            <AxisRow
              label="Roll"
              value={roll}
              icon={
                <Icon>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h6M15 12h6M12 15v6" />
                  <circle cx="12" cy="12" r="3" />
                </Icon>
              }
            />
            <AxisRow
              label="Pitch"
              value={pitch}
              icon={
                <Icon>
                  <path d="M4 16l8-8 8 8" />
                  <path d="M4 20h16" />
                </Icon>
              }
            />
            <AxisRow
              label="Yaw"
              value={0}
              placeholder
              icon={
                <Icon>
                  <path d="M4 12a8 8 0 0 1 14-5.3" />
                  <path d="M18 3v4h-4" />
                  <path d="M20 12a8 8 0 0 1-14 5.3" />
                  <path d="M6 21v-4h4" />
                </Icon>
              }
            />
            <AxisRow
              label="Speed up/down"
              value={0}
              placeholder
              icon={
                <Icon>
                  <path d="M12 4v16" />
                  <path d="M7 9l5-5 5 5" />
                  <path d="M7 15l5 5 5-5" />
                </Icon>
              }
            />
          </div>

          <div className="axes-footer">
            <button
              className={`btn ${connectionStatus === 'disconnected' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={toggleConnection}
            >
              {connectionStatus === 'disconnected'
                ? 'Connect to game'
                : connectionStatus === 'connecting'
                  ? 'Cancel'
                  : 'Disconnect'}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
