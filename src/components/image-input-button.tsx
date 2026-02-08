import { Plus } from "lucide-react";
import { observer } from "mobx-react";
import { useEffect, useRef, useState } from "react";
import CameraManager from "../services/camera-manager";
import ShaderManager from "../services/shader-manager";
import TextureList from "./texture-list";

type Props = {
  index: number;
};

function ImageInputButton({ index }: Props) {
  const texture = CameraManager.inputTextures[index];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function updateCanvas() {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx!.drawImage(texture?.image, 0, 0, canvas.width, canvas.height);
  }

  const [open, setOpen] = useState(false);

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  async function handleTextureSelect(url: string | null, type: string) {
    const input = ShaderManager.activeShader?.passes[0].inputs[index]!;

    if (url) {
      input.url = url;
    } else if (type === "camera") {
      input.url = undefined;
      input.type = "camera";
    }

    handleClose();
  }

  useEffect(() => {
    if (!texture?.image) return;
    if (texture?.image?.tagName === "VIDEO") {
      const timer = setInterval(() => updateCanvas(), 100);

      return () => clearInterval(timer);
    } else updateCanvas();
  }, [texture?.image]);

  return (
    <div className="w-[50px] h-[50px] rounded overflow-hidden relative my-1">
      {texture && !open && (
        <canvas
          ref={canvasRef}
          width={50}
          height={50}
          className="absolute top-0"
        />
      )}
      <button
        onClick={handleClickOpen}
        className="absolute top-0 left-0 w-[50px] h-[50px] text-white bg-black/20 hover:bg-black/10 flex items-center justify-center cursor-pointer"
      >
        <Plus className="h-6 w-6" />
      </button>
      <TextureList
        open={open}
        onClose={handleClose}
        onTextureSelect={handleTextureSelect}
      />
    </div>
  );
}

export default observer(ImageInputButton);
