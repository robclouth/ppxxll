import { X, Share, Download } from "lucide-react";
import { observer } from "mobx-react";
import { useCallback, useRef } from "react";
import CameraManager from "../services/camera-manager";
import QuickPinchZoom, { make3dTransformValue } from "react-quick-pinch-zoom";
import { Dialog, DialogFullScreen } from "./ui/dialog";
import { Button } from "./ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
}

function ImagePreview({ open, onClose }: Props) {
  const { latestPreviewUrl } = CameraManager;
  const imgRef = useRef<HTMLImageElement>(null);

  const onUpdate = useCallback(({ x, y, scale }: { x: number; y: number; scale: number }) => {
    const { current: img } = imgRef;

    if (img) {
      const value = make3dTransformValue({ x, y, scale });
      img.style.setProperty("transform", value);
    }
  }, []);

  async function handleSharePress() {
    try {
      await CameraManager.shareExport();
    } catch (err) {
      console.log(err);
    }
  }

  async function handleDownloadPress() {
    await CameraManager.downloadExport();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogFullScreen className="bg-black">
        {latestPreviewUrl && (
          <QuickPinchZoom onUpdate={onUpdate}>
            <img ref={imgRef} src={latestPreviewUrl} />
          </QuickPinchZoom>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 left-0 m-2"
          onClick={onClose}
          aria-label="close"
        >
          <X className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 m-2"
          onClick={handleSharePress}
          aria-label="share"
        >
          <Share className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-0 right-0 m-2"
          onClick={handleDownloadPress}
          aria-label="download"
        >
          <Download className="h-5 w-5" />
        </Button>
      </DialogFullScreen>
    </Dialog>
  );
}

export default observer(ImagePreview);
