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
  Info
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export function Profile() {
  const navigate = useNavigate();

  const handleLogout = () => {
    toast.success("Вы вышли из системы");
    navigate("/login");
  };

  const handleSettingsClick = () => {
    toast.info("Настройки в разработке");
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
            <h2 className="text-xl font-bold mb-1">Эмир Токтосунов</h2>
            <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 mb-2">
              Администратор
            </Badge>
            <div className="flex items-center gap-2 text-sm text-blue-100">
              <IdCard className="w-4 h-4" />
              <span>ID: STU-2024-1234</span>
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
              <p className="text-sm font-medium text-gray-900">emir.toktosunov@salymbekov.edu</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-xs text-gray-500">Телефон</p>
              <p className="text-sm font-medium text-gray-900">+996 555 123 456</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <GraduationCap className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-xs text-gray-500">Факультет</p>
              <p className="text-sm font-medium text-gray-900">Информационные технологии</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Shield className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-xs text-gray-500">Статус доступа</p>
              <p className="text-sm font-medium text-green-700">Активен</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center bg-blue-50 border-blue-200">
          <div className="text-xl font-bold text-blue-900">42</div>
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
            onClick={handleSettingsClick}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-900">Уведомления</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={handleSettingsClick}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-900">Безопасность</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={handleSettingsClick}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-900">Помощь и поддержка</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </Card>

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
