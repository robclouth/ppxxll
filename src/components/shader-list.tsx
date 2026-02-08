import { Plus, ChevronDown, Check } from "lucide-react";
import { observer } from "mobx-react";
import { useState } from "react";
import ShaderManager from "../services/shader-manager";
import { Shader } from "../types";
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
          <h2 className="ml-2 flex-1 text-lg font-semibold">Shaders</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAddShaderOpen(true)}
            aria-label="add shader"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {Object.values(ShaderManager.shaders).map((shader) => (
            <div
              key={shader.id}
              className="flex items-center hover:bg-white/5"
            >
              <button
                className="flex-1 flex items-center px-4 py-3 text-left cursor-pointer"
                onClick={() => handleSelectShader(shader)}
              >
                <div className="w-8 flex-shrink-0">
                  {ShaderManager.activeShader === shader && (
                    <Check className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="text-sm">{shader.title}</div>
                  <div className="text-xs text-white/50">{shader.author}</div>
                </div>
              </button>
              <ItemMenu
                options={["Delete", "View in Shadertoy"]}
                onSelect={(index) => {
                  if (index === 0) handleShaderDelete(shader.id);
                  else if (index === 1) handleGoToShadertoy(shader.id);
                }}
                className="mr-2"
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
      </DialogFullScreen>
    </Dialog>
  );
}

export default observer(ShaderList);
