import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SplitSmart — Group Expense Splitter",
    short_name: "SplitSmart",
    description: "Split expenses, track subscriptions, and settle up with your group.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#060914",
    theme_color: "#0ea5e9",
    orientation: "portrait",
    categories: ["finance", "utilities"],
    icons: [
      { src: "/icons/icon-72.png", sizes: "72x72", type: "image/png" },
      { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { src: "/icons/icon-128.png", sizes: "128x128", type: "image/png" },
      { src: "/icons/icon-144.png", sizes: "144x144", type: "image/png" },
      { src: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    shortcuts: [
      {
        name: "Add Expense",
        short_name: "Add",
        url: "/expenses?action=new",
        icons: [{ src: "/icons/icon-96.png", sizes: "96x96" }],
      },
      {
        name: "Settle Up",
        short_name: "Settle",
        url: "/settlements",
        icons: [{ src: "/icons/icon-96.png", sizes: "96x96" }],
      },
    ],
  };
}
