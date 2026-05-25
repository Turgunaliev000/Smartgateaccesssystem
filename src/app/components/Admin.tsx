import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Shield,
  UserPlus,
  UserX,
  Users,
  Activity,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Search,
  BarChart3,
  TrendingUp,
  Clock,
  DoorOpen,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  type: "student" | "staff";
  status: "active" | "blocked";
  accessCount: number;
}

const mockUsers: User[] = [
  { id: "1", name: "Эмир Токтосунов", type: "student", status: "active", accessCount: 42 },
  { id: "2", name: "Проф. Жамиля Исакова", type: "staff", status: "active", accessCount: 67 },
  { id: "3", name: "Нургуль Бекова", type: "student", status: "active", accessCount: 38 },
  { id: "4", name: "Д-р Алмаз Асанов", type: "staff", status: "active", accessCount: 54 },
  { id: "5", name: "Азамат Султанов", type: "student", status: "blocked", accessCount: 12 },
];

export function Admin() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserType, setNewUserType] = useState<"student" | "staff">("student");

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeUsers = users.filter(u => u.status === "active").length;
  const blockedUsers = users.filter(u => u.status === "blocked").length;
  const totalAccess = users.reduce((sum, u) => sum + u.accessCount, 0);

  const handleToggleStatus = (userId: string) => {
    setUsers(prev =>
      prev.map(user =>
        user.id === userId
          ? { ...user, status: user.status === "active" ? "blocked" : "active" }
          : user
      )
    );
    const user = users.find(u => u.id === userId);
    if (user) {
      toast.success(
        user.status === "active"
          ? `${user.name} заблокирован`
          : `${user.name} разблокирован`
      );
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: `${Date.now()}`,
      name: newUserName,
      type: newUserType,
      status: "active",
      accessCount: 0,
    };
    setUsers(prev => [...prev, newUser]);
    toast.success(`${newUserName} добавлен в систему`);
    setNewUserName("");
    setShowAddForm(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Заголовок */}
      <div className="pt-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-900 p-2 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Административная панель</h1>
            <p className="text-sm text-gray-600">Полный контроль доступа на территорию университета</p>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-green-500 p-2 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-700" />
          </div>
          <div className="text-2xl font-bold text-green-900">{activeUsers}</div>
          <div className="text-xs text-gray-700">Активных пользователей</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-red-500 p-2 rounded-lg">
              <UserX className="w-5 h-5 text-white" />
            </div>
            <AlertTriangle className="w-5 h-5 text-red-700" />
          </div>
          <div className="text-2xl font-bold text-red-900">{blockedUsers}</div>
          <div className="text-xs text-gray-700">Заблокированных</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-blue-500 p-2 rounded-lg">
              <DoorOpen className="w-5 h-5 text-white" />
            </div>
            <Activity className="w-5 h-5 text-blue-700" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{totalAccess}</div>
          <div className="text-xs text-gray-700">Всего въездов</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-purple-500 p-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <Clock className="w-5 h-5 text-purple-700" />
          </div>
          <div className="text-2xl font-bold text-purple-900">24</div>
          <div className="text-xs text-gray-700">Въездов сегодня</div>
        </Card>
      </div>

      {/* Быстрые действия */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-900" />
          Управление доступом
        </h3>

        <div className="space-y-2">
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full bg-green-600 hover:bg-green-700 justify-start"
            size="lg"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            {showAddForm ? "Отменить добавление" : "Добавить пользователя"}
          </Button>
        </div>
      </Card>

      {/* Форма добавления пользователя */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="p-5 bg-green-50 border-green-200">
            <h4 className="font-semibold text-gray-900 mb-4">Новый пользователь</h4>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <Label htmlFor="userName">Имя пользователя</Label>
                <Input
                  id="userName"
                  type="text"
                  placeholder="Введите имя"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="userType">Тип пользователя</Label>
                <select
                  id="userType"
                  value={newUserType}
                  onChange={(e) => setNewUserType(e.target.value as "student" | "staff")}
                  className="w-full mt-1.5 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="student">Студент</option>
                  <option value="staff">Преподаватель</option>
                </select>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Добавить в систему
              </Button>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Поиск пользователей */}
      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск пользователей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-300"
          />
        </div>
      </Card>

      {/* Список пользователей */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-900" />
            Пользователи ({filteredUsers.length})
          </h3>
        </div>

        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`p-4 ${user.status === "blocked" ? "bg-red-50 border-red-200" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">{user.name}</h4>
                    {user.status === "blocked" && (
                      <Badge variant="destructive" className="text-xs">
                        Заблокирован
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Badge variant="outline" className="text-xs">
                      {user.type === "student" ? "Студент" : "Преподаватель"}
                    </Badge>
                    <span className="text-xs">
                      {user.accessCount} {user.accessCount === 1 ? "въезд" : "въездов"}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => handleToggleStatus(user.id)}
                  variant={user.status === "active" ? "destructive" : "default"}
                  size="sm"
                  className="flex-shrink-0"
                >
                  {user.status === "active" ? (
                    <>
                      <UserX className="w-4 h-4 mr-1" />
                      Блок
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Разблок
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-gray-400 mb-2">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-600">Пользователи не найдены</p>
        </Card>
      )}

      {/* Информация */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex gap-3 items-start">
          <Shield className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-2">
              Возможности администратора
            </p>
            <ul className="text-gray-600 text-xs space-y-1.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Повышение безопасности кампуса</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Уменьшение времени въезда на территорию</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Полный контроль администрации над доступом</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Детальная статистика и аналитика</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
