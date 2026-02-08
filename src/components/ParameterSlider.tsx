import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import Input from "@mui/material/Input";
import { observer } from "mobx-react";
import { Parameter } from "../types";
import startCase from "lodash-es/startCase";
import { useState } from "react";

type Props = {
  parameter: Parameter;
};

function ParameterSlider({ parameter }: Props) {
  const [value, setValue] = useState(parameter.value.toString());

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    parameter.value = newValue as number;
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
    <Box component="div">
      <Typography variant="caption" id="input-slider" sx={{ p: 0, m: 0 }}>
        {startCase(parameter.name)}
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid size="grow">
          <Slider
            size="small"
            value={typeof parameter.value === "number" ? parameter.value : 0}
            onChange={handleSliderChange}
            aria-labelledby="input-slider"
            min={parameter.minValue}
            max={parameter.maxValue}
            step={0.001}
          />
        </Grid>
        <Grid>
          <Input
            value={value}
            size="small"
            onChange={handleInputChange}
            inputProps={{
              step: 0.1,
              min: parameter.minValue,
              max: parameter.maxValue,
              type: "number",
              "aria-labelledby": "input-slider",
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default observer(ParameterSlider);
