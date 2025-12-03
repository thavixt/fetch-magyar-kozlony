import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Layout from "./Layout.tsx";
import { MagyarKozlony } from "./kozlony.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Layout>
      <MagyarKozlony />
    </Layout>
  </StrictMode>,
);
