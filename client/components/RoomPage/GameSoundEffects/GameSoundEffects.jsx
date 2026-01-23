import { useEffect, useRef } from 'react';

const GameSoundEffects = ({
    gamePhase,
    timeLeft,
    gameStarted
}) => {
    const gameStartAudioRef = useRef(null);
    const roundEndAudioRef = useRef(null);
    const gameEndAudioRef = useRef(null);
    const timerUrgentAudioRef = useRef(null);
    const turnEndAudioRef = useRef(null);
    const hasPlayedUrgentRef = useRef(false);
    const prevGamePhaseRef = useRef(null);
    const prevGameStartedRef = useRef(false);

    // Initialize audio objects once
    useEffect(() => {
        gameStartAudioRef.current = new Audio('/sounds/game-start.mp3');
        roundEndAudioRef.current = new Audio('/sounds/round-end.wav');
        gameEndAudioRef.current = new Audio('/sounds/game-end.wav');
        timerUrgentAudioRef.current = new Audio('/sounds/timer-urgent.mp3');
        turnEndAudioRef.current = new Audio('/sounds/round-end.wav');

        // Set volume levels
        if (gameStartAudioRef.current) gameStartAudioRef.current.volume = 0.5;
        if (roundEndAudioRef.current) roundEndAudioRef.current.volume = 0.5;
        if (gameEndAudioRef.current) gameEndAudioRef.current.volume = 0.5;
        if (timerUrgentAudioRef.current) timerUrgentAudioRef.current.volume = 0.5;
        if (turnEndAudioRef.current) turnEndAudioRef.current.volume = 0.5;

        // Cleanup
        return () => {
            const audios = [
                gameStartAudioRef.current,
                roundEndAudioRef.current,
                gameEndAudioRef.current,
                timerUrgentAudioRef.current,
                turnEndAudioRef.current
            ];

            audios.forEach(audio => {
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
        };
    }, []);

    // Play sound helper
    const playSound = (audioRef) => {
        if (audioRef && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => {
                console.log('Audio play failed:', err);
            });
        }
    };

    // Game start sound
    useEffect(() => {
        if (gameStarted && !prevGameStartedRef.current && gamePhase === 'starting') {
            playSound(gameStartAudioRef);
        }
        prevGameStartedRef.current = gameStarted;
    }, [gameStarted, gamePhase]);

    // Turn end sound
    useEffect(() => {
        if (gamePhase === 'turn-end' && prevGamePhaseRef.current !== 'turn-end') {
            playSound(turnEndAudioRef);
        }
    }, [gamePhase]);

    // Round end sound
    useEffect(() => {
        if (gamePhase === 'round-end' && prevGamePhaseRef.current !== 'round-end') {
            playSound(roundEndAudioRef);
        }
        prevGamePhaseRef.current = gamePhase;
    }, [gamePhase]);

    // Game end sound
    useEffect(() => {
        if (gamePhase === 'game-end') {
            playSound(gameEndAudioRef);
        }
    }, [gamePhase]);

    // Timer urgent sound (last 10 seconds)
    useEffect(() => {
        if (gamePhase === 'drawing') {
            if (timeLeft === 10 && !hasPlayedUrgentRef.current) {
                playSound(timerUrgentAudioRef);
                hasPlayedUrgentRef.current = true;
            } else if (timeLeft > 10) {
                hasPlayedUrgentRef.current = false;
            }
        } else {
            hasPlayedUrgentRef.current = false;
        }
    }, [timeLeft, gamePhase]);

    return null;
};

export default GameSoundEffects;