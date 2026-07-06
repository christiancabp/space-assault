/**
 * TouchControls - On-screen controls for touch devices
 *
 * - Fixed joystick (bottom-right): pointer-captured drag, radius-clamped,
 *   deadzone, writes normalized moveX/moveY into the shared touchInput module
 * - Fire button (bottom-left): hold to fire
 * - Pause button (top-right)
 *
 * Rendered only during gameplay on coarse-pointer (touch) devices.
 * Double-flicking the stick horizontally triggers the barrel roll - the
 * Player treats deflection past 0.6 as a digital press, so the keyboard
 * double-tap logic handles it.
 */

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { touchInput, resetTouchInput, isTouchDevice } from '../input/touchInput';

const STICK_RADIUS = 48;  // Max knob travel in px
const DEADZONE = 0.15;

/** setPointerCapture throws for already-released/synthetic pointers - never fatal */
function capturePointer(el: Element, pointerId: number): void {
  try {
    el.setPointerCapture(pointerId);
  } catch {
    // Capture is an optimization (keeps the drag when leaving the element);
    // tracking still works without it
  }
}

function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const updateFromPointer = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    if (dist > STICK_RADIUS) {
      dx = (dx / dist) * STICK_RADIUS;
      dy = (dy / dist) * STICK_RADIUS;
    }
    setKnob({ x: dx, y: dy });

    // Normalize, apply deadzone; screen y grows downward -> world +y is up
    const nx = dx / STICK_RADIUS;
    const ny = dy / STICK_RADIUS;
    touchInput.moveX = Math.abs(nx) < DEADZONE ? 0 : nx;
    touchInput.moveY = Math.abs(ny) < DEADZONE ? 0 : -ny;
  };

  const release = () => {
    setKnob({ x: 0, y: 0 });
    touchInput.moveX = 0;
    touchInput.moveY = 0;
  };

  return (
    <div
      ref={baseRef}
      className="touch-joystick"
      onPointerDown={(e) => {
        activePointer.current = e.pointerId;
        capturePointer(e.currentTarget, e.pointerId);
        updateFromPointer(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activePointer.current === e.pointerId) {
          updateFromPointer(e.clientX, e.clientY);
        }
      }}
      onPointerUp={(e) => {
        if (activePointer.current === e.pointerId) {
          activePointer.current = null;
          release();
        }
      }}
      onPointerCancel={() => {
        activePointer.current = null;
        release();
      }}
    >
      <div
        className="touch-joystick-knob"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
}

export function TouchControls() {
  const pauseGame = useGameStore((state) => state.pauseGame);
  const [firing, setFiring] = useState(false);

  // Never leave stale input behind (e.g. pausing mid-drag unmounts this)
  useEffect(() => resetTouchInput, []);

  if (!isTouchDevice) return null;

  return (
    <div className="touch-controls">
      <button
        type="button"
        className={`touch-fire${firing ? ' active' : ''}`}
        onPointerDown={(e) => {
          capturePointer(e.currentTarget, e.pointerId);
          touchInput.firing = true;
          setFiring(true);
        }}
        onPointerUp={() => {
          touchInput.firing = false;
          setFiring(false);
        }}
        onPointerCancel={() => {
          touchInput.firing = false;
          setFiring(false);
        }}
        aria-label="Fire"
      >
        FIRE
      </button>

      <Joystick />

      <button
        type="button"
        className="touch-pause"
        onClick={pauseGame}
        aria-label="Pause"
      >
        ❚❚
      </button>
    </div>
  );
}
