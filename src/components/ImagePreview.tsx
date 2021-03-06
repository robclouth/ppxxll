import CloseIcon from "@mui/icons-material/Close";
import ShareIcon from "@mui/icons-material/Share";
import DownloadIcon from "@mui/icons-material/Download";

import { Dialog, IconButton, Slide } from "@mui/material";
import { observer } from "mobx-react";
import { forwardRef, useCallback, useRef } from "react";
import CameraManager from "../services/CameraManager";
import QuickPinchZoom, { make3dTransformValue } from "react-quick-pinch-zoom";

const Transition = forwardRef<any>(function Transition(props: any, ref: any) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface Props {
  open: boolean;
  onClose: () => void;
}

function ImagePreview({ open, onClose }: Props) {
  const { latestPreviewUrl } = CameraManager;
  const imgRef = useRef<any>();

  const onUpdate = useCallback(({ x, y, scale }) => {
    const { current: img } = imgRef;

    if (img) {
      const value = make3dTransformValue({ x, y, scale });

      img.style.setProperty("transform", value);
    }
  }, []);

  function handleClose() {
    onClose();
  }

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
    <Dialog
      container={document.getElementById("cameraView")}
      fullScreen
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition as any}
    >
      {latestPreviewUrl && (
        <QuickPinchZoom onUpdate={onUpdate}>
          <img ref={imgRef} src={latestPreviewUrl} />
        </QuickPinchZoom>
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

export default observer(ImagePreview);
