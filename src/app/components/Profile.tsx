import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  IdCard, 
  Shield, 
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Lock,
  HelpCircle,
  Info,
  Download,
  Smartphone,
  Share,
  SquarePlus,
  EllipsisVertical,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { api, AccessUser } from "../api";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AccessUser | null>(null);
  const [activePanel, setActivePanel] = useState<"security" | "help" | "install" | null>(null);
  const [installPlatform, setInstallPlatform] = useState<"ios" | "android">("android");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    api.me()
      .then((data) => setUser(data.user))
      .catch(() => navigate("/login"));

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setInstallPlatform(isIos ? "ios" : "android");
    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const savedPrompt = (window as Window & { smartGateInstallPrompt?: Event }).smartGateInstallPrompt;
    if (savedPrompt) setInstallPrompt(savedPrompt as InstallPromptEvent);

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      (window as Window & { smartGateInstallPrompt?: Event }).smartGateInstallPrompt = event;
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

  const handleLogout = async () => {
    await api.logout();
    toast.success("Вы вышли из системы");
    navigate("/login");
  };

  const handleInstall = async () => {
    if (isInstalled) {
      toast.success("Smart Gate уже установлен");
      return;
    }
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setInstallPrompt(null);
      if (choice.outcome === "accepted") {
        delete (window as Window & { smartGateInstallPrompt?: Event }).smartGateInstallPrompt;
      }
      return;
    }
    setActivePanel("install");
    toast.info(
      installPlatform === "ios"
        ? "Следуйте инструкции для iPhone ниже"
        : "Откройте меню браузера и выберите «Установить приложение»",
    );
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Профиль пользователя */}
      <Card className="p-6 bg-gradient-to-br from-blue-900 to-blue-800 text-white">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-900 flex-shrink-0">
            <User className="w-8 h-8" />
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{user?.name ?? "Пользователь"}</h2>
            <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 mb-2">
              {user?.isAdmin ? "Администратор" : user?.type === "staff" ? "Преподаватель" : user?.type === "security" ? "Охрана" : "Студент"}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-blue-100">
              <IdCard className="w-4 h-4" />
              <span>ID: {user?.identifier ?? "..."}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Контактная информация */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-900" />
          Контактная информация
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{user?.email ?? "..."}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-xs text-gray-500">Телефон</p>
              <p className="text-sm font-medium text-gray-900">{user?.phone || "Не указан"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <GraduationCap className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-xs text-gray-500">Факультет</p>
              <p className="text-sm font-medium text-gray-900">{user?.department || "Салымбеков Университет"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Shield className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-xs text-gray-500">Статус доступа</p>
              <p className={`text-sm font-medium ${user?.status === "blocked" ? "text-red-700" : "text-green-700"}`}>
                {user?.status === "blocked" ? "Заблокирован" : "Активен"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center bg-blue-50 border-blue-200">
          <div className="text-xl font-bold text-blue-900">{user?.accessCount ?? 0}</div>
          <div className="text-xs text-gray-600">Въездов</div>
          <div className="text-xs text-gray-500 mt-0.5">этот месяц</div>
        </Card>
        
        <Card className="p-3 text-center bg-green-50 border-green-200">
          <div className="text-xl font-bold text-green-900">8</div>
          <div className="text-xs text-gray-600">QR-кодов</div>
          <div className="text-xs text-gray-500 mt-0.5">создано</div>
        </Card>
        
        <Card className="p-3 text-center bg-purple-50 border-purple-200">
          <div className="text-xl font-bold text-purple-900">24</div>
          <div className="text-xs text-gray-600">Гостей</div>
          <div className="text-xs text-gray-500 mt-0.5">приглашено</div>
        </Card>
      </div>

      {/* Настройки и действия */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-900" />
          Настройки
        </h3>
        
        <div className="space-y-2">
          <button
            onClick={() => navigate("/notifications")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-900">Уведомления</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => setActivePanel(activePanel === "install" ? null : "install")}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
              activePanel === "install" ? "bg-blue-50" : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <span className="block text-sm text-gray-900">Установить приложение</span>
                <span className="block text-xs text-gray-500">iPhone и Android</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => setActivePanel(activePanel === "security" ? null : "security")}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
              activePanel === "security" ? "bg-blue-50" : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-900">Безопасность</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => setActivePanel(activePanel === "help" ? null : "help")}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
              activePanel === "help" ? "bg-blue-50" : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-900">Помощь и поддержка</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </Card>

      {activePanel === "install" && (
        <Card className="overflow-hidden border-blue-200">
          <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
            <img
              src="/install-guide-phones.png"
              alt="Smart Gate на iPhone и Android"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-blue-950/90 text-white px-4 py-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Установка Smart Gate
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                Приложение появится на главном экране телефона
              </p>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button
                type="button"
                onClick={() => setInstallPlatform("ios")}
                className={`h-11 border rounded-md text-sm font-semibold transition-colors ${
                  installPlatform === "ios"
                    ? "bg-blue-950 text-white border-blue-950"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                iPhone
              </button>
              <button
                type="button"
                onClick={() => setInstallPlatform("android")}
                className={`h-11 border rounded-md text-sm font-semibold transition-colors ${
                  installPlatform === "android"
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                Android
              </button>
            </div>

            {isInstalled ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle2 className="w-6 h-6 text-green-700 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">Приложение установлено</p>
                  <p className="text-xs text-green-800 mt-0.5">Откройте Smart Gate с главного экрана</p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {(installPlatform === "ios"
                    ? [
                        { icon: Share, title: "Нажмите «Поделиться»", text: "Кнопка находится внизу Safari" },
                        { icon: SquarePlus, title: "Выберите «На экран Домой»", text: "Прокрутите список действий вниз" },
                        { icon: CheckCircle2, title: "Нажмите «Добавить»", text: "Smart Gate появится среди приложений" },
                      ]
                    : [
                        { icon: EllipsisVertical, title: "Откройте меню браузера", text: "Нажмите три точки в Chrome" },
                        { icon: Download, title: "Выберите «Установить приложение»", text: "Иногда пункт называется «Добавить на экран»" },
                        { icon: CheckCircle2, title: "Подтвердите установку", text: "Запускайте Smart Gate как обычное приложение" },
                      ]
                  ).map((step, index) => (
                    <div key={step.title} className="flex items-center gap-3 p-3 border border-gray-200 rounded-md">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-950 flex items-center justify-center flex-shrink-0">
                        <step.icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {index + 1}. {step.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={handleInstall}
                  className="w-full h-12 mt-5 bg-blue-950 hover:bg-blue-900 text-white"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {installPrompt ? "Установить сейчас" : "Показать способ установки"}
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {activePanel === "security" && (
        <Card className="p-5 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-950 mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Безопасность аккаунта
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <span className="text-gray-600">Статус доступа</span>
              <Badge className={user?.status === "blocked" ? "bg-red-600" : "bg-green-600"}>
                {user?.status === "blocked" ? "Заблокирован" : "Активен"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <span className="text-gray-600">Роль</span>
              <span className="font-medium text-gray-900">
                {user?.isAdmin ? "Администратор" : user?.type === "staff" ? "Преподаватель" : user?.type === "security" ? "Охрана" : "Студент"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <span className="text-gray-600">ID доступа</span>
              <span className="font-medium text-gray-900">{user?.identifier ?? "..."}</span>
            </div>
          </div>
        </Card>
      )}

      {activePanel === "help" && (
        <Card className="p-5 bg-green-50 border-green-200">
          <h3 className="font-semibold text-green-950 mb-3 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Помощь и поддержка
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>Если QR-код не работает, проверьте срок действия пропуска на странице сканера.</p>
            <p>Если доступ заблокирован, обратитесь к администратору системы или охране КПП.</p>
            <div className="p-3 bg-white rounded-lg border border-green-100">
              <p className="text-xs text-gray-500">Контакт поддержки</p>
              <p className="font-medium text-gray-900">support@salymbekov.edu</p>
            </div>
          </div>
        </Card>
      )}

      {/* Информация о системе */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="text-center text-sm text-gray-700">
          <p className="font-semibold text-blue-900 mb-2">Smart Gate v2.0</p>
          <p className="text-xs text-gray-600">Салымбеков Университет</p>
          <p className="text-xs text-gray-500 mt-1">© 2026 Все права защищены</p>
        </div>
      </Card>

      {/* Выход */}
      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full py-6 border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Выйти из системы
      </Button>

      {/* Дополнительная информация */}
      <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="flex gap-3 items-start">
          <Shield className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-green-900 mb-1">
              Безопасность данных
            </p>
            <p className="text-gray-600 text-xs">
              Ваши данные защищены и используются только для обеспечения безопасности кампуса
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
