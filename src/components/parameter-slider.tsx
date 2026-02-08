import { observer } from "mobx-react";
import { Parameter } from "../types";
import { useCallback, useRef } from "react";
import { RotateCcw } from "lucide-react";

type Props = {
  parameter: Parameter;
};

const TICK_COUNT = 81;
const TICK_SPACING = 6;
const PIXELS_PER_RANGE = (TICK_COUNT - 1) * TICK_SPACING;

function formatValue(value: number, range: number): string {
  if (range >= 10) return Math.round(value).toString();
  if (range >= 1) return (Math.round(value * 10) / 10).toFixed(1);
  return (Math.round(value * 100) / 100).toFixed(2);
}

function ParameterSlider({ parameter }: Props) {
  const dragRef = useRef({ isDragging: false, startX: 0, startValue: 0 });
  const range = parameter.maxValue - parameter.minValue;
  const fraction = (parameter.value - parameter.minValue) / range;
  const rulerOffset = fraction * PIXELS_PER_RANGE;

  const defaultFraction =
    (parameter.defaultValue - parameter.minValue) / range;
  const defaultTickIndex = Math.round(defaultFraction * (TICK_COUNT - 1));

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragRef.current = {
        isDragging: true,
        startX: e.clientX,
        startValue: parameter.value,
      };
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [parameter]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current.isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const valueDelta = (-dx / PIXELS_PER_RANGE) * range;
      const newValue = Math.max(
        parameter.minValue,
        Math.min(parameter.maxValue, dragRef.current.startValue + valueDelta)
      );
      parameter.value = newValue;
    },
    [parameter, range]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current.isDragging = false;
  }, []);

  const handleReset = useCallback(() => {
    parameter.value = parameter.defaultValue;
  }, [parameter]);

  const isModified =
    Math.abs(parameter.value - parameter.defaultValue) > 0.001;

  return (
    <div className="flex items-center bg-zinc-800/80 rounded-full px-3 py-2.5 mx-4">
      <span className="text-sm font-medium text-white/90 w-10 text-center tabular-nums flex-shrink-0">
        {formatValue(parameter.value, range)}
      </span>
      <div
        className="flex-1 h-6 relative overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Fixed center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white z-10 -translate-x-px" />
        {/* Ruler ticks */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `calc(50% - ${rulerOffset}px)`,
            width: PIXELS_PER_RANGE + 1,
          }}
        >
          {Array.from({ length: TICK_COUNT }, (_, i) => {
            const isDefault = i === defaultTickIndex;
            const isMajor = i % 10 === 0;
            const isMedium = i % 5 === 0;

            let height: number;
            let opacity: string;
            if (isDefault) {
              height = 18;
              opacity = "bg-white/80";
            } else if (isMajor) {
              height = 14;
              opacity = "bg-white/50";
            } else if (isMedium) {
              height = 10;
              opacity = "bg-white/35";
            } else {
              height = 6;
              opacity = "bg-white/20";
            }

            return (
              <div
                key={i}
                className={`absolute top-1/2 w-px ${opacity}`}
                style={{
                  left: i * TICK_SPACING,
                  height,
                  transform: "translateY(-50%)",
                }}
              />
            );
          })}
        </div>
      </div>
      <button
        onClick={handleReset}
        className={`w-10 flex items-center justify-center flex-shrink-0 transition-opacity cursor-pointer ${isModified ? "text-white/80 hover:text-white" : "text-white/20"}`}
        disabled={!isModified}
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </div>
  );
}

export default observer(ParameterSlider);
