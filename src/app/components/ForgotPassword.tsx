import { useState } from "react";
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { api } from "../api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Step = "email" | "code" | "done";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api.requestPasswordReset(email);
      toast.success(result.detail);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить код");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api.confirmPasswordReset({ email, code, password, passwordConfirm });
      toast.success(result.detail);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось изменить пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <main className="w-full max-w-md bg-white rounded-2xl p-7 shadow-2xl">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate("/login")}
          aria-label="Вернуться ко входу"
          title="Вернуться ко входу"
          className="mb-4 text-blue-950"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-blue-100 p-4 text-blue-900">
            {step === "email" && <Mail className="h-9 w-9" />}
            {step === "code" && <KeyRound className="h-9 w-9" />}
            {step === "done" && <ShieldCheck className="h-9 w-9" />}
          </div>
          <h1 className="text-2xl font-bold text-blue-950">
            {step === "done" ? "Пароль изменён" : "Восстановление пароля"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {step === "email" && "Введите email, который указан в вашем аккаунте"}
            {step === "code" && `Введите код из письма, отправленного на ${email}`}
            {step === "done" && "Теперь можно войти в Smart Gate с новым паролем"}
          </p>
        </div>

        {step === "email" && (
          <form onSubmit={requestCode} className="space-y-5">
            <div>
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="student@salymbekov.edu"
                className="mt-1.5"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-blue-900 py-6 hover:bg-blue-800">
              {loading ? "Отправка..." : "Получить код"}
            </Button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={resetPassword} className="space-y-4">
            <div>
              <Label htmlFor="reset-code">Код из письма</Label>
              <Input
                id="reset-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="mt-1.5 text-center text-xl"
                minLength={6}
                maxLength={6}
                required
              />
            </div>
            <div>
              <Label htmlFor="new-password">Новый пароль</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Минимум 8 символов"
                className="mt-1.5"
                minLength={8}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Повторите пароль</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                className="mt-1.5"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-blue-900 py-6 hover:bg-blue-800">
              {loading ? "Проверка..." : "Изменить пароль"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={() => setStep("email")}
              className="w-full text-blue-900"
            >
              Отправить код повторно
            </Button>
          </form>
        )}

        {step === "done" && (
          <Button onClick={() => navigate("/login")} className="w-full bg-blue-900 py-6 hover:bg-blue-800">
            Перейти ко входу
          </Button>
        )}

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
        {step !== "done" && (
          <p className="mt-6 text-center text-xs text-gray-500">
            Код действует 10 минут. Smart Gate никогда не просит сообщать его другим людям.
          </p>
        )}
      </main>
    </div>
  );
}
