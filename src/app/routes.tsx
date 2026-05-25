import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { GuestQR } from "./components/GuestQR";
import { History } from "./components/History";
import { Notifications } from "./components/Notifications";
import { Profile } from "./components/Profile";
import { Admin } from "./components/Admin";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "guest-qr", Component: GuestQR },
      { path: "history", Component: History },
      { path: "notifications", Component: Notifications },
      { path: "profile", Component: Profile },
      { path: "admin", Component: Admin },
    ],
  },
]);
