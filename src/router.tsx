import { createBrowserRouter } from "react-router"

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("./routes/root.tsx"),
    HydrateFallback: () => null,
    children: [
      { index: true, lazy: () => import("./routes/home.tsx") },
      { path: "auth", lazy: () => import("./routes/auth.tsx") },
      { path: "admin", lazy: () => import("./routes/admin.tsx") },
      { path: "*", lazy: () => import("./routes/not-found.tsx") },
    ],
  },
])
