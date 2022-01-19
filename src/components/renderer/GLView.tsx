import { OrthographicCamera, ScreenQuad, useAspect } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { observer } from "mobx-react";
import { useMemo } from "react";
import CameraManager from "../../services/CameraManager";
import Camera from "../../services/CameraManager";
import ShaderToyMaterial from "./ShaderToyMaterial";

function ShaderCanvas() {
  const { size, gl: renderer, scene, camera } = useThree();

  const code = `
  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
      // input: pixel coordinates
      vec2 p = (-iResolution.xy + 2.0*fragCoord)/iResolution.y;
  
      // angle of each pixel to the center of the screen
      float a = atan(p.y,p.x);
      
      // modified distance metric
      float r = pow( pow(p.x*p.x,4.0) + pow(p.y*p.y,4.0), 1.0/8.0 );
      
      // index texture by (animated inverse) radious and angle
      vec2 uv = vec2( 1.0/r + 0.2*iTime, a );
  
      // pattern: cosines
      float f = cos(12.0*uv.x)*cos(6.0*uv.y);
  
      // color fetch: palette
      vec3 col = 0.5 + 0.5*sin( 3.1416*f + vec3(0.0,0.5,1.0) );
      
      // lighting: darken at the center    
      col = col*r;
      
      // output: pixel color
      fragColor = vec4( col, 1.0 );
  }`;

  const material = useMemo(() => {
    return new ShaderToyMaterial(code);
  }, []);

  useFrame(() => {
    material.resize(size.width, size.height);
    CameraManager.setRenderParams(renderer, camera, scene);
  });

  const scale = useAspect(size.width, size.height, 1);

  return (
    <mesh scale={scale}>
      <planeBufferGeometry args={[1, 1, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );

  return (
    <ScreenQuad>
      <primitive object={material} attach="material" />
    </ScreenQuad>
  );
}

function GLView() {
  return (
    <Canvas dpr={window.devicePixelRatio}>
      <OrthographicCamera />
      <ShaderCanvas />
    </Canvas>
  );
}

export default observer(GLView);
