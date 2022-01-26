# ppxxll

**ppxxll** is an open-source photo effects app built using web-technologies. Results are renderered at full photo resolution using a tile-based rendering system from [dekapng](https://github.com/greggman/dekapng).

Check it out [here](www.ppxxll.vercel.app).

The app is a PWA, so you can download it to desktop and run it offline.

Only tested on chrome for android and desktop.

### Instructions

- Select an effect with the top-left menu
- Switch camera using the button in the bottom-left corner
- Edit effect parameters using the button in the bottom-right corner
- Take a picture using the shutter button
- Preview the result then either share or download

### Effects

The effects are taken from [ShaderToy](www.shadertoy.com). To add a new shader, open the top-left menu in the camera view to open the shader selection menu, then press the **+** button and enter a ShaderToy shader URL (e.g. https://www.shadertoy.com/view/fdscD2). For now, only single pass shaders are supported.

### Inputs

When a shader has inputs, you can use the **+** buttons on the left side of the camera view to open the input select screen. Inputs can be either the camera input or images. To add an image press the **+** button in the top-right of the input select screen.

### Parameters

Effects can have parameters. To edit them press the icon in the bottom right of the camera view. If there is no icon then the effect doesn't have parameters.

To define parameters in your own shaders, the variables you wish to be editable must be annotated with a specific comment on the same line, as follows:

```
const float brightness = 1.0; // @param min -10, max 10
```

Only globally defined const floats are supported. You must include the min and max values.

### TODO

- [ ] Support multipass shaders (esp. feedback shaders)
- [ ] Support more parameter types (esp. colors)
- [ ] Video recording
- [ ] Phone sensor inputs (gyroscope etc.)
- [ ] More in-built shaders
- [ ] JPEG output instead of PNG
