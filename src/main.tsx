import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Layout from "./Layout.tsx";
import { MagyarKozlony } from "./kozlony.tsx";

const footer = [
  { link: "https://magyarkozlony.hu/", text: "Magyar Közlöny weboldala" },
  {
    link: "https://github.com/thavixt/fetch-magyar-kozlony",
    text: "Forráskód",
  },
];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Layout
      title="Magyar közlöny értelmező ⚖️🧾"
      subtitle="A legutóbbi ~10 Magyar Közlöny szám listázva, könnyű elérésért és értelmezésért."
      footer={footer}>
      <MagyarKozlony />
    </Layout>
  </StrictMode>,
);
