import * as THREE from "three";
import CameraManager from "../../services/CameraManager";

const VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 iResolution;
varying vec2 vUv;
uniform float iTime; 
uniform float iTimeDelta; 
uniform int iFrame; 
uniform float iChannelTime[4]; 
uniform vec3 iChannelResolution[4]; 
uniform vec4 iMouse; 
uniform sampler2D iChannel0, iChannel1, iChannel2, iChannel3;
uniform vec4 iDate;
uniform float iSampleRate;


void mainImage(out vec4, vec2 fragCoord);
void main () {
  vec4 outfrag;
  mainImage(outfrag, iResolution * vUv);
  gl_FragColor = outfrag;
}
`;

export default class ShaderToyMaterial extends THREE.ShaderMaterial {
  clock = new THREE.Clock();

  uniforms = {
    iResolution: { value: new THREE.Vector2() },
    iTime: { value: 0 },
    iTimeDelta: { value: 0 },
    iFrame: { value: 0 },
    iChannelTime: { value: new THREE.Vector4() },
    iChannelResolution: {
      value: [
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ],
    },
    iMouse: { value: new THREE.Vector4() },
    iChannel0: {
      value: null,
    },
    iChannel1: {
      value: null,
    },
    iChannel2: {
      value: null,
    },
    iChannel3: {
      value: null,
    },
    iDate: { value: new THREE.Vector4() },
    iSampleRate: { value: 0 },
  };

  shouldUpdateUniforms = true;
  shaderCode: string;

  constructor(shaderCode: string) {
    super({
      vertexShader: VERTEX_SHADER,
    });

    this.shaderCode = shaderCode;
    this.fragmentShader = FRAGMENT_SHADER + "\n" + shaderCode;

    this.update();
  }

  resize(width: number, height: number) {
    this.uniforms.iResolution.value.set(width, height);
  }

  update() {
    if (this.shouldUpdateUniforms) {
      this.uniforms.iTime.value = this.clock.getElapsedTime();
      this.uniforms.iTimeDelta.value = this.clock.getDelta();
      this.uniforms.iFrame.value = this.uniforms.iFrame.value + 1;

      const date = new Date();
      const seconds =
        date.getSeconds() + 60 * date.getMinutes() + 60 * 60 * date.getHours();
      this.uniforms.iDate.value = new THREE.Vector4(
        date.getFullYear(),
        date.getMonth(),
        date.getDay(),
        seconds
      );

      const { isPointerDown, pointerPosition, pointerDownPosition } =
        CameraManager;

      const invertedY =
        this.uniforms.iResolution.value.y - pointerDownPosition.y;

      this.uniforms.iMouse.value.set(
        pointerPosition.x,
        this.uniforms.iResolution.value.y - pointerPosition.y,
        !isPointerDown ? -pointerDownPosition.x : pointerDownPosition.x,
        !isPointerDown ? -invertedY : invertedY
      );

      for (let i = 0; i < 4; i++) {
        const uniformName = "iChannel" + i;

        (this.uniforms as any)[uniformName] = {
          value: CameraManager.textures[i],
        };

        const image = (this.uniforms as any)[uniformName]?.value?.image;
        if (image) {
          this.uniforms.iChannelResolution.value[i] = new THREE.Vector3(
            image.width,
            image.height,
            1
          );
        }
      }
    }

    requestAnimationFrame(() => this.update());
  }
}
