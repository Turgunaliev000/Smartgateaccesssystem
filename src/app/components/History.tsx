import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { 
  GraduationCap, 
  User, 
  UserCheck, 
  Search, 
  Calendar,
  Filter,
  DoorOpen,
  Clock,
  CheckCircle2
} from "lucide-react";
import { motion } from "motion/react";
import { api, HistoryEntry } from "../api";
import { toast } from "sonner";

export function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "student" | "guest" | "staff" | "admin">("all");

  useEffect(() => {
    api.accessLogs()
      .then((data) => {
        setHistory(data.logs);
        setStats(data.stats);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Не удалось загрузить журнал"));
  }, []);

  const filteredHistory = history.filter((entry) => {
    const matchesSearch = entry.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || entry.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "student":
        return <GraduationCap className="w-5 h-5" />;
      case "guest":
        return <User className="w-5 h-5" />;
      case "staff":
        return <UserCheck className="w-5 h-5" />;
      case "admin":
        return <UserCheck className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "student":
        return "Студент";
      case "guest":
        return "Гость";
      case "staff":
        return "Преподаватель";
      case "admin":
        return "Администратор";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "student":
        return "bg-blue-100 text-blue-900 border-blue-200";
      case "guest":
        return "bg-purple-100 text-purple-900 border-purple-200";
      case "staff":
        return "bg-green-100 text-green-900 border-green-200";
      case "admin":
        return "bg-orange-100 text-orange-900 border-orange-200";
      default:
        return "bg-gray-100 text-gray-900 border-gray-200";
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Заголовок */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Журнал въездов</h1>
        <p className="text-sm text-gray-600">
          История всех въездов на территорию университета
        </p>
      </div>

      {/* Поиск */}
      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск по имени..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-300"
          />
        </div>
      </Card>

      {/* Фильтры */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterType("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filterType === "all"
              ? "bg-blue-900 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Filter className="w-4 h-4 inline mr-1.5" />
          Все
        </button>
        <button
          onClick={() => setFilterType("student")}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filterType === "student"
              ? "bg-blue-900 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <GraduationCap className="w-4 h-4 inline mr-1.5" />
          Студенты
        </button>
        <button
          onClick={() => setFilterType("guest")}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filterType === "guest"
              ? "bg-blue-900 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <User className="w-4 h-4 inline mr-1.5" />
          Гости
        </button>
        <button
          onClick={() => setFilterType("staff")}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filterType === "staff"
              ? "bg-blue-900 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <UserCheck className="w-4 h-4 inline mr-1.5" />
          Преподаватели
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center bg-blue-50 border-blue-200">
          <div className="text-xl font-bold text-blue-900">{stats.today}</div>
          <div className="text-xs text-gray-600">Сегодня</div>
        </Card>
        
        <Card className="p-3 text-center bg-green-50 border-green-200">
          <div className="text-xl font-bold text-green-900">{stats.week}</div>
          <div className="text-xs text-gray-600">Эта неделя</div>
        </Card>
        
        <Card className="p-3 text-center bg-purple-50 border-purple-200">
          <div className="text-xl font-bold text-purple-900">{stats.month}</div>
          <div className="text-xs text-gray-600">Этот месяц</div>
        </Card>
      </div>

      {/* Список истории */}
      <div className="space-y-3">
        {filteredHistory.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg ${getTypeColor(entry.type)}`}>
                  {getTypeIcon(entry.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{entry.name}</h3>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {getTypeLabel(entry.type)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      {entry.action === "open" ? (
                        <>
                          <DoorOpen className="w-4 h-4 text-green-600" />
                          <span>Открыт</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-purple-600" />
                          <span>QR-код</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{entry.time}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{entry.date}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-gray-400 mb-2">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-600">Записи не найдены</p>
          <p className="text-sm text-gray-500 mt-1">Попробуйте изменить фильтры или поисковый запрос</p>
        </Card>
      )}

      {/* Важное уведомление */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3 items-start">
          <CheckCircle2 className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">
              Все действия фиксируются системой
            </p>
            <p className="text-gray-600 text-xs">
              Журнал ведётся в автоматическом режиме для обеспечения безопасности кампуса
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
