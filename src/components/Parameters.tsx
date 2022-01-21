import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  AppBar,
  Box,
  Dialog,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Slide,
  Slider,
  SwipeableDrawer,
  Toolbar,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react";
import { forwardRef } from "react";
import ShaderManager, { Parameter, Shader } from "../services/ShaderManager";
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
        component="div"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <ParameterSlider key={parameter.name} parameter={parameter} />
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
