import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  ChevronDown,
  User,
  Radio,
  RefreshCw,
  Camera,
} from 'lucide-react';
import type { RoomParticipant, UserRole } from '../types/lesson';

interface RtcSignal {
  type: string;
  fromId?: string;
  fromRole?: UserRole;
  payload?: unknown;
}

interface StudentVideoSlotProps {
  roomCode: string | null;
  connected: boolean;
  selfId: string | null;
  participants: RoomParticipant[];
  role: UserRole;
  studentName?: string;
  studentCount?: number;
  sendRtcSignal: (type: string, payload?: unknown, toId?: string) => void;
  subscribeRtcSignal: (listener: (msg: RtcSignal) => void) => () => void;
}

interface PeerEntry {
  peerId: string;
  pc: RTCPeerConnection;
  remoteStream: MediaStream;
  remoteCameraActive: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  isSettingRemoteAnswerPending: boolean;
  pendingCandidates: RTCIceCandidateInit[];
  iceState: RTCIceConnectionState;
}

interface RemoteFeed {
  peerId: string;
  name: string;
  role: UserRole;
  stream: MediaStream;
  iceState: RTCIceConnectionState;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 4,
};

function VideoElement({
  stream,
  muted = false,
  mirrored = false,
  className = '',
}: {
  stream: MediaStream;
  muted?: boolean;
  mirrored?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
    const attemptPlay = () => {
      el.play().catch(() => {
        // Autoplay with audio may wait for interaction; muted local always plays
      });
    };
    attemptPlay();

    const handleAddTrack = () => attemptPlay();
    stream.addEventListener('addtrack', handleAddTrack);
    return () => {
      stream.removeEventListener('addtrack', handleAddTrack);
    };
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={className}
      style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
    />
  );
}

export function StudentVideoSlot({
  roomCode,
  connected,
  selfId,
  participants,
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
  const [localMicMuted, setLocalMicMuted] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteFeeds, setRemoteFeeds] = useState<RemoteFeed[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isRefreshingConnection, setIsRefreshingConnection] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerEntry>>(new Map());
  const selfIdRef = useRef<string | null>(selfId);
  selfIdRef.current = selfId;

  const participantsRef = useRef<RoomParticipant[]>(participants);
  participantsRef.current = participants;

  const refreshVideoDevices = useCallback(async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.enumerateDevices
    ) {
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(cams);
      setSelectedDeviceId((prev) => {
        if (prev && cams.some((c) => c.deviceId === prev)) return prev;
        return cams[0]?.deviceId || '';
      });
    } catch {
      // Ignore enumerateDevices errors
    }
  }, []);

  useEffect(() => {
    refreshVideoDevices();
    const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
    if (!md?.addEventListener) return;
    md.addEventListener('devicechange', refreshVideoDevices);
    return () => {
      md.removeEventListener('devicechange', refreshVideoDevices);
    };
  }, [refreshVideoDevices]);

  const syncRemoteFeeds = useCallback(() => {
    const nextFeeds: RemoteFeed[] = [];
    for (const [peerId, entry] of peersRef.current.entries()) {
      const hasLiveVideoTrack = entry.remoteStream
        .getVideoTracks()
        .some((t) => t.readyState === 'live' && !t.muted);
      if (entry.remoteCameraActive || hasLiveVideoTrack) {
        const meta = participantsRef.current.find((p) => p.id === peerId);
        nextFeeds.push({
          peerId,
          name: meta?.name || (role === 'tutor' ? studentName?.trim() || 'Élève' : 'Professeur'),
          role: meta?.role || (role === 'tutor' ? 'student' : 'tutor'),
          stream: entry.remoteStream,
          iceState: entry.iceState,
        });
      }
    }
    setRemoteFeeds(nextFeeds);
  }, [role, studentName]);

  const closePeer = useCallback(
    (peerId: string) => {
      const entry = peersRef.current.get(peerId);
      if (!entry) return;
      try {
        entry.pc.onicecandidate = null;
        entry.pc.ontrack = null;
        entry.pc.onnegotiationneeded = null;
        entry.pc.oniceconnectionstatechange = null;
        entry.pc.close();
      } catch {
        // Ignore close error
      }
      peersRef.current.delete(peerId);
      syncRemoteFeeds();
    },
    [syncRemoteFeeds]
  );

  const closeAllPeers = useCallback(() => {
    for (const peerId of Array.from(peersRef.current.keys())) {
      closePeer(peerId);
    }
  }, [closePeer]);

  const attachLocalTracksToPeer = useCallback(
    (pc: RTCPeerConnection, stream: MediaStream) => {
      const senders = pc.getSenders();
      for (const track of stream.getTracks()) {
        const existingSameKindSender = senders.find(
          (s) => s.track?.kind === track.kind
        );
        if (existingSameKindSender) {
          existingSameKindSender.replaceTrack(track).catch(() => {});
          continue;
        }
        const matchingTransceiver = pc
          .getTransceivers()
          .find(
            (t) =>
              t.receiver.track?.kind === track.kind &&
              (!t.sender.track || t.sender.track.readyState === 'ended')
          );
        if (matchingTransceiver) {
          matchingTransceiver.direction = 'sendrecv';
          matchingTransceiver.sender.replaceTrack(track).catch(() => {});
        } else {
          pc.addTrack(track, stream);
        }
      }
    },
    []
  );

  const negotiatePeer = useCallback(
    async (entry: PeerEntry, iceRestart = false) => {
      if (!roomCode || !connected) return;
      const { pc, peerId } = entry;
      if (pc.signalingState !== 'stable' && !iceRestart) return;
      try {
        entry.makingOffer = true;
        const offer = await pc.createOffer(iceRestart ? { iceRestart: true } : undefined);
        if (pc.signalingState !== 'stable' && !iceRestart) return;
        await pc.setLocalDescription(offer);
        sendRtcSignal('rtc:offer', pc.localDescription, peerId);
      } catch {
        // Ignore transient negotiation errors
      } finally {
        entry.makingOffer = false;
      }
    },
    [connected, roomCode, sendRtcSignal]
  );

  const getOrCreatePeer = useCallback(
    (peerId: string): PeerEntry => {
      const existing = peersRef.current.get(peerId);
      if (existing && existing.pc.signalingState !== 'closed') {
        return existing;
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      const remoteStream = new MediaStream();
      const entry: PeerEntry = {
        peerId,
        pc,
        remoteStream,
        remoteCameraActive: false,
        makingOffer: false,
        ignoreOffer: false,
        isSettingRemoteAnswerPending: false,
        pendingCandidates: [],
        iceState: pc.iceConnectionState,
      };
      peersRef.current.set(peerId, entry);

      if (localStreamRef.current) {
        attachLocalTracksToPeer(pc, localStreamRef.current);
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendRtcSignal('rtc:ice', event.candidate.toJSON(), peerId);
        }
      };

      pc.oniceconnectionstatechange = () => {
        entry.iceState = pc.iceConnectionState;
        if (pc.iceConnectionState === 'failed') {
          negotiatePeer(entry, true);
        } else if (
          pc.iceConnectionState === 'disconnected' ||
          pc.iceConnectionState === 'closed'
        ) {
          syncRemoteFeeds();
        } else if (
          pc.iceConnectionState === 'connected' ||
          pc.iceConnectionState === 'completed'
        ) {
          syncRemoteFeeds();
        }
      };

      pc.onnegotiationneeded = async () => {
        if (!localStreamRef.current) return;
        await negotiatePeer(entry);
      };

      pc.ontrack = (event) => {
        const track = event.track;
        const incomingStream = event.streams?.[0];
        if (incomingStream) {
          for (const t of incomingStream.getTracks()) {
            if (!entry.remoteStream.getTracks().some((x) => x.id === t.id)) {
              entry.remoteStream.addTrack(t);
            }
          }
        } else if (!entry.remoteStream.getTracks().some((x) => x.id === track.id)) {
          entry.remoteStream.addTrack(track);
        }

        if (track.kind === 'video') {
          entry.remoteCameraActive = true;
        }
        track.onunmute = () => {
          if (track.kind === 'video') entry.remoteCameraActive = true;
          syncRemoteFeeds();
        };
        track.onended = () => {
          if (track.kind === 'video') {
            entry.remoteStream.removeTrack(track);
            entry.remoteCameraActive = entry.remoteStream
              .getVideoTracks()
              .some((t) => t.readyState === 'live');
          }
          syncRemoteFeeds();
        };
        syncRemoteFeeds();
      };

      return entry;
    },
    [attachLocalTracksToPeer, negotiatePeer, sendRtcSignal, syncRemoteFeeds]
  );

  // Sync PeerConnections with current room participants
  const otherParticipants = useMemo(() => {
    if (!selfId) return [];
    return participants.filter((p) => p.id !== selfId);
  }, [participants, selfId]);

  useEffect(() => {
    if (!roomCode || !connected || !selfId) {
      closeAllPeers();
      return;
    }

    const activeIds = new Set(otherParticipants.map((p) => p.id));

    // Remove peers that left the room
    for (const existingId of Array.from(peersRef.current.keys())) {
      if (!activeIds.has(existingId)) {
        closePeer(existingId);
      }
    }

    // Create / initiate connection with any newly joined participants if our camera is active
    for (const peer of otherParticipants) {
      const existing = peersRef.current.get(peer.id);
      if (!existing) {
        const entry = getOrCreatePeer(peer.id);
        if (localStreamRef.current) {
          negotiatePeer(entry);
        } else {
          sendRtcSignal('rtc:request-offer', undefined, peer.id);
        }
      }
    }
  }, [
    closeAllPeers,
    closePeer,
    connected,
    getOrCreatePeer,
    negotiatePeer,
    otherParticipants,
    roomCode,
    selfId,
    sendRtcSignal,
  ]);

  // WebRTC signaling listener (Perfect Negotiation pattern)
  useEffect(() => {
    if (!roomCode || !connected) return;

    // Ask any already-connected peers to send an offer if their camera is on
    sendRtcSignal('rtc:request-offer');

    const unsubscribe = subscribeRtcSignal(async (msg) => {
      const peerId = msg.fromId;
      if (!peerId || (selfIdRef.current && peerId === selfIdRef.current)) {
        return;
      }

      try {
        if (msg.type === 'rtc:request-offer') {
          if (localStreamRef.current) {
            const entry = getOrCreatePeer(peerId);
            attachLocalTracksToPeer(entry.pc, localStreamRef.current);
            await negotiatePeer(entry, true);
          }
          return;
        }

        if (msg.type === 'rtc:camera-off') {
          const entry = peersRef.current.get(peerId);
          if (entry) {
            entry.remoteCameraActive = false;
            for (const vt of entry.remoteStream.getVideoTracks()) {
              entry.remoteStream.removeTrack(vt);
            }
            syncRemoteFeeds();
          }
          return;
        }

        if (msg.type === 'rtc:camera-on') {
          const entry = peersRef.current.get(peerId);
          if (entry) {
            entry.remoteCameraActive = true;
            syncRemoteFeeds();
          }
          return;
        }

        if (msg.type === 'rtc:offer' && msg.payload) {
          const entry = getOrCreatePeer(peerId);
          const { pc } = entry;
          const description = msg.payload as RTCSessionDescriptionInit;

          const myId = selfIdRef.current || '';
          const polite = myId < peerId;
          const readyForOffer =
            !entry.makingOffer &&
            (pc.signalingState === 'stable' || entry.isSettingRemoteAnswerPending);
          const offerCollision = !readyForOffer;

          entry.ignoreOffer = !polite && offerCollision;
          if (entry.ignoreOffer) {
            return;
          }

          await pc.setRemoteDescription(new RTCSessionDescription(description));

          // Flush queued ICE candidates now that remoteDescription is set
          while (entry.pendingCandidates.length > 0) {
            const cand = entry.pendingCandidates.shift();
            if (cand) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
          }

          if (localStreamRef.current) {
            attachLocalTracksToPeer(pc, localStreamRef.current);
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendRtcSignal('rtc:answer', pc.localDescription, peerId);
          return;
        }

        if (msg.type === 'rtc:answer' && msg.payload) {
          const entry = peersRef.current.get(peerId);
          if (!entry) return;
          const { pc } = entry;
          if (pc.signalingState === 'have-local-offer') {
            entry.isSettingRemoteAnswerPending = true;
            try {
              await pc.setRemoteDescription(
                new RTCSessionDescription(msg.payload as RTCSessionDescriptionInit)
              );
              while (entry.pendingCandidates.length > 0) {
                const cand = entry.pendingCandidates.shift();
                if (cand) {
                  await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
                }
              }
            } finally {
              entry.isSettingRemoteAnswerPending = false;
            }
          }
          return;
        }

        if (msg.type === 'rtc:ice' && msg.payload) {
          const entry = getOrCreatePeer(peerId);
          const candidateInit = msg.payload as RTCIceCandidateInit;
          if (!entry.pc.remoteDescription) {
            entry.pendingCandidates.push(candidateInit);
          } else {
            try {
              await entry.pc.addIceCandidate(new RTCIceCandidate(candidateInit));
            } catch {
              if (!entry.ignoreOffer) {
                // Ignore stale ICE candidates during renegotiation
              }
            }
          }
        }
      } catch {
        // Ignore transient signaling mismatches
      }
    });

    return () => {
      unsubscribe();
    };
  }, [
    attachLocalTracksToPeer,
    connected,
    getOrCreatePeer,
    negotiatePeer,
    roomCode,
    sendRtcSignal,
    subscribeRtcSignal,
    syncRemoteFeeds,
  ]);

  const stopLocalCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setLocalCameraOn(false);
    setLocalMicMuted(false);

    for (const entry of peersRef.current.values()) {
      for (const sender of entry.pc.getSenders()) {
        if (sender.track) {
          sender.replaceTrack(null).catch(() => {});
        }
      }
    }

    if (roomCode && connected) {
      sendRtcSignal('rtc:camera-off');
    }
  }, [connected, roomCode, sendRtcSignal]);

  const startLocalCamera = async (overrideDeviceId?: string) => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Caméra non disponible dans ce navigateur.');
      return;
    }

    const targetDeviceId = overrideDeviceId ?? selectedDeviceId;

    const videoConstraints: MediaTrackConstraints = targetDeviceId
      ? { deviceId: { exact: targetDeviceId }, width: { ideal: 640 }, height: { ideal: 360 } }
      : { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: 'user' };

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch {
        try {
          // Fallback without strict deviceId/resolution constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch {
          // Fallback to video-only if microphone is blocked or absent
          stream = await navigator.mediaDevices.getUserMedia({
            video: targetDeviceId ? { deviceId: { ideal: targetDeviceId } } : true,
            audio: false,
          });
        }
      }

      // Stop previous tracks if switching camera
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setLocalCameraOn(true);
      setLocalMicMuted(false);

      // Update device list now that permissions are granted (labels become visible)
      await refreshVideoDevices();
      const activeVideoTrack = stream.getVideoTracks()[0];
      const activeDeviceId = activeVideoTrack?.getSettings()?.deviceId;
      if (activeDeviceId) {
        setSelectedDeviceId(activeDeviceId);
      }

      // Push local tracks to all active peers & negotiate
      if (roomCode && connected) {
        for (const peer of otherParticipants) {
          const entry = getOrCreatePeer(peer.id);
          attachLocalTracksToPeer(entry.pc, stream);
          await negotiatePeer(entry);
        }
        sendRtcSignal('rtc:camera-on');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (/NotFoundError|DevicesNotFound/i.test(msg)) {
        setCameraError('Aucune webcam détectée sur cet appareil.');
      } else if (/NotReadableError|TrackStartError/i.test(msg)) {
        setCameraError('Caméra déjà utilisée par une autre application (Zoom/Teams...).');
      } else {
        setCameraError('Accès caméra refusé. Vérifiez les autorisations système.');
      }
    }
  };

  const handleToggleMute = () => {
    if (!localStreamRef.current) return;
    const nextMuted = !localMicMuted;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !nextMuted;
    });
    setLocalMicMuted(nextMuted);
  };

  const handleSwitchCamera = async (nextDeviceId: string) => {
    setSelectedDeviceId(nextDeviceId);
    if (localCameraOn) {
      await startLocalCamera(nextDeviceId);
    }
  };

  const handleRefreshVideoConnection = async () => {
    if (!roomCode || !connected) return;
    setIsRefreshingConnection(true);
    closeAllPeers();
    for (const peer of otherParticipants) {
      const entry = getOrCreatePeer(peer.id);
      if (localStreamRef.current) {
        await negotiatePeer(entry, true);
      } else {
        sendRtcSignal('rtc:request-offer', undefined, peer.id);
      }
    }
    if (!otherParticipants.length) {
      sendRtcSignal('rtc:request-offer');
    }
    window.setTimeout(() => setIsRefreshingConnection(false), 1000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      closeAllPeers();
    };
  }, [closeAllPeers]);

  const targetName = studentName?.trim() || 'Élève';
  const headerTitle =
    role === 'tutor' ? `Visage de ${targetName}` : 'Visage du Professeur';
  const hasRemoteVideo = remoteFeeds.length > 0;

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
        isExpanded ? 'w-[26rem]' : 'w-80'
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
          {roomCode && connected && (
            <button
              type="button"
              onClick={handleRefreshVideoConnection}
              aria-label="Relancer la connexion vidéo"
              title="Relancer la connexion vidéo"
              className="p-1 rounded-lg sb-text-muted hover:sb-text-accent cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshingConnection ? 'animate-spin sb-text-accent' : ''}`}
              />
            </button>
          )}
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
        {hasRemoteVideo ? (
          <div
            className={`w-full h-full grid gap-1.5 ${
              remoteFeeds.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {remoteFeeds.map((feed) => (
              <div
                key={feed.peerId}
                className="relative w-full h-full rounded-xl overflow-hidden bg-slate-950"
              >
                <VideoElement
                  stream={feed.stream}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 z-20 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 text-white text-[10px] font-bold">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>{feed.name}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
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
                ? otherParticipants.length === 0
                  ? 'En attente de connexion du participant dans la salle...'
                  : role === 'tutor'
                    ? "Participant connecté — en attente de sa caméra..."
                    : 'Professeur connecté — en attente de sa caméra...'
                : 'Connectez-vous à la salle pour activer la visio live.'}
            </p>
          </div>
        )}

        {/* Picture-in-Picture: The User's Own Camera (Prof or Élève) */}
        {localCameraOn && localStream && (
          <div className="absolute bottom-3 right-3 z-30 w-24 h-16 sm:w-28 sm:h-[4.5rem] rounded-lg overflow-hidden border-2 border-cyan-400 shadow-xl bg-slate-900">
            <VideoElement
              stream={localStream}
              muted
              mirrored
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

        {/* Camera selector when multiple webcams are available */}
        {videoDevices.length > 1 && (
          <div className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 sb-text-muted shrink-0" aria-hidden="true" />
            <select
              aria-label="Choisir une caméra"
              value={selectedDeviceId}
              onChange={(e) => handleSwitchCamera(e.target.value)}
              className="flex-1 rounded-lg border sb-input px-2 py-1 text-[11px] truncate cursor-pointer"
            >
              {videoDevices.map((dev, idx) => (
                <option key={dev.deviceId || idx} value={dev.deviceId}>
                  {dev.label || `Caméra ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {localCameraOn ? (
            <>
              <button
                type="button"
                onClick={stopLocalCamera}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border sb-status-danger text-xs font-bold hover:opacity-90 cursor-pointer transition-colors"
              >
                <VideoOff className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Couper caméra</span>
              </button>
              <button
                type="button"
                onClick={handleToggleMute}
                aria-label={localMicMuted ? 'Réactiver mon micro' : 'Couper mon micro'}
                title={localMicMuted ? 'Réactiver mon micro' : 'Couper mon micro'}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                  localMicMuted ? 'sb-status-danger' : 'sb-chip-idle'
                }`}
              >
                {localMicMuted ? (
                  <MicOff className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => startLocalCamera()}
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
