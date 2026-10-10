import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {AuthProvider} from './lib/AuthContext.tsx'
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./components/ThemeProvider";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
