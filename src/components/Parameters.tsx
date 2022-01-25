import { Box, Drawer } from "@mui/material";
import { observer } from "mobx-react";
import ShaderManager, { Parameter } from "../services/ShaderManager";
import ParameterSlider from "./ParameterSlider";

interface Props {
  open: boolean;
  onClose: () => void;
}

function Parameters({ open, onClose }: Props) {
  const { activeShader } = ShaderManager;

  const parameters = activeShader?.passes[0].parameters
    ? Object.values(activeShader?.passes[0].parameters)
    : [];

  function handleClose() {
    onClose();
  }

  function renderParameter(parameter: Parameter) {
    return (
      <Box
        key={parameter.name}
        component="div"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <ParameterSlider parameter={parameter} />
      </Box>
    );
  }

  return (
    <Drawer
      anchor={"bottom"}
      open={open}
      onClose={handleClose}
      ModalProps={{
        BackdropProps: {
          invisible: true,
        },
      }}
      PaperProps={{
        sx: {
          backgroundColor: "transparent",
        },
      }}
      container={document.getElementById("cameraView")}
      keepMounted
    >
      <Box
        component="div"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          p: 1,
          overflowX: "hidden",
          overflowY: "auto",
          maxHeight: "30vh",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      >
        {parameters.map((parameter) => renderParameter(parameter))}
      </Box>
    </Drawer>
  );
}

export default observer(Parameters);
