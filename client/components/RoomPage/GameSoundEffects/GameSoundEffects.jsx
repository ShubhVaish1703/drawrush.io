import { useEffect, useRef } from 'react';

const GameSoundEffects = ({ gamePhase, timeLeft }) => {
    const audiosRef = useRef({});
    const prevPhaseRef = useRef(null);
    const urgentPlayedRef = useRef(false);

    // 🔊 Initialize audio ONCE
    useEffect(() => {
        audiosRef.current = {
            gameStart: new Audio('/sounds/game-start.mp3'),
            turnEnd: new Audio('/sounds/round-end.wav'),
            roundEnd: new Audio('/sounds/round-end.wav'),
            gameEnd: new Audio('/sounds/game-end.wav'),
            urgent: new Audio('/sounds/timer-urgent.mp3'),
        };

        Object.values(audiosRef.current).forEach(audio => {
            audio.volume = 0.5;
            audio.preload = 'auto';
        });

        return () => {
            Object.values(audiosRef.current).forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
            });
        };
    }, []);

    const stopAllSounds = () => {
        Object.values(audiosRef.current).forEach(audio => {
            if (!audio) return;
            audio.pause();
            audio.currentTime = 0;
        });
    };

    const play = (key) => {
        const audio = audiosRef.current[key];
        if (!audio) return;

        stopAllSounds();
        audio.currentTime = 0;
        audio.play().catch(() => { });
    };

    // 🎮 PHASE-BASED SOUNDS
    useEffect(() => {
        if (gamePhase !== prevPhaseRef.current) {
            switch (gamePhase) {
                case 'starting':
                    play('gameStart');
                    break;
                case 'turn-end':
                    play('turnEnd');
                    break;
                case 'round-end':
                    play('roundEnd');
                    break;
                case 'game-end':
                    play('gameEnd');
                    break;
                default:
                    break;
            }
        }
        prevPhaseRef.current = gamePhase;
    }, [gamePhase]);

    // ⏱️ LAST 10 SECONDS WARNING
    useEffect(() => {
        if (gamePhase === 'drawing') {
            if (timeLeft === 10 && !urgentPlayedRef.current) {
                play('urgent');
                urgentPlayedRef.current = true;
            }
            if (timeLeft > 10) {
                urgentPlayedRef.current = false;
            }
        } else {
            urgentPlayedRef.current = false;
        }
    }, [timeLeft, gamePhase]);

    return null;
};

export default GameSoundEffects;
