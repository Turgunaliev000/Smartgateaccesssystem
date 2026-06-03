import { Outlet, NavLink } from "react-router";
import { Home, QrCode, History, Bell, User, Shield } from "lucide-react";
import { Badge } from "./ui/badge";
import { useEffect, useState } from "react";
import { api } from "../api";

export function Layout() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.notifications()
      .then((data) => setUnreadCount(data.notifications.filter((item) => !item.read).length))
      .catch(() => undefined);
  }, []);

  const navItems = [
    { path: "/", icon: Home, label: "Главная" },
    { path: "/guest-qr", icon: QrCode, label: "QR" },
    { path: "/history", icon: History, label: "Журнал" },
    { path: "/notifications", icon: Bell, label: "Уведомления", badge: unreadCount },
    { path: "/profile", icon: User, label: "Профиль" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-950 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            <div>
              <h1 className="font-bold">Smart Gate</h1>
              <p className="text-xs text-blue-200">Салымбеков Университет</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-1 relative ${
                  isActive ? "text-blue-900" : "text-gray-500"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="w-5 h-5 mb-1" />
                  <span className="text-xs">{item.label}</span>
                  {item.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute top-1 right-2 px-1.5 py-0 text-xs min-w-[18px] h-[18px] flex items-center justify-center"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-900 rounded-t-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
