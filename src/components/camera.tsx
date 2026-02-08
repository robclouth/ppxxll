import {
  ChevronUp,
  Camera as CameraIcon,
  SwitchCamera,
  Crop,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import CameraManager from "../services/camera-manager";
import ExportManager from "../services/export-manager";
import RenderManager from "../services/render-manager";
import ShaderManager from "../services/shader-manager";
import App from "../services/app";
import GLView from "./gl-view";
import ShaderList from "./shader-list";
import Parameters from "./parameters";
import InputStrip from "./input-strip";
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
  const { photoProgress } = ExportManager;
  if (!ExportManager.isExporting) return null;
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

  // Update export size when aspect ratio changes, preserving current resolution
  useEffect(() => {
    const currentLongest = Math.max(App.exportSize.width, App.exportSize.height);
    const baseSize = currentLongest || 3840;
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
    ExportManager.latestExportBlob = undefined;
  }, [aspectRatio]);

  function handleShaderListClose() {
    setShaderListOpen(false);
    RenderManager.setRenderingActive(true);
  }

  function handleShaderListPress() {
    setShaderListOpen(true);
    RenderManager.setRenderingActive(false);
  }

  function handlePhotoPreviewClose() {
    setPhotoPreviewOpen(false);
    CameraManager.restoreLiveInputs();
    RenderManager.setRenderingActive(true);
  }

  function handleVideoPreviewClose() {
    setVideoPreviewOpen(false);
    RenderManager.setRenderingActive(true);
  }

  async function handleTakePicturePress() {
    if (ExportManager.mode === "photo") {
      await RenderManager.startPreviewCapture();
      setPhotoPreviewOpen(true);
    } else {
      if (!ExportManager.isRecording) ExportManager.startRecording();
      else ExportManager.stopRecording();
    }
  }

  function handleSwitchCameraPress() {
    CameraManager.switchCamera();
  }

  return (
    <div className="w-full h-full flex flex-col bg-black overflow-hidden">
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
      </div>

      {/* Parameters - always visible */}
      <div className="flex-shrink-0">
        <Parameters />
      </div>

      {/* Input strip - below parameters */}
      <div className="flex-shrink-0">
        <InputStrip />
      </div>

      {/* Camera controls row */}
      <div className="flex-shrink-0 flex items-center py-2 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={handleSwitchCameraPress}
        >
          <SwitchCamera className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-full border-2 border-white/30"
            onClick={handleTakePicturePress}
          >
            <CameraIcon className="h-6 w-6" />
          </Button>
        </div>
        <div className="w-10" />
      </div>

      {/* Shader selector + aspect ratio row */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 pb-3">
        <Button
          variant="ghost"
          className="flex-1 min-w-0 truncate text-sm px-2 justify-start"
          onClick={handleShaderListPress}
        >
          <ChevronUp className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="truncate">{ShaderManager.activeShader?.title || "None"}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex-shrink-0 text-sm px-2 gap-1">
              <Crop className="h-4 w-4" />
              {aspectRatio.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top">
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
  );
}

export default observer(Camera);
