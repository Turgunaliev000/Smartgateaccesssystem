import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { QRCodeSVG } from "qrcode.react";
import { Calendar, Clock, User, FileText, MapPin, Download, Share2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { api, GuestPass } from "../api";

export function GuestQR() {
  const [guestName, setGuestName] = useState("");
  const [reason, setReason] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [generatedPass, setGeneratedPass] = useState<GuestPass | null>(null);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.guestPasses()
      .then((data) => setStats(data.stats))
      .catch(() => undefined);
  }, []);

  const handleGenerateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.createGuestPass(guestName, reason, validUntil);
      const nextStats = await api.guestPasses();
      setGeneratedPass(data.pass);
      setStats(nextStats.stats);
      toast.success("QR-код успешно сгенерирован!");
      setGuestName("");
      setReason("");
      setValidUntil("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось создать QR-код");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    toast.success("QR-код готов к отправке гостю");
  };

  const handleDownload = () => {
    toast.success("QR-код сохранён");
  };

  const handleReset = () => {
    setGeneratedPass(null);
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Заголовок */}
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Пропуск для гостя</h1>
        <p className="text-sm text-gray-600">
          Создайте временный QR-код для въезда гостей на территорию университета
        </p>
      </div>

      {!generatedPass ? (
        /* Форма генерации */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 bg-white">
            <form onSubmit={handleGenerateQR} className="space-y-4">
              <div>
                <Label htmlFor="guestName" className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Имя гостя
                </Label>
                <Input
                  id="guestName"
                  type="text"
                  placeholder="Например: Айбек Каримов"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  className="border-gray-300"
                />
              </div>

              <div>
                <Label htmlFor="reason" className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />
                  Причина визита
                </Label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите причину</option>
                  <option value="meeting">Встреча с сотрудником</option>
                  <option value="delivery">Доставка</option>
                  <option value="event">Мероприятие</option>
                  <option value="interview">Собеседование</option>
                  <option value="maintenance">Техническое обслуживание</option>
                  <option value="other">Другое</option>
                </select>
              </div>

              <div>
                <Label htmlFor="validUntil" className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" />
                  Действует до
                </Label>
                <Input
                  id="validUntil"
                  type="time"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  required
                  className="border-gray-300"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Пропуск будет действителен до указанного времени сегодня
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-blue-900 hover:bg-blue-800"
                size="lg"
              >
                {loading ? "Создание..." : "Сгенерировать QR-код"}
              </Button>
            </form>
          </Card>

          {/* Информация */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex gap-3 items-start">
              <MapPin className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Важная информация</p>
                <ul className="text-gray-600 text-xs space-y-1 list-disc list-inside">
                  <li>Доступ только через главный въезд</li>
                  <li>QR-код действителен только сегодня</li>
                  <li>Гость должен иметь документ удостоверяющий личность</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      ) : (
        /* Сгенерированный QR-код */
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <Card className="p-6 bg-white text-center">
            <div className="inline-block p-4 bg-white rounded-xl shadow-inner border-2 border-gray-200">
              <QRCodeSVG
                value={JSON.stringify({ type: "smart-gate-guest-pass", code: generatedPass.code })}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
          </Card>

          {/* Информация о пропуске */}
          <Card className="p-5 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <h3 className="font-semibold text-green-900">Пропуск активен</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Имя</p>
                  <p className="font-semibold text-gray-900">{generatedPass.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Причина визита</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {generatedPass.reason === 'meeting' && 'Встреча с сотрудником'}
                    {generatedPass.reason === 'delivery' && 'Доставка'}
                    {generatedPass.reason === 'event' && 'Мероприятие'}
                    {generatedPass.reason === 'interview' && 'Собеседование'}
                    {generatedPass.reason === 'maintenance' && 'Техническое обслуживание'}
                    {generatedPass.reason === 'other' && 'Другое'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Действует до</p>
                  <p className="font-semibold text-gray-900">
                    Сегодня, {generatedPass.validUntil}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Въезд</p>
                  <p className="font-semibold text-gray-900">Главный въезд</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                ID: {generatedPass.code}
              </p>
            </div>
          </Card>

          {/* Действия */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleShare}
              className="py-6 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Отправить
            </Button>

            <Button
              onClick={handleDownload}
              className="py-6 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
          </div>

          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full py-6 border-gray-300"
            size="lg"
          >
            Создать новый пропуск
          </Button>
        </motion.div>
      )}

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
    </div>
  );
}
