import { Box, createTheme, ThemeProvider } from "@mui/material";
import React from "react";
import "./App.css";
import Camera from "./components/Camera";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
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
