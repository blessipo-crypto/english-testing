import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  ChevronDown,
  User,
  Radio,
} from 'lucide-react';
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
  studentName?: string;
  studentCount?: number;
  sendRtcSignal: (type: string, payload?: unknown) => void;
  subscribeRtcSignal: (listener: (msg: RtcSignal) => void) => () => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function StudentVideoSlot({
  roomCode,
  connected,
  role,
  studentName,
  studentCount = 1,
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

  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remotePeerIdRef = useRef<string | null>(null);

  const attachRemoteStream = useCallback((stream: MediaStream | null) => {
    const el = remoteVideoRef.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) {
      el.play().catch(() => {});
    }
  }, []);

  const attachLocalStream = useCallback((stream: MediaStream | null) => {
    const el = localVideoRef.current;
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
    remotePeerIdRef.current = null;
    setHasRemoteVideo(false);
    attachRemoteStream(null);
  }, [attachRemoteStream]);

  // Symmetrical WebRTC Offer Creator
  const createAndSendOffer = useCallback(async () => {
    if (!roomCode || !connected) return;

    if (!pcRef.current) {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

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
          attachRemoteStream(stream);
        }
      };
    }

    try {
      const pc = pcRef.current;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendRtcSignal('rtc:offer', offer);
    } catch {
      // Ignore transient negotiation errors
    }
  }, [attachRemoteStream, connected, roomCode, sendRtcSignal]);

  const startLocalCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Caméra non disponible dans ce navigateur.');
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch {
        // Fallback to video-only if audio/microphone is blocked
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      localStreamRef.current = stream;
      setLocalCameraOn(true);
      attachLocalStream(stream);

      // Transmit to peer if connected
      if (roomCode && connected) {
        if (pcRef.current) {
          stream.getTracks().forEach((track) => {
            pcRef.current?.addTrack(track, stream);
          });
          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          sendRtcSignal('rtc:offer', offer);
        } else {
          await createAndSendOffer();
        }
      }
    } catch {
      setCameraError(
        'Accès caméra refusé. Vérifiez les autorisations de votre navigateur.'
      );
    }
  };

  const stopLocalCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalCameraOn(false);
    attachLocalStream(null);

    if (roomCode && connected) {
      sendRtcSignal('rtc:camera-off');
    }
  }, [attachLocalStream, connected, roomCode, sendRtcSignal]);

  // WebRTC signaling listener
  useEffect(() => {
    if (!roomCode || !connected) return;

    // Ask peer to share their offer if already active
    sendRtcSignal('rtc:request-offer');

    const unsubscribe = subscribeRtcSignal(async (msg) => {
      try {
        if (msg.type === 'rtc:request-offer') {
          if (localStreamRef.current) {
            await createAndSendOffer();
          }
        } else if (msg.type === 'rtc:offer' && msg.payload) {
          remotePeerIdRef.current = msg.fromId || null;

          if (pcRef.current) {
            pcRef.current.close();
          }

          const pc = new RTCPeerConnection(RTC_CONFIG);
          pcRef.current = pc;

          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
              pc.addTrack(track, localStreamRef.current!);
            });
          }

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
              attachRemoteStream(stream);
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
          if (
            !remotePeerIdRef.current ||
            !msg.fromId ||
            remotePeerIdRef.current === msg.fromId
          ) {
            await pcRef.current.addIceCandidate(
              new RTCIceCandidate(msg.payload as RTCIceCandidateInit)
            );
          }
        } else if (msg.type === 'rtc:camera-off') {
          if (
            !remotePeerIdRef.current ||
            !msg.fromId ||
            remotePeerIdRef.current === msg.fromId
          ) {
            remoteStreamRef.current = null;
            setHasRemoteVideo(false);
            attachRemoteStream(null);
          }
        }
      } catch {
        // Ignore negotiation mismatches
      }
    });

    return () => {
      unsubscribe();
    };
  }, [
    attachRemoteStream,
    connected,
    createAndSendOffer,
    roomCode,
    sendRtcSignal,
    subscribeRtcSignal,
  ]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      cleanupPeer();
    };
  }, [cleanupPeer]);

  // Re-attach streams when video DOM elements mount/re-open
  useEffect(() => {
    if (!isOpen) return;
    if (remoteStreamRef.current) {
      attachRemoteStream(remoteStreamRef.current);
    }
    if (localStreamRef.current) {
      attachLocalStream(localStreamRef.current);
    }
  }, [isOpen, attachRemoteStream, attachLocalStream]);

  // Titles & Labels
  const targetName = studentName?.trim() || 'Élève';
  const headerTitle =
    role === 'tutor' ? `Visage de ${targetName}` : 'Visage du Professeur';

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="manga-btn-primary inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-xl"
        >
          <Video className="w-4 h-4" aria-hidden="true" />
          <span>{headerTitle} (Visio)</span>
          {hasRemoteVideo && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Emplacement vidéo interactif"
      className={`flex flex-col fixed bottom-4 right-4 z-40 manga-panel overflow-hidden transition-all shadow-2xl max-w-[calc(100vw-2rem)] ${
        isExpanded ? 'w-96' : 'w-72'
      }`}
    >
      {/* Header */}
      <div className="px-3.5 py-2 sb-surface border-b sb-divider flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Video className="w-3.5 h-3.5 sb-text-accent shrink-0" aria-hidden="true" />
          <span className="text-xs font-bold tracking-wide sb-text-primary truncate">
            {headerTitle}
          </span>
          {hasRemoteVideo ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          ) : connected ? (
            <span className="text-[10px] sb-text-muted">En attente</span>
          ) : null}
          {studentCount > 1 && role === 'tutor' && (
            <span className="px-1.5 py-0.5 rounded-md border sb-reward-pill text-[10px] font-bold tabular-nums shrink-0">
              {studentCount} élèves
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            aria-label={isExpanded ? 'Réduire la taille' : 'Agrandir le cadre'}
            title={isExpanded ? 'Réduire la taille' : 'Agrandir le cadre'}
            className="p-1 rounded-lg sb-text-muted hover:sb-text-accent cursor-pointer"
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
            className="p-1 rounded-lg sb-text-muted hover:sb-text-accent cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 16:9 Video Stage */}
      <div className="relative aspect-video sb-surface flex items-center justify-center p-2.5 overflow-hidden">
        {/* Main Stage: ALWAYS Displays the Remote Participant */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover rounded-xl ${
            hasRemoteVideo ? 'block' : 'hidden'
          }`}
        />

        {/* Remote Live Indicator Badge */}
        {hasRemoteVideo && (
          <div className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 text-white text-[10px] font-bold">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>{role === 'tutor' ? targetName : 'Professeur'}</span>
          </div>
        )}

        {/* When Remote Video is NOT active: Waiting Placeholder */}
        {!hasRemoteVideo && (
          <div className="w-full h-full rounded-xl border border-dashed sb-divider manga-panel-sm flex flex-col items-center justify-center text-center p-3 space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
              <User className="w-4 h-4" aria-hidden="true" />
            </div>
            <p className="text-xs font-bold tracking-wide sb-text-primary">
              {role === 'tutor'
                ? `Zone réservée au visage de ${targetName}`
                : 'Zone vidéo du Professeur'}
            </p>
            <p className="text-[11px] sb-text-muted leading-tight">
              {connected
                ? role === 'tutor'
                  ? "En attente que l'élève allume sa caméra..."
                  : 'En attente de la caméra du professeur...'
                : 'Connectez-vous à la salle pour activer la visio live.'}
            </p>
          </div>
        )}

        {/* Picture-in-Picture: The User's Own Camera (Prof or Élève) */}
        {localCameraOn && (
          <div className="absolute bottom-3 right-3 z-30 w-24 h-16 sm:w-28 sm:h-18 rounded-lg overflow-hidden border-2 border-cyan-400 shadow-xl bg-slate-900">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0.5 left-0.5 right-0.5 px-1 py-0.5 rounded bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold flex items-center justify-between">
              <span className="truncate">
                Moi ({role === 'tutor' ? 'Prof' : targetName})
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="px-3.5 py-2.5 border-t sb-divider space-y-2">
        {cameraError && (
          <p className="text-[11px] sb-text-danger leading-snug">{cameraError}</p>
        )}

        <div className="flex items-center justify-between gap-2">
          {localCameraOn ? (
            <button
              type="button"
              onClick={stopLocalCamera}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border sb-status-danger text-xs font-bold hover:opacity-90 cursor-pointer transition-colors"
            >
              <VideoOff className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                Couper ma caméra ({role === 'tutor' ? 'Prof' : 'Élève'})
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startLocalCamera}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-b-2 sb-card-option sb-text-accent text-xs font-bold cursor-pointer hover:sb-card-option-active transition-colors"
            >
              <Video className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {role === 'tutor'
                  ? 'Allumer ma caméra (Prof)'
                  : 'Allumer ma caméra (Élève)'}
              </span>
            </button>
          )}
        </div>

        {/* Helpful tip */}
        <p className="text-[10px] sb-text-muted text-center leading-tight">
          {role === 'tutor'
            ? 'Votre caméra s’affiche en vignette pour vous et en direct pour l’élève.'
            : 'Votre vidéo est transmise en direct au professeur.'}
        </p>
      </div>
    </aside>
  );
}
