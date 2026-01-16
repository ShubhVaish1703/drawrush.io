'use client'
import { initSocket } from "@/socket/socket";
import { useRef, useState, useEffect } from "react";

const TOOLS = {
    PEN: "pen",
    ERASER: "eraser",
};

// Fixed canvas dimensions for consistency across all devices
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;

const DrawingBoard = ({ roomId }) => {
    const socket = initSocket();
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const ctxRef = useRef(null);
    const [tool, setTool] = useState(TOOLS.PEN);
    const [color, setColor] = useState("#000000");
    const [size, setSize] = useState(5);
    const [isDrawing, setIsDrawing] = useState(false);
    const [start, setStart] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);

    const colorPalette = [
        "#000000", "#FFFFFF", "#FF0000", "#00FF00",
        "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"
    ];

    // Initialize canvas with fixed dimensions
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set fixed canvas dimensions
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        const ctx = canvas.getContext("2d");
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctxRef.current = ctx;

        // Calculate scale to fit container
        updateScale();
        window.addEventListener('resize', updateScale);

        return () => {
            window.removeEventListener('resize', updateScale);
        };
    }, []);

    // Update scale based on container size
    const updateScale = () => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate scale to fit while maintaining aspect ratio
        const scaleX = containerWidth / CANVAS_WIDTH;
        const scaleY = containerHeight / CANVAS_HEIGHT;
        const newScale = Math.min(scaleX, scaleY, 1); // Never scale up, only down

        setScale(newScale);
    };

    // Socket listeners for drawing
    useEffect(() => {
        if (!socket) return;

        const handleDraw = (data) => {
            drawStroke(data);
        };

        const handleClear = () => {
            clearCanvas();
        };

        const handleLoadDrawing = (drawHistory) => {
            clearCanvas();
            if (drawHistory && drawHistory.length > 0) {
                drawHistory.forEach(data => drawStroke(data));
            }
        };

        socket.on("draw", handleDraw);
        socket.on("clear-canvas", handleClear);
        socket.on("load-drawing", handleLoadDrawing);

        // Request drawing history when component mounts
        socket.emit("fetch-drawing", { roomId });

        return () => {
            socket.off("draw", handleDraw);
            socket.off("clear-canvas", handleClear);
            socket.off("load-drawing", handleLoadDrawing);
        };
    }, [socket, roomId]);

    const drawStroke = (data) => {
        const ctx = ctxRef.current;
        if (!ctx) return;

        if (data.tool === TOOLS.ERASER) {
            ctx.globalCompositeOperation = "destination-out";
            ctx.strokeStyle = "rgba(0,0,0,1)";
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = data.color;
        }

        ctx.lineWidth = data.size;

        ctx.beginPath();
        ctx.moveTo(data.startX, data.startY);
        ctx.lineTo(data.endX, data.endY);
        ctx.stroke();
        ctx.closePath();

        ctx.globalCompositeOperation = "source-over";
    };

    const getCoords = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const event = e.touches ? e.touches[0] : e;

        // Convert screen coordinates to canvas coordinates accounting for scale
        const x = (event.clientX - rect.left) / scale;
        const y = (event.clientY - rect.top) / scale;

        return { x, y };
    };

    const startDrawing = (e) => {
        // e.preventDefault();
        const { x, y } = getCoords(e);
        setStart({ x, y });
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        // e.preventDefault();

        const { x, y } = getCoords(e);

        const drawData = {
            tool,
            startX: start.x,
            startY: start.y,
            endX: x,
            endY: y,
            color,
            size,
            roomCode: roomId,
        };

        drawStroke(drawData);
        socket.emit("draw", drawData);

        setStart({ x, y });
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleClear = () => {
        clearCanvas();
        socket.emit("clear-canvas", { roomCode: roomId });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Drawing Tools */}
            <div className="p-3 border-b border-white/20 bg-slate-900/50 shrink-0">
                <div className="flex flex-wrap gap-y-3 items-center justify-between">
                    {/* Tool Buttons */}
                    <div className="flex gap-2 items-start">
                        <button
                            onClick={() => setTool(TOOLS.PEN)}
                            className={`px-1.5 py-1 md:px-3 md:py-2 text-sm tracking-wide cursor-pointer rounded-lg font-semibold transition ${tool === TOOLS.PEN
                                ? "bg-blue-500 text-white"
                                : "bg-slate-700 text-white hover:bg-slate-600"
                                }`}
                        >
                            ✏️ Pen
                        </button>
                        <button
                            onClick={() => setTool(TOOLS.ERASER)}
                            className={`px-1.5 py-1 md:px-3 md:py-2 text-sm tracking-wide cursor-pointer rounded-lg font-semibold transition ${tool === TOOLS.ERASER
                                ? "bg-blue-500 text-white"
                                : "bg-slate-700 text-white hover:bg-slate-600"
                                }`}
                        >
                            🧹 Eraser
                        </button>
                    </div>

                    {/* Color Palette */}
                    <div className="flex gap-2 items-center flex-wrap">
                        {colorPalette.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`h-6 w-6 md:w-7 md:h-7 rounded-full border-2 transition ${color === c ? "border-white scale-110" : "border-gray-500 cursor-pointer"
                                    }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-7 h-7 rounded-full cursor-pointer"
                        />
                    </div>

                    {/* Size Control */}
                    <div className="flex gap-2 items-center text-white">
                        <span className="text-sm tracking-wide font-medium">Size </span>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={size}
                            onChange={(e) => setSize(Number(e.target.value))}
                            className="w-20"
                        />
                        <span className="text-sm w-10">{size}px</span>
                    </div>

                    {/* Clear Button */}
                    <button
                        onClick={handleClear}
                        className="px-1.5 py-1 md:px-3 md:py-2 cursor-pointer rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition font-semibold"
                    >
                        🗑️ Clear
                    </button>
                </div>
            </div>

            {/* Canvas Container */}
            <div
                ref={containerRef}
                className="flex-1 p-2 flex items-center justify-center bg-gray-100 min-h-0 overflow-hidden"
            >
                <canvas
                    ref={canvasRef}
                    className="bg-white border-2 border-gray-300 rounded-lg shadow-lg cursor-crosshair"
                    style={{
                        width: `${CANVAS_WIDTH * scale}px`,
                        height: `${CANVAS_HEIGHT * scale}px`,
                        maxWidth: '100%',
                        maxHeight: '100%',
                        touchAction: 'none',
                    }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
        </div>
    );
};

export default DrawingBoard;