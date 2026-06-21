import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { Dashboard } from "./components/Dashboard";
import { GuestQR } from "./components/GuestQR";
import { History } from "./components/History";
import { Notifications } from "./components/Notifications";
import { Profile } from "./components/Profile";
import { Admin } from "./components/Admin";
import { Scanner } from "./components/Scanner";
import { ForgotPassword } from "./components/ForgotPassword";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "guest-qr", Component: GuestQR },
      { path: "scanner", Component: Scanner },
      { path: "history", Component: History },
      { path: "notifications", Component: Notifications },
      { path: "profile", Component: Profile },
      { path: "admin-panel", Component: Admin },
    ],
  },
]);
