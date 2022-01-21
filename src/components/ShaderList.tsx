import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  AppBar,
  Dialog,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Slide,
  Toolbar,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react";
import { forwardRef } from "react";
import ShaderManager, { Shader } from "../services/ShaderManager";

const Transition = forwardRef<any>(function Transition(props: any, ref: any) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface Props {
  open: boolean;
  onClose: () => void;
}

function ShaderList({ open, onClose }: Props) {
  function handleClose() {
    onClose();
  }

  function handleSelectShader(shader: Shader) {
    ShaderManager.setShader(shader);
    handleClose();
  }

  return (
    <Dialog
      container={document.getElementById("cameraView")}
      fullScreen
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition as any}
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
          >
            <KeyboardArrowDownIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Shaders
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
          >
            <AddIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <List>
        {Object.values(ShaderManager.shaders).map((shader) => (
          <ListItem
            key={shader.id}
            button
            onClick={() => handleSelectShader(shader)}
          >
            {ShaderManager.activeShader === shader && (
              <ListItemIcon>
                <CheckIcon />
              </ListItemIcon>
            )}
            <ListItemText
              inset={ShaderManager.activeShader !== shader}
              primary={shader.name}
              secondary={shader.description}
            />
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
}

export default observer(ShaderList);
