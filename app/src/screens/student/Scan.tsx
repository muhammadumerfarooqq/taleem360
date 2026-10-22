import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CloseIcon, ScanIcon } from '../../components/Icons'
import StudentShell from '../../components/StudentShell'
import { pick } from '../../mock/subjects'
import { clearPhoto, setPhoto } from '../../photoStore'

// The Home tab ids. With no ?subject= the demo uses Physics (the electricity generator).
const subjectNames: Record<string, string> = {
  biology: 'Biology',
  chemistry: 'Chemistry',
  physics: 'Physics',
  cs: 'Computer Science',
}

// 'starting' = asking for the camera, 'live' = the back camera is showing, 'off' = no live camera here
// (plain http address, permission denied, no camera). Then the phone's own camera app takes the photo.
type CameraState = 'starting' | 'live' | 'off'

export default function Scan() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [camera, setCamera] = useState<CameraState>('starting')
  const [captureFailed, setCaptureFailed] = useState(false)
  const [params] = useSearchParams()
  const requested = params.get('subject')
  const subject = pick(subjectNames, requested) ? (requested as string) : 'physics'
  const fetchingHref = `/fetching?subject=${encodeURIComponent(subject)}`

  // Open the back camera while this screen is open and always release it when leaving.
  useEffect(() => {
    clearPhoto()
    let alive = true
    let stream: MediaStream | null = null
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamera('off')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        })
        if (!alive) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => undefined)
        }
        setCamera('live')
      } catch {
        if (alive) setCamera('off')
      }
    }
    start()
    return () => {
      alive = false
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  // No live camera: on a phone, try to open the camera app straight away. The browser may
  // refuse without a fresh tap, so the "Open camera" button below stays as the manual way.
  useEffect(() => {
    if (camera === 'off' && window.matchMedia('(pointer: coarse)').matches) {
      fileRef.current?.click()
    }
  }, [camera])

  // One photo from the live camera, then on to Fetching. If no photo could be taken we stay here:
  // a scan must never go on without a real photo.
  async function capture() {
    const video = videoRef.current
    if (camera !== 'live' || !video || video.videoWidth === 0) {
      setCaptureFailed(true)
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    if (!blob || blob.size === 0) {
      setCaptureFailed(true)
      return
    }
    setPhoto(blob)
    navigate(fetchingHref)
  }

  // The phone's camera app took the photo.
  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || file.size === 0) return
    setPhoto(file)
    navigate(fetchingHref)
  }

  return (
    <StudentShell tone="camera">
      <div className={`scan${camera === 'live' ? ' live' : ''}`}>
        <video ref={videoRef} className="scan-video" playsInline muted autoPlay aria-hidden="true" />

        {camera === 'live' && (
          <div className="scan-stage">
            <div className="scan-frame" aria-hidden="true">
              <i className="corner tl" />
              <i className="corner tr" />
              <i className="corner bl" />
              <i className="corner br" />
            </div>
            <div className="scan-hint">
              <span>Fit one diagram inside the box</span>
            </div>
          </div>
        )}

        {camera === 'off' && (
          <div className="scan-off">
            <div className="scan-off-icon" aria-hidden="true">
              <ScanIcon size={34} color="#1B1B2F" />
            </div>
            <div className="scan-off-title">Take a photo of the diagram</div>
            <div className="scan-off-sub">Your camera opens, you take one photo, and we find the 3D model.</div>
            <label className="btn btn-primary scan-off-btn">
              Open camera
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} />
            </label>
          </div>
        )}

        <div className="scan-top">
          <Link to="/home" className="round-btn dark" aria-label="Close scanner">
            <CloseIcon size={20} color="#FFFFFF" />
          </Link>
          <div className="pill-label">Class 9 · {pick(subjectNames, subject)}</div>
          <div className="round-spacer" />
        </div>

        {camera === 'live' && (
          <div className="scan-bottom">
            <button type="button" className="shutter" aria-label="Capture diagram" onClick={capture}>
              <span />
            </button>
            <div className="scan-note">{captureFailed ? 'The photo could not be taken. Try again.' : 'The camera takes one photo, then closes'}</div>
          </div>
        )}
      </div>
    </StudentShell>
  )
}
