import { Box, IconButton } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";

import GLView from "./renderer/GLView";
import CameraManager from "../services/CameraManager";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import ImageInputButton from "./ImageInputButton";

function Camera() {
  const handle = useFullScreenHandle();

  async function takePicture() {
    await CameraManager.takePicture(2000, 2000);
  }

  return (
    <FullScreen handle={handle} className="fullscreen">
      <Box
        component="div"
        id="cameraView"
        sx={{ width: "100%", height: "100%" }}
      >
        <GLView />
        <Box
          component="div"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ImageInputButton index={0} />
          <ImageInputButton index={1} />
          <ImageInputButton index={2} />
          <ImageInputButton index={3} />
        </Box>
        <IconButton
          size="large"
          sx={{ position: "absolute", bottom: 10, right: 10, color: "white" }}
          onClick={takePicture}
        >
          <PhotoCameraIcon fontSize="inherit" />
        </IconButton>
        <IconButton
          size="large"
          sx={{ position: "absolute", top: 10, right: 10, color: "white" }}
          onClick={handle.active ? handle.exit : handle.enter}
        >
          {handle.active ? (
            <FullscreenExitIcon fontSize="inherit" />
          ) : (
            <FullscreenIcon fontSize="inherit" />
          )}
        </IconButton>
      </Box>
    </FullScreen>
  );
}

export default Camera;
