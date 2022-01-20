import {
  AppBar,
  Box,
  Button,
  Dialog,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Slide,
  Toolbar,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react";
import { forwardRef, useEffect, useRef, useState } from "react";
import CameraManager from "../services/CameraManager";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

const Transition = forwardRef<any>(function Transition(props: any, ref: any) {
  return <Slide direction="up" ref={ref} {...props} />;
});

type Props = {
  index: number;
};

function ImageInputButton({ index }: Props) {
  const texture = CameraManager.textures[index];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function updateCanvas() {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx!.drawImage(texture?.image, 0, 0, canvas.width, canvas.height);
  }

  function handlePress() {}

  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

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
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {texture && (
        <canvas
          ref={canvasRef}
          width={50}
          height={50}
          style={{ position: "absolute", top: 0 }}
        />
      )}
      <IconButton
        size="large"
        onClick={handleClickOpen}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 50,
          height: 50,
          color: "white",
        }}
      >
        <AddIcon fontSize="inherit" />
      </IconButton>
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
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Sound
            </Typography>
            <Button autoFocus color="inherit" onClick={handleClose}>
              save
            </Button>
          </Toolbar>
        </AppBar>
        <List>
          <ListItem button>
            <ListItemText primary="Phone ringtone" secondary="Titania" />
          </ListItem>
          <Divider />
          <ListItem button>
            <ListItemText
              primary="Default notification ringtone"
              secondary="Tethys"
            />
          </ListItem>
        </List>
      </Dialog>
    </Box>
  );
}

export default observer(ImageInputButton);
