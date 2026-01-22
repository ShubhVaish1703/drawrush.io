"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { initSocket } from "@/socket/socket";

const VoiceChat = ({ roomCode, playerId, isCurrentPlayerDrawer }) => {
    /* ================= SOCKET (SAFE SINGLETON) ================= */
    const socket = initSocket();

    /* ================= STATE ================= */
    const [isMicOn, setIsMicOn] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [connectedPeers, setConnectedPeers] = useState(0);

    /* ================= REFS ================= */
    const localStreamRef = useRef(null);
    const pcs = useRef(new Map());
    const audios = useRef(new Map());

    // Perfect Negotiation refs (per peer)
    const makingOffer = useRef(new Map());
    const ignoreOffer = useRef(new Map());

    /* ================= ICE ================= */
    const iceConfig = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    };

    /* ================= HELPERS ================= */

    // ✅ Correct polite decision (socket.id vs peer socket.id)
    const isPoliteForPeer = useCallback(
        (peerSocketId) => socket.id < peerSocketId,
        [socket]
    );

    const getPC = useCallback((peerId) => {
        if (pcs.current.has(peerId)) return pcs.current.get(peerId);

        const pc = new RTCPeerConnection(iceConfig);
        pcs.current.set(peerId, pc);

        makingOffer.current.set(peerId, false);
        ignoreOffer.current.set(peerId, false);

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track =>
                pc.addTrack(track, localStreamRef.current)
            );
        }

        pc.ontrack = (e) => {
            let audio = audios.current.get(peerId);
            if (!audio) {
                audio = new Audio();
                audio.autoplay = true;
                audio.playsInline = true;
                audios.current.set(peerId, audio);
            }
            audio.srcObject = e.streams[0];
            audio.volume = isSpeakerOn ? 1 : 0;
        };

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                socket.emit("webrtc-ice-candidate", {
                    targetSocketId: peerId,
                    candidate: e.candidate
                });
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "connected") {
                setConnectedPeers(v => v + 1);
            }
            if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
                setConnectedPeers(v => Math.max(0, v - 1));
            }
        };

        pc.onnegotiationneeded = async () => {
            try {
                makingOffer.current.set(peerId, true);
                await pc.setLocalDescription(await pc.createOffer());
                socket.emit("webrtc-offer", {
                    targetSocketId: peerId,
                    offer: pc.localDescription
                });
            } catch (err) {
                console.error("Negotiation error:", err);
            } finally {
                makingOffer.current.set(peerId, false);
            }
        };

        return pc;
    }, [socket, isSpeakerOn]);

    /* ================= PERFECT NEGOTIATION ================= */

    const onOffer = async ({ offer, senderSocketId }) => {
        const pc = getPC(senderSocketId);

        const offerCollision =
            makingOffer.current.get(senderSocketId) ||
            pc.signalingState !== "stable";

        const politePeer = isPoliteForPeer(senderSocketId);

        ignoreOffer.current.set(
            senderSocketId,
            !politePeer && offerCollision
        );

        if (ignoreOffer.current.get(senderSocketId)) return;

        try {
            if (offerCollision) {
                // ✅ Rollback if polite
                await Promise.all([
                    pc.setLocalDescription({ type: "rollback" }),
                    pc.setRemoteDescription(offer)
                ]);
            } else {
                await pc.setRemoteDescription(offer);
            }

            await pc.setLocalDescription(await pc.createAnswer());

            socket.emit("webrtc-answer", {
                targetSocketId: senderSocketId,
                answer: pc.localDescription
            });
        } catch (err) {
            console.error("Offer handling failed:", err);
        }
    };

    const onAnswer = async ({ answer, senderSocketId }) => {
        const pc = pcs.current.get(senderSocketId);
        if (!pc) return;

        // ✅ Answer guard
        if (pc.signalingState !== "have-local-offer") {
            console.warn("Ignoring answer in state:", pc.signalingState);
            return;
        }

        try {
            await pc.setRemoteDescription(answer);
        } catch (err) {
            console.error("Answer error:", err);
        }
    };

    const onIce = async ({ candidate, senderSocketId }) => {
        const pc = pcs.current.get(senderSocketId);
        if (!pc) return;

        try {
            await pc.addIceCandidate(candidate);
        } catch (err) {
            if (!ignoreOffer.current.get(senderSocketId)) {
                console.error("ICE error:", err);
            }
        }
    };

    /* ================= MEDIA ================= */

    const startMic = async () => {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        socket.emit("join-voice", { roomCode, playerId });
        setIsMicOn(true);
    };

    const stopMic = useCallback(() => {
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;

        pcs.current.forEach(pc => pc.close());
        pcs.current.clear();

        audios.current.forEach(a => {
            a.pause();
            a.srcObject = null;
        });
        audios.current.clear();

        socket.emit("leave-voice", { roomCode, playerId });
        setConnectedPeers(0);
        setIsMicOn(false);
    }, [socket, roomCode, playerId]);

    /* ================= EFFECTS ================= */

    // Drawer → force mic off
    useEffect(() => {
        if (isCurrentPlayerDrawer) stopMic();
    }, [isCurrentPlayerDrawer, stopMic]);

    // Socket wiring
    useEffect(() => {
        socket.on("webrtc-offer", onOffer);
        socket.on("webrtc-answer", onAnswer);
        socket.on("webrtc-ice-candidate", onIce);
        socket.on("voice-users-list", ({ users }) =>
            users.forEach(u => getPC(u.socketId))
        );
        socket.on("voice-user-joined", ({ socketId }) => getPC(socketId));

        return () => {
            socket.off("webrtc-offer", onOffer);
            socket.off("webrtc-answer", onAnswer);
            socket.off("webrtc-ice-candidate", onIce);
            socket.off("voice-users-list");
            socket.off("voice-user-joined");
        };
    }, [socket, getPC]);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopMic();
    }, [stopMic]);

    /* ================= UI ================= */

    return (
        <div className="flex justify-start items-center gap-2">
            {!isCurrentPlayerDrawer && (
                <button
                    className={`p-2 rounded-full transition-all cursor-pointer
                    ${isMicOn
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                        }`}
                    title={isMicOn ? "Turn off microphone" : "Turn on microphone"}
                    onClick={isMicOn ? stopMic : startMic}
                >
                    {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
            )}

            <button
                onClick={() => {
                    setIsSpeakerOn(v => !v);
                    audios.current.forEach(a => (a.volume = isSpeakerOn ? 0 : 1));
                }}
                disabled={!isMicOn}
                className={`p-2 rounded-full transition-all cursor-pointer
                ${isSpeakerOn
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                title={isSpeakerOn ? "Mute all players" : "Unmute all players"}
            >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
        </div>
    );
};

export default VoiceChat;
