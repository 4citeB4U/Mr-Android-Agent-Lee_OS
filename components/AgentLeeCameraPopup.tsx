import React, { useEffect, useRef, useState } from 'react';

interface CameraPopupProps {
  visible: boolean;
  onClose: () => void;
  defaultPosition?: { top: number; right: number };
}

const DEFAULT_POS = { top: 20, right: 20 };

export const AgentLeeCameraPopup: React.FC<CameraPopupProps> = ({ visible, onClose, defaultPosition }) => {
  const [position, setPosition] = useState(defaultPosition || DEFAULT_POS);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (visible) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          setStream(s);
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => onClose());
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    // Cleanup on unmount
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line
  }, [visible]);

  // Drag logic
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setOffset({
      x: e.clientX - (popupRef.current?.offsetLeft || 0),
      y: e.clientY - (popupRef.current?.offsetTop || 0),
    });
  };
  const onMouseMove = (e: MouseEvent) => {
    if (dragging) {
      setPosition({
        top: e.clientY - offset.y,
        right: window.innerWidth - (e.clientX - offset.x) - 200, // 200 = width
      });
    }
  };
  const onMouseUp = () => setDragging(false);
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    // eslint-disable-next-line
  }, [dragging, offset]);

  if (!visible) return null;
  return (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        top: position.top,
        right: position.right,
        width: 200,
        height: 120,
        zIndex: 9999,
        background: '#111',
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        border: '2px solid #00e5ff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: dragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={onMouseDown}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
      />
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 2,
          right: 2,
          background: '#222',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '2px 8px',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >✕</button>
    </div>
  );
};
