import { observer } from "mobx-react";
import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Image as ImageIcon, X } from "lucide-react";
import CameraManager from "../services/camera-manager";
import ShaderManager from "../services/shader-manager";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "./ui/drawer";
import { cn } from "../lib/utils";

/** Small live camera preview thumbnail */
const CameraThumbnail = observer(({ size }: { size: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const texture = CameraManager.cameraTexture;

  useEffect(() => {
    if (!texture?.image) return;

    function draw() {
      if (!canvasRef.current || !texture?.image) return;
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.drawImage(texture.image, 0, 0, size, size);
    }

    const timer = setInterval(draw, 100);
    return () => clearInterval(timer);
  }, [texture?.image, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="w-full h-full object-cover"
    />
  );
});

/** Thumbnail showing a captured photo */
function CapturedThumbnail({
  capture,
  size,
}: {
  capture: { fullRes: HTMLCanvasElement };
  size: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !capture.fullRes) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.drawImage(capture.fullRes, 0, 0, size, size);
  }, [capture.fullRes, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="w-full h-full object-cover"
    />
  );
}

type InputButtonProps = {
  index: number;
  onAction: (index: number) => void;
};

const InputButton = observer(({ index, onAction }: InputButtonProps) => {
  const input = CameraManager.inputs[index];
  const capture = CameraManager.inputCaptures[index];
  const isCapturing = CameraManager.capturingForInput === index;

  const hasCaptured = input?.type === "captured" && capture;
  const isLive = input?.type === "camera";

  return (
    <button
      className={cn(
        "relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer",
        "border-2 transition-colors",
        isCapturing
          ? "border-white"
          : hasCaptured
            ? "border-white/40"
            : "border-white/20"
      )}
      onClick={() => onAction(index)}
    >
      {hasCaptured ? (
        <CapturedThumbnail capture={capture} size={48} />
      ) : isLive ? (
        <CameraThumbnail size={48} />
      ) : (
        <div className="w-full h-full bg-white/10 flex items-center justify-center">
          <ImagePlus className="h-5 w-5 text-white/40" />
        </div>
      )}
      {/* Input index label */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white/70 text-center leading-4">
        {index + 1}
      </div>
    </button>
  );
});

function InputStrip() {
  const { activeShader } = ShaderManager;
  const inputs = activeShader?.passes[0].inputs;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedInput, setSelectedInput] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!inputs || inputs.length === 0) return null;

  function handleInputPress(index: number) {
    setSelectedInput(index);
    setDrawerOpen(true);
  }

  async function handleTakePhoto() {
    if (selectedInput === null) return;
    setDrawerOpen(false);
    await CameraManager.captureForInput(selectedInput);
  }

  function handleSetLiveCamera() {
    if (selectedInput === null) return;
    CameraManager.setInputToCamera(selectedInput);
    setDrawerOpen(false);
  }

  function handleFromGallery() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || selectedInput === null) return;
    setDrawerOpen(false);
    await CameraManager.setInputFromFile(selectedInput, file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  function handleClear() {
    if (selectedInput === null) return;
    CameraManager.clearInput(selectedInput);
    setDrawerOpen(false);
  }

  const selectedInputData =
    selectedInput !== null ? CameraManager.inputs[selectedInput] : null;
  const hasCaptured =
    selectedInputData?.type === "captured" &&
    CameraManager.inputCaptures[selectedInput!];

  return (
    <>
      <div className="flex gap-2 px-4 py-1 items-center justify-center">
        {inputs.map((_, i) => (
          <InputButton key={i} index={i} onAction={handleInputPress} />
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerTitle className="sr-only">
            Input {selectedInput !== null ? selectedInput + 1 : ""}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Choose a source for this shader input
          </DrawerDescription>
          <div className="flex flex-col gap-2 p-4 pb-8">
            <Button
              variant="ghost"
              className="justify-start gap-3 h-12 text-base"
              onClick={handleSetLiveCamera}
            >
              <Camera className="h-5 w-5" />
              Live Camera
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-3 h-12 text-base"
              onClick={handleTakePhoto}
            >
              <ImagePlus className="h-5 w-5" />
              Take Photo
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-3 h-12 text-base"
              onClick={handleFromGallery}
            >
              <ImageIcon className="h-5 w-5" />
              From Gallery
            </Button>
            {hasCaptured && (
              <Button
                variant="ghost"
                className="justify-start gap-3 h-12 text-base text-red-400 hover:text-red-300"
                onClick={handleClear}
              >
                <X className="h-5 w-5" />
                Clear
              </Button>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default observer(InputStrip);
