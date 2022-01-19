import * as THREE from "three";

const VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  float x = -1.0 + float((gl_VertexID & 1) << 2);
  float y = -1.0 + float((gl_VertexID & 2) << 1);
  vUv.x = (x+1.0)*0.5;
  vUv.y = (y+1.0)*0.5;
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

  constructor(shaderCode: string) {
    super({
      vertexShader: VERTEX_SHADER,
    });

    this.fragmentShader = FRAGMENT_SHADER + "\n" + shaderCode;

    this.update();
  }

  resize(width: number, height: number) {
    this.uniforms.iResolution.value.set(width, height);
  }

  update() {
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

    for (let i = 0; i < 4; i++) {
      const uniformName = "iChannel" + i;
      const image = (this.uniforms as any)[uniformName]?.value?.image;
      if (image) {
        this.uniforms.iChannelResolution.value[i] = new THREE.Vector3(
          image.width,
          image.height
        );
      }
    }

    requestAnimationFrame(() => this.update());
  }
}
