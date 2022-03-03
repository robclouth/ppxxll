import { Box } from "@mui/material";
import { AdaptiveDpr } from "@react-three/drei/core/AdaptiveDpr";
import { OrthographicCamera } from "@react-three/drei/core/OrthographicCamera";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { observer } from "mobx-react";
import { useEffect } from "react";
import App from "../../services/App";
import CameraManager from "../../services/CameraManager";

const ShaderQuad = observer(() => {
  const { material } = CameraManager;
  const { gl, size } = useThree();

  useEffect(() => {
    CameraManager.setPreviewCanvas(gl.domElement);
  }, [gl.domElement]);

  useEffect(() => {
    CameraManager.setPreviewCanvasSize(size.width, size.height);
  }, [size.width, size.height]);

  useFrame(({ gl, scene, camera }) => {
    if (CameraManager.isRenderingActive) gl.render(scene, camera);

    if (CameraManager.shouldCapturePreview) {
      CameraManager.finishPreviewCapture(gl.domElement.toDataURL());
    }
  }, 1);

  return (
    <mesh material={material}>
      <planeBufferGeometry args={[2, 2, 1, 1]} />
    </mesh>
  );
});

function handlePointerDown(e: any) {
  if (e.changedTouches?.[0])
    App.setPointerDown(
      e.changedTouches?.[0].pageX,
      e.changedTouches?.[0].pageY
    );
  else App.setPointerDown(e.pageX, e.pageY);
}

function handlePointerUp(e: any) {
  if (e.changedTouches?.[0])
    App.setPointerUp(e.changedTouches?.[0].pageX, e.changedTouches?.[0].pageY);
  else App.setPointerUp(e.pageX, e.pageY);
}

function handlePointerMove(e: any) {
  if (e.changedTouches?.[0])
    App.setPointerPosition(
      e.changedTouches?.[0].pageX,
      e.changedTouches?.[0].pageY
    );
  else App.setPointerPosition(e.pageX, e.pageY);
}

function GLView() {
  return (
    <Box
      component="div"
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onMouseUp={handlePointerUp}
      onTouchEnd={handlePointerUp}
      onMouseMove={handlePointerMove}
      onTouchMove={handlePointerMove}
      width={"100%"}
      height={"100%"}
      sx={{ touchAction: "none" }}
    >
      <Canvas
        frameloop={CameraManager.shouldCapturePreview ? "demand" : "always"}
        linear
        flat
        dpr={[0.25, window.devicePixelRatio]}
        performance={{ min: 0.2, debounce: 10 }}
      >
        <OrthographicCamera
          makeDefault
          manual
          position={[0, 0, 1]}
          left={-1}
          right={1}
          top={1}
          bottom={-1}
          near={0}
          far={1}
        />
        <ShaderQuad />
        <AdaptiveDpr pixelated />
      </Canvas>
    </Box>
  );
}

export default observer(GLView);
