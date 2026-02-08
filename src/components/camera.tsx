import {
  Maximize,
  Minimize,
  ChevronDown,
  Camera as CameraIcon,
  SlidersHorizontal,
  SwitchCamera,
} from "lucide-react";
import { useState } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import CameraManager from "../services/camera-manager";
import ShaderManager from "../services/shader-manager";
import ImageInputButton from "./image-input-button";
import GLView from "./gl-view";
import ShaderList from "./shader-list";
import Parameters from "./parameters";
import { observer } from "mobx-react";
import ImagePreview from "./image-preview";
import VideoPreview from "./video-preview";
import { Button } from "./ui/button";

const Progress = observer(() => {
  const { photoProgress } = CameraManager;

  if (!CameraManager.isExporting) return null;

  const pct = Math.min(photoProgress * 100, 100);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative h-16 w-16">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-white/20"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="text-white"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${pct}, 100`}
          />
        </svg>
      </div>
    </div>
  );
});

function Camera() {
  const handle = useFullScreenHandle();

  const { activeShader } = ShaderManager;

  const [shaderListOpen, setShaderListOpen] = useState(false);
  const [parametersOpen, setParametersOpen] = useState(false);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);

  function handleShaderListClose() {
    setShaderListOpen(false);
    CameraManager.setRenderingActive(true);
  }

  function handleShaderListPress() {
    setShaderListOpen(true);
    CameraManager.setRenderingActive(false);
  }

  function handleParametersClose() {
    setParametersOpen(false);
  }

  function handleParametersPress() {
    setParametersOpen(true);
  }

  function handlePhotoPreviewClose() {
    setPhotoPreviewOpen(false);
    CameraManager.setRenderingActive(true);
  }

  function handleVideoPreviewClose() {
    setVideoPreviewOpen(false);
    CameraManager.setRenderingActive(true);
  }

  async function handleTakePicturePress() {
    if (CameraManager.mode === "photo") {
      await CameraManager.startPreviewCapture();
      setPhotoPreviewOpen(true);
    } else {
      if (!CameraManager.isRecording) CameraManager.startRecording();
      else CameraManager.stopRecording();
    }
  }

  function handleSwitchCameraPress() {
    CameraManager.switchCamera();
  }

  const parameters = activeShader?.passes[0].parameters
    ? Object.values(activeShader?.passes[0].parameters)
    : [];

  return (
    <FullScreen handle={handle} className="fullscreen">
      <div id="cameraView" className="w-full h-full relative">
        <GLView />
        <div className="absolute bottom-0 top-0 flex flex-col p-2 justify-center">
          {activeShader?.passes[0].inputs.map((input, i) => (
            <ImageInputButton key={i} index={i} />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex flex-row p-2 justify-between">
          <div className="flex-1 flex justify-start items-center">
            <Button
              variant="default"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={handleSwitchCameraPress}
            >
              <SwitchCamera className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <Button
              variant="default"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={handleTakePicturePress}
            >
              <CameraIcon className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex-1 flex justify-end items-center">
            {parameters.length > 0 && (
              <Button
                variant="default"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={handleParametersPress}
              >
                <SlidersHorizontal className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>
        <Button
          variant="default"
          size="icon"
          className="absolute top-2.5 right-2.5"
          onClick={handle.active ? handle.exit : handle.enter}
        >
          {handle.active ? (
            <Minimize className="h-5 w-5" />
          ) : (
            <Maximize className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="default"
          className="absolute top-2.5 left-2.5 max-w-[50%]"
          onClick={handleShaderListPress}
        >
          {ShaderManager.activeShader?.title || "None"}
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
        <ShaderList open={shaderListOpen} onClose={handleShaderListClose} />
        <Parameters open={parametersOpen} onClose={handleParametersClose} />
        <ImagePreview
          open={photoPreviewOpen}
          onClose={handlePhotoPreviewClose}
        />
        <VideoPreview
          open={videoPreviewOpen}
          onClose={handleVideoPreviewClose}
        />
        <Progress />
      </div>
    </FullScreen>
  );
}

export default observer(Camera);
