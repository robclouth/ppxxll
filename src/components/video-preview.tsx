import { X, Share, Download } from "lucide-react";
import { observer } from "mobx-react";
import { useMemo } from "react";
import CameraManager from "../services/camera-manager";
import { Dialog, DialogFullScreen } from "./ui/dialog";
import { Button } from "./ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
}

function VideoPreview({ open, onClose }: Props) {
  const { latestVideoBlob } = CameraManager;

  const videoUrl = useMemo(() => {
    return latestVideoBlob ? URL.createObjectURL(latestVideoBlob) : undefined;
  }, [latestVideoBlob]);

  function handleSharePress() {
    CameraManager.shareVideo();
  }

  function handleDownloadPress() {
    CameraManager.downloadVideo();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogFullScreen className="bg-black">
        {videoUrl && (
          <video src={videoUrl} controls loop autoPlay muted />
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

export default observer(VideoPreview);
