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

const itemData = [
  {
    img: "https://images.unsplash.com/photo-1549388604-817d15aa0110",
    title: "Bed",
  },
  {
    img: "https://images.unsplash.com/photo-1525097487452-6278ff080c31",
    title: "Books",
  },
  {
    img: "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6",
    title: "Sink",
  },
  {
    img: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3",
    title: "Kitchen",
  },
  {
    img: "https://images.unsplash.com/photo-1588436706487-9d55d73a39e3",
    title: "Blinds",
  },
  {
    img: "https://images.unsplash.com/photo-1574180045827-681f8a1a9622",
    title: "Chairs",
  },
  {
    img: "https://images.unsplash.com/photo-1530731141654-5993c3016c77",
    title: "Laptop",
  },
  {
    img: "https://images.unsplash.com/photo-1481277542470-605612bd2d61",
    title: "Doors",
  },
  {
    img: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7",
    title: "Coffee",
  },
  {
    img: "https://images.unsplash.com/photo-1516455207990-7a41ce80f7ee",
    title: "Storage",
  },
  {
    img: "https://images.unsplash.com/photo-1597262975002-c5c3b14bbd62",
    title: "Candle",
  },
  {
    img: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4",
    title: "Coffee table",
  },
];

const Transition = forwardRef<any>(function Transition(props: any, ref: any) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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

  function handleAddPress() {}

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  async function handleInputSelect(url: string | null, type: InputType) {
    if (url) {
      new THREE.TextureLoader().load(url, (texture) => {
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
              Inputs
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
        <Box
          component="div"
          sx={{
            overflowY: "scroll",
          }}
        >
          <ImageList cols={3} gap={3} sx={{ margin: 0 }}>
            <ButtonBase onClick={() => handleInputSelect(null, "camera")}>
              <ImageListItem>
                {open && (
                  <canvas
                    ref={canvasRef}
                    style={{ width: "100%", height: "100%" }}
                  />
                )}
              </ImageListItem>
            </ButtonBase>
            {itemData.map((item) => (
              <ButtonBase
                key={item.img}
                onClick={() => handleInputSelect(item.img, "image")}
              >
                <ImageListItem
                  key={item.img}
                  style={{ width: "100%", height: "100%" }}
                >
                  <img
                    src={`${item.img}?w=300&h=300&auto=format`}
                    srcSet={`${item.img}?w=300&auto=format&dpr=2 2x`}
                    alt={item.title}
                    loading="lazy"
                  />
                </ImageListItem>
              </ButtonBase>
            ))}
          </ImageList>
        </Box>
      </Dialog>
    </Box>
  );
}

export default observer(ImageInputButton);
