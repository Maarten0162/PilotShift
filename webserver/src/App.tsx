import { useEffect, useRef, useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
      startCamera();

      return () => {
        if (streamRef.current)
        {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
    };
  }, []);

  async function startCamera() {
    streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    });
    
    if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
    }
    
  }

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


