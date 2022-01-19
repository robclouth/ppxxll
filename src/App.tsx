import { Box } from "@mui/material";
import React from "react";
import "./App.css";
import Camera from "./components/Camera";

function App() {
  return (
    <Box component="div" sx={{ width: "100vw", height: "100vh" }}>
      <Camera />
    </Box>
  );
}

export default App;
