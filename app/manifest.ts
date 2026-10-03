import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Susegad",
    short_name: "Susegad",
    description:
      "Susegad is a free chat app for India. Ask in English, Hindi, or Hinglish.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4ecdf",
    theme_color: "#08343c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
