import { Outlet, NavLink, useNavigate } from "react-router";
import { Home, QrCode, History, Bell, User, Shield, FileScan, Settings, Download } from "lucide-react";
import { Badge } from "./ui/badge";
import { useEffect, useState } from "react";
import { api, AccessUser } from "../api";
import { toast } from "sonner";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function Layout() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<AccessUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    api.me()
      .then((data) => {
        setUser(data.user);
        return api.notifications();
      })
      .then((data) => setUnreadCount(data.notifications.filter((item) => !item.read).length))
      .catch(() => navigate("/login", { replace: true }))
      .finally(() => setAuthLoading(false));

    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsInstalled(standalone);

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      toast.success("Smart Gate установлен");
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [navigate]);

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
      }
      return;
    }

    toast.info("На iPhone: нажмите «Поделиться», затем «На экран Домой». В Chrome откройте меню и выберите «Установить приложение».");
  };

  const role = user?.isAdmin ? "admin" : user?.type;
  const navItems = [
    { path: "/", icon: Home, label: "Главная", show: true },
    { path: "/guest-qr", icon: QrCode, label: "QR", show: role === "admin" || role === "staff" },
    { path: "/scanner", icon: FileScan, label: "Сканер", show: role === "admin" || role === "security" },
    { path: "/history", icon: History, label: "Журнал", show: true },
    { path: "/notifications", icon: Bell, label: "Уведомления", badge: unreadCount, show: true },
    { path: "/admin-panel", icon: Settings, label: "Админ", show: role === "admin" },
    { path: "/profile", icon: User, label: "Профиль", show: true },
  ].filter((item) => item.show);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-blue-950 text-white flex items-center justify-center">
        <p className="text-sm">Проверка доступа...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
          {!isInstalled && (
            <button
              type="button"
              onClick={handleInstall}
              title="Установить приложение"
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-blue-900 transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div
          className="max-w-md mx-auto grid gap-1"
          style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        >
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
