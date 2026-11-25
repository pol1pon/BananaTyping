import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { Home } from "./pages/Home";
import { Training } from "./pages/Training";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Profile } from "./pages/Profile";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminClaimPage } from "./pages/AdminClaimPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: "training", Component: Training },
      { path: "leaderboard", Component: LeaderboardPage },
    ],
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/profile",
    Component: Profile,
  },
  {
    path: "/admin",
    Component: AdminDashboard,
  },
  {
    path: "/admin/claim/:secretKey",
    Component: AdminClaimPage,
  },
  {
    path: "/admin/claim",
    Component: AdminClaimPage,
  },
]);

