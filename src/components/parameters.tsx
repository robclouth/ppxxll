import { observer } from "mobx-react";
import ShaderManager from "../services/shader-manager";
import { Parameter } from "../types";
import ParameterSlider from "./parameter-slider";
import { cn } from "../lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

function Parameters({ open, onClose }: Props) {
  const { activeShader } = ShaderManager;

  const parameters = activeShader?.passes[0].parameters
    ? Object.values(activeShader?.passes[0].parameters)
    : [];

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40" onClick={onClose} />
      )}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex flex-col items-stretch p-2 overflow-x-hidden overflow-y-auto max-h-[30vh] bg-black/50 backdrop-blur-sm">
          {parameters.map((parameter) => (
            <div key={parameter.name} className="flex flex-col items-stretch">
              <ParameterSlider parameter={parameter} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default observer(Parameters);
