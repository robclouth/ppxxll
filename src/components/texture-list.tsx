import { observer } from "mobx-react";
import { useEffect, useRef, useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import CameraManager from "../services/camera-manager";
import TextureManager from "../services/texture-manager";
import ItemMenu from "./item-menu";
import {
  Dialog,
  DialogFullScreen,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface Props {
  open: boolean;
  onClose: () => void;
  onTextureSelect: (url: string | null, type: string) => void;
}

function TextureList({ open, onClose, onTextureSelect }: Props) {
  const { textures } = TextureManager;

  const texture = CameraManager.cameraTexture;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [addTextureOpen, setAddTextureOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  function updateCanvas() {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx!.drawImage(texture?.image, 0, 0, canvas.width, canvas.height);
  }

  useEffect(() => {
    if (CameraManager.cameraTexture?.image) {
      const timer = setInterval(() => updateCanvas(), 100);
      return () => clearInterval(timer);
    } else updateCanvas();
  }, [texture?.image]);

  function handleAddFromFilePress() {
    fileInputRef?.current?.click();
  }

  function handleFileSelected(fileList: FileList | null) {
    if (fileList && fileList.length > 0) {
      const imageFile = fileList[0];
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    }
  }

  async function handleAddPress() {
    TextureManager.addTextureFromUrl(imageUrl!);
    setAddTextureOpen(false);
  }

  function handleTextureDelete(url: string) {
    TextureManager.deleteTexture(url);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogFullScreen>
        <div className="flex items-center px-4 py-3 bg-neutral-800">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="close"
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
          <h2 className="ml-2 flex-1 text-lg font-semibold">Inputs</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAddTextureOpen(true)}
            aria-label="add texture"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-[3px] m-0">
            {CameraManager.cameraTexture?.image && (
              <button
                className="cursor-pointer"
                onClick={() => onTextureSelect(null, "camera")}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full"
                />
              </button>
            )}
            {textures.map((url) => (
              <div key={url} className="relative w-full h-full">
                <button
                  className="w-full h-full cursor-pointer"
                  onClick={() => onTextureSelect(url, "image")}
                >
                  <img
                    className="w-full h-full object-cover"
                    src={url}
                    loading="lazy"
                  />
                </button>
                <ItemMenu
                  options={["Delete"]}
                  onSelect={(index) => {
                    if (index === 0) handleTextureDelete(url);
                  }}
                  className="absolute top-0 right-0"
                />
              </div>
            ))}
          </div>
        </div>

        <Dialog open={addTextureOpen} onOpenChange={setAddTextureOpen}>
          <DialogContent>
            <DialogTitle>Add texture</DialogTitle>
            <DialogDescription className="sr-only">
              Add a texture from a local file or URL
            </DialogDescription>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileSelected(e.target.files)}
            />
            <div className="mt-4 space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAddFromFilePress}
              >
                Add from local file
              </Button>
              <p className="text-center text-sm text-white/50">OR</p>
              <Input
                autoFocus
                placeholder="Add from URL"
                onBlur={(e) => setImageUrl(e.target.value)}
              />
              {imageUrl && (
                <img
                  className="w-full max-h-[30vh] object-contain"
                  src={imageUrl}
                />
              )}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAddTextureOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPress} disabled={!imageUrl}>
                  Add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogFullScreen>
    </Dialog>
  );
}

export default observer(TextureList);
