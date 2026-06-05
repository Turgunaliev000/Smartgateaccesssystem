const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail ?? "Ошибка сервера");
  }
  return data as T;
}

export type AccessUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  type: "student" | "staff" | "security" | "admin";
  department: string;
  identifier: string;
  status: "active" | "blocked";
  isAdmin: boolean;
  accessCount: number;
};

export type GateState = {
  id: number;
  name: string;
  location: string;
  isOpen: boolean;
  lastOpenedAt: string | null;
  openedUntil: string | null;
};

export type UserRole = "student" | "staff" | "security" | "admin";

export type HistoryEntry = {
  id: number;
  type: "student" | "guest" | "staff" | "admin";
  name: string;
  action: "open" | "qr" | "denied";
  success: boolean;
  time: string;
  date: string;
  createdAt: string;
};

export type NotificationItem = {
  id: number;
  type: "gate" | "guest" | "qr" | "alert";
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export type GuestPass = {
  id: number;
  code: string;
  name: string;
  phone: string;
  vehiclePlate: string;
  comment: string;
  reason: string;
  validUntil: string;
  validUntilIso: string;
  passType: "one_time" | "multiple";
  usageCount: number;
  status: "active" | "used" | "expired";
};

export type ScanResult = {
  status: "allowed" | "denied" | "used" | "expired";
  detail?: string;
  pass?: GuestPass;
  gate?: GateState;
};

export const api = {
  login: (email: string, password: string) =>
    request<{ user: AccessUser }>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (data: {
    name: string;
    email: string;
    phone: string;
    department: string;
    password: string;
    passwordConfirm: string;
  }) =>
    request<{ user: AccessUser }>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logout: () => request<{ ok: boolean }>("/auth/logout/", { method: "POST" }),
  me: () => request<{ user: AccessUser }>("/me/"),
  dashboard: () =>
    request<{
      user: AccessUser;
      gate: GateState;
      stats: {
        todayAccess: number;
        todayGuests: number;
        monthAccess: number;
        security: number;
        timeSaved: number;
        control: number;
      };
    }>("/dashboard/"),
  openGate: () => request<{ gate: GateState; user: AccessUser }>("/gate/open/", { method: "POST" }),
  createGuestPass: (data: {
    name: string;
    phone: string;
    vehiclePlate: string;
    comment: string;
    reason: string;
    validUntil: string;
    passType: "one_time" | "multiple";
  }) =>
    request<{ pass: GuestPass }>("/guest-passes/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  guestPasses: () => request<{ passes: GuestPass[]; stats: { today: number; week: number; month: number } }>("/guest-passes/"),
  scanGuestPass: (code: string) =>
    request<ScanResult>("/scan/", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  scannerOverview: () =>
    request<{
      passes: GuestPass[];
      recentLogs: HistoryEntry[];
      stats: { active: number; used: number; expired: number };
    }>("/scan/"),
  accessLogs: () => request<{ logs: HistoryEntry[]; stats: { today: number; week: number; month: number } }>("/access-logs/"),
  notifications: () => request<{ notifications: NotificationItem[] }>("/notifications/"),
  markNotificationRead: (id: number) => request<{ ok: boolean }>(`/notifications/${id}/read/`, { method: "POST" }),
  markAllNotificationsRead: () => request<{ ok: boolean }>("/notifications/read-all/", { method: "POST" }),
  deleteNotification: (id: number) => request<{ ok: boolean }>(`/notifications/${id}/`, { method: "DELETE" }),
  users: () => request<{ users: AccessUser[] }>("/users/"),
  createUser: (data: {
    name: string;
    email: string;
    password: string;
    type: UserRole;
    phone: string;
    department: string;
  }) =>
    request<{ user: AccessUser }>("/users/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  toggleUser: (id: number) => request<{ user: AccessUser }>(`/users/${id}/toggle/`, { method: "POST" }),
  updateUserRole: (id: number, role: UserRole) =>
    request<{ user: AccessUser }>(`/users/${id}/role/`, {
      method: "POST",
      body: JSON.stringify({ role }),
    }),
};
