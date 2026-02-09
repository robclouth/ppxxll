import { X, Share, Download } from "lucide-react";
import { observer } from "mobx-react";
import ExportManager from "../services/export-manager";
import RenderManager from "../services/render-manager";
import App from "../services/app";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "./ui/drawer";
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
  }

  function handleFormatChange(format: "png" | "jpeg") {
    ExportManager.exportFormat = format;
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
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()} dismissible={false}>
      <DrawerContent className="h-[92vh] max-h-[92vh] [&>div:first-child]:hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-4 pt-3 pb-1">
          <DrawerTitle>Preview</DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <DrawerDescription className="sr-only">Photo preview</DrawerDescription>

        {/* Pinch-zoomable preview - wrapper fills space, content centered */}
        <div className="flex-1 min-h-0">
          {latestPreviewUrl && (
            <TransformWrapper
              centerOnInit
              minScale={0.5}
              maxScale={10}
            >
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <img
                  src={latestPreviewUrl}
                  className="max-w-full max-h-full object-contain"
                />
              </TransformComponent>
            </TransformWrapper>
          )}
        </div>

        {/* Bottom controls */}
        <div className="flex-shrink-0 p-4">
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
      </DrawerContent>
    </Drawer>
  );
}

export default observer(ImagePreview);
