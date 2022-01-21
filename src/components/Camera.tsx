import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { Box, Button, IconButton } from "@mui/material";
import { useState } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import CameraManager from "../services/CameraManager";
import ShaderManager from "../services/ShaderManager";
import ImageInputButton from "./ImageInputButton";
import GLView from "./renderer/GLView";
import ShaderList from "./ShaderList";
import TuneIcon from "@mui/icons-material/Tune";
import Parameters from "./Parameters";
const buttonStyle = {
  color: "white",
  backgroundColor: "rgba(0,0,0,0.2)",
  "&:hover": {
    backgroundColor: "rgba(0,0,0,0.1)",
  },
};

function Camera() {
  const handle = useFullScreenHandle();

  const { activeShader } = ShaderManager;

  const [shaderListOpen, setShaderListOpen] = useState(false);
  const [parametersOpen, setParametersOpen] = useState(false);

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

  async function takePicture() {
    await CameraManager.takePicture();
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
            justifyContent: "center",
          }}
        >
          <IconButton size="large" sx={buttonStyle} onClick={takePicture}>
            <PhotoCameraIcon fontSize="inherit" />
          </IconButton>
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
            ...buttonStyle,
          }}
          onClick={handleShaderListPress}
          endIcon={<KeyboardArrowDownIcon />}
        >
          {ShaderManager.activeShader?.name || "None"}
        </Button>
        <ShaderList open={shaderListOpen} onClose={handleShaderListClose} />
        <Parameters open={parametersOpen} onClose={handleParametersClose} />
      </Box>
    </FullScreen>
  );
}

export default Camera;
