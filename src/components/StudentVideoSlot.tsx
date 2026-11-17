import { useCallback, useEffect, useRef, useState } from 'react';
import { Video, VideoOff, Maximize2, Minimize2, ChevronDown } from 'lucide-react';
import type { UserRole } from '../types/lesson';

interface RtcSignal {
  type: string;
  fromId?: string;
  fromRole?: UserRole;
  payload?: unknown;
}

interface StudentVideoSlotProps {
  roomCode: string | null;
  connected: boolean;
  role: UserRole;
  sendRtcSignal: (type: string, payload?: unknown) => void;
  subscribeRtcSignal: (listener: (msg: RtcSignal) => void) => () => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export function StudentVideoSlot({
  roomCode,
  connected,
  role,
  sendRtcSignal,
  subscribeRtcSignal,
}: StudentVideoSlotProps) {
  const [isOpen, setIsOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [localCameraOn, setLocalCameraOn] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const attachStream = useCallback((stream: MediaStream | null) => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) {
      el.play().catch(() => {});
    }
  }, []);

  const cleanupPeer = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    remoteStreamRef.current = null;
    setHasRemoteVideo(false);
  }, []);

  const stopLocalCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalCameraOn(false);
    attachStream(remoteStreamRef.current);
    if (roomCode && connected) {
      sendRtcSignal('rtc:camera-off');
    }
    cleanupPeer();
  }, [attachStream, cleanupPeer, connected, roomCode, sendRtcSignal]);

  const startOfferAsStudent = useCallback(
    async (stream: MediaStream) => {
      cleanupPeer();
      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendRtcSignal('rtc:ice', e.candidate);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendRtcSignal('rtc:offer', offer);
    },
    [cleanupPeer, sendRtcSignal]
  );

  const startLocalCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Caméra non disponible dans ce navigateur.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      localStreamRef.current = stream;
      setLocalCameraOn(true);
      attachStream(stream);

      if (role === 'student' && roomCode && connected) {
        await startOfferAsStudent(stream);
      }
    } catch {
      setCameraError(
        'Accès caméra refusé. Utilisez le cadre pour poser la vignette WhatsApp/Zoom.'
      );
    }
  };

  // WebRTC signaling listener inside live rooms
  useEffect(() => {
    if (!roomCode || !connected) return;

    // If tutor joins an active room, ask student to resend video offer if active
    if (role === 'tutor') {
      sendRtcSignal('rtc:request-offer');
    }

    const unsubscribe = subscribeRtcSignal(async (msg) => {
      try {
        if (msg.type === 'rtc:request-offer' && role === 'student') {
          if (localStreamRef.current) {
            await startOfferAsStudent(localStreamRef.current);
          }
        } else if (msg.type === 'rtc:offer' && msg.payload && role === 'tutor') {
          cleanupPeer();
          const pc = new RTCPeerConnection(RTC_CONFIG);
          pcRef.current = pc;

          pc.onicecandidate = (e) => {
            if (e.candidate) {
              sendRtcSignal('rtc:ice', e.candidate);
            }
          };

          pc.ontrack = (e) => {
            const [stream] = e.streams;
            if (stream) {
              remoteStreamRef.current = stream;
              setHasRemoteVideo(true);
              attachStream(stream);
            }
          };

          await pc.setRemoteDescription(
            new RTCSessionDescription(msg.payload as RTCSessionDescriptionInit)
          );
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendRtcSignal('rtc:answer', answer);
        } else if (msg.type === 'rtc:answer' && msg.payload && pcRef.current) {
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(msg.payload as RTCSessionDescriptionInit)
          );
        } else if (msg.type === 'rtc:ice' && msg.payload && pcRef.current) {
          await pcRef.current.addIceCandidate(
            new RTCIceCandidate(msg.payload as RTCIceCandidateInit)
          );
        } else if (msg.type === 'rtc:camera-off') {
          cleanupPeer();
          attachStream(localStreamRef.current);
        }
      } catch {
        // Ignore transient WebRTC negotiation mismatch
      }
    });

    return () => {
      unsubscribe();
    };
  }, [
    attachStream,
    cleanupPeer,
    connected,
    role,
    roomCode,
    sendRtcSignal,
    startOfferAsStudent,
    subscribeRtcSignal,
  ]);

  // Cleanup camera tracks on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, []);

  // Re-attach stream when video element mounts/re-opens
  useEffect(() => {
    if (!isOpen) return;
    const activeStream = localCameraOn
      ? localStreamRef.current
      : remoteStreamRef.current;
    if (activeStream) {
      attachStream(activeStream);
    }
  }, [isOpen, localCameraOn, hasRemoteVideo, attachStream]);

  const showingVideo = localCameraOn || hasRemoteVideo;

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="manga-btn-primary inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer"
        >
          <Video className="w-4 h-4" aria-hidden="true" />
          Visage de l’élève
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Emplacement vidéo de l'élève"
      className={`flex flex-col fixed bottom-4 right-4 z-40 manga-panel overflow-hidden transition-all max-w-[calc(100vw-2rem)] ${
        isExpanded ? 'w-96' : 'w-72'
      }`}
    >
      {/* Compact Header */}
      <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Video className="w-3.5 h-3.5 text-indigo-700 shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold text-slate-900 truncate">
            Visage de l’élève (Visio)
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            aria-label={isExpanded ? 'Réduire la taille' : 'Agrandir le cadre'}
            title={isExpanded ? 'Réduire la taille' : 'Agrandir le cadre'}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 cursor-pointer"
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Replier l'emplacement vidéo"
            title="Replier"
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 16:9 Video Stage */}
      <div className="relative aspect-video bg-slate-100 flex items-center justify-center p-3">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover rounded-lg ${
            showingVideo ? 'block' : 'hidden'
          }`}
        />

        {!showingVideo && (
          <div className="w-full h-full rounded-lg border border-dashed border-slate-300 bg-white/70 flex flex-col items-center justify-center text-center p-3 space-y-1.5">
            <Video className="w-5 h-5 text-slate-400" aria-hidden="true" />
            <p className="text-xs font-semibold text-slate-700">
              Zone dédiée au visage
            </p>
            <p className="text-[11px] text-slate-500 leading-snug">
              Posez ici la fenêtre vidéo WhatsApp / Zoom, ou activez la caméra en direct.
            </p>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="px-3.5 py-2.5 border-t border-slate-100 bg-white space-y-2">
        {cameraError && (
          <p className="text-[11px] text-rose-700 leading-snug">{cameraError}</p>
        )}

        <div className="flex items-center justify-between gap-2">
          {localCameraOn ? (
            <button
              type="button"
              onClick={stopLocalCamera}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold hover:bg-rose-100 cursor-pointer"
            >
              <VideoOff className="w-3.5 h-3.5" aria-hidden="true" />
              Couper la caméra
            </button>
          ) : (
            <button
              type="button"
              onClick={startLocalCamera}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" aria-hidden="true" />
              {role === 'student'
                ? 'Allumer ma caméra'
                : 'Tester / Aperçu caméra'}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
