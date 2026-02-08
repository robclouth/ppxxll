import {
  Maximize,
  Minimize,
  ChevronDown,
  Camera as CameraIcon,
  SwitchCamera,
  Crop,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import CameraManager from "../services/camera-manager";
import ShaderManager from "../services/shader-manager";
import App from "../services/app";
import ImageInputButton from "./image-input-button";
import GLView from "./gl-view";
import ShaderList from "./shader-list";
import Parameters from "./parameters";
import { observer } from "mobx-react";
import ImagePreview from "./image-preview";
import VideoPreview from "./video-preview";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { cn } from "../lib/utils";

const ASPECT_RATIOS = [
  { label: "16:9", w: 16, h: 9 },
  { label: "3:2", w: 3, h: 2 },
  { label: "4:3", w: 4, h: 3 },
  { label: "1:1", w: 1, h: 1 },
  { label: "3:4", w: 3, h: 4 },
  { label: "2:3", w: 2, h: 3 },
  { label: "9:16", w: 9, h: 16 },
];

const Progress = observer(() => {
  const { photoProgress } = CameraManager;
  if (!CameraManager.isExporting) return null;
  const pct = Math.min(photoProgress * 100, 100);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative h-16 w-16">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-white/20"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="text-white"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${pct}, 100`}
          />
        </svg>
      </div>
    </div>
  );
});

function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return size;
}

function Camera() {
  const handle = useFullScreenHandle();
  const { activeShader } = ShaderManager;

  const [shaderListOpen, setShaderListOpen] = useState(false);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const containerSize = useContainerSize(previewContainerRef);

  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[2]); // 4:3

  // Compute preview dimensions to fit container while maintaining aspect ratio
  const previewSize = (() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { width: 0, height: 0 };
    }
    const containerRatio = containerSize.width / containerSize.height;
    const targetRatio = aspectRatio.w / aspectRatio.h;
    if (targetRatio > containerRatio) {
      return {
        width: containerSize.width,
        height: containerSize.width / targetRatio,
      };
    } else {
      return {
        width: containerSize.height * targetRatio,
        height: containerSize.height,
      };
    }
  })();

  // Update export size when aspect ratio changes
  useEffect(() => {
    const baseSize = 4000;
    const ratio = aspectRatio.w / aspectRatio.h;
    if (ratio >= 1) {
      App.exportSize = {
        width: baseSize,
        height: Math.round(baseSize / ratio),
      };
    } else {
      App.exportSize = {
        width: Math.round(baseSize * ratio),
        height: baseSize,
      };
    }
  }, [aspectRatio]);

  function handleShaderListClose() {
    setShaderListOpen(false);
    CameraManager.setRenderingActive(true);
  }

  function handleShaderListPress() {
    setShaderListOpen(true);
    CameraManager.setRenderingActive(false);
  }

  function handlePhotoPreviewClose() {
    setPhotoPreviewOpen(false);
    CameraManager.setRenderingActive(true);
  }

  function handleVideoPreviewClose() {
    setVideoPreviewOpen(false);
    CameraManager.setRenderingActive(true);
  }

  async function handleTakePicturePress() {
    if (CameraManager.mode === "photo") {
      await CameraManager.startPreviewCapture();
      setPhotoPreviewOpen(true);
    } else {
      if (!CameraManager.isRecording) CameraManager.startRecording();
      else CameraManager.stopRecording();
    }
  }

  function handleSwitchCameraPress() {
    CameraManager.switchCamera();
  }

  return (
    <FullScreen handle={handle} className="fullscreen">
      <div className="w-full h-full flex flex-col bg-black">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-2 z-10">
          <Button
            variant="default"
            className="max-w-[50%] truncate"
            onClick={handleShaderListPress}
          >
            {ShaderManager.activeShader?.title || "None"}
            <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0" />
          </Button>
          <div className="flex items-center gap-1">
            {/* Aspect ratio selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="text-xs gap-1">
                  <Crop className="h-3.5 w-3.5" />
                  {aspectRatio.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {ASPECT_RATIOS.map((ar) => (
                  <DropdownMenuItem
                    key={ar.label}
                    className={cn(
                      ar.label === aspectRatio.label && "bg-white/10"
                    )}
                    onSelect={() => setAspectRatio(ar)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="border border-white/50 rounded-sm"
                        style={{
                          width: ar.w > ar.h ? 18 : Math.round((18 * ar.w) / ar.h),
                          height: ar.h > ar.w ? 18 : Math.round((18 * ar.h) / ar.w),
                        }}
                      />
                      {ar.label}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="default"
              size="icon"
              onClick={handle.active ? handle.exit : handle.enter}
            >
              {handle.active ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Preview area - GLView contained with aspect ratio */}
        <div
          ref={previewContainerRef}
          className="flex-1 flex items-center justify-center overflow-hidden relative min-h-0"
        >
          {previewSize.width > 0 && (
            <div
              className="relative"
              style={{
                width: previewSize.width,
                height: previewSize.height,
              }}
            >
              <GLView />
              <Progress />
            </div>
          )}
          {/* Image input buttons */}
          {activeShader?.passes[0].inputs &&
            activeShader.passes[0].inputs.length > 0 && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col">
                {activeShader.passes[0].inputs.map((_input, i) => (
                  <ImageInputButton key={i} index={i} />
                ))}
              </div>
            )}
        </div>

        {/* Parameters - always visible */}
        <Parameters />

        {/* Bottom action buttons */}
        <div className="flex items-center justify-between px-6 py-3">
          <Button
            variant="default"
            size="icon"
            className="h-11 w-11 rounded-full"
            onClick={handleSwitchCameraPress}
          >
            <SwitchCamera className="h-5 w-5" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="h-14 w-14 rounded-full border-2 border-white/30"
            onClick={handleTakePicturePress}
          >
            <CameraIcon className="h-6 w-6" />
          </Button>
          <div className="w-11" />
        </div>

        {/* Dialogs */}
        <ShaderList open={shaderListOpen} onClose={handleShaderListClose} />
        <ImagePreview
          open={photoPreviewOpen}
          onClose={handlePhotoPreviewClose}
        />
        <VideoPreview
          open={videoPreviewOpen}
          onClose={handleVideoPreviewClose}
        />
      </div>
    </FullScreen>
  );
}

export default observer(Camera);
