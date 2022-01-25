import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  AppBar,
  Box,
  Button,
  ButtonBase,
  Dialog,
  IconButton,
  ImageList,
  ImageListItem,
  Slide,
  Toolbar,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react";
import { forwardRef, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { InputType } from "zlib";
import CameraManager from "../services/CameraManager";
import TextureList from "./TextureList";

type Props = {
  index: number;
};

function ImageInputButton({ index }: Props) {
  const texture = CameraManager.inputTextures[index];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function updateCanvas() {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx!.drawImage(texture?.image, 0, 0, canvas.width, canvas.height);
  }

  const [open, setOpen] = useState(false);

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  async function handleTextureSelect(url: string | null, type: InputType) {
    if (url) {
      new THREE.TextureLoader()
        .setCrossOrigin("anonymous")
        .load(url, (texture) => {
          CameraManager.setInputTexture(index, texture);
        });
    } else if (type === "camera") {
      CameraManager.setInputTexture(index, CameraManager.cameraTexture);
    }
    handleClose();
  }

  useEffect(() => {
    if (!texture?.image) return;
    if (texture?.image?.tagName === "VIDEO") {
      const timer = setInterval(() => updateCanvas(), 100);

      return () => clearInterval(timer);
    } else updateCanvas();
  }, [texture?.image]);

  return (
    <Box
      component="div"
      sx={{
        width: 50,
        height: 50,
        borderRadius: 1,
        overflow: "hidden",
        position: "relative",
        mt: 1,
        mb: 1,
      }}
    >
      {texture && !open && (
        <canvas
          ref={canvasRef}
          width={50}
          height={50}
          style={{ position: "absolute", top: 0 }}
        />
      )}
      <Button
        size="large"
        onClick={handleClickOpen}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 50,
          height: 50,
          color: "white",
          backgroundColor: "rgba(0,0,0,0.2)",
          "&:hover": {
            backgroundColor: "rgba(0,0,0,0.1)",
          },
        }}
        startIcon={<AddIcon sx={{ fontSize: 50 }} />}
      ></Button>
      <TextureList
        open={open}
        onClose={handleClose}
        onTextureSelect={handleTextureSelect}
      />
    </Box>
  );
}

export default observer(ImageInputButton);
