import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Shield } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Простая авторизация для демо
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-900 p-4 rounded-full mb-4">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-blue-950 mb-1">Smart Gate</h1>
            <p className="text-sm text-gray-600 text-center">
              Салымбеков Университет
            </p>
            <p className="text-xs text-gray-500 mt-1">Си��тема цифрового доступа</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@salymbekov.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 border-gray-300"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 border-gray-300"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-800 text-white py-6"
            >
              Войти в систему
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Безопасный, быстрый и современный контроль въезда
            </p>
          </div>
        </div>

        <div className="mt-4 text-center text-white text-xs">
          © 2026 Салымбеков Университет
        </div>
      </div>
    </div>
  );
}
