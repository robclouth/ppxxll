import {
  AppBar,
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  IconButton,
  ImageList,
  ImageListItem,
  Slide,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react";
import { forwardRef, useEffect, useRef, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CameraManager from "../services/CameraManager";
import TextureManager from "../services/TextureManager";
import ItemMenu from "./ItemMenu";

const Transition = forwardRef<any>(function Transition(props: any, ref: any) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface Props {
  open: boolean;
  onClose: () => void;
  onTextureSelect: (url: string | null, type: string) => void;
}

function TextureList({ open, onClose, onTextureSelect }: Props) {
  const { textures } = TextureManager;

  const texture = CameraManager.cameraTexture;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [addTextureOpen, setAddTextureOpen] = useState(false);

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  function updateCanvas() {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx!.drawImage(texture?.image, 0, 0, canvas.width, canvas.height);
  }

  useEffect(() => {
    if (CameraManager.cameraTexture?.image) {
      const timer = setInterval(() => updateCanvas(), 100);
      return () => clearInterval(timer);
    } else updateCanvas();
  }, [texture?.image]);

  function handleClose() {
    onClose();
  }

  function handleAddTextureOpen() {
    setAddTextureOpen(true);
  }

  function handleAddTextureClose() {
    setAddTextureOpen(false);
  }

  function handleAddFromFilePress() {
    fileInputRef?.current?.click();
  }

  function handleFileSelected(fileList: FileList | null) {
    if (fileList && fileList.length > 0) {
      const imageFile = fileList[0];
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    }
  }

  async function handleUrlInputBlur(url: string) {
    setImageUrl(url);
  }

  async function handleAddPress() {
    TextureManager.addTextureFromUrl(imageUrl!);
    handleAddTextureClose();
  }

  function handleTextureDelete(url: string) {
    TextureManager.deleteTexture(url);
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
            Inputs
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleAddTextureOpen}
            aria-label="close"
          >
            <AddIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="div"
        sx={{
          overflowY: "auto",
          height: "100%",
        }}
      >
        <ImageList cols={3} gap={3} sx={{ margin: 0 }}>
          {CameraManager.cameraTexture?.image && (
            <ButtonBase onClick={() => onTextureSelect(null, "camera")}>
              <ImageListItem>
                <canvas
                  ref={canvasRef}
                  style={{ width: "100%", height: "100%" }}
                />
              </ImageListItem>
            </ButtonBase>
          )}
          {textures.map((url, i) => (
            <ImageListItem key={url} style={{ width: "100%", height: "100%" }}>
              <ButtonBase
                key={url}
                onClick={() => onTextureSelect(url, "image")}
                sx={{ width: "100%", height: "100%" }}
              >
                <img
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  src={url}
                  loading="lazy"
                />
              </ButtonBase>
              <ItemMenu
                options={["Delete"]}
                onSelect={(index) => {
                  if (index === 0) handleTextureDelete(url);
                }}
                sx={{ position: "absolute", top: 0, right: 0, m: 0 }}
              />
            </ImageListItem>
          ))}
        </ImageList>
      </Box>
      <Dialog open={addTextureOpen} onClose={handleAddTextureClose}>
        <input
          type="file"
          id="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={(e) => handleFileSelected(e.target.files)}
        />

        <DialogTitle>Add texture</DialogTitle>
        <DialogContent>
          <Button
            variant="outlined"
            sx={{ mb: 1 }}
            onClick={handleAddFromFilePress}
            fullWidth
          >
            Add from local file
          </Button>
          <Typography textAlign="center" sx={{ mt: 1, mb: 1 }}>
            OR
          </Typography>
          <TextField
            autoFocus
            id="name"
            fullWidth
            variant="standard"
            placeholder="Add from URL"
            sx={{ mb: 1 }}
            onBlur={(e) => handleUrlInputBlur(e.target.value)}
          />
          {imageUrl && (
            <img
              style={{ width: "100%", maxHeight: "30vh", objectFit: "contain" }}
              src={imageUrl}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddTextureClose}>Cancel</Button>
          <Button onClick={handleAddPress} disabled={!imageUrl}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

export default observer(TextureList);
