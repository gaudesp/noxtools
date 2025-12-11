import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app";
import "./index.css";
import { NotificationsProvider } from "./shared/notifications";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationsProvider>
        <App />
      </NotificationsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
