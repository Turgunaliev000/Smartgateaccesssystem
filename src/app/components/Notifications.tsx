import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Bell, 
  DoorOpen, 
  QrCode, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Trash2
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, NotificationItem } from "../api";

export function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    api.notifications()
      .then((data) => setNotifications(data.notifications))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Не удалось загрузить уведомления"));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "gate":
        return <DoorOpen className="w-5 h-5" />;
      case "guest":
        return <Bell className="w-5 h-5" />;
      case "qr":
        return <QrCode className="w-5 h-5" />;
      case "alert":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "gate":
        return "bg-green-100 text-green-900";
      case "guest":
        return "bg-blue-100 text-blue-900";
      case "qr":
        return "bg-purple-100 text-purple-900";
      case "alert":
        return "bg-orange-100 text-orange-900";
      default:
        return "bg-gray-100 text-gray-900";
    }
  };

  const handleMarkAsRead = async (id: number) => {
    await api.markNotificationRead(id);
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    toast.success("Отмечено как прочитанное");
  };

  const handleDelete = async (id: number) => {
    await api.deleteNotification(id);
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    toast.success("Уведомление удалено");
  };

  const handleMarkAllAsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    toast.success("Все уведомления отмечены как прочитанные");
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Заголовок */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Уведомления</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600">
                {unreadCount} {unreadCount === 1 ? 'непрочитанное' : 'непрочитанных'}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-blue-900 border-blue-900"
            >
              Прочитать все
            </Button>
          )}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="p-3 text-center bg-blue-50 border-blue-200">
          <div className="text-xl font-bold text-blue-900">{unreadCount}</div>
          <div className="text-xs text-gray-600">Новые</div>
        </Card>
        
        <Card className="p-3 text-center bg-green-50 border-green-200">
          <div className="text-xl font-bold text-green-900">
            {notifications.filter(n => n.type === "gate").length}
          </div>
          <div className="text-xs text-gray-600">Шлагбаум</div>
        </Card>
        
        <Card className="p-3 text-center bg-purple-50 border-purple-200">
          <div className="text-xl font-bold text-purple-900">
            {notifications.filter(n => n.type === "qr").length}
          </div>
          <div className="text-xs text-gray-600">QR</div>
        </Card>
        
        <Card className="p-3 text-center bg-orange-50 border-orange-200">
          <div className="text-xl font-bold text-orange-900">
            {notifications.filter(n => n.type === "guest" || n.type === "alert").length}
          </div>
          <div className="text-xs text-gray-600">Прочие</div>
        </Card>
      </div>

      {/* Список уведомлений */}
      <div className="space-y-3">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`p-4 transition-all ${
                !notification.read
                  ? "bg-blue-50 border-l-4 border-l-blue-900 shadow-md"
                  : "bg-white hover:shadow-md"
              }`}
            >
              <div className="flex gap-3">
                <div className={`p-2.5 rounded-lg flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <div className="w-2.5 h-2.5 bg-blue-900 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{notification.time}</span>
                    </div>
                    
                    <div className="flex gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="h-7 px-2 text-xs text-blue-900 hover:text-blue-800"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Прочитано
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {notifications.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-gray-400 mb-2">
            <Bell className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-600">Нет уведомлений</p>
          <p className="text-sm text-gray-500 mt-1">
            Вы будете получать уведомления о въездах и других событиях
          </p>
        </Card>
      )}

      {/* Информация */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <div className="flex gap-3 items-start">
          <Bell className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">
              Настройки уведомлений
            </p>
            <p className="text-gray-600 text-xs mb-2">
              Вы получаете уведомления о:
            </p>
            <ul className="text-gray-600 text-xs space-y-1">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                Прибытии гостей на КПП
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                Использовании QR-кодов
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                Открытии/закрытии шлагбаума
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                Системных событиях
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
