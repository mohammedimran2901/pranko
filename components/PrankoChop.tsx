"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Gamepad2 } from "lucide-react";

export function PrankoChop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const scoreRef = useRef(0);
  const animRef = useRef<number>(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cleanup previous game
    if (cleanupRef.current) cleanupRef.current();
    cancelAnimationFrame(animRef.current);

    canvas.width = 320;
    canvas.height = 400;

    let player = { x: 60, y: 300, vy: 0, w: 30, h: 40, grounded: true };
    let obstacles: { x: number; y: number; w: number; h: number }[] = [];
    let frame = 0;
    let speed = 4;
    let isGameOver = false;
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    setStarted(true);

    function jump() {
      if (player.grounded) {
        player.vy = -12;
        player.grounded = false;
      }
    }

    function loop() {
      if (!ctx || !canvas || isGameOver) return;
      frame++;
      speed = 4 + Math.floor(frame / 300) * 0.5;

      // Physics
      player.vy += 0.6;
      player.y += player.vy;
      if (player.y >= 300) {
        player.y = 300;
        player.vy = 0;
        player.grounded = true;
      }

      // Spawn obstacles
      if (frame % 70 === 0 || (obstacles.length === 0 && frame > 20)) {
        const h = 25 + Math.random() * 40;
        obstacles.push({ x: canvas.width, y: 320 - h, w: 22, h });
      }

      // Move obstacles
      for (const obs of obstacles) obs.x -= speed;

      // Collision
      for (const obs of obstacles) {
        if (
          player.x < obs.x + obs.w &&
          player.x + player.w > obs.x &&
          player.y < obs.y + obs.h &&
          player.y + player.h > obs.y
        ) {
          isGameOver = true;
          setGameOver(true);
          setStarted(false);
          cancelAnimationFrame(animRef.current);
          return;
        }
      }

      obstacles = obstacles.filter((o) => o.x > -30);
      if (frame % 10 === 0) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff88";
      ctx.fillRect(0, 320, canvas.width, 80);

      // Player
      ctx.fillStyle = "#00ff88";
      ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(player.x + 6, player.y + 8, 6, 6);
      ctx.fillRect(player.x + 18, player.y + 8, 6, 6);
      ctx.fillRect(player.x + 10, player.y + 24, 10, 4);

      // Obstacles
      for (const obs of obstacles) {
        ctx.fillStyle = "#ff4455";
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.fillStyle = "#fff";
        ctx.fillRect(obs.x + 4, obs.y + 4, 4, 4);
        ctx.fillRect(obs.x + 14, obs.y + 4, 4, 4);
      }

      // Score
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px monospace";
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 30);

      animRef.current = requestAnimationFrame(loop);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        jump();
      }
    };
    const onTouch = (e: TouchEvent) => { e.preventDefault(); jump(); };
    const onClick = () => jump();

    canvas.addEventListener("click", onClick);
    canvas.addEventListener("touchstart", onTouch, { passive: false });
    window.addEventListener("keydown", onKey);

    cleanupRef.current = () => {
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("touchstart", onTouch);
      window.removeEventListener("keydown", onKey);
    };

    animRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="text-center mt-4">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pranko-lime/20 text-pranko-lime text-xs font-display font-bold mb-2">
        <Gamepad2 size={14} /> PRANKO CHOP
      </div>
      {!started && !gameOver && (
        <button onClick={startGame} className="btn-pranko !text-sm !py-3 !px-6 glow-lime mb-2">
          🎮 Play while you wait
        </button>
      )}
      {gameOver && (
        <div className="mb-2">
          <p className="text-pranko-pink text-sm font-bold mb-2">Game Over! Score: {score}</p>
          <button onClick={startGame} className="btn-pranko !text-sm !py-2 !px-4 glow-lime">Play again</button>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={320}
        height={400}
        className={`mx-auto rounded-xl border-2 border-pranko-border ${started ? "block" : "hidden"}`}
        style={{ maxWidth: "100%" }}
      />
      {started && !gameOver && (
        <p className="text-pranko-muted text-[10px] mt-2">Press Space or tap to jump</p>
      )}
    </div>
  );
}