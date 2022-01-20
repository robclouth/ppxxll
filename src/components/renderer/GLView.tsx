import { Box } from "@mui/material";
import { AdaptiveDpr, OrthographicCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { observer } from "mobx-react";
import { useEffect } from "react";
import { imageEffects, pointerTest } from "../../constants/testShaders";
import CameraManager from "../../services/CameraManager";

const ShaderCanvas = observer(() => {
  const code = imageEffects;

  useEffect(() => {
    CameraManager.setShaderCode(code);
  }, []);

  const { size } = useThree();

  useFrame(() => CameraManager.material?.resize(size.width, size.height));

  return (
    <mesh material={CameraManager.material}>
      <planeBufferGeometry args={[2, 2, 1, 1]} />
    </mesh>
  );
});

function handlePointerDown(e: any) {
  // e.preventDefault();
  if (e.changedTouches?.[0])
    CameraManager.setPointerDown(
      e.changedTouches?.[0].pageX,
      e.changedTouches?.[0].pageY
    );
  else CameraManager.setPointerDown(e.pageX, e.pageY);
}

function handlePointerUp(e: any) {
  // e.preventDefault();
  if (e.changedTouches?.[0])
    CameraManager.setPointerUp(
      e.changedTouches?.[0].pageX,
      e.changedTouches?.[0].pageY
    );
  else CameraManager.setPointerUp(e.pageX, e.pageY);
}

function handlePointerMove(e: any) {
  // e.preventDefault();
  if (e.changedTouches?.[0])
    CameraManager.setPointerPosition(
      e.changedTouches?.[0].pageX,
      e.changedTouches?.[0].pageY
    );
  else CameraManager.setPointerPosition(e.pageX, e.pageY);
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
        frameloop={CameraManager.isExporting ? "demand" : "always"}
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
        <ShaderCanvas />
        <AdaptiveDpr pixelated />
      </Canvas>
    </Box>
  );
}

export default observer(GLView);
