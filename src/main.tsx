
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(<App />);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    (window as Window & { smartGateInstallPrompt?: Event }).smartGateInstallPrompt = event;
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    });
  }
