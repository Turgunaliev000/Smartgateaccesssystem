import { useEffect, useState } from "react";
import { Eye, EyeOff, Shield, UserPlus } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { api } from "../api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function Register() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    password: "",
    passwordConfirm: "",
  });

  useEffect(() => {
    api.me()
      .then(() => navigate("/", { replace: true }))
      .catch(() => setCheckingSession(false));
  }, [navigate]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.passwordConfirm) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      await api.register(form);
      toast.success("Аккаунт создан");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать аккаунт");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-blue-950 text-white flex items-center justify-center">
        <p className="text-sm">Проверка входа...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-950 px-4 py-6">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-blue-900 w-14 h-14 rounded-full flex items-center justify-center mb-3">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-blue-950">Создание аккаунта</h1>
            <p className="text-sm text-gray-600 mt-1 text-center">
              Зарегистрируйтесь в системе Smart Gate
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="register-name">Имя и фамилия</Label>
              <Input
                id="register-name"
                autoComplete="name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Эмир Тургуналиев"
                className="mt-1.5 h-11"
                required
              />
            </div>

            <div>
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="name@example.com"
                className="mt-1.5 h-11"
                required
              />
            </div>

            <div>
              <Label htmlFor="register-phone">Телефон</Label>
              <Input
                id="register-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+996 555 123 456"
                className="mt-1.5 h-11"
              />
            </div>

            <div>
              <Label htmlFor="register-department">Факультет или подразделение</Label>
              <Input
                id="register-department"
                value={form.department}
                onChange={(event) => updateField("department", event.target.value)}
                placeholder="Например, IT"
                className="mt-1.5 h-11"
              />
            </div>

            <div>
              <Label htmlFor="register-password">Пароль</Label>
              <div className="relative mt-1.5">
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder="Минимум 8 символов"
                  className="h-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-gray-500"
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="register-password-confirm">Повторите пароль</Label>
              <Input
                id="register-password-confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                value={form.passwordConfirm}
                onChange={(event) => updateField("passwordConfirm", event.target.value)}
                className="mt-1.5 h-11"
                required
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-md">
              <Shield className="w-4 h-4 text-blue-900 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-700">
                Новый аккаунт создаётся с ролью «Студент». Другую роль назначает администратор.
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 text-center">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white"
            >
              {loading ? "Создание..." : "Зарегистрироваться"}
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">Уже есть аккаунт?</p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/login")}
              className="text-blue-900"
            >
              Войти
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
