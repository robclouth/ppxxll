import { observer } from "mobx-react";
import { useState, useEffect } from "react";
import ShaderManager from "../services/shader-manager";
import ParameterSlider from "./parameter-slider";
import startCase from "lodash-es/startCase";
import { cn } from "../lib/utils";

function Parameters() {
  const { activeShader } = ShaderManager;
  const parameters = activeShader?.passes[0].parameters
    ? Object.values(activeShader?.passes[0].parameters)
    : [];

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [activeShader?.id]);

  if (parameters.length === 0) return null;

  const selectedParam = parameters[Math.min(selectedIndex, parameters.length - 1)];

  return (
    <div className="flex flex-col gap-2 py-2">
      {/* Parameter name selector - horizontal scroll with snap */}
      <div
        className="flex gap-1 overflow-x-auto px-4 snap-x snap-mandatory scrollbar-hide"
      >
        {parameters.map((param, i) => (
          <button
            key={param.name}
            className={cn(
              "flex-shrink-0 snap-center px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer",
              i === selectedIndex
                ? "text-white"
                : "text-white/40 hover:text-white/60"
            )}
            onClick={() => setSelectedIndex(i)}
          >
            {startCase(param.name)}
          </button>
        ))}
      </div>
      {/* Active parameter dial slider */}
      <ParameterSlider key={selectedParam.name} parameter={selectedParam} />
    </div>
  );
}

export default observer(Parameters);
