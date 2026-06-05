import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { DoorOpen, MapPin, CheckCircle2, Clock, AlertCircle, Settings, FileScan } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { api, AccessUser, GateState } from "../api";
import { toast } from "sonner";

export function Dashboard() {
  const navigate = useNavigate();
  const [gate, setGate] = useState<GateState | null>(null);
  const [user, setUser] = useState<AccessUser | null>(null);
  const [stats, setStats] = useState({ security: 98, timeSaved: 40, control: 100 });
  const [gateOpen, setGateOpen] = useState(false);
  const [lastOpenTime, setLastOpenTime] = useState<Date | null>(null);
  const [timeAgo, setTimeAgo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard()
      .then((data) => {
        setGate(data.gate);
        setUser(data.user);
        setStats(data.stats);
        setGateOpen(data.gate.isOpen);
        setLastOpenTime(data.gate.lastOpenedAt ? new Date(data.gate.lastOpenedAt) : null);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Не удалось загрузить данные"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (lastOpenTime) {
      const interval = setInterval(() => {
        const seconds = Math.floor((Date.now() - lastOpenTime.getTime()) / 1000);
        if (seconds < 60) {
          setTimeAgo(`${seconds} секунд назад`);
        } else if (seconds < 3600) {
          const minutes = Math.floor(seconds / 60);
          setTimeAgo(`${minutes} ${minutes === 1 ? 'минуту' : 'минут'} назад`);
        } else {
          const hours = Math.floor(seconds / 3600);
          setTimeAgo(`${hours} ${hours === 1 ? 'час' : 'часов'} назад`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lastOpenTime]);

  const handleToggleGate = async () => {
    try {
      const data = await api.openGate();
      setGate(data.gate);
      setUser(data.user);
      setGateOpen(true);
      setLastOpenTime(data.gate.lastOpenedAt ? new Date(data.gate.lastOpenedAt) : new Date());
      toast.success("Шлагбаум открыт");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось открыть шлагбаум");
      return;
    }

    setTimeout(() => {
      setGateOpen(false);
    }, 5000);
  };

  if (loading) {
    return <div className="max-w-md mx-auto p-4 text-sm text-gray-600">Загрузка системы доступа...</div>;
  }

  const role = user?.isAdmin ? "admin" : user?.type;
  const canCreateGuests = role === "admin" || role === "staff";
  const canScan = role === "admin" || role === "security";

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Локация */}
      <Card className="p-4 bg-white border-blue-100">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <MapPin className="w-5 h-5 text-blue-900" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{gate?.name ?? "Главный въезд"}</h3>
            <p className="text-sm text-gray-600">{gate?.location ?? "Салымбеков Университет"}</p>
          </div>
        </div>
      </Card>

      {/* Статус шлагбаума */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`p-6 border-2 ${gateOpen ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: gateOpen ? 90 : 0 }}
              transition={{ duration: 0.5 }}
              className={`inline-flex p-4 rounded-full ${gateOpen ? 'bg-green-500' : 'bg-red-500'}`}
            >
              <DoorOpen className="w-12 h-12 text-white" />
            </motion.div>

            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                {gateOpen ? (
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                ) : (
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                )}
                <h2 className="text-2xl font-bold text-gray-900">
                  {gateOpen ? "Открыт" : "Закрыт"}
                </h2>
              </div>
              
              {lastOpenTime && (
                <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{gateOpen ? 'Открыт' : 'Закрыт'} {timeAgo}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleToggleGate}
              disabled={gateOpen}
              className="w-full py-6 bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400"
              size="lg"
            >
              {gateOpen ? "Закрывается автоматически..." : "Открыть шлагбаум"}
            </Button>

            {gateOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-green-700"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Доступ разрешён</span>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Быстрые действия */}
      <div className="grid grid-cols-3 gap-3">
        {canCreateGuests && (
          <Card
            className="p-4 hover:shadow-md transition-shadow cursor-pointer border-blue-200"
            onClick={() => navigate("/guest-qr")}
          >
            <div className="text-center space-y-2">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                <motion.div whileHover={{ scale: 1.1 }}>
                  <svg className="w-6 h-6 text-blue-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm11-2h3v3h-3v-3zm0 5h3v3h-3v-3zm5-5h3v3h-3v-3zm0 5h3v3h-3v-3z"/>
                  </svg>
                </motion.div>
              </div>
              <p className="text-sm font-medium text-gray-900">Гостевой QR</p>
            </div>
          </Card>
        )}

        {canScan && (
          <Card
            className="p-4 hover:shadow-md transition-shadow cursor-pointer border-blue-200"
            onClick={() => navigate("/scanner")}
          >
            <div className="text-center space-y-2">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                <motion.div whileHover={{ scale: 1.1 }}>
                  <FileScan className="w-6 h-6 text-blue-900" />
                </motion.div>
              </div>
              <p className="text-sm font-medium text-gray-900">Сканер</p>
            </div>
          </Card>
        )}

        <Card
          className="p-4 hover:shadow-md transition-shadow cursor-pointer border-blue-200"
          onClick={() => navigate("/history")}
        >
          <div className="text-center space-y-2">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
              <motion.div whileHover={{ scale: 1.1 }}>
                <Clock className="w-6 h-6 text-blue-900" />
              </motion.div>
            </div>
            <p className="text-sm font-medium text-gray-900">История</p>
          </div>
        </Card>
      </div>

      {/* Админ кнопка */}
      {user?.isAdmin && (
        <Card
          className="p-4 bg-gradient-to-r from-blue-900 to-blue-800 text-white hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate("/admin-panel")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6" />
              <div>
                <p className="font-semibold">Административная панель</p>
                <p className="text-xs text-blue-200">Управление доступом</p>
              </div>
            </div>
            <div className="text-2xl">→</div>
          </div>
        </Card>
      )}

      {/* Информационные карточки */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        <Card className="p-3 text-center bg-green-50 border-green-200">
          <div className="text-2xl font-bold text-green-700">{stats.security}%</div>
          <div className="text-xs text-gray-600">Безопасность</div>
        </Card>
        
        <Card className="p-3 text-center bg-blue-50 border-blue-200">
          <div className="text-2xl font-bold text-blue-700">-{stats.timeSaved}%</div>
          <div className="text-xs text-gray-600">Время въезда</div>
        </Card>
        
        <Card className="p-3 text-center bg-purple-50 border-purple-200">
          <div className="text-2xl font-bold text-purple-700">{stats.control}%</div>
          <div className="text-xs text-gray-600">Контроль</div>
        </Card>
      </div>

      {/* Важное уведомление */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">Все действия фиксируются системой</p>
            <p className="text-gray-600 text-xs">
              Каждый въезд и выезд записывается для обеспечения безопасности кампуса
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
