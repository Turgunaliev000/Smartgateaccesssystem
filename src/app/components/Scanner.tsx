import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { api, GuestPass, HistoryEntry, ScanResult } from "../api";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Car,
  CheckCircle2,
  Clock,
  DoorOpen,
  FileScan,
  History,
  QrCode,
  RotateCcw,
  Phone,
  Repeat2,
  TicketCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";

function statusText(result: ScanResult) {
  if (result.status === "allowed") return "Доступ разрешён";
  if (result.status === "used") return "Пропуск уже использован";
  if (result.status === "expired") return "Срок действия истёк";
  return "Доступ запрещён";
}

function statusClass(result: ScanResult) {
  if (result.status === "allowed") return "bg-green-50 border-green-400 text-green-900";
  if (result.status === "used") return "bg-orange-50 border-orange-300 text-orange-900";
  return "bg-red-50 border-red-300 text-red-900";
}

export function Scanner() {
  const [qrText, setQrText] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [passes, setPasses] = useState<GuestPass[]>([]);
  const [recentLogs, setRecentLogs] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState({ active: 0, used: 0, expired: 0 });
  const [loading, setLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  const activePasses = useMemo(
    () => passes.filter((item) => item.status === "active"),
    [passes]
  );

  const loadOverview = async () => {
    try {
      const data = await api.scannerOverview();
      setPasses(data.passes);
      setRecentLogs(data.recentLogs);
      setStats(data.stats);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось загрузить пропуска");
    } finally {
      setOverviewLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
    return () => stopCamera();
  }, []);

  const runScan = async (code: string) => {
    setLoading(true);
    setResult(null);

    try {
      const data = await api.scanGuestPass(code);
      setResult(data);
      setQrText("");
      toast.success("QR-пропуск подтверждён");
      await loadOverview();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось проверить QR";
      const status = message.includes("истёк")
        ? "expired"
        : message.includes("использован")
          ? "used"
          : "denied";
      setResult({ status, detail: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (event: React.FormEvent) => {
    event.preventDefault();
    await runScan(qrText);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    scanningRef.current = false;
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError("");
    setResult(null);

    if (!("BarcodeDetector" in window)) {
      setCameraError("Этот браузер не поддерживает сканирование QR через камеру. Используйте ручной ввод кода.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      await new Promise((resolve) => requestAnimationFrame(resolve));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      scanningRef.current = true;
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });

      const scanFrame = async () => {
        if (!scanningRef.current || !videoRef.current) return;

        try {
          const codes = await detector.detect(videoRef.current);
          const value = codes?.[0]?.rawValue;
          if (value) {
            stopCamera();
            await runScan(value);
            return;
          }
        } catch {
          setCameraError("Не удалось распознать QR. Попробуйте приблизить код или используйте ручной ввод.");
        }

        requestAnimationFrame(scanFrame);
      };

      requestAnimationFrame(scanFrame);
    } catch {
      setCameraError("Нет доступа к камере. Разрешите доступ в браузере или вставьте код вручную.");
      stopCamera();
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="pt-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-900 p-2 rounded-lg">
            <FileScan className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Сканер QR</h1>
            <p className="text-sm text-gray-600">Проверка гостевых пропусков на КПП</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center bg-green-50 border-green-200">
          <div className="text-xl font-bold text-green-900">{stats.active}</div>
          <div className="text-xs text-gray-600">Активные</div>
        </Card>
        <Card className="p-3 text-center bg-blue-50 border-blue-200">
          <div className="text-xl font-bold text-blue-900">{stats.used}</div>
          <div className="text-xs text-gray-600">Использованы</div>
        </Card>
        <Card className="p-3 text-center bg-red-50 border-red-200">
          <div className="text-xl font-bold text-red-900">{stats.expired}</div>
          <div className="text-xs text-gray-600">Истекли</div>
        </Card>
      </div>

      <Card className="p-5 bg-white">
        <div className="mb-4">
          <Button
            type="button"
            onClick={cameraActive ? stopCamera : startCamera}
            className={`w-full py-6 ${cameraActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
            size="lg"
          >
            {cameraActive ? (
              <>
                <CameraOff className="w-5 h-5 mr-2" />
                Остановить камеру
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 mr-2" />
                Сканировать камерой
              </>
            )}
          </Button>

          {(cameraActive || cameraError) && (
            <div className="mt-3">
              {cameraActive && (
                <div className="overflow-hidden rounded-lg border-2 border-blue-200 bg-black aspect-video">
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {cameraError && (
                <p className="text-sm text-red-600 mt-2">{cameraError}</p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <Label htmlFor="qrText" className="flex items-center gap-2 mb-2">
              <QrCode className="w-4 h-4" />
              QR-код или код пропуска
            </Label>
            <Textarea
              id="qrText"
              placeholder='Например: {"type":"smart-gate-guest-pass","code":"..."}'
              value={qrText}
              onChange={(event) => setQrText(event.target.value)}
              required
              className="min-h-[120px] border-gray-300 resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !qrText.trim()}
            className="w-full py-6 bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400"
            size="lg"
          >
            {loading ? "Проверка..." : "Проверить и открыть"}
          </Button>
        </form>
      </Card>

      <Card className="p-4 bg-white">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-900" />
            Активные пропуска
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadOverview}
            className="border-gray-300"
          >
            Обновить
          </Button>
        </div>

        {overviewLoading ? (
          <p className="text-sm text-gray-600">Загрузка пропусков...</p>
        ) : activePasses.length > 0 ? (
          <div className="space-y-3">
            {activePasses.map((pass) => (
              <div key={pass.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{pass.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>До {pass.validUntil}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                      {pass.passType === "multiple" ? (
                        <Repeat2 className="w-3.5 h-3.5" />
                      ) : (
                        <TicketCheck className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {pass.passType === "multiple"
                          ? `Многоразовый · проходов: ${pass.usageCount}`
                          : "Одноразовый"}
                      </span>
                    </div>
                    {(pass.vehiclePlate || pass.phone) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {pass.vehiclePlate && (
                          <Badge variant="outline" className="text-xs border-blue-200 text-blue-900">
                            {pass.vehiclePlate}
                          </Badge>
                        )}
                        {pass.phone && (
                          <Badge variant="outline" className="text-xs border-green-200 text-green-900">
                            {pass.phone}
                          </Badge>
                        )}
                      </div>
                    )}
                    {pass.comment && (
                      <p className="text-xs text-gray-600 mt-2">{pass.comment}</p>
                    )}
                    <p className="text-xs text-gray-500 truncate mt-1">{pass.code}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={loading}
                    onClick={() => runScan(pass.code)}
                    className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                  >
                    Проверить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Нет активных гостевых пропусков</p>
        )}
      </Card>

      {result && (
        <Card className={`p-5 border-2 ${statusClass(result)}`}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {result.status === "allowed" ? (
                <CheckCircle2 className="w-6 h-6 text-green-700" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-700" />
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-bold text-lg">{statusText(result)}</h3>
                {result.detail && <p className="text-sm opacity-80">{result.detail}</p>}
              </div>

              {result.pass && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{result.pass.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Действует до {result.pass.validUntil}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.pass.passType === "multiple" ? (
                      <Repeat2 className="w-4 h-4" />
                    ) : (
                      <TicketCheck className="w-4 h-4" />
                    )}
                    <span>
                      {result.pass.passType === "multiple"
                        ? `Многоразовый, проходов: ${result.pass.usageCount}`
                        : "Одноразовый"}
                    </span>
                  </div>
                  {result.pass.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{result.pass.phone}</span>
                    </div>
                  )}
                  {result.pass.vehiclePlate && (
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      <span>{result.pass.vehiclePlate}</span>
                    </div>
                  )}
                  {result.pass.comment && (
                    <p className="text-sm font-medium">{result.pass.comment}</p>
                  )}
                  <Badge variant="outline" className="bg-white/70">
                    {result.pass.code}
                  </Badge>
                </div>
              )}

              {result.status === "allowed" && (
                <div className="flex items-center gap-2 text-green-800">
                  <DoorOpen className="w-5 h-5" />
                  <span className="font-medium">Шлагбаум открыт на 5 секунд</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <Button
        onClick={() => {
          setQrText("");
          setResult(null);
        }}
        variant="outline"
        className="w-full py-5 border-gray-300"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Очистить
      </Button>

      <Card className="p-4 bg-white">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <History className="w-5 h-5 text-blue-900" />
          Последние проверки
        </h3>
        {recentLogs.length > 0 ? (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-3 text-sm border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{log.name}</p>
                  <p className="text-xs text-gray-500">{log.date}, {log.time}</p>
                </div>
                <Badge variant="outline" className={log.success ? "text-green-700 border-green-300" : "text-red-700 border-red-300"}>
                  {log.success ? "Разрешён" : "Отказ"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Проверок пока нет</p>
        )}
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3 items-start">
          <CheckCircle2 className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">Как работает проверка</p>
            <p className="text-gray-600 text-xs">
              При успешной проверке пропуск становится использованным, событие попадает в журнал, а владелец получает уведомление.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
