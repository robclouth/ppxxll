import { observer } from "mobx-react";
import { Parameter } from "../types";
import startCase from "lodash-es/startCase";
import { useState } from "react";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";

type Props = {
  parameter: Parameter;
};

function ParameterSlider({ parameter }: Props) {
  const [value, setValue] = useState(parameter.value.toString());

  const handleSliderChange = (newValue: number[]) => {
    parameter.value = newValue[0];
    setValue(parameter.value.toString());
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    updateParameterValue(event.target.value);
  };

  function updateParameterValue(text: string) {
    const newValue = parseFloat(text);
    if (newValue < parameter.minValue) {
      parameter.value = parameter.minValue;
    } else if (newValue > parameter.maxValue) {
      parameter.value = parameter.maxValue;
    } else {
      parameter.value = newValue;
    }
  }

  return (
    <div>
      <label className="text-xs text-white/70" id="input-slider">
        {startCase(parameter.name)}
      </label>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Slider
            value={[typeof parameter.value === "number" ? parameter.value : 0]}
            onValueChange={handleSliderChange}
            aria-labelledby="input-slider"
            min={parameter.minValue}
            max={parameter.maxValue}
            step={0.001}
          />
        </div>
        <Input
          value={value}
          onChange={handleInputChange}
          type="number"
          step={0.1}
          min={parameter.minValue}
          max={parameter.maxValue}
          aria-labelledby="input-slider"
          className="w-20"
        />
      </div>
    </div>
  );
}

export default observer(ParameterSlider);
