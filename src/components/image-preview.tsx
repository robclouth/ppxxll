import { X, Share, Download } from "lucide-react";
import { observer } from "mobx-react";
import { useCallback, useRef } from "react";
import ExportManager from "../services/export-manager";
import RenderManager from "../services/render-manager";
import App from "../services/app";
import QuickPinchZoom, { make3dTransformValue } from "react-quick-pinch-zoom";
import { Dialog, DialogFullScreen } from "./ui/dialog";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { cn } from "../lib/utils";

const RESOLUTION_PRESETS = [
  { label: "1080p", size: 1920 },
  { label: "2K", size: 2560 },
  { label: "4K", size: 3840 },
  { label: "6K", size: 5760 },
  { label: "8K", size: 7680 },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

function ImagePreview({ open, onClose }: Props) {
  const { latestPreviewUrl } = RenderManager;
  const imgRef = useRef<HTMLImageElement>(null);

  const onUpdate = useCallback(({ x, y, scale }: { x: number; y: number; scale: number }) => {
    const { current: img } = imgRef;

    if (img) {
      const value = make3dTransformValue({ x, y, scale });
      img.style.setProperty("transform", value);
    }
  }, []);

  const currentResolution = RESOLUTION_PRESETS.find(
    (r) => r.size === Math.max(App.exportSize.width, App.exportSize.height)
  ) || RESOLUTION_PRESETS[2];

  function handleResolutionChange(preset: typeof RESOLUTION_PRESETS[number]) {
    const ratio = App.exportSize.width / App.exportSize.height;
    if (ratio >= 1) {
      App.exportSize = {
        width: preset.size,
        height: Math.round(preset.size / ratio),
      };
    } else {
      App.exportSize = {
        width: Math.round(preset.size * ratio),
        height: preset.size,
      };
    }
    // Clear cached export so next share/download re-exports at new resolution
    ExportManager.latestExportBlob = undefined;
  }

  function handleFormatChange(format: "png" | "jpeg") {
    ExportManager.exportFormat = format;
    // Clear cached export so next share/download re-exports with new format
    ExportManager.latestExportBlob = undefined;
  }

  async function handleSharePress() {
    try {
      await ExportManager.shareExport();
    } catch (err) {
      console.log(err);
    }
  }

  async function handleDownloadPress() {
    await ExportManager.downloadExport();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogFullScreen className="bg-black">
        {/* Close button */}
        <div className="flex-shrink-0 flex items-center p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Centered preview image */}
        <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
          {latestPreviewUrl && (
            <QuickPinchZoom onUpdate={onUpdate}>
              <img
                ref={imgRef}
                src={latestPreviewUrl}
                className="max-w-full max-h-full object-contain"
              />
            </QuickPinchZoom>
          )}
        </div>

        {/* Bottom controls */}
        <div className="flex-shrink-0 p-4 space-y-3">
          {/* Format + Resolution row */}
          <div className="flex items-center gap-2">
            {/* Format selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-sm">
                  {ExportManager.exportFormat.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top">
                <DropdownMenuItem
                  className={cn(ExportManager.exportFormat === "png" && "bg-white/10")}
                  onSelect={() => handleFormatChange("png")}
                >
                  PNG
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(ExportManager.exportFormat === "jpeg" && "bg-white/10")}
                  onSelect={() => handleFormatChange("jpeg")}
                >
                  JPEG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Resolution selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-sm">
                  {currentResolution.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top">
                {RESOLUTION_PRESETS.map((preset) => (
                  <DropdownMenuItem
                    key={preset.label}
                    className={cn(
                      currentResolution.label === preset.label && "bg-white/10"
                    )}
                    onSelect={() => handleResolutionChange(preset)}
                  >
                    {preset.label} ({preset.size}px)
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1" />

            {/* Share + Download buttons */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleSharePress}
            >
              <Share className="h-4 w-4" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleDownloadPress}
            >
              <Download className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </DialogFullScreen>
    </Dialog>
  );
}

export default observer(ImagePreview);
