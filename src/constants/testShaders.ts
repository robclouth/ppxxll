export const pointerTest = `
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec3 col = vec3(0.);

    //Draw a red cross where the mouse button was last down.
    if(abs(iMouse.x-fragCoord.x) < 4.) {
        col = vec3(1.,0.,0.);
    }
    if(abs(iMouse.y-fragCoord.y) < 4.) {
        col = vec3(1.,0.,0.);
    }
    
    //If the button is currently up, (iMouse.z, iMouse.w) is where the mouse
    //was when the button last went down.
    if(abs(iMouse.z-fragCoord.x) < 2.) {
        col = vec3(0.,0.,1.);
    }
    if(abs(iMouse.w-fragCoord.y) < 2.) {
        col = vec3(0.,0.,1.);
    }
    
    //If the button is currently down, (-iMouse.z, -iMouse.w) is where
    //the button was when the click occurred.
    if(abs(-iMouse.z-fragCoord.x) < 2.) {
        col = vec3(0.,1.,0.);
    }
    if(abs(-iMouse.w-fragCoord.y) < 2.) {
        col = vec3(0.,1.,0.);
    }
    
    fragColor = vec4(col, 1.0);
}
`;

export const imageEffects = `
// The MIT License
// Copyright © 2021 Ololee
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#define SCALE 1.9  // magnification times,it must greater than 1.0
#define BETA 7.0  // whiteing fractor. it's suit for me.
#define MAGNIFY_SIZE 0.5
#define MIRROR_SWITCH //Mirror switch


/*
whiteing the image. 
beta must not be 1.0 or a negative number
*/
void whitening(inout vec3 col,float beta){
   col = log(col*(beta-1.0)+1.0)/log(beta);
}


/*
thanks iq for his method
link:  https://www.shadertoy.com/view/3ltSW2
*/
float sdCircle( in vec2 p, in float r ) 
{
    return length(p)-r;
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // range from [0,1]
    vec2 uv = fragCoord/iResolution.xy;
    vec2 ms = iMouse.xy/iResolution.xy;  
    // range from [-1,1]
    vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y;
    vec2 m = (2.0*iMouse.xy-iResolution.xy)/iResolution.y; 
    float scale = 1.0/SCALE;
   
   // mirror   
    #ifdef MIRROR_SWITCH
        vec2 one_zero = vec2(1.0,0.0);
        vec2 minusOne_zero = vec2(-1.0,1.0);
        uv = one_zero + uv*minusOne_zero;
        ms = one_zero + ms*minusOne_zero;
        
    #endif    
    ms *=(1.0-scale);
   vec3 col =texture(iChannel0,uv).xyz;
   whitening(col,BETA);
   if( iMouse.z>0.001 )
   {
       vec3 colScale = texture(iChannel0,scale*uv+ms).xyz;
       whitening(colScale,BETA);
       col = mix(colScale,col, smoothstep(0.0, 0.01, length(p-m)-MAGNIFY_SIZE));
   }
   
   fragColor = vec4(col,1.0);
}
`;

export const circle = `
vec3 sdfCircle(vec2 uv, float r) {
  float x = uv.x;
  float y = uv.y;
  
  float d = length(vec2(x, y)) - r;
  
  return d > 0. ? vec3(0.) : 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0,2,4));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 uv = fragCoord/iResolution.xy; // <0,1>
  uv -= 0.5;
  uv.x *= iResolution.x/iResolution.y; // fix aspect ratio
  
  vec3 col = sdfCircle(uv, .2);

  // Output to screen
  fragColor = vec4(col,1.0);
}
`;
