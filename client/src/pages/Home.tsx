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
  // 使用系統時間（假設系統時區已設定為 HK 時區 UTC+8）
  // 或者可以手動調整時區偏移
  const now = new Date();
  // 如果需要從香港天文台 API 獲取精確時間，可以在此添加
  // 但為了性能，使用本地系統時間
  return now;
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

// ============================================
// TOAST COMPONENT
// ============================================
interface ToastState {
  message: string;
  type: "success" | "error" | "info";
  visible: boolean;
}

// ============================================
// MAIN APP COMPONENT
// ============================================
// Auto-refresh interval for real-time sync
const AUTO_REFRESH_INTERVAL = 5000; // 5 seconds

export default function Home() {
  // 啟用實時同步
  useRealtimeSync();

  // tRPC queries
  const systemDataQuery = trpc.band.getSystemData.useQuery(undefined, { refetchInterval: 500, staleTime: 0, refetchOnWindowFocus: true, refetchOnMount: true });
  const membersQuery = trpc.band.getMembers.useQuery(undefined, { refetchInterval: 500, staleTime: 0, refetchOnWindowFocus: true, refetchOnMount: true });
  const eventsQuery = trpc.band.getEvents.useQuery(undefined, { refetchInterval: 500, staleTime: 0, refetchOnWindowFocus: true, refetchOnMount: true });
  const holidaysQuery = trpc.band.getHolidays.useQuery(undefined, { refetchInterval: 500, staleTime: 0, refetchOnWindowFocus: true, refetchOnMount: true });

  // tRPC mutations
  const initSystemMutation = trpc.band.initSystem.useMutation();
  const updatePasswordMutation = trpc.band.updateSystemPassword.useMutation();
  const addMemberMutation = trpc.band.addMember.useMutation();
  const updateMemberMutation = trpc.band.updateMember.useMutation();
  const deleteMemberMutation = trpc.band.deleteMember.useMutation();
  const addEventMutation = trpc.band.addEvent.useMutation();
  const updateEventMutation = trpc.band.updateEvent.useMutation();
  const deleteEventMutation = trpc.band.deleteEvent.useMutation();
  const setAttendanceMutation = trpc.band.setAttendance.useMutation();
  const addHolidayMutation = trpc.band.addHoliday.useMutation();
  const utils = trpc.useUtils();

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
    if (systemDataQuery.isLoading) {
      return;
    }
    
    // If no system data or not set up, show setup modal
    if (!systemDataQuery.data || systemDataQuery.data.isSetup === 0) {
      setShowSetupModal(true);
      setShowLoginModal(false);
    } else {
      // System is set up, show login modal
      setShowSetupModal(false);
      setShowLoginModal(true); // Show login modal for users to log in
    }
  }, [systemDataQuery.data, systemDataQuery.isLoading]);

  // Refresh every minute to check event completion
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh for real-time synchronization
  useEffect(() => {
    const interval = setInterval(() => {
      eventsQuery.refetch();
      membersQuery.refetch();
    }, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [eventsQuery, membersQuery]);


  // ============================================
  // SETUP
  // ============================================
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    // Use default password 'admin' instead of user input
    const adminPassword = "admin";

    try {
      await initSystemMutation.mutateAsync({ adminPassword });
      
      // Add first member if provided
      if (setupFirstName.trim()) {
        await addMemberMutation.mutateAsync({
          name: setupFirstName.trim(),
          instrument: setupFirstInstrument.trim(),
          color: "blue",
          password: "",
        });
      }

      // Add holidays
      const hkHolidays = initializeHolidays([]);
      for (const holiday of hkHolidays) {
        await addHolidayMutation.mutateAsync(holiday);
      }

      setShowSetupModal(false);
      showToast("設定完成！主管密碼已設定為 admin，香港假期已自動載入（2026年起）", "success");
      setShowLoginModal(false); // Allow viewing without login
      setLoginTab("admin");
      
      // Refetch data
      systemDataQuery.refetch();
      membersQuery.refetch();
      holidaysQuery.refetch();
    } catch (error) {
      showToast("設定失敗，請重試", "error");
    }
  };

  // ============================================
  // LOGIN
  // ============================================
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Admin Login Debug:");
    console.log("Input password:", adminLoginPassword);
    console.log("Stored password:", systemDataQuery.data?.adminPassword);
    console.log("System data:", systemDataQuery.data);
    if (adminLoginPassword === systemDataQuery.data?.adminPassword) {
      setCurrentUser({ id: "admin", role: "admin", name: "主管" });
      setShowLoginModal(false);
      setAdminLoginPassword("");
      showToast("主管登入成功", "success");
    } else {
      showToast("主管密碼錯誤", "error");
    }
  };

  const handleMemberLogin = (memberId: number) => {
    const member = membersQuery.data?.find((m) => m.id === memberId);
    if (!member) return;
    if (!member.password) {
      // First login - set password
      const newPassword = prompt(`首次登入，請為 ${member.name} 設定密碼（最少4個字元）：`);
      if (!newPassword || newPassword.length < 4) return showToast("密碼太短或取消設定", "error");
      const confirmPassword = prompt("請再次輸入密碼確認：");
      if (newPassword !== confirmPassword) return showToast("兩次輸入的密碼不一致", "error");
      
      updateMemberMutation.mutate({ id: memberId, password: newPassword }, {
        onSuccess: () => {
          setCurrentUser({ id: memberId, role: "member", name: member.name });
          setShowLoginModal(false);
          showToast(`歡迎，${member.name}！密碼已設定`, "success");
          membersQuery.refetch();
        },
      });
    } else {
      const password = prompt(`請輸入 ${member.name} 的密碼：`);
      if (password === null) return;
      if (password === member.password) {
        setCurrentUser({ id: memberId, role: "member", name: member.name });
        setShowLoginModal(false);
        showToast(`歡迎回來，${member.name}！`, "success");
      } else {
        showToast("密碼錯誤", "error");
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast("已登出", "info");
    setShowLoginModal(false); // Allow viewing without login
  };

  // ============================================
  // REGISTER
  // ============================================
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return showToast("請輸入名稱", "error");
    if (regPassword.length < 4) return showToast("密碼最少需要4個字元", "error");
    if (regPassword !== regConfirm) return showToast("兩次輸入的密碼不一致", "error");
    if (membersQuery.data?.some((m) => m.name === regName.trim())) return showToast("此名稱已被使用", "error");

    addMemberMutation.mutate({
      name: regName.trim(),
      instrument: regInstrument.trim(),
      color: selectedRegColor,
      password: regPassword,
    }, {
      onSuccess: () => {
        setRegName("");
        setRegInstrument("");
        setRegPassword("");
        setRegConfirm("");
        setSelectedRegColor("blue");
        setShowRegisterModal(false);
        showToast(`${regName} 已註冊！`, "success");
        setShowLoginModal(false); // Allow viewing without login
        setLoginTab("member");
        membersQuery.refetch();
      },
    });
  };

  // ============================================
  // EVENT MANAGEMENT
  // ============================================
  const openAddEventModal = (dateStr?: string) => {
    if (currentUser?.role !== "admin") return;
    setEventTitle("");
    setEventDate(dateStr || formatDateStr(new Date()));
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
    setSelectedEventId(null);
    setEventModalMode("add");
    checkDateHolidayFor(dateStr || formatDateStr(new Date()));
    setShowEventModal(true);
  };

  const openEventModal = (eventId: number) => {
    const event = eventsQuery.data?.find((e) => e.id === eventId);
    if (!event) return;
    setSelectedEventId(eventId);
    if (currentUser?.role === "admin" && !isEventEnded(event)) {
      setEventModalMode("edit");
      setEventTitle(event.title);
      setEventDate(event.date);
      setEventType(event.type);
      setEventLocation(event.location);
      setEventNotes(event.notes || "");
      const [startH, startM] = event.startTime.split(":");
      const [endH, endM] = event.endTime.split(":");
      setStartHour(String(parseInt(startH) % 12 || 12));
      setStartMinute(startM);
      setStartAmpm(parseInt(startH) >= 12 ? "PM" : "AM");
      setEndHour(String(parseInt(endH) % 12 || 12));
      setEndMinute(endM);
      setEndAmpm(parseInt(endH) >= 12 ? "PM" : "AM");
      checkDateHolidayFor(event.date);
    } else {
      setEventModalMode("view");
    }
    setShowEventModal(true);
  };

  const checkDateHolidayFor = (date: string) => {
    const holiday = holidaysQuery.data?.find((h) => h.date === date);
    setDateHolidayWarning(holiday ? holiday.name : "");
  }

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return showToast("請輸入活動名稱", "error");
    if (!eventDate) return showToast("請選擇日期", "error");

    const startTime = parseTime12To24(startHour, startMinute, startAmpm);
    const endTime = parseTime12To24(endHour, endMinute, endAmpm);

    if (startTime >= endTime) return showToast("開始時間必須早於結束時間", "error");

    const dateHoliday = hkHolidays.find((h) => h.date === eventDate);
    if (dateHoliday && !dateHolidayWarning) {
      setDateHolidayWarning(dateHoliday.name);
      return;
    }

    if (eventModalMode === "edit" && selectedEventId) {
      updateEventMutation.mutate({
        id: selectedEventId,
        title: eventTitle,
        date: eventDate,
        startTime,
        endTime,
        location: eventLocation,
        type: eventType,
        notes: eventNotes,
      }, {
        onSuccess: () => {
          showToast("活動已更新", "success");
          setShowEventModal(false);
          utils.band.getEvents.invalidate();
        },
      });
    } else {
      addEventMutation.mutate({
        title: eventTitle,
        date: eventDate,
        startTime,
        endTime,
        location: eventLocation,
        type: eventType,
        notes: eventNotes,
      }, {
        onSuccess: () => {
          showToast("活動已新增", "success");
          setShowEventModal(false);
          utils.band.getEvents.invalidate();
        },
      });
    }
  };

  const handleDeleteEvent = () => {
    if (!selectedEventId) return;
    const event = eventsQuery.data?.find((e) => e.id === selectedEventId);
    if (event && isEventEnded(event)) return showToast("此活動已結束，不能刪除", "error");
    if (!confirm("確定要刪除這個活動嗎？")) return;
    
    deleteEventMutation.mutate({ id: selectedEventId }, {
      onSuccess: () => {
        setShowEventModal(false);
        showToast("活動已刪除", "success");
        eventsQuery.refetch();
      },
    });
  };

  const handleAttendanceChange = (eventId: number, status: "going" | "not-going" | "unknown") => {
    if (currentUser?.role !== "member") return;
    const event = eventsQuery.data?.find((e) => e.id === eventId);
    if (!event) return;
    if (isEventEnded(event)) return showToast("此活動已結束，不能修改出席狀態", "error");

    setAttendanceMutation.mutate({
      eventId,
      memberId: currentUser.id as number,
      status,
    }, {
      onSuccess: () => {
        showToast(status === "going" ? "已確認出席" : "已確認不出席", "success");
        eventsQuery.refetch();
      },
    });
  };

  // Handle individual member attendance change
  const handleAttendanceChangeForMember = (eventId: number, memberId: number, status: "going" | "not-going" | "unknown") => {
    const event = eventsQuery.data?.find((e) => e.id === eventId);
    if (!event) return;
    if (isEventEnded(event)) return showToast("此活動已結束，不能修改出席狀態", "error");

    setAttendanceMutation.mutate({
      eventId,
      memberId,
      status,
    }, {
      onSuccess: () => {
        showToast("出席狀態已更新", "success");
        eventsQuery.refetch();
      },
    });
  };

  const handleSetAttendance = (status: "going" | "not-going" | "unknown") => {
    if (!selectedEventId || currentUser?.role !== "member") return;
    const event = eventsQuery.data?.find((e) => e.id === selectedEventId);
    if (!event) return;
    if (isEventEnded(event)) return showToast("此活動已結束，不能修改出席狀態", "error");

    setAttendanceMutation.mutate({
      eventId: selectedEventId,
      memberId: currentUser.id as number,
      status,
    }, {
      onSuccess: () => {
        showToast(status === "going" ? "已確認出席" : "已確認不出席", "success");
        eventsQuery.refetch();
      },
    });
  };

  // ============================================
  // MEMBER MANAGEMENT
  // ============================================
  const handleResetMemberPassword = (memberId: number) => {
    const member = membersQuery.data?.find((m) => m.id === memberId);
    if (!member) return;
    const newPassword = prompt(`為 ${member.name} 設定新密碼（最少4個字元）：`);
    if (!newPassword) return;
    if (newPassword.length < 4) return showToast("密碼太短", "error");
    
    updateMemberMutation.mutate({ id: memberId, password: newPassword }, {
      onSuccess: async () => {
        showToast(`${member.name} 的密碼已重設`, "success");
        // Wait a moment for the server to process, then refetch
        await new Promise(resolve => setTimeout(resolve, 500));
        await membersQuery.refetch();
      },
    });
  };

  const handleResetAdminPassword = () => {
    const currentPassword = prompt("請輸入現有主管密碼：");
    if (currentPassword !== systemDataQuery.data?.adminPassword) return showToast("密碼錯誤", "error");
    const newPassword = prompt("請輸入新主管密碼（最少4個字元）：");
    if (!newPassword || newPassword.length < 4) return showToast("密碼太短", "error");
    const confirmPassword = prompt("請再次輸入新密碼確認：");
    if (newPassword !== confirmPassword) return showToast("兩次輸入不一致", "error");
    
    updatePasswordMutation.mutate({ adminPassword: newPassword }, {
      onSuccess: async () => {
        showToast("主管密碼已重設", "success");
        // Wait a moment for the server to process, then refetch
        await new Promise(resolve => setTimeout(resolve, 500));
        await systemDataQuery.refetch();
      },
    });
  };

  const handleDeleteMember = (memberId: number) => {
    if (!confirm("確定要刪除這位成員嗎？所有出席記錄也會被移除。")) return;
    
    deleteMemberMutation.mutate({ id: memberId }, {
      onSuccess: () => {
        if (currentUser?.id === memberId) {
          setCurrentUser(null);
          setShowLoginModal(false); // Allow viewing without login
        }
        showToast("成員已刪除", "success");
        membersQuery.refetch();
      },
    });
  };

  // ============================================
  // CALENDAR RENDERING
  // ============================================
  const calendarYear = currentDate.getFullYear();
  const calendarMonth = currentDate.getMonth();

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const todayStr = formatDateStr(new Date());
  const hkHolidays = initializeHolidays(holidaysQuery.data || []);

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
    const cells = [];

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-day rounded-xl" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isToday = dateStr === todayStr;
      const dayCompleted = isDayCompleted(dateStr);
      const holidays = hkHolidays.filter((h) => h.date === dateStr);
      const dayEvents = (eventsQuery.data || [])
        .filter((e) => e.date === dateStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      cells.push(
        <div
          key={dateStr}
          className={`calendar-day rounded-xl border p-1.5 sm:p-2 md:p-2 lg:p-2 cursor-pointer flex flex-col ${
            dayCompleted
              ? "completed-day bg-gray-50 border-gray-200"
              : isToday
              ? "today border-purple-400 bg-purple-50/30"
              : "bg-white border-gray-200 hover:border-purple-300"
          }`}
          onClick={() => {
            if (currentUser?.role === "admin") openAddEventModal(dateStr);
            else if (dayEvents.length > 0) {
              // 顯示當日所有活動的清單
              setCurrentView("list");
              setSelectedDates(new Set([dateStr]));
              setCurrentListTab("incomplete");
            }
          }}
        >
          <div className="flex items-center justify-between mb-0.5 sm:mb-1">
            <span
              className={`text-xs sm:text-sm font-semibold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                isToday
                  ? "band-gradient text-white text-xs"
                  : dayCompleted
                  ? "text-gray-400"
                  : "text-gray-700"
              }`}
            >
              {day}
            </span>
            {holidays.length > 0 && <span className="text-xs text-amber-600 font-bold">🏖</span>}
          </div>
            {holidays.length > 0 && (
              <div className="text-xs text-amber-600 font-semibold px-1 sm:px-1.5 py-0.5 mb-0.5 truncate line-clamp-1">
                {holidays[0].name}
              </div>
            )}
          {dayEvents.map((evt, i) => {
            const goingCount = Object.values(evt.attendance).filter(v => v === "going").length;
            const notGoingCount = Object.values(evt.attendance).filter(v => v === "not-going").length;
            const unknownCount = Object.values(evt.attendance).filter(v => v === "unknown").length;
            const myStatus = currentUser?.role === "member" ? evt.attendance[currentUser.id as number] : null;
            return (
              <div key={i} className="text-xs sm:text-xs space-y-0.5 mb-0.5 sm:mb-1 border-l-2 border-purple-300 pl-1">
                <div
                  className={`px-1 sm:px-1.5 py-0.5 rounded font-semibold text-xs sm:text-sm ${TYPE_CONFIG[evt.type].color}`}
                  title={evt.title}
                >
                  {evt.title}
                </div>
                <div className="text-xs sm:text-xs text-gray-600 px-1 sm:px-1.5">
                  {evt.startTime} - {evt.endTime}
                </div>

                {evt.notes && (
                  <div className="text-xs text-gray-500 px-1.5 italic whitespace-pre-wrap break-words">
                    {evt.notes}
                  </div>
                )}
                {currentUser?.role === "member" && !isEventEnded(evt) && (
                  <div className="flex gap-0.5 px-1 mt-0.5 flex-wrap">
                    <button onClick={(e) => { e.stopPropagation(); handleAttendanceChange(evt.id, "going"); }} className={`flex-1 min-w-16 text-xs px-1 py-0.5 rounded transition-all ${myStatus === "going" ? "bg-green-100 text-green-700 font-semibold" : "bg-gray-100 text-gray-600 hover:bg-green-50"}`}>出席</button>
                    <button onClick={(e) => { e.stopPropagation(); handleAttendanceChange(evt.id, "not-going"); }} className={`flex-1 min-w-16 text-xs px-1 py-0.5 rounded transition-all ${myStatus === "not-going" ? "bg-red-100 text-red-700 font-semibold" : "bg-gray-100 text-gray-600 hover:bg-red-50"}`}>不出席</button>
                    <button onClick={(e) => { e.stopPropagation(); handleAttendanceChange(evt.id, "unknown"); }} className={`flex-1 min-w-16 text-xs px-1 py-0.5 rounded transition-all ${myStatus === "unknown" ? "bg-gray-400 text-white font-semibold" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>未知道</button>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      );
    }

    return cells;
  };

  // ============================================
  // LIST RENDERING
  // ============================================
  const getFilteredEvents = () => {
    let filtered = (eventsQuery.data || []).filter((e) => {
      if (selectedDates.size > 0 && !selectedDates.has(e.date)) return false;
      const d = new Date(e.date);
      if (d.getFullYear() !== listYear) return false;
      if (listMonth !== "all" && d.getMonth() !== parseInt(listMonth)) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(query);
        const matchesLocation = e.location.toLowerCase().includes(query);
        const matchesNotes = (e.notes || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesLocation && !matchesNotes) return false;
      }
      return true;
    });
    filtered.sort((a, b) => {
      const dateA = new Date(a.date + "T" + a.startTime);
      const dateB = new Date(b.date + "T" + b.startTime);
      return dateA.getTime() - dateB.getTime();
    });
    const incomplete = filtered.filter((e) => !isEventEnded(e));
    const completed = filtered.filter((e) => isEventEnded(e));
    return { incomplete, completed };
  };

  const { incomplete: incompleteEvents, completed: completedEvents } = getFilteredEvents();
  const displayEvents = currentListTab === "incomplete" ? incompleteEvents : completedEvents;
  const hasSearchResults = displayEvents.length > 0 || searchQuery.trim() === "";

  // ============================================
  // SELECTED EVENT
  // ============================================
  const selectedEvent = selectedEventId ? eventsQuery.data?.find((e) => e.id === selectedEventId) : null;
  const selectedEventEnded = selectedEvent ? isEventEnded(selectedEvent) : false;

  // ============================================
  // YEAR OPTIONS
  // ============================================
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = 2026; y <= 2126; y++) yearOptions.push(y);

  const minuteOptions = [];
  for (let i = 0; i < 60; i++) minuteOptions.push(String(i).padStart(2, "0"));

  // Loading state
  if (systemDataQuery.isLoading || membersQuery.isLoading || eventsQuery.isLoading || holidaysQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <div className="text-white text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      {/* Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel rounded-xl sm:rounded-2xl w-full max-w-sm sm:max-w-md p-4 sm:p-6 modal-enter shadow-2xl my-4">
            <div className="text-center mb-4 sm:mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 band-gradient rounded-full flex items-center justify-center text-white text-xl sm:text-2xl mx-auto mb-3 sm:mb-4 shadow-lg">
                <i className="fas fa-music" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">首次設定</h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">請設定主管密碼以開始使用系統</p>
            </div>
            <form onSubmit={handleSetup} className="space-y-3 sm:space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4">
                <p className="text-purple-800 font-medium text-sm mb-1">主管密碼已設定</p>
                <p className="text-purple-600 text-xs">默認主管密碼為：<strong>admin</strong></p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">新增第一位成員（可選）</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={setupFirstName}
                    onChange={(e) => setSetupFirstName(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                    placeholder="成員名稱"
                  />
                  <input
                    type="text"
                    value={setupFirstInstrument}
                    onChange={(e) => setSetupFirstInstrument(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                    placeholder="職位/樂器"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-2 band-gradient text-white py-3 rounded-xl hover:shadow-lg transition-all font-medium text-sm"
              >
                <i className="fas fa-rocket mr-2" />完成設定
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && !currentUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel rounded-xl sm:rounded-2xl w-full max-w-sm sm:max-w-md p-4 sm:p-6 modal-enter shadow-2xl my-4">
            <div className="flex mb-3 sm:mb-5 border-b border-gray-200">
              <button
                onClick={() => setLoginTab("member")}
                className={`flex-1 pb-2 sm:pb-3 text-xs sm:text-sm font-medium transition-all ${loginTab === "member" ? "border-b-2 border-purple-500 text-purple-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                <i className="fas fa-user mr-1 sm:mr-2" />成員登入
              </button>
              <button
                onClick={() => setLoginTab("admin")}
                className={`flex-1 pb-2 sm:pb-3 text-xs sm:text-sm font-medium transition-all ${loginTab === "admin" ? "border-b-2 border-purple-500 text-purple-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                <i className="fas fa-crown mr-1 sm:mr-2" />主管登入
              </button>
            </div>

            {loginTab === "member" ? (
              <div>
                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                  {(membersQuery.data || []).length === 0 ? (
                    <p className="text-center text-gray-500 py-6 text-sm">暫無成員，請先註冊</p>
                  ) : (
                    (membersQuery.data || []).map((member) => (
                      <div
                        key={member.id}
                        onClick={() => handleMemberLogin(member.id)}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors cursor-pointer border border-transparent hover:border-purple-200"
                      >
                        <div className={`w-10 h-10 rounded-full ${COLOR_MAP[member.color] || "bg-blue-500"} flex items-center justify-center text-white font-bold text-sm`}>
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-sm">{member.name}</div>
                          {member.instrument && <div className="text-xs text-gray-500">{member.instrument}</div>}
                        </div>
                        <i className="fas fa-chevron-right text-gray-400 text-xs" />
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}
                  className="w-full py-2.5 border-2 border-dashed border-purple-300 text-purple-600 rounded-xl hover:bg-purple-50 transition-all text-sm font-medium"
                >
                  <i className="fas fa-user-plus mr-2" />新成員註冊
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">主管密碼</label>
                  <input
                    type="password"
                    required
                    value={adminLoginPassword}
                    onChange={(e) => setAdminLoginPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                    placeholder="輸入主管密碼"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full band-gradient text-white py-3 rounded-xl hover:shadow-lg transition-all font-medium text-sm"
                >
                  <i className="fas fa-sign-in-alt mr-2" />登入
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && !currentUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel rounded-xl sm:rounded-2xl w-full max-w-sm sm:max-w-md p-4 sm:p-6 modal-enter shadow-2xl my-4">
            <div className="flex items-center justify-between mb-3 sm:mb-5">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">新成員註冊</h3>
              <button
                onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }}
                className="text-gray-400 hover:text-gray-600 text-lg sm:text-xl"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名稱 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-xs sm:text-sm"
                  placeholder="輸入名稱"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">職位/樂器</label>
                <input
                  type="text"
                  value={regInstrument}
                  onChange={(e) => setRegInstrument(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-xs sm:text-sm"
                  placeholder="例如：結他手、鼓手"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">選擇頭像顏色</label>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  {MEMBER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedRegColor(color)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${COLOR_MAP[color]} transition-all ${selectedRegColor === color ? "ring-2 ring-offset-2 ring-purple-400" : ""}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">密碼 <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-xs sm:text-sm"
                  placeholder="最少4個字元"
                  minLength={4}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">確認密碼 <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  required
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-xs sm:text-sm"
                  placeholder="再次輸入密碼"
                />
              </div>
              <button
                type="submit"
                className="w-full band-gradient text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:shadow-lg transition-all font-medium text-xs sm:text-sm"
              >
                <i className="fas fa-user-plus mr-2" />完成註冊
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel rounded-xl sm:rounded-2xl w-full max-w-sm sm:max-w-2xl p-4 sm:p-6 modal-enter shadow-2xl my-4 sm:my-8">
            <div className="flex items-center justify-between mb-3 sm:mb-5">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                {eventModalMode === "add" ? "新增活動" : eventModalMode === "edit" ? "編輯活動" : "活動詳情"}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg sm:text-xl ml-2 flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {eventModalMode !== "view" ? (
              <form onSubmit={handleSaveEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">活動名稱 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">日期 <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => { setEventDate(e.target.value); checkDateHolidayFor(e.target.value); }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                    />
                    {dateHolidayWarning && (
                      <p className="text-xs text-amber-600 mt-1">
                        <i className="fas fa-exclamation-triangle mr-1" />此日期為香港公眾假期：{dateHolidayWarning}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">類型</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value as BandEvent["type"])}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                    >
                      <option value="rehearsal">🎸 排練</option>
                      <option value="performance">🎤 演出</option>
                      <option value="meeting">📋 會議</option>
                      <option value="other">📌 其他</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">開始時間 <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-1 sm:gap-1.5 bg-gray-50 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-gray-200 overflow-x-auto">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <label className="text-xs text-gray-500 mb-0.5">時</label>
                        <select value={startHour} onChange={(e) => setStartHour(e.target.value)} className="time-select w-12 sm:w-14 text-xs sm:text-sm">
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
                        </select>
                      </div>
                      <span className="text-gray-400 pt-3 sm:pt-5 text-xs sm:text-base flex-shrink-0">:</span>
                      <div className="flex flex-col items-center flex-shrink-0">
                        <label className="text-xs text-gray-500 mb-0.5">分</label>
                        <select value={startMinute} onChange={(e) => setStartMinute(e.target.value)} className="time-select w-12 sm:w-14 text-xs sm:text-sm">
                          {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col items-center flex-shrink-0">
                        <label className="text-xs text-gray-500 mb-0.5">時段</label>
                        <select value={startAmpm} onChange={(e) => setStartAmpm(e.target.value)} className="time-select w-14 sm:w-16 bg-purple-50 font-medium text-xs sm:text-sm">
                          <option value="AM">上午</option>
                          <option value="PM">下午</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">結束時間 <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-1 sm:gap-1.5 bg-gray-50 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-gray-200 overflow-x-auto">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <label className="text-xs text-gray-500 mb-0.5">時</label>
                        <select value={endHour} onChange={(e) => setEndHour(e.target.value)} className="time-select w-12 sm:w-14 text-xs sm:text-sm">
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
                        </select>
                      </div>
                      <span className="text-gray-400 pt-3 sm:pt-5 text-xs sm:text-base flex-shrink-0">:</span>
                      <div className="flex flex-col items-center flex-shrink-0">
                        <label className="text-xs text-gray-500 mb-0.5">分</label>
                        <select value={endMinute} onChange={(e) => setEndMinute(e.target.value)} className="time-select w-12 sm:w-14 text-xs sm:text-sm">
                          {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col items-center flex-shrink-0">
                        <label className="text-xs text-gray-500 mb-0.5">時段</label>
                        <select value={endAmpm} onChange={(e) => setEndAmpm(e.target.value)} className="time-select w-14 sm:w-16 bg-purple-50 font-medium text-xs sm:text-sm">
                          <option value="AM">上午</option>
                          <option value="PM">下午</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地點 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                  <textarea
                    rows={3}
                    value={eventNotes}
                    onChange={(e) => setEventNotes(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 band-gradient text-white py-2.5 rounded-xl hover:shadow-lg transition-all font-medium text-sm"
                  >
                    <i className="fas fa-save mr-2" />儲存活動
                  </button>
                  {eventModalMode === "edit" && (
                    <button
                      type="button"
                      onClick={handleDeleteEvent}
                      className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-medium text-sm border border-red-200"
                    >
                      <i className="fas fa-trash-alt mr-2" />刪除
                    </button>
                  )}
                </div>
              </form>
            ) : (
              selectedEvent && (
                <div>
                  <div className="bg-gray-50 rounded-xl p-4 mb-5">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${TYPE_CONFIG[selectedEvent.type].color}`}>
                        {TYPE_CONFIG[selectedEvent.type].text}
                      </span>
                      {(() => {
                        const status = selectedEventEnded ? "completed" : getEventStatus(selectedEvent);
                        const statusLabels = { upcoming: "即將開始", ongoing: "進行中", completed: "已完結" };
                        const statusColors = { upcoming: "bg-gray-100 text-gray-700", ongoing: "bg-amber-100 text-amber-700", completed: "bg-green-100 text-green-700" };
                        return (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[status]}`}>
                            {statusLabels[status]}
                          </span>
                        );
                      })()}
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-3">{selectedEvent.title}</h4>
                    <p className="text-gray-600 text-sm mb-2 flex items-center gap-2">
                      <i className="far fa-calendar text-gray-400 w-4" />{formatDate(selectedEvent.date)}
                    </p>
                    <p className="text-gray-600 text-sm mb-2 flex items-center gap-2">
                      <i className="far fa-clock text-gray-400 w-4" />
                      {formatTime12Full(selectedEvent.startTime)} - {formatTime12Full(selectedEvent.endTime)}
                    </p>
                    <p className="text-gray-600 text-sm mb-2 flex items-center gap-2">
                      <i className="fas fa-map-marker-alt text-gray-400 w-4" />{selectedEvent.location}
                    </p>
                    {selectedEvent.notes && (
                      <p className="text-gray-600 text-sm bg-white p-3 rounded-lg border border-gray-200 mt-3">{selectedEvent.notes}</p>
                    )}
                  </div>

                  {/* Attendance Section */}
                  <div className="mt-5 pt-5 border-t border-gray-200">
                    {currentUser?.role === "admin" && (
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-gray-800">出席狀態</h4>
                        <span className="text-sm text-gray-500">
                          出席: {Object.values(selectedEvent.attendance).filter(v => v === "going").length} |
                          缺席: {Object.values(selectedEvent.attendance).filter(v => v === "not-going").length} |
                          未知道: {Object.values(selectedEvent.attendance).filter(v => v === "unknown").length}
                          {selectedEventEnded ? " (已完結)" : ""}
                        </span>
                      </div>
                    )}
                    {currentUser?.role === "member" && (
                      <div className="mb-4">
                        <h4 className="font-bold text-gray-800 mb-2">您的出席狀態</h4>
                      </div>
                    )}

                    {currentUser?.role === "member" && !selectedEventEnded && (
                      <div className="mb-5">
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-3">
                          <p className="text-purple-800 font-medium text-sm mb-0.5">
                            你好，{(membersQuery.data || []).find(m => m.id === currentUser.id)?.name}！
                          </p>
                          <p className="text-purple-600 text-xs">請選擇你的出席狀態：</p>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <button
                            onClick={() => handleSetAttendance("going")}
                            className={`attendance-btn flex-1 min-w-24 ${selectedEvent.attendance[currentUser.id as number] === "going" ? "going" : "pending"}`}
                          >
                            <i className="fas fa-check mr-2" />出席
                          </button>
                          <button
                            onClick={() => handleSetAttendance("not-going")}
                            className={`attendance-btn flex-1 min-w-24 ${selectedEvent.attendance[currentUser.id as number] === "not-going" ? "not-going" : "pending"}`}
                          >
                            <i className="fas fa-times mr-2" />不出席
                          </button>
                          <button
                            onClick={() => handleSetAttendance("unknown")}
                            className={`attendance-btn flex-1 min-w-24 ${selectedEvent.attendance[currentUser.id as number] === "unknown" ? "unknown" : "pending"}`}
                          >
                            <i className="fas fa-question mr-2" />未知道
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Attendance Status Summary Panel */}
                    {selectedEvent && (
                      <div className="mt-5 pt-5 border-t border-gray-200">
                        <h4 className="font-bold text-gray-800 mb-3">成員出席狀態</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Going */}
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <h5 className="font-semibold text-green-700 text-sm mb-2 flex items-center gap-1">
                              <i className="fas fa-check" /> 出席 ({Object.values(selectedEvent.attendance).filter(v => v === "going").length})
                            </h5>
                            <div className="space-y-1">
                              {(membersQuery.data || []).filter(m => selectedEvent.attendance[m.id] === "going").length === 0 ? (
                                <p className="text-xs text-gray-500">暫無</p>
                              ) : (
                                (membersQuery.data || []).filter(m => selectedEvent.attendance[m.id] === "going").map(member => (
                                  <div key={member.id} className="text-xs text-green-700 font-medium">{member.name}</div>
                                ))
                              )}
                            </div>
                          </div>
                          
                          {/* Not Going */}
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <h5 className="font-semibold text-red-700 text-sm mb-2 flex items-center gap-1">
                              <i className="fas fa-times" /> 不出席 ({Object.values(selectedEvent.attendance).filter(v => v === "not-going").length})
                            </h5>
                            <div className="space-y-1">
                              {(membersQuery.data || []).filter(m => selectedEvent.attendance[m.id] === "not-going").length === 0 ? (
                                <p className="text-xs text-gray-500">暫無</p>
                              ) : (
                                (membersQuery.data || []).filter(m => selectedEvent.attendance[m.id] === "not-going").map(member => (
                                  <div key={member.id} className="text-xs text-red-700 font-medium">{member.name}</div>
                                ))
                              )}
                            </div>
                          </div>
                          
                          {/* Unknown */}
                          <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
                            <h5 className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-1">
                              <i className="fas fa-question" /> 未知道 ({Object.values(selectedEvent.attendance).filter(v => v === "unknown").length})
                            </h5>
                            <div className="space-y-1">
                              {(membersQuery.data || []).filter(m => selectedEvent.attendance[m.id] === "unknown").length === 0 ? (
                                <p className="text-xs text-gray-500">暫無</p>
                              ) : (
                                (membersQuery.data || []).filter(m => selectedEvent.attendance[m.id] === "unknown").map(member => (
                                  <div key={member.id} className="text-xs text-gray-700 font-medium">{member.name}</div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show all members with attendance buttons - Admin only */}
                    {currentUser?.role === "admin" && (
                    <div className="space-y-2">
                      {(membersQuery.data || []).length === 0 ? (
                        <p className="text-center text-gray-500 py-4 text-sm">暫無成員</p>
                      ) : (
                        (membersQuery.data || []).map((member) => {
                          const status = selectedEvent.attendance[member.id];
                          return (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2 flex-1">
                                <div className={`w-8 h-8 rounded-full ${COLOR_MAP[member.color] || "bg-blue-500"} flex items-center justify-center text-white font-bold text-xs`}>
                                  {member.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-800">{member.name}</span>
                                  <div className="text-xs mt-1">
                                    {status === "going" && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">✓ 出席</span>}
                                    {status === "not-going" && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">✕ 不出席</span>}
                                    {status === "unknown" && <span className="px-2 py-0.5 bg-gray-300 text-gray-700 rounded-full font-medium">? 未知道</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                <button
                                  onClick={() => handleAttendanceChangeForMember(selectedEvent.id, member.id, "going")}
                                  disabled={!currentUser}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                    !currentUser ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400" :
                                    status === "going" 
                                      ? "bg-green-100 text-green-700 border border-green-300" 
                                      : "bg-gray-100 text-gray-600 hover:bg-green-50"
                                  }`}
                                  title={!currentUser ? "請登入以修改出席狀態" : ""}
                                >
                                  <i className="fas fa-check mr-1" />出席
                                </button>
                                <button
                                  onClick={() => handleAttendanceChangeForMember(selectedEvent.id, member.id, "not-going")}
                                  disabled={!currentUser}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                    !currentUser ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400" :
                                    status === "not-going" 
                                      ? "bg-red-100 text-red-700 border border-red-300" 
                                      : "bg-gray-100 text-gray-600 hover:bg-red-50"
                                  }`}
                                  title={!currentUser ? "請登入以修改出席狀態" : ""}
                                >
                                  <i className="fas fa-times mr-1" />不出席
                                </button>
                                <button
                                  onClick={() => handleAttendanceChangeForMember(selectedEvent.id, member.id, "unknown")}
                                  disabled={!currentUser}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                    !currentUser ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400" :
                                    status === "unknown" 
                                      ? "bg-gray-400 text-white border border-gray-500" 
                                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  }`}
                                  title={!currentUser ? "請登入以修改出席狀態" : ""}
                                >
                                  <i className="fas fa-question mr-1" />未知道
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    )}
                    
                    {/* SAVE button */}
                    {!selectedEventEnded && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setShowEventModal(false)}
                          className="w-full band-gradient text-white py-2.5 rounded-xl hover:shadow-lg transition-all font-medium text-sm"
                        >
                          <i className="fas fa-save mr-2" />儲存
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 max-w-full">
        {/* Header */}
        <div className="glass-panel rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg mb-3 sm:mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 band-gradient rounded-full flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl shadow-md flex-shrink-0">
                <i className="fas fa-music" />
              </div>
              <div className="min-w-0 flex-1 sm:flex-none">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">慢半拍</h1>
                <p className="text-xs text-gray-500">{currentUser?.role === "admin" ? "主管" : "成員"}</p>
              </div>
            </div>
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right hidden sm:block">
                  <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.role === "admin" ? "主管" : "成員"}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-50 text-red-600 text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-lg sm:rounded-xl hover:bg-red-100 transition-all font-medium whitespace-nowrap"
                >
                  <i className="fas fa-sign-out-alt mr-1" /><span className="hidden sm:inline">登出</span><span className="sm:hidden">出</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="band-gradient text-white text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-lg sm:rounded-xl hover:shadow-md transition-all font-medium whitespace-nowrap w-full sm:w-auto"
              >
                <i className="fas fa-sign-in-alt mr-1" /><span className="hidden sm:inline">登入</span><span className="sm:hidden">入</span>
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-4 md:mt-5 pt-3 sm:pt-4 md:pt-5 border-t border-gray-100">
            {[
              { label: "本月活動", value: (eventsQuery.data || []).filter(e => { const d = new Date(e.date); return d.getMonth() === calendarMonth && d.getFullYear() === calendarYear; }).length, icon: "fa-calendar-check", color: "text-purple-600" },
              { label: "本月假期", value: hkHolidays.filter(h => { const d = new Date(h.date); return d.getMonth() === calendarMonth && d.getFullYear() === calendarYear; }).length, icon: "fa-umbrella-beach", color: "text-amber-600" },
              { label: "成員人數", value: (membersQuery.data || []).length, icon: "fa-users", color: "text-blue-600" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className={`text-base sm:text-lg md:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs md:text-sm text-gray-500 mt-0.5 truncate">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-1 sm:gap-2 mt-3 sm:mt-4 md:mt-5 pt-3 sm:pt-4 md:pt-5 border-t border-gray-100 flex-wrap">
            <button onClick={() => setCurrentView("calendar")} className={`nav-tab text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 ${currentView === "calendar" ? "active" : ""}`}>
              <i className="fas fa-calendar-alt" /><span className="hidden sm:inline">月曆</span><span className="sm:hidden">曆</span>
            </button>
            <button onClick={() => setCurrentView("list")} className={`nav-tab text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 ${currentView === "list" ? "active" : ""}`}>
              <i className="fas fa-list" /><span className="hidden sm:inline">活動清單</span><span className="sm:hidden">清</span>
            </button>
            {currentUser?.role === "admin" && (
              <button onClick={() => setCurrentView("members")} className={`nav-tab text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 ${currentView === "members" ? "active" : ""}`}>
                <i className="fas fa-users" /><span className="hidden sm:inline">成員管理</span><span className="sm:hidden">成</span>
              </button>
            )}
          </div>
        </div>

        {/* Calendar View */}
        {currentView === "calendar" && (
          <div className="glass-panel rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-5">
              <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-wrap w-full sm:w-auto">
                <button
                  onClick={() => setCurrentDate(new Date(calendarYear, calendarMonth - 1, 1))}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl bg-gray-100 hover:bg-purple-100 hover:text-purple-600 transition-all text-gray-600 text-xs sm:text-sm flex-shrink-0"
                >
                  <i className="fas fa-chevron-left" />
                </button>
                <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                  <select
                    value={calendarYear}
                    onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), calendarMonth, 1))}
                    className="text-sm sm:text-base md:text-lg font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer"
                  >
                    {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
                  </select>
                  <select
                    value={calendarMonth}
                    onChange={(e) => setCurrentDate(new Date(calendarYear, parseInt(e.target.value), 1))}
                    className="text-sm sm:text-base md:text-lg font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer"
                  >
                    {[0,1,2,3,4,5,6,7,8,9,10,11].map(m => (
                      <option key={m} value={m}>{m + 1}月</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setCurrentDate(new Date(calendarYear, calendarMonth + 1, 1))}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl bg-gray-100 hover:bg-purple-100 hover:text-purple-600 transition-all text-gray-600 text-xs sm:text-sm flex-shrink-0"
                >
                  <i className="fas fa-chevron-right" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="text-xs sm:text-sm text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 sm:px-3 py-1.5 rounded-lg transition-all font-medium whitespace-nowrap"
                >
                  今天
                </button>
              </div>
              {currentUser?.role === "admin" && (
                <button
                  onClick={() => openAddEventModal()}
                  className="band-gradient text-white text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-lg sm:rounded-xl hover:shadow-md transition-all font-medium flex items-center gap-1 sm:gap-2 whitespace-nowrap w-full sm:w-auto justify-center sm:justify-start"
                >
                  <i className="fas fa-plus" /><span className="hidden sm:inline">新增活動</span><span className="sm:hidden">新</span>
                </button>
              )}
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-1.5 mb-1 sm:mb-1.5">
              {["\u65e5", "\u4e00", "\u4e8c", "\u4e09", "\u56db", "\u4e94", "\u516d"].map((d, i) => (
                <div key={d} className={`text-center text-xs sm:text-sm font-semibold py-1 sm:py-2 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-1.5 w-full">
              {renderCalendar()}
            </div>
          </div>
        )}

        {/* List View */}
        {currentView === "list" && (
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

            {/* Tabs */}
            <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-5">
              <button
                onClick={() => setCurrentListTab("incomplete")}
                className={`list-tab-btn flex-1 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3`}
                style={currentListTab === "incomplete" ? {} : {}}
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

            {/* Batch Operations Toolbar */}
            {selectedEventIds.size > 0 && currentUser?.role === "admin" && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 mb-4 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-purple-700">
                  Selected {selectedEventIds.size} / {displayEvents.length} events
                </span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const allIds = new Set(displayEvents.map(e => e.id));
                      setSelectedEventIds(allIds);
                    }}
                    className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-300 hover:bg-blue-100 transition-all font-medium"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedEventIds(new Set())}
                    className="text-xs bg-white text-gray-700 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    Deselect All
                  </button>
                  <button
                    onClick={() => {
                      for (const id of selectedEventIds) {
                        deleteEventMutation.mutate({ id });
                      }
                      setSelectedEventIds(new Set());
                      showToast(`Deleted ${selectedEventIds.size} events`, "success");
                    }}
                    className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-all font-medium flex items-center gap-1"
                  >
                    <i className="fas fa-trash" />Delete
                  </button>
                </div>
              </div>
            )}
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
                  const toggleEventSelection = (e: any) => {
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
                                  const member = membersQuery.data?.find(m => m.id === parseInt(memberId));
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
                                {membersQuery.data?.filter(m => !event.attendance[m.id]).map(member => (
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

        {/* Members View (Admin only) */}
        {currentView === "members" && currentUser?.role === "admin" && (
          <div className="glass-panel rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-5">
              <h2 className="text-xl font-bold text-gray-800">成員管理</h2>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleResetAdminPassword}
                  className="bg-gray-100 text-gray-700 text-sm px-4 py-2 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <i className="fas fa-key" />重設主管密碼
                </button>
                <button
                  onClick={() => {
                    if (confirm('確定要清除所有活動嗎？此操作無法撤銷。')) {
                      localStorage.removeItem('bandSystemData');
                      window.location.reload();
                    }
                  }}
                  className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl hover:bg-red-100 transition-all flex items-center gap-2"
                >
                  <i className="fas fa-trash-alt" />清除所有活動
                </button>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5">
              <p className="text-blue-800 text-sm">
                <i className="fas fa-info-circle mr-2" />香港公眾假期已自動載入（2026年起）。
              </p>
            </div>
            {(membersQuery.data || []).length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <i className="fas fa-users text-4xl mb-3 text-gray-300 block" />
                <p>暫無成員</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(membersQuery.data || []).map((member) => {
                  const eventCount = (eventsQuery.data || []).filter(e => e.attendance[member.id] === "going").length;
                  const notAttendingCount = (eventsQuery.data || []).filter(e => e.attendance[member.id] === "not-going").length;
                  const pendingCount = (eventsQuery.data || []).filter(e => !e.attendance[member.id]).length;
                  return (
                    <div key={member.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-purple-200 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl ${COLOR_MAP[member.color] || "bg-blue-500"} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">{member.name}</h4>
                            <p className="text-sm text-gray-500">{member.instrument || "未設定職位"}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleResetMemberPassword(member.id)}
                            className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
                            title="重設密碼"
                          >
                            <i className="fas fa-key text-xs" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors"
                            title="刪除成員"
                          >
                            <i className="fas fa-trash-alt text-xs" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <p className="text-xs text-green-600 font-bold">{eventCount}</p>
                            <p className="text-xs text-gray-500">出席</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-red-600 font-bold">{notAttendingCount}</p>
                            <p className="text-xs text-gray-500">不出席</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 font-bold">{pendingCount}</p>
                            <p className="text-xs text-gray-500">待確認</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast.visible && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl text-white text-sm font-medium shadow-lg toast-${toast.type} animate-in fade-in slide-in-from-bottom-4`}>
          {toast.type === "success" && <i className="fas fa-check-circle mr-2" />}
          {toast.type === "error" && <i className="fas fa-exclamation-circle mr-2" />}
          {toast.type === "info" && <i className="fas fa-info-circle mr-2" />}
          {toast.message}
        </div>
      )}

      {/* Styles */}
      <style>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .band-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .modal-enter {
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .password-strength-bar {
          transition: all 0.3s ease;
        }

        .strength-weak {
          width: 33%;
          background: linear-gradient(90deg, #ef4444, #f87171);
        }

        .strength-medium {
          width: 66%;
          background: linear-gradient(90deg, #f59e0b, #fbbf24);
        }

        .strength-strong {
          width: 100%;
          background: linear-gradient(90deg, #10b981, #34d399);
        }

        .calendar-day {
          min-height: auto;
          background: white;
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          word-break: break-word;
        }

        @media (max-width: 768px) {
          .calendar-day {
            min-height: auto;
            padding: 0.75rem !important;
            font-size: 0.8rem;
            gap: 0.25rem;
          }
          .calendar-day .text-sm {
            font-size: 0.75rem !important;
          }
          .calendar-day .text-xs {
            font-size: 0.65rem !important;
          }
        }

        @media (max-width: 640px) {
          .calendar-day {
            min-height: auto;
            padding: 0.5rem !important;
            font-size: 0.75rem;
            gap: 0.2rem;
          }
          .calendar-day .text-sm {
            font-size: 0.7rem !important;
          }
          .calendar-day .text-xs {
            font-size: 0.6rem !important;
          }
          .calendar-day .space-y-0\.5 {
            gap: 0.125rem !important;
          }
        }

        @media (max-width: 480px) {
          .calendar-day {
            min-height: auto;
            padding: 0.375rem !important;
            font-size: 0.65rem;
            gap: 0.15rem;
          }
          .calendar-day .text-sm {
            font-size: 0.65rem !important;
          }
          .calendar-day .text-xs {
            font-size: 0.55rem !important;
          }
          .calendar-day .space-y-0\.5 {
            gap: 0.1rem !important;
          }
          .calendar-day .py-0\.5 {
            padding-top: 0.2rem !important;
            padding-bottom: 0.2rem !important;
          }
        }

        .calendar-day:hover {
          border-color: #a78bfa;
          background: #f3f0ff;
        }

        .completed-day {
          background: #f9fafb !important;
          border-color: #e5e7eb !important;
        }

        .today {
          border-color: #a78bfa;
          background: rgba(167, 139, 250, 0.1);
        }

        .nav-tab {
          flex: 1;
          padding: 0.75rem;
          border-radius: 0.75rem;
          background: transparent;
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .nav-tab.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
        }

        .nav-tab:hover:not(.active) {
          background: #f3f4f6;
          color: #374151;
        }

        .list-tab-btn {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .list-tab-btn:not(:has(.active)) {
          background: #f3f4f6;
          color: #6b7280;
        }

        .event-card {
          transition: all 0.2s ease;
          border-left: 4px solid;
        }

        .event-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .ongoing-card {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(251, 146, 60, 0.05));
          border-left-color: #f59e0b;
        }

        .completed-card {
          opacity: 0.7;
          background: #f9fafb;
        }

        .attendance-btn {
          padding: 0.75rem;
          border-radius: 0.75rem;
          border: 2px solid #e5e7eb;
          background: white;
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .attendance-btn.going {
          background: #dcfce7;
          border-color: #22c55e;
          color: #16a34a;
        }

        .attendance-btn.not-going {
          background: #fee2e2;
          border-color: #ef4444;
          color: #dc2626;
        }

        .attendance-btn.pending:hover {
          border-color: #a78bfa;
          background: #f3f0ff;
        }

        .time-select {
          padding: 0.5rem;
          border: none;
          background: transparent;
          font-size: 0.875rem;
          font-weight: 500;
          outline: none;
          cursor: pointer;
        }

        .toast-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .toast-error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .toast-info {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInFromBottom {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-in {
          animation: fadeIn 0.3s ease-out, slideInFromBottom 0.3s ease-out;
        }

        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .slide-in-from-bottom-4 {
          animation: slideInFromBottom 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
