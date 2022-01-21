import * as THREE from "three";
import { Shader } from "../../services/ShaderManager";

const VERTEX_SHADER = `
varying vec2 vUv;
uniform vec3 iChannelResolution[4]; 

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const BASE_FRAGMENT_SHADER = `
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

vec4 textureCover(sampler2D tex, vec2 uv, int iChannelIndex){
  vec3 iChannelRes = iChannelResolution[iChannelIndex];

  float contentWidth = iChannelRes.x;
  float contentHeight = iChannelRes.y;
  float containerWidth = iResolution.x;
  float containerHeight = iResolution.y;

  float contentRatio = contentWidth / contentHeight;
  float containerRatio = containerWidth / containerHeight;
  float resultWidth = contentRatio > containerRatio? (containerWidth / (containerHeight * contentRatio)) : 1.0;
  float resultHeight = contentRatio > containerRatio? 1.0 : (containerHeight / (containerWidth / contentRatio));
  float offsetLeft = (1.0 - resultWidth) * 0.5;
  float offsetTop = (1.0 - resultHeight) * 0.5;
 
  return texture(tex, uv * vec2(resultWidth, resultHeight) + vec2(offsetLeft, offsetTop));
}

void mainImage(out vec4, vec2 fragCoord);
void main () {
  vec4 outfrag;
  mainImage(outfrag, iResolution * vUv);
  gl_FragColor = outfrag;
}
`;

const DEFAULT_FRAGMENT_SHADER = `
const float test1 = 1.0; // @param min -1, max 1
const float test2 = -1.0; // @param min -10, max 10

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 uv = fragCoord / iResolution.xy;
  fragColor = texture(iChannel0, uv) * test1;
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

  shader?: Shader;

  constructor(shader?: Shader) {
    super({
      vertexShader: VERTEX_SHADER,
      fragmentShader:
        BASE_FRAGMENT_SHADER +
        "\n" +
        (shader?.passes[0].code || DEFAULT_FRAGMENT_SHADER),
    });

    this.fragmentShader = this.fragmentShader.replace(
      /(texture)(\(\s*iChannel)(\d)(\s*,\s*.*)(\))/g,
      "$1Cover$2$3$4,$3$5"
    );

    this.shader = shader;

    this.updateUniforms();
  }

  setSize(width: number, height: number) {
    this.uniforms.iResolution.value.set(width, height);
  }

  updateUniforms() {
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

      // custom uniforms
      if (this.shader) {
        for (const parameter of Object.values(
          this.shader.passes[0].parameters
        )) {
          (this.uniforms as any)[parameter.name] = {
            value: parameter.value,
          };
        }
      }
    }

    requestAnimationFrame(() => this.updateUniforms());
  }

  updateMouseUniforms(
    isPointerDown: boolean,
    pointerPosition: { x: number; y: number },
    pointerDownPosition: { x: number; y: number }
  ) {
    const invertedY = this.uniforms.iResolution.value.y - pointerDownPosition.y;

    this.uniforms.iMouse.value.set(
      pointerPosition.x,
      this.uniforms.iResolution.value.y - pointerPosition.y,
      !isPointerDown ? -pointerDownPosition.x : pointerDownPosition.x,
      !isPointerDown ? -invertedY : invertedY
    );
  }

  updateInputTextures(textures: (THREE.Texture | undefined)[]) {
    for (let i = 0; i < 4; i++) {
      const uniformName = "iChannel" + i;

      (this.uniforms as any)[uniformName] = {
        value: textures[i],
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
}
