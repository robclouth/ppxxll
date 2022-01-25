import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  AppBar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Slide,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react";
import { forwardRef, useState } from "react";
import ShaderManager, { Shader } from "../services/ShaderManager";
import TextureManager from "../services/TextureManager";
import ItemMenu from "./ItemMenu";

const Transition = forwardRef<any>(function Transition(props: any, ref: any) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface Props {
  open: boolean;
  onClose: () => void;
}

function ShaderList({ open, onClose }: Props) {
  const [addTextureOpen, setAddTextureOpen] = useState(false);
  const [shaderToyId, setShaderToyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function handleClose() {
    onClose();
  }

  function handleSelectShader(shader: Shader) {
    ShaderManager.setShader(shader);
    handleClose();
  }

  function handleAddShaderOpen() {
    setAddTextureOpen(true);
  }

  function handleAddShaderClose() {
    setAddTextureOpen(false);
  }

  async function handleShaderToyIdInputBlur(url: string) {
    setShaderToyId(url);
  }

  async function handleAddPress() {
    try {
      setError("");
      await ShaderManager.addShaderToyShader(shaderToyId!);
      handleAddShaderClose();
    } catch (err) {
      setError("Unable to get shader");
    }
  }

  function handleShaderDelete(id: string) {
    ShaderManager.deleteShader(id);
  }

  function handleGoToShaderToy(id: string) {
    window.open(
      `https://www.shadertoy.com/view/${id}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <Dialog
      container={document.getElementById("cameraView")}
      fullScreen
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition as any}
      keepMounted
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
            onClick={handleAddShaderOpen}
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
            disablePadding
            secondaryAction={
              <ItemMenu
                options={["Delete", "View in ShaderToy"]}
                onSelect={(index) => {
                  if (index === 0) handleShaderDelete(shader.id);
                  else if (index === 1) handleGoToShaderToy(shader.id);
                }}
              />
            }
          >
            {ShaderManager.activeShader === shader && (
              <ListItemIcon>
                <CheckIcon />
              </ListItemIcon>
            )}
            <ListItemButton onClick={() => handleSelectShader(shader)}>
              <ListItemText
                inset={ShaderManager.activeShader !== shader}
                primary={shader.title}
                secondary={shader.author}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Dialog open={addTextureOpen} onClose={handleAddShaderClose}>
        <DialogTitle>Add Shader</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            id="name"
            fullWidth
            variant="standard"
            placeholder="ShaderToy ID"
            sx={{ mb: 1 }}
            onChange={(e) => handleShaderToyIdInputBlur(e.target.value)}
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddShaderClose}>Cancel</Button>
          <Button onClick={handleAddPress} disabled={!shaderToyId}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

export default observer(ShaderList);
