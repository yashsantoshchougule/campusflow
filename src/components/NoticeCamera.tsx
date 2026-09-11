/** Uses react-webcam getUserMedia/still-capture flow. Copyright (c) 2018 Moz Morris, MIT License. */
import { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { dataUrlToNoticeFile } from '../features/notices/engine';

export default function NoticeCamera({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const webcam = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState('');

  const capture = () => {
    const image = webcam.current?.getScreenshot();
    if (!image) { setError('The camera is not ready.'); return; }
    onCapture(dataUrlToNoticeFile(image));
  };

  return <div className="notice-camera-backdrop" role="presentation"><section className="notice-camera" role="dialog" aria-modal="true" aria-labelledby="notice-camera-title">
    <h2 id="notice-camera-title">Capture notice</h2>
    <p>Camera access requires localhost or HTTPS. Only a still image is captured.</p>
    <Webcam ref={webcam} audio={false} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: { ideal: facingMode } }} onUserMedia={() => setError('')} onUserMediaError={(caught) => setError(String(caught).includes('NotAllowed') ? 'Camera permission was denied.' : 'No usable camera was found.')} />
    {error && <p role="alert">{error}</p>}
    <div className="notice-actions"><button type="button" onClick={() => setFacingMode((current) => current === 'environment' ? 'user' : 'environment')}>Switch camera</button><button type="button" onClick={capture}>Capture still image</button><button type="button" onClick={onClose}>Cancel</button></div>
  </section></div>;
}
