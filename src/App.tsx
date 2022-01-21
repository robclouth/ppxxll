import { Box, createTheme, ThemeProvider } from "@mui/material";
import React, { useEffect } from "react";
import "./App.css";
import Camera from "./components/Camera";
import CssBaseline from "@mui/material/CssBaseline";
import AppManager from "./services/App";

const theme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  async function init() {
    await AppManager.init();
  }
  useEffect(() => {
    init();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box component="div" sx={{ width: "100vw", height: "100vh" }}>
        <Camera />
      </Box>
    </ThemeProvider>
  );
}

export default App;
