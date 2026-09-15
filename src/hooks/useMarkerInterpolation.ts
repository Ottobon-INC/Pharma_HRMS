import { useState, useEffect, useRef } from 'react';

interface Position {
  lat: number;
  lng: number;
}

/**
 * Animates a marker's position smoothly between incoming GPS coordinates using requestAnimationFrame.
 * The animation duration is derived from intervalMs * 0.9 to provide continuous, unbroken motion.
 */
export function useMarkerInterpolation(
  targetPosition: Position | null,
  intervalMs: number
): Position | null {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(targetPosition);
  
  const fromPosRef = useRef<Position | null>(targetPosition);
  const targetPosRef = useRef<Position | null>(targetPosition);
  const animStartTimeRef = useRef<number | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Derive animation duration from broadcast interval (90% of interval window)
  const durationMs = Math.max(1000, intervalMs * 0.9);

  useEffect(() => {
    if (!targetPosition) {
      setCurrentPosition(null);
      fromPosRef.current = null;
      targetPosRef.current = null;
      return;
    }

    // First position initialization
    if (!fromPosRef.current) {
      fromPosRef.current = targetPosition;
      targetPosRef.current = targetPosition;
      setCurrentPosition(targetPosition);
      return;
    }

    // If target position hasn't changed, do nothing
    if (
      targetPosRef.current &&
      targetPosRef.current.lat === targetPosition.lat &&
      targetPosRef.current.lng === targetPosition.lng
    ) {
      return;
    }

    // Set starting position to where the marker currently is
    fromPosRef.current = currentPosition || targetPosRef.current || targetPosition;
    targetPosRef.current = targetPosition;
    animStartTimeRef.current = performance.now();

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }

    const animate = (time: number) => {
      if (!animStartTimeRef.current || !fromPosRef.current || !targetPosRef.current) return;

      const elapsed = time - animStartTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);

      // Linear interpolation
      const lat = fromPosRef.current.lat + (targetPosRef.current.lat - fromPosRef.current.lat) * progress;
      const lng = fromPosRef.current.lng + (targetPosRef.current.lng - fromPosRef.current.lng) * progress;

      setCurrentPosition({ lat, lng });

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        fromPosRef.current = targetPosRef.current;
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [targetPosition?.lat, targetPosition?.lng, durationMs]);

  return currentPosition;
}
