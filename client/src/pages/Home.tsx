/*
 * 慢半拍 - 主頁面
 * Design: 清新樂譜 (Sheet Music Minimalism)
 * - White background, purple-blue gradient brand color
 * - Noto Sans HK typography, different weights for hierarchy
 * - Card-based layout with subtle shadows
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { trpc } from "@/lib/trpc";

// ============================================
// TYPES
// ============================================
interface Member {
  id: number;
  name: string;
  instrument: string;
  color: string;
  password: string;
}

interface BandEvent {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: "rehearsal" | "performance" | "meeting" | "other";
  notes?: string | null;
  attendance: Record<number, string>;
  isCompleted?: number | boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Holiday {
  date: string;
  name: string;
}

interface SystemData {
  isSetup: boolean;
  adminPassword: string;
  members: Member[];
  events: BandEvent[];
  holidays: Holiday[];
}

interface CurrentUser {
  id: number | "admin";
  role: "admin" | "member";
  name: string;
}

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
  visible: boolean;
}

// ============================================
// HONG KONG PUBLIC HOLIDAYS 2026-2030
// ============================================
const HK_HOLIDAYS_DATA: Record<number, Holiday[]> = {
  2026: [
    { date: "2026-01-01", name: "元旦" },
    { date: "2026-02-17", name: "農曆年初一" },
    { date: "2026-02-18", name: "農曆年初二" },
    { date: "2026-02-19", name: "農曆年初三" },
    { date: "2026-04-03", name: "耶穌受難節" },
    { date: "2026-04-04", name: "耶穌受難節翌日" },
    { date: "2026-04-06", name: "復活節星期一" },
    { date: "2026-04-05", name: "清明節" },
    { date: "2026-05-01", name: "勞動節" },
    { date: "2026-05-25", name: "佛誕" },
    { date: "2026-06-19", name: "端午節" },
    { date: "2026-07-01", name: "香港特別行政區成立紀念日" },
    { date: "2026-09-26", name: "中秋節翌日" },
    { date: "2026-10-01", name: "國慶日" },
    { date: "2026-10-19", name: "重陽節" },
    { date: "2026-12-25", name: "聖誕節" },
    { date: "2026-12-26", name: "聖誕節後第一個周日" },
  ],
  2027: [
    { date: "2027-01-01", name: "元旦" },
    { date: "2027-02-06", name: "農曆年初一" },
    { date: "2027-02-07", name: "農曆年初二" },
    { date: "2027-02-08", name: "農曆年初三" },
    { date: "2027-03-26", name: "耶穌受難節" },
    { date: "2027-03-27", name: "耶穌受難節翌日" },
    { date: "2027-03-29", name: "復活節星期一" },
    { date: "2027-04-05", name: "清明節" },
    { date: "2027-05-01", name: "勞動節" },
    { date: "2027-05-14", name: "佛誕" },
    { date: "2027-06-09", name: "端午節" },
    { date: "2027-07-01", name: "香港特別行政區成立紀念日" },
    { date: "2027-09-16", name: "中秋節翌日" },
    { date: "2027-10-01", name: "國慶日" },
    { date: "2027-10-09", name: "重陽節" },
    { date: "2027-12-25", name: "聖誕節" },
    { date: "2027-12-26", name: "聖誕節後第一個周日" },
  ],
  2028: [
    { date: "2028-01-01", name: "元旦" },
    { date: "2028-01-26", name: "農曆年初一" },
    { date: "2028-01-27", name: "農曆年初二" },
    { date: "2028-01-28", name: "農曆年初三" },
    { date: "2028-04-14", name: "耶穌受難節" },
    { date: "2028-04-15", name: "耶穌受難節翌日" },
    { date: "2028-04-17", name: "復活節星期一" },
    { date: "2028-04-04", name: "清明節" },
    { date: "2028-05-01", name: "勞動節" },
    { date: "2028-05-02", name: "佛誕" },
    { date: "2028-05-29", name: "端午節" },
    { date: "2028-07-01", name: "香港特別行政區成立紀念日" },
    { date: "2028-10-04", name: "中秋節翌日" },
    { date: "2028-10-01", name: "國慶日" },
    { date: "2028-10-27", name: "重陽節" },
    { date: "2028-12-25", name: "聖誕節" },
    { date: "2028-12-26", name: "聖誕節後第一個周日" },
  ],
  2029: [
    { date: "2029-01-01", name: "元旦" },
    { date: "2029-02-13", name: "農曆年初一" },
    { date: "2029-02-14", name: "農曆年初二" },
    { date: "2029-02-15", name: "農曆年初三" },
    { date: "2029-03-30", name: "耶穌受難節" },
    { date: "2029-03-31", name: "耶穌受難節翌日" },
    { date: "2029-04-02", name: "復活節星期一" },
    { date: "2029-04-04", name: "清明節" },
    { date: "2029-05-01", name: "勞動節" },
    { date: "2029-05-21", name: "佛誕" },
    { date: "2029-06-16", name: "端午節" },
    { date: "2029-07-01", name: "香港特別行政區成立紀念日" },
    { date: "2029-09-25", name: "中秋節翌日" },
    { date: "2029-10-01", name: "國慶日" },
    { date: "2029-10-16", name: "重陽節" },
    { date: "2029-12-25", name: "聖誕節" },
    { date: "2029-12-26", name: "聖誕節後第一個周日" },
  ],
  2030: [
    { date: "2030-01-01", name: "元旦" },
    { date: "2030-02-03", name: "農曆年初一" },
    { date: "2030-02-04", name: "農曆年初二" },
    { date: "2030-02-05", name: "農曆年初三" },
    { date: "2030-04-19", name: "耶穌受難節" },
    { date: "2030-04-20", name: "耶穌受難節翌日" },
    { date: "2030-04-22", name: "復活節星期一" },
    { date: "2030-04-05", name: "清明節" },
    { date: "2030-05-01", name: "勞動節" },
    { date: "2030-05-10", name: "佛誕" },
    { date: "2030-06-05", name: "端午節" },
    { date: "2030-07-01", name: "香港特別行政區成立紀念日" },
    { date: "2030-09-13", name: "中秋節翌日" },
    { date: "2030-10-01", name: "國慶日" },
    { date: "2030-10-06", name: "重陽節" },
    { date: "2030-12-25", name: "聖誕節" },
    { date: "2030-12-26", name: "聖誕節後第一個周日" },
  ],
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function calculateEasterHolidays(year: number): Holiday[] {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easterSunday = new Date(year, month, day);
  const goodFriday = new Date(easterSunday);
  goodFriday.setDate(goodFriday.getDate() - 2);
  const holySaturday = new Date(easterSunday);
  holySaturday.setDate(holySaturday.getDate() - 1);
  const easterMonday = new Date(easterSunday);
  easterMonday.setDate(easterMonday.getDate() + 1);
  return [
    { date: formatDateStr(goodFriday), name: "耶穌受難節" },
    { date: formatDateStr(holySaturday), name: "耶穌受難節翌日" },
    { date: formatDateStr(easterMonday), name: "復活節星期一" },
  ];
}

function initializeHolidays(savedHolidays: Holiday[]): Holiday[] {
  const holidays: Holiday[] = [];
  for (let year = 2026; year <= 2030; year++) {
    if (HK_HOLIDAYS_DATA[year]) holidays.push(...HK_HOLIDAYS_DATA[year]);
  }
  const currentYear = new Date().getFullYear();
  for (let year = 2031; year <= currentYear + 10; year++) {
    const fixed: Holiday[] = [
      { date: `${year}-01-01`, name: "元旦" },
      { date: `${year}-05-01`, name: "勞動節" },
      { date: `${year}-07-01`, name: "香港特別行政區成立紀念日" },
      { date: `${year}-10-01`, name: "國慶日" },
      { date: `${year}-12-25`, name: "聖誕節" },
      { date: `${year}-12-26`, name: "聖誕節後第一個周日" },
    ];
    holidays.push(...fixed, ...calculateEasterHolidays(year));
  }
  if (savedHolidays && savedHolidays.length > 0) {
    savedHolidays.forEach((h) => {
      if (!holidays.find((existing) => existing.date === h.date)) {
        holidays.push(h);
      }
    });
  }
  return holidays;
}

function getHKTime(): Date {
  return new Date();
}

function isDayCompleted(dateStr: string): boolean {
  const hkNow = getHKTime();
  const todayStr = formatDateStr(hkNow);
  return dateStr < todayStr;
}

function isEventEnded(event: BandEvent): boolean {
  const hkNow = getHKTime();
  const todayStr = formatDateStr(hkNow);
  
  if (event.date < todayStr) return true;
  if (event.date > todayStr) return false;
  
  const nowTime = `${String(hkNow.getHours()).padStart(2, "0")}:${String(hkNow.getMinutes()).padStart(2, "0")}`;
  return nowTime > event.endTime;
}

function getEventStatus(event: BandEvent): "upcoming" | "ongoing" | "completed" {
  const hkNow = getHKTime();
  const todayStr = formatDateStr(hkNow);
  if (event.date < todayStr) return "completed";
  if (event.date > todayStr) return "upcoming";
  const nowTime = `${String(hkNow.getHours()).padStart(2, "0")}:${String(hkNow.getMinutes()).padStart(2, "0")}`;
  if (nowTime >= event.startTime && nowTime <= event.endTime) return "ongoing";
  if (nowTime > event.endTime) return "completed";
  return "upcoming";
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${year}年${parseInt(month)}月${parseInt(day)}日`;
}

function formatTime12Full(time24: string): string {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":").map(Number);
  const ampm = hours >= 12 ? "下午" : "上午";
  const hours12 = hours % 12 || 12;
  return `${ampm} ${hours12}:${String(minutes).padStart(2, "0")}`;
}

function parseTime12To24(hour: string, minute: string, ampm: string): string {
  let h = parseInt(hour);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

const TYPE_CONFIG = {
  rehearsal: { text: "排練", icon: "fa-guitar", color: "bg-blue-100 text-blue-700", border: "border-blue-400" },
  performance: { text: "演出", icon: "fa-microphone", color: "bg-red-100 text-red-700", border: "border-red-400" },
  meeting: { text: "會議", icon: "fa-users", color: "bg-green-100 text-green-700", border: "border-green-400" },
  other: { text: "其他", icon: "fa-calendar", color: "bg-gray-100 text-gray-700", border: "border-gray-400" },
};

const MEMBER_COLORS = ["blue", "purple", "green", "red", "yellow", "pink", "indigo", "orange"];
const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  green: "bg-green-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  pink: "bg-pink-500",
  indigo: "bg-indigo-500",
  orange: "bg-orange-500",
};
const COLOR_HEX: Record<string, string> = {
  blue: "#3b82f6",
  purple: "#8b5cf6",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#eab308",
  pink: "#ec4899",
  indigo: "#6366f1",
  orange: "#f97316",
};

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function Home() {
  // tRPC queries and mutations
  const systemDataQuery = trpc.band.getSystemData.useQuery(undefined, { refetchInterval: 500, refetchOnWindowFocus: true, refetchOnMount: true, staleTime: 0 });
  const membersQuery = trpc.band.getMembers.useQuery(undefined, { refetchInterval: 500, refetchOnWindowFocus: true, refetchOnMount: true, staleTime: 0 });
  const eventsQuery = trpc.band.getEvents.useQuery(undefined, { refetchInterval: 500, refetchOnWindowFocus: true, refetchOnMount: true, staleTime: 0 });
  const holidaysQuery = trpc.band.getHolidays.useQuery(undefined, { refetchInterval: 500, refetchOnWindowFocus: true, refetchOnMount: true, staleTime: 0 });

  const addMemberMutation = trpc.band.addMember.useMutation();
  const updateMemberMutation = trpc.band.updateMember.useMutation();
  const deleteMemberMutation = trpc.band.deleteMember.useMutation();
  const addEventMutation = trpc.band.addEvent.useMutation();
  const updateEventMutation = trpc.band.updateEvent.useMutation();
  const deleteEventMutation = trpc.band.deleteEvent.useMutation();
  const setAttendanceMutation = trpc.band.setAttendance.useMutation();
  const addHolidayMutation = trpc.band.addHoliday.useMutation();
  const utils = trpc.useUtils();

  useRealtimeSync();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<"calendar" | "list" | "members">("calendar");
  const [currentListTab, setCurrentListTab] = useState<"incomplete" | "completed">("incomplete");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedRegColor, setSelectedRegColor] = useState("blue");

  // Modal states
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [loginTab, setLoginTab] = useState<"member" | "admin">("member");

  // Toast
  const [toast, setToast] = useState<ToastState>({ message: "", type: "info", visible: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form states
  const [setupFirstName, setSetupFirstName] = useState("");
  const [setupFirstInstrument, setSetupFirstInstrument] = useState("");

  const [adminLoginPassword, setAdminLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regInstrument, setRegInstrument] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  // Event form
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState<BandEvent["type"]>("rehearsal");
  const [eventLocation, setEventLocation] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [startHour, setStartHour] = useState("7");
  const [startMinute, setStartMinute] = useState("00");
  const [startAmpm, setStartAmpm] = useState("PM");
  const [endHour, setEndHour] = useState("10");
  const [endMinute, setEndMinute] = useState("00");
  const [endAmpm, setEndAmpm] = useState("PM");
  const [dateHolidayWarning, setDateHolidayWarning] = useState("");
  const [eventModalMode, setEventModalMode] = useState<"add" | "edit" | "view">("view");

  // List view
  const [listYear, setListYear] = useState(new Date().getFullYear());
  const [listMonth, setListMonth] = useState<string>("all");
  const [filterByDate, setFilterByDate] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventIds, setSelectedEventIds] = useState<Set<number>>(new Set());

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type, visible: true });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const handleShowMoreEvents = (dateStr: string) => {
    setSelectedDates(new Set([dateStr]));
    setCurrentView("list");
    setCurrentListTab("incomplete");
  };

  const toggleDateSelection = (dateStr: string) => {
    const newDates = new Set(selectedDates);
    if (newDates.has(dateStr)) {
      newDates.delete(dateStr);
    } else {
      newDates.add(dateStr);
    }
    setSelectedDates(newDates);
  };

  const clearDateSelection = () => {
    setSelectedDates(new Set());
  };

  // Initialize on mount
  useEffect(() => {
    systemDataQuery.refetch();
  }, []);

  // Handle system data changes
  useEffect(() => {
    if (!systemDataQuery.data) return;
  }, [systemDataQuery.data]);

  // Logout
  const handleLogout = () => {
    setCurrentUser(null);
    showToast("已登出", "info");
    setShowLoginModal(true);
    setSelectedEventIds(new Set());
  };

  // Setup
  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupFirstName.trim()) {
      showToast("請輸入名稱", "error");
      return;
    }
    // Call setup API
    showToast("設定完成！", "success");
    setShowSetupModal(false);
    setShowLoginModal(true);
    setLoginTab("admin");
  };

  // Admin login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLoginPassword === "admin") {
      setCurrentUser({ id: "admin", role: "admin", name: "主管" });
      setShowLoginModal(false);
      setAdminLoginPassword("");
      showToast("主管登入成功", "success");
    } else {
      showToast("主管密碼錯誤", "error");
    }
  };

  // Member login
  const handleMemberLogin = (memberId: number) => {
    const member = membersQuery.data?.find((m) => m.id === memberId);
    if (!member) return;
    setCurrentUser({ id: memberId, role: "member", name: member.name });
    setShowLoginModal(false);
    showToast(`歡迎回來，${member.name}！`, "success");
  };

  // Register
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return showToast("請輸入名稱", "error");
    if (regPassword.length < 4) return showToast("密碼最少需要4個字元", "error");
    if (regPassword !== regConfirm) return showToast("兩次輸入的密碼不一致", "error");

    addMemberMutation.mutate(
      {
        name: regName.trim(),
        instrument: regInstrument.trim(),
        color: selectedRegColor,
        password: regPassword,
      },
      {
        onSuccess: () => {
          showToast(`${regName} 已註冊`, "success");
          setShowRegisterModal(false);
          setRegName("");
          setRegInstrument("");
          setRegPassword("");
          setRegConfirm("");
          setSelectedRegColor("blue");
          utils.band.getMembers.invalidate();
        },
        onError: () => {
          showToast("註冊失敗", "error");
        },
      }
    );
  };

  // Events
  const openAddEventModal = () => {
    setEventTitle("");
    setEventDate("");
    setEventType("rehearsal");
    setEventLocation("");
    setEventNotes("");
    setStartHour("7");
    setStartMinute("00");
    setStartAmpm("PM");
    setEndHour("10");
    setEndMinute("00");
    setEndAmpm("PM");
    setDateHolidayWarning("");
    setEventModalMode("add");
    setShowEventModal(true);
  };

  const openEventModal = (eventId: number) => {
    const event = eventsQuery.data?.find((e) => e.id === eventId);
    if (!event) return;
    setSelectedEventId(eventId);
    setEventTitle(event.title);
    setEventDate(event.date);
    setEventType(event.type);
    setEventLocation(event.location);
    setEventNotes(event.notes || "");
    const [startH, startM] = event.startTime.split(":").map(Number);
    const [endH, endM] = event.endTime.split(":").map(Number);
    setStartHour(String(startH % 12 || 12));
    setStartMinute(String(startM).padStart(2, "0"));
    setStartAmpm(startH >= 12 ? "PM" : "AM");
    setEndHour(String(endH % 12 || 12));
    setEndMinute(String(endM).padStart(2, "0"));
    setEndAmpm(endH >= 12 ? "PM" : "AM");
    setEventModalMode("view");
    setShowEventModal(true);
  };

  const saveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return showToast("請輸入活動名稱", "error");
    if (!eventDate) return showToast("請選擇日期", "error");

    const startTime = parseTime12To24(startHour, startMinute, startAmpm);
    const endTime = parseTime12To24(endHour, endMinute, endAmpm);

    if (eventModalMode === "add") {
      addEventMutation.mutate(
        {
          title: eventTitle.trim(),
          date: eventDate,
          startTime,
          endTime,
          location: eventLocation.trim(),
          type: eventType,
          notes: eventNotes.trim(),
        },
        {
          onSuccess: () => {
            showToast("活動已新增", "success");
            setShowEventModal(false);
            utils.band.getEvents.invalidate();
          },
          onError: () => {
            showToast("新增活動失敗", "error");
          },
        }
      );
    } else if (eventModalMode === "edit" && selectedEventId) {
      updateEventMutation.mutate(
        {
          id: selectedEventId,
          title: eventTitle.trim(),
          date: eventDate,
          startTime,
          endTime,
          location: eventLocation.trim(),
          type: eventType,
          notes: eventNotes.trim(),
        },
        {
          onSuccess: () => {
            showToast("活動已更新", "success");
            setShowEventModal(false);
            utils.band.getEvents.invalidate();
          },
          onError: () => {
            showToast("更新活動失敗", "error");
          },
        }
      );
    }
  };

  const deleteEvent = (eventId: number) => {
    if (!confirm("確定要刪除此活動嗎？")) return;
    deleteEventMutation.mutate(
      { id: eventId },
      {
        onSuccess: () => {
          showToast("活動已刪除", "success");
          setShowEventModal(false);
          utils.band.getEvents.invalidate();
        },
        onError: () => {
          showToast("刪除活動失敗", "error");
        },
      }
    );
  };

  const deleteSelectedEvents = () => {
    if (selectedEventIds.size === 0) {
      showToast("請先選擇要刪除的活動", "info");
      return;
    }
    if (!confirm(`確定要刪除 ${selectedEventIds.size} 個活動嗎？`)) return;

    let deleted = 0;
    selectedEventIds.forEach((eventId) => {
      deleteEventMutation.mutate(
        { id: eventId },
        {
          onSuccess: () => {
            deleted++;
            if (deleted === selectedEventIds.size) {
              showToast(`已刪除 ${deleted} 個活動`, "success");
              setSelectedEventIds(new Set());
              utils.band.getEvents.invalidate();
            }
          },
          onError: () => {
            showToast("刪除活動失敗", "error");
          },
        }
      );
    });
  };

  const handleAttendanceChange = (eventId: number, status: "going" | "not-going" | "pending") => {
    if (currentUser?.role !== "member") return;
    setAttendanceMutation.mutate(
      { eventId, memberId: currentUser.id as number, status },
      {
        onSuccess: () => {
          utils.band.getEvents.invalidate();
        },
        onError: () => {
          showToast("更新出席狀態失敗", "error");
        },
      }
    );
  };

  // Computed values
  const systemData = systemDataQuery.data;
  const members = membersQuery.data || [];
  const events = eventsQuery.data || [];
  const holidays = holidaysQuery.data || [];

  const incompleteEvents = events.filter((e) => !isEventEnded(e));
  const completedEvents = events.filter((e) => isEventEnded(e));

  const filteredEvents = (currentListTab === "incomplete" ? incompleteEvents : completedEvents)
    .filter((e) => {
      if (selectedDates.size > 0 && !selectedDates.has(e.date)) return false;
      if (listMonth !== "all") {
        const [, month] = e.date.split("-");
        if (parseInt(month) - 1 !== parseInt(listMonth)) return false;
      }
      const [year] = e.date.split("-");
      if (parseInt(year) !== listYear) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(query) ||
          e.location.toLowerCase().includes(query) ||
          (e.notes && e.notes.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => new Date(`${a.date} ${a.startTime}`).getTime() - new Date(`${b.date} ${b.startTime}`).getTime());

  const displayEvents = filteredEvents;

  const yearOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-2 sm:p-3 md:p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              慢半拍
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">樂隊管理系統</p>
          </div>
          {currentUser && (
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="text-right flex-1 sm:flex-none">
                <p className="text-xs sm:text-sm font-medium text-gray-800">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.role === "admin" ? "主管" : "成員"}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium whitespace-nowrap"
              >
                登出
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      {currentUser && (
        <div className="max-w-7xl mx-auto mb-4 sm:mb-6">
          <div className="flex gap-1 sm:gap-2 flex-wrap">
            <button
              onClick={() => {
                setCurrentView("calendar");
                setSelectedEventIds(new Set());
              }}
              className={`nav-tab text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium transition-all ${
                currentView === "calendar"
                  ? "band-gradient text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <i className="fas fa-calendar mr-1 hidden sm:inline" />
              <span className="hidden sm:inline">月曆</span>
              <span className="sm:hidden">月</span>
            </button>
            <button
              onClick={() => setCurrentView("list")}
              className={`nav-tab text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium transition-all ${
                currentView === "list"
                  ? "band-gradient text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <i className="fas fa-list mr-1 hidden sm:inline" />
              <span className="hidden sm:inline">清單</span>
              <span className="sm:hidden">清</span>
            </button>
            {currentUser.role === "admin" && (
              <button
                onClick={() => setCurrentView("members")}
                className={`nav-tab text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium transition-all ${
                  currentView === "members"
                    ? "band-gradient text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <i className="fas fa-users mr-1 hidden sm:inline" />
                <span className="hidden sm:inline">成員</span>
                <span className="sm:hidden">成</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Login/Setup */}
        {!currentUser && (
          <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-lg text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">歡迎使用慢半拍</h2>
            <p className="text-gray-600 mb-6">請登入以繼續</p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="band-gradient text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium"
            >
              登入
            </button>
          </div>
        )}

        {/* Calendar View */}
        {currentView === "calendar" && currentUser && (
          <div className="glass-panel rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-5">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">月曆</h2>
              {currentUser?.role === "admin" && (
                <button
                  onClick={() => openAddEventModal()}
                  className="band-gradient text-white text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-lg sm:rounded-xl hover:shadow-md transition-all font-medium flex items-center gap-1 sm:gap-2 whitespace-nowrap w-full sm:w-auto justify-center sm:justify-start"
                >
                  <i className="fas fa-plus" /><span className="hidden sm:inline">新增活動</span><span className="sm:hidden">新</span>
                </button>
              )}
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-full">
                {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
                  <div key={day} className="text-center text-xs sm:text-sm font-bold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }).map((_, i) => {
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i - currentDate.getDate() + 1);
                  const dateStr = formatDateStr(date);
                  const dayEvents = events.filter((e) => e.date === dateStr);
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  const isToday = dateStr === formatDateStr(new Date());

                  return (
                    <div
                      key={i}
                      className={`min-h-[80px] sm:min-h-[100px] md:min-h-[120px] p-1 sm:p-2 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all ${
                        isCurrentMonth
                          ? isToday
                            ? "bg-purple-50 border-purple-400"
                            : "bg-white border-gray-200 hover:border-purple-300"
                          : "bg-gray-50 border-gray-100 opacity-50"
                      }`}
                      onClick={() => {
                        if (dayEvents.length > 0) {
                          handleShowMoreEvents(dateStr);
                        }
                      }}
                    >
                      <div className="text-xs sm:text-sm font-bold text-gray-700 mb-1">
                        {date.getDate()}
                      </div>
                      <div className="space-y-0.5 text-xs">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`px-1 py-0.5 rounded text-white truncate ${TYPE_CONFIG[event.type].color.split(" ")[0]}`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowMoreEvents(dateStr);
                            }}
                            className="text-purple-600 hover:text-purple-700 font-medium"
                          >
                            +{dayEvents.length - 2} more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        {currentView === "list" && currentUser && (
          <div className="glass-panel rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-5">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">活動清單</h2>
              {currentUser?.role === "admin" && (
                <button
                  onClick={() => openAddEventModal()}
                  className="band-gradient text-white text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-lg sm:rounded-xl hover:shadow-md transition-all font-medium flex items-center gap-1 sm:gap-2 whitespace-nowrap w-full sm:w-auto justify-center sm:justify-start"
                >
                  <i className="fas fa-plus" /><span className="hidden sm:inline">新增活動</span><span className="sm:hidden">新</span>
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-5 flex-wrap items-start sm:items-center">
              <input
                type="text"
                placeholder="搜尋活動..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg sm:rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-400 flex-1 min-w-0 w-full sm:w-auto"
              />
              <select
                value={listYear}
                onChange={(e) => setListYear(parseInt(e.target.value))}
                className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg sm:rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-400"
              >
                {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
              </select>
              <select
                value={listMonth}
                onChange={(e) => setListMonth(e.target.value)}
                className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg sm:rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="all">全月</option>
                {[0,1,2,3,4,5,6,7,8,9,10,11].map(m => (
                  <option key={m} value={m}>{m + 1}月</option>
                ))}
              </select>
              {selectedDates.size > 0 && (
                <>
                  <span className="text-xs sm:text-sm text-gray-600 truncate">篩選: {Array.from(selectedDates).length}日</span>
                  <button
                    onClick={() => clearDateSelection()}
                    className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 sm:px-3 py-1.5 rounded-lg whitespace-nowrap"
                  >
                    清除
                  </button>
                </>
              )}
            </div>

            {/* Batch Delete Toolbar */}
            {selectedEventIds.size > 0 && currentUser?.role === "admin" && (
              <div className="mb-3 sm:mb-5 flex items-center gap-2 sm:gap-3 bg-blue-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-200">
                <span className="text-xs sm:text-sm font-medium text-blue-700">已選擇 {selectedEventIds.size} 個活動</span>
                <button
                  onClick={() => setSelectedEventIds(new Set())}
                  className="text-xs px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  取消選擇
                </button>
                <button
                  onClick={deleteSelectedEvents}
                  className="text-xs px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium flex items-center gap-1"
                >
                  <i className="fas fa-trash" />刪除
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-5">
              <button
                onClick={() => setCurrentListTab("incomplete")}
                className={`list-tab-btn flex-1 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3`}
              >
                <i className="fas fa-clock hidden sm:inline" />
                <span className="hidden sm:inline">未完成</span><span className="sm:hidden">未</span>
                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold ${currentListTab === "incomplete" ? "bg-white/20" : "bg-gray-200 text-gray-600"}`}>
                  {incompleteEvents.length}
                </span>
              </button>
              <button
                onClick={() => setCurrentListTab("completed")}
                className={`list-tab-btn flex-1 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3`}
              >
                <i className="fas fa-check-circle hidden sm:inline" />
                <span className="hidden sm:inline">已完成</span><span className="sm:hidden">成</span>
                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold ${currentListTab === "completed" ? "bg-white/20" : "bg-gray-200 text-gray-600"}`}>
                  {completedEvents.length}
                </span>
              </button>
            </div>

            {/* Events */}
            <div className="space-y-3">
              {displayEvents.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <i className="fas fa-calendar-times text-4xl mb-3 text-gray-300 block" />
                  <p>{searchQuery.trim() ? `搜尋「${searchQuery}」無結果` : `暫無活動`}</p>
                  {currentListTab === "incomplete" && currentUser?.role === "admin" && !searchQuery.trim() && (
                    <button onClick={() => openAddEventModal()} className="mt-3 text-purple-600 hover:underline text-sm">
                      新增活動
                    </button>
                  )}
                </div>
              ) : (
                displayEvents.map((event) => {
                  const isEnded = isEventEnded(event);
                  const status = isEnded ? "completed" : getEventStatus(event);
                  const isOngoing = status === "ongoing";
                  const typeConf = TYPE_CONFIG[event.type];
                  const goingCount = Object.values(event.attendance).filter(v => v === "going").length;
                  const myStatus = currentUser?.role === "member" ? event.attendance[currentUser.id as number] : null;
                  const isSelected = selectedEventIds.has(event.id);

                  const toggleEventSelection = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    const newSelected = new Set(selectedEventIds);
                    if (newSelected.has(event.id)) {
                      newSelected.delete(event.id);
                    } else {
                      newSelected.add(event.id);
                    }
                    setSelectedEventIds(newSelected);
                  };

                  return (
                    <div
                      key={event.id}
                      onClick={() => !selectedEventIds.size && openEventModal(event.id)}
                      className={`event-card bg-white rounded-xl p-4 shadow-sm cursor-pointer ${typeConf.border} ${isOngoing ? "ongoing-card" : ""} ${isEnded ? "completed-card" : ""} ${isSelected ? "ring-2 ring-purple-500 bg-purple-50" : ""}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        {/* Checkbox for admin */}
                        {currentUser?.role === "admin" && (
                          <div className="flex-shrink-0 pt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e: any) => toggleEventSelection(e)}
                              className="w-5 h-5 text-purple-600 rounded cursor-pointer"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`text-xs px-2.5 py-1 rounded-full ${typeConf.color} font-medium flex items-center gap-1`}>
                              <i className={`fas ${typeConf.icon} text-xs`} />{typeConf.text}
                            </span>
                            {isOngoing && <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-bold animate-pulse">進行中</span>}
                            {isEnded && <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold">已完結</span>}
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <i className="far fa-calendar" />{formatDate(event.date)}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-800 mb-1 truncate">{event.title}</h3>
                          <p className="text-gray-600 text-sm mb-1 flex items-center gap-2">
                            <i className="far fa-clock text-gray-400 w-4" />
                            {formatTime12Full(event.startTime)} - {formatTime12Full(event.endTime)}
                          </p>
                          <p className="text-gray-600 text-sm flex items-center gap-2">
                            <i className="fas fa-map-marker-alt text-gray-400 w-4" />
                            <span className="truncate">{event.location}</span>
                          </p>
                          {currentUser?.role === "admin" && (
                            <div className="mt-2 pt-2 border-t border-gray-200 w-full">
                              <div className="text-xs text-gray-600 mb-1">出席狀態：</div>
                              <div className="flex gap-1 flex-wrap">
                                {Object.entries(event.attendance).map(([memberId, status]) => {
                                  const member = members.find(m => m.id === parseInt(memberId));
                                  if (!member) return null;
                                  return (
                                    <span key={memberId} className={`text-xs px-2 py-1 rounded ${
                                      status === "going" ? "bg-green-100 text-green-700" :
                                      status === "not-going" ? "bg-red-100 text-red-700" :
                                      "bg-gray-100 text-gray-600"
                                    }`}>
                                      {member.name} {status === "going" ? "✓" : status === "not-going" ? "✗" : "?"}
                                    </span>
                                  );
                                })}
                                {members.filter(m => !event.attendance[m.id]).map(member => (
                                  <span key={member.id} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                    {member.name} ?
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {currentUser?.role === "member" && (
                            <div className="mt-2 pt-2 border-t border-gray-200 w-full">
                              <div className="text-xs text-gray-600 mb-1">您的出席狀態：</div>
                              <div className="text-xs px-3 py-1 rounded inline-block bg-blue-50 text-blue-700 font-medium">
                                {myStatus === "going" ? "✓ 已確認出席" : myStatus === "not-going" ? "✗ 已確認不出席" : "? 待確認"}
                              </div>
                            </div>
                          )}
                          {event.notes && (
                            <div className="mt-2 pt-2 border-t border-gray-200 w-full">
                              <div className="text-xs text-gray-600 mb-1">備註:</div>
                              <div className="text-xs text-gray-700 bg-yellow-50 p-2 rounded border-l-2 border-yellow-300 whitespace-pre-wrap break-words">
                                {event.notes}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 min-w-[80px]">
                          {currentUser?.role === "member" ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAttendanceChange(event.id, "going");
                                  }}
                                  className={`p-2 rounded-lg transition-all ${
                                    myStatus === "going"
                                      ? "bg-green-100 text-green-600"
                                      : "bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-500"
                                  }`}
                                  title="出席"
                                >
                                  <i className="fas fa-check-circle text-lg" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAttendanceChange(event.id, "not-going");
                                  }}
                                  className={`p-2 rounded-lg transition-all ${
                                    myStatus === "not-going"
                                      ? "bg-red-100 text-red-600"
                                      : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                  }`}
                                  title="不出席"
                                >
                                  <i className="fas fa-times-circle text-lg" />
                                </button>
                              </div>
                              {myStatus === undefined && (
                                <span className="text-xs text-gray-500 font-medium">待確認</span>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Members View */}
        {currentView === "members" && currentUser?.role === "admin" && (
          <div className="glass-panel rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-5">
              <h2 className="text-xl font-bold text-gray-800">成員管理</h2>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="band-gradient text-white px-4 py-2 rounded-xl hover:shadow-md transition-all font-medium flex items-center gap-2"
              >
                <i className="fas fa-user-plus" />新增成員
              </button>
            </div>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.instrument}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`確定要刪除 ${member.name} 嗎？`)) {
                          deleteMemberMutation.mutate(
                            { id: member.id },
                            {
                              onSuccess: () => {
                                showToast(`${member.name} 已刪除`, "success");
                                utils.band.getMembers.invalidate();
                              },
                              onError: () => {
                                showToast("刪除成員失敗", "error");
                              },
                            }
                          );
                        }
                      }}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">登入</h2>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setLoginTab("member")}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  loginTab === "member"
                    ? "band-gradient text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                成員
              </button>
              <button
                onClick={() => setLoginTab("admin")}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  loginTab === "admin"
                    ? "band-gradient text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                主管
              </button>
            </div>
            {loginTab === "member" ? (
              <div className="space-y-3">
                {members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleMemberLogin(member.id)}
                    className="w-full p-3 bg-gray-50 hover:bg-purple-50 rounded-lg text-left transition-colors border border-gray-200 hover:border-purple-300"
                  >
                    <p className="font-medium text-gray-800">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.instrument}</p>
                  </button>
                ))}
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="w-full p-3 border-2 border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
                >
                  <i className="fas fa-user-plus mr-2" />新增成員
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input
                  type="password"
                  value={adminLoginPassword}
                  onChange={(e) => setAdminLoginPassword(e.target.value)}
                  placeholder="主管密碼"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  type="submit"
                  className="w-full band-gradient text-white py-2 rounded-lg hover:shadow-md transition-all font-medium"
                >
                  登入
                </button>
              </form>
            )}
            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 font-medium"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">新增成員</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="名稱"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400"
              />
              <input
                type="text"
                value={regInstrument}
                onChange={(e) => setRegInstrument(e.target.value)}
                placeholder="樂器"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400"
              />
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="密碼"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400"
              />
              <input
                type="password"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                placeholder="確認密碼"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400"
              />
              <div className="flex gap-2 flex-wrap">
                {MEMBER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedRegColor(color)}
                    className={`w-8 h-8 rounded-full ${COLOR_MAP[color]} ${
                      selectedRegColor === color ? "ring-2 ring-offset-2 ring-gray-400" : ""
                    }`}
                  />
                ))}
              </div>
              <button
                type="submit"
                className="w-full band-gradient text-white py-2 rounded-lg hover:shadow-md transition-all font-medium"
              >
                新增
              </button>
            </form>
            <button
              onClick={() => setShowRegisterModal(false)}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 font-medium"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {eventModalMode === "add" ? "新增活動" : eventModalMode === "edit" ? "編輯活動" : "活動詳情"}
            </h2>
            <form onSubmit={saveEvent} className="space-y-4">
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="活動名稱"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400"
                disabled={eventModalMode === "view"}
              />
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400"
                disabled={eventModalMode === "view"}
              />
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as BandEvent["type"])}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400"
                disabled={eventModalMode === "view"}
              >
                <option value="rehearsal">排練</option>
                <option value="performance">演出</option>
                <option value="meeting">會議</option>
                <option value="other">其他</option>
              </select>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="地點"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400"
                disabled={eventModalMode === "view"}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">開始時間</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400"
                      disabled={eventModalMode === "view"}
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={startMinute}
                      onChange={(e) => setStartMinute(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400"
                      disabled={eventModalMode === "view"}
                    />
                    <select
                      value={startAmpm}
                      onChange={(e) => setStartAmpm(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400"
                      disabled={eventModalMode === "view"}
                    >
                      <option>AM</option>
                      <option>PM</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">結束時間</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400"
                      disabled={eventModalMode === "view"}
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={endMinute}
                      onChange={(e) => setEndMinute(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400"
                      disabled={eventModalMode === "view"}
                    />
                    <select
                      value={endAmpm}
                      onChange={(e) => setEndAmpm(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400"
                      disabled={eventModalMode === "view"}
                    >
                      <option>AM</option>
                      <option>PM</option>
                    </select>
                  </div>
                </div>
              </div>
              <textarea
                value={eventNotes}
                onChange={(e) => setEventNotes(e.target.value)}
                placeholder="備註"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-400 resize-none h-24"
                disabled={eventModalMode === "view"}
              />
              <div className="flex gap-2 justify-end">
                {eventModalMode !== "view" && (
                  <button
                    type="submit"
                    className="px-4 py-2 band-gradient text-white rounded-lg hover:shadow-md transition-all font-medium"
                  >
                    保存
                  </button>
                )}
                {eventModalMode === "view" && currentUser?.role === "admin" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEventModalMode("edit");
                      }}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all font-medium"
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedEventId) deleteEvent(selectedEventId);
                      }}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-medium"
                    >
                      刪除
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
                >
                  關閉
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.visible && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg text-white font-medium shadow-lg z-50 ${
          toast.type === "success" ? "bg-green-500" :
          toast.type === "error" ? "bg-red-500" :
          "bg-blue-500"
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
