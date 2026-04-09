import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Components

import Feedbacks from "./Components/Feedback/Feedbacks";

// MUI Date Picker Provider
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<App />} />
        
        <Route path="/feedbacks" element={<Feedbacks />} />
      </Routes>
    </BrowserRouter>
  </LocalizationProvider>
);