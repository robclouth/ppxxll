import { Plus, Check } from "lucide-react";
import { observer } from "mobx-react";
import { useState } from "react";
import ShaderManager from "../services/shader-manager";
import { Shader } from "../types";
import ItemMenu from "./item-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "./ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

function ShaderList({ open, onClose }: Props) {
  const [addShaderOpen, setAddShaderOpen] = useState(false);
  const [shadertoyUrl, setShadertoyUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  function handleSelectShader(shader: Shader) {
    ShaderManager.setShader(shader);
    onClose();
  }

  async function handleAddPress() {
    try {
      setError("");
      const match = shadertoyUrl?.match(
        /^https:\/\/www\.shadertoy\.com\/view\/(\w+)/
      );
      if (!match) {
        setError("Invalid Shadertoy URL");
        return;
      }

      await ShaderManager.addShadertoyShader(shadertoyUrl!);
      setAddShaderOpen(false);
    } catch (err) {
      setError("Unable to get shader");
    }
  }

  function handleShaderDelete(id: string) {
    ShaderManager.deleteShader(id);
  }

  function handleGoToShadertoy(id: string) {
    window.open(
      `https://www.shadertoy.com/view/${id}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="flex flex-row items-center justify-between">
          <div>
            <DrawerTitle>Shaders</DrawerTitle>
            <DrawerDescription className="sr-only">
              Select a shader effect
            </DrawerDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAddShaderOpen(true)}
            aria-label="add shader"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {Object.values(ShaderManager.shaders).map((shader) => (
            <div
              key={shader.id}
              className={cn(
                "flex items-center rounded-md",
                "hover:bg-white/5",
                ShaderManager.activeShader === shader && "bg-white/5"
              )}
            >
              <button
                className="flex-1 flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer"
                onClick={() => handleSelectShader(shader)}
              >
                <div className="w-5 flex-shrink-0">
                  {ShaderManager.activeShader === shader && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{shader.title}</div>
                  <div className="text-xs text-white/50">{shader.author}</div>
                </div>
              </button>
              <ItemMenu
                options={["Delete", "View in Shadertoy"]}
                onSelect={(index) => {
                  if (index === 0) handleShaderDelete(shader.id);
                  else if (index === 1) handleGoToShadertoy(shader.id);
                }}
                className="mr-1"
              />
            </div>
          ))}
        </div>

        <Dialog open={addShaderOpen} onOpenChange={setAddShaderOpen}>
          <DialogContent>
            <DialogTitle>Add Shader</DialogTitle>
            <DialogDescription className="sr-only">
              Enter a Shadertoy URL to add a shader
            </DialogDescription>
            <div className="mt-4 space-y-4">
              <Input
                autoFocus
                placeholder="Shadertoy URL"
                onChange={(e) => setShadertoyUrl(e.target.value)}
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAddShaderOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPress} disabled={!shadertoyUrl}>
                  Add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DrawerContent>
    </Drawer>
  );
}

export default observer(ShaderList);
