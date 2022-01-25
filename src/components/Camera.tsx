import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { useEffect, useState } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import CameraManager from "../services/CameraManager";
import ShaderManager from "../services/ShaderManager";
import ImageInputButton from "./ImageInputButton";
import GLView from "./renderer/GLView";
import ShaderList from "./ShaderList";
import TuneIcon from "@mui/icons-material/Tune";
import Parameters from "./Parameters";
import CameraswitchIcon from "@mui/icons-material/Cameraswitch";
import { observer } from "mobx-react";
import PhotoPreview from "./PhotoPreview";

const buttonStyle = {
  color: "white",
  backgroundColor: "rgba(0,0,0,0.2)",
  "&:hover": {
    backgroundColor: "rgba(0,0,0,0.1)",
  },
};

const buttonContainerStyle = {
  flex: 1,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const Progress = observer(() => {
  const { photoProgress } = CameraManager;

  return (
    <Backdrop open={CameraManager.isTakingPicture}>
      <CircularProgress
        color="inherit"
        variant="determinate"
        value={Math.min(photoProgress * 100, 100)}
      />
    </Backdrop>
  );
});

function Camera() {
  const handle = useFullScreenHandle();

  const { activeShader } = ShaderManager;
  const { latestPhotoUrl } = CameraManager;

  const [shaderListOpen, setShaderListOpen] = useState(false);
  const [parametersOpen, setParametersOpen] = useState(false);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);

  useEffect(() => {
    latestPhotoUrl && setPhotoPreviewOpen(true);
  }, [latestPhotoUrl]);

  useEffect(() => {
    CameraManager.setPreviewActive(!(shaderListOpen || photoPreviewOpen));
  }, [shaderListOpen, photoPreviewOpen]);

  function handleShaderListClose() {
    setShaderListOpen(false);
  }

  function handleShaderListPress() {
    setShaderListOpen(true);
  }

  function handleParametersClose() {
    setParametersOpen(false);
  }

  function handleParametersPress() {
    setParametersOpen(true);
  }

  function handlePhotoPreviewClose() {
    setPhotoPreviewOpen(false);
  }

  async function handleTakePicturePress() {
    await CameraManager.takePicture();
  }

  function handleSwitchCameraPress() {
    CameraManager.switchCamera();
  }

  const parameters = activeShader?.passes[0].parameters
    ? Object.values(activeShader?.passes[0].parameters)
    : [];

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
            bottom: 0,
            top: 0,
            display: "flex",
            flexDirection: "column",
            p: 1,
            justifyContent: "center",
          }}
        >
          {activeShader?.passes[0].inputs.map((input, i) => (
            <ImageInputButton key={i} index={i} />
          ))}
        </Box>
        <Box
          component="div"
          sx={{
            position: "absolute",
            bottom: 0,
            top: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            p: 1,
            justifyContent: "center",
          }}
        ></Box>
        <Box
          component="div"
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "row",
            p: 1,
            justifyContent: "space-between",
          }}
        >
          <Box
            component="div"
            sx={{ ...buttonContainerStyle, justifyContent: "flex-start" }}
          >
            <IconButton
              size="large"
              sx={buttonStyle}
              onClick={handleSwitchCameraPress}
            >
              <CameraswitchIcon fontSize="inherit" />
            </IconButton>
          </Box>
          <Box component="div" sx={buttonContainerStyle}>
            <IconButton
              size="large"
              sx={buttonStyle}
              onClick={handleTakePicturePress}
            >
              <PhotoCameraIcon fontSize="inherit" />
            </IconButton>
          </Box>
          <Box
            component="div"
            sx={{ ...buttonContainerStyle, justifyContent: "flex-end" }}
          >
            {parameters.length > 0 && (
              <IconButton
                size="large"
                sx={buttonStyle}
                onClick={handleParametersPress}
              >
                <TuneIcon fontSize="inherit" />
              </IconButton>
            )}
          </Box>
        </Box>
        <IconButton
          size="large"
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            ...buttonStyle,
          }}
          onClick={handle.active ? handle.exit : handle.enter}
        >
          {handle.active ? (
            <FullscreenExitIcon fontSize="inherit" />
          ) : (
            <FullscreenIcon fontSize="inherit" />
          )}
        </IconButton>
        <Button
          size="large"
          sx={{
            position: "absolute",
            top: 10,
            left: 10,
            maxWidth: "50%",
            ...buttonStyle,
          }}
          onClick={handleShaderListPress}
          endIcon={<KeyboardArrowDownIcon />}
        >
          {ShaderManager.activeShader?.name || "None"}
        </Button>
        <ShaderList open={shaderListOpen} onClose={handleShaderListClose} />
        <Parameters open={parametersOpen} onClose={handleParametersClose} />
        <PhotoPreview
          open={photoPreviewOpen}
          onClose={handlePhotoPreviewClose}
        />
        <Progress />
      </Box>
    </FullScreen>
  );
}

export default observer(Camera);
