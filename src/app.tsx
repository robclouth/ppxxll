import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import Camera from "./components/camera";
import AppManager from "./services/app";

function App() {
  useEffect(() => {
    AppManager.init();
  }, []);

  return (
    <div className="w-screen h-screen">
      <Camera />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "rgba(0,0,0,0.8)",
            color: "#fff",
            borderRadius: "8px",
          },
        }}
      />
    </div>
  );
}

export default App;
