import { Box, IconButton } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import GLView from "./renderer/GLView";
import CameraManager from "../services/CameraManager";

function Camera() {
  const [imageCapture, setImageCapture] = useState<ImageCapture | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);

  const cameraRef = useCallback(async (ref) => {
    if (ref) {
      const constraints = { video: true };

      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );

      ref.srcObject = mediaStream;
      ref.onloadedmetadata = () => {
        ref.play();
      };

      const mediaStreamTrack = mediaStream.getVideoTracks()[0];
      setImageCapture(new ImageCapture(mediaStreamTrack));
    }
  }, []);

  const cameras = useMemo(async () => {
    try {
      return await navigator.mediaDevices.enumerateDevices();
    } catch (error) {
      console.error("enumerateDevices() error:", error);
    }
  }, []);

  async function takePicture() {
    // if (imageCapture) {
    //   try {
    //     const blob = await imageCapture.takePhoto();
    //     setImageBlob(blob);
    //     // img.src = URL.createObjectURL(blob);
    //     // img.onload = () => {
    //     //   URL.revokeObjectURL(this.src);
    //     // };
    //   } catch (error) {
    //     console.error("takePhoto() error:", error);
    //   }
    // }

    await CameraManager.takePicture();
  }

  return (
    <Box component="div" sx={{ width: "100%", height: "100%" }}>
      {/* <video ref={cameraRef} muted autoPlay /> */}
      <GLView />
      <IconButton
        size="large"
        sx={{ position: "absolute", bottom: 10, right: 10 }}
        onClick={takePicture}
      >
        <PhotoCamera fontSize="inherit" />
      </IconButton>
    </Box>
  );
}

export default Camera;
