import CloseIcon from "@mui/icons-material/Close";
import ShareIcon from "@mui/icons-material/Share";
import DownloadIcon from "@mui/icons-material/Download";

import { Dialog, IconButton, Slide } from "@mui/material";
import { observer } from "mobx-react";
import { forwardRef, useCallback, useMemo, useRef } from "react";
import CameraManager from "../services/CameraManager";

const Transition = forwardRef<any>(function Transition(props: any, ref: any) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface Props {
  open: boolean;
  onClose: () => void;
}

function VideoPreview({ open, onClose }: Props) {
  const { latestVideoBlob } = CameraManager;
  const imgRef = useRef<any>();

  const videoUrl = useMemo(() => {
    return latestVideoBlob ? URL.createObjectURL(latestVideoBlob) : undefined;
  }, [latestVideoBlob]);

  function handleClose() {
    onClose();
  }

  function handleSharePress() {
    CameraManager.shareVideo();
  }

  function handleDownloadPress() {
    CameraManager.downloadVideo();
  }

  return (
    <Dialog
      container={document.getElementById("cameraView")}
      fullScreen
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition as any}
    >
      {videoUrl && (
        <video ref={imgRef} src={videoUrl} controls loop autoPlay muted />
      )}
      <IconButton
        edge="start"
        color="inherit"
        onClick={handleClose}
        aria-label="close"
        sx={{ position: "absolute", m: 1, top: 0, left: 0 }}
      >
        <CloseIcon />
      </IconButton>
      <IconButton
        edge="start"
        color="inherit"
        onClick={handleSharePress}
        aria-label="close"
        sx={{ position: "absolute", m: 1, top: 0, right: 0 }}
      >
        <ShareIcon />
      </IconButton>
      <IconButton
        edge="start"
        color="inherit"
        onClick={handleDownloadPress}
        aria-label="close"
        sx={{ position: "absolute", m: 1, bottom: 0, right: 0 }}
      >
        <DownloadIcon />
      </IconButton>
    </Dialog>
  );
}

export default observer(VideoPreview);
