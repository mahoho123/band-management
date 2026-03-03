/*
 * Band隊管理系統 - 主頁面
 * Design: 清新樂譜 (Sheet Music Minimalism)
 * - White background, purple-blue gradient brand color
 * - Noto Sans HK typography, different weights for hierarchy
 * - Card-based layout with subtle shadows
 */

import { useState, useEffect, useCallback, useRef } from "react";

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
  notes: string;
  attendance: Record<number, "going" | "not-going">;
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
  // Use system time which should be HK time (UTC+8)
  return new Date();
}

function isDayCompleted(dateStr: string): boolean {
  const hkNow = getHKTime();
  const todayStr = formatDateStr(hkNow);
  return dateStr < todayStr;
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
export default function Home() {
  const [systemData, setSystemData] = useState<SystemData>({
    isSetup: false,
    adminPassword: "",
    members: [],
    events: [],
    holidays: [],
  });
  const [hkHolidays, setHkHolidays] = useState<Holiday[]>([]);
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
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [setupFirstName, setSetupFirstName] = useState("");
  const [setupFirstInstrument, setSetupFirstInstrument] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");

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

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type, visible: true });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem("bandSystemData");
    let data: SystemData = {
      isSetup: false,
      adminPassword: "",
      members: [],
      events: [],
      holidays: [],
    };
    if (saved) {
      try {
        data = JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    setSystemData(data);
    const holidays = initializeHolidays(data.holidays || []);
    setHkHolidays(holidays);

    if (!data.isSetup) {
      setShowSetupModal(true);
    } else {
      setShowLoginModal(true);
    }

    // Refresh every minute
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const saveData = useCallback((data: SystemData) => {
    localStorage.setItem("bandSystemData", JSON.stringify(data));
    setSystemData(data);
  }, []);

  // ============================================
  // SETUP
  // ============================================
  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPassword !== setupConfirm) return showToast("兩次輸入的密碼不一致", "error");
    if (setupPassword.length < 4) return showToast("密碼最少需要4個字元", "error");

    const newData: SystemData = {
      ...systemData,
      isSetup: true,
      adminPassword: setupPassword,
      holidays: hkHolidays,
    };
    if (setupFirstName.trim()) {
      newData.members.push({
        id: Date.now(),
        name: setupFirstName.trim(),
        instrument: setupFirstInstrument.trim(),
        color: "blue",
        password: "",
      });
    }
    saveData(newData);
    setShowSetupModal(false);
    showToast("設定完成！香港假期已自動載入（2026年起）", "success");
    setShowLoginModal(true);
    setLoginTab("admin");
  };

  // ============================================
  // LOGIN
  // ============================================
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLoginPassword === systemData.adminPassword) {
      setCurrentUser({ id: "admin", role: "admin", name: "主管" });
      setShowLoginModal(false);
      setAdminLoginPassword("");
      showToast("主管登入成功", "success");
    } else {
      showToast("主管密碼錯誤", "error");
    }
  };

  const handleMemberLogin = (memberId: number) => {
    const member = systemData.members.find((m) => m.id === memberId);
    if (!member) return;
    if (!member.password) {
      // First login - set password
      const newPassword = prompt(`首次登入，請為 ${member.name} 設定密碼（最少4個字元）：`);
      if (!newPassword || newPassword.length < 4) return showToast("密碼太短或取消設定", "error");
      const confirmPassword = prompt("請再次輸入密碼確認：");
      if (newPassword !== confirmPassword) return showToast("兩次輸入的密碼不一致", "error");
      const newData = { ...systemData };
      const memberIdx = newData.members.findIndex((m) => m.id === memberId);
      newData.members[memberIdx].password = newPassword;
      saveData(newData);
      setCurrentUser({ id: memberId, role: "member", name: member.name });
      setShowLoginModal(false);
      showToast(`歡迎，${member.name}！密碼已設定`, "success");
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
    setShowLoginModal(true);
  };

  // ============================================
  // REGISTER
  // ============================================
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return showToast("請輸入名稱", "error");
    if (regPassword.length < 4) return showToast("密碼最少需要4個字元", "error");
    if (regPassword !== regConfirm) return showToast("兩次輸入的密碼不一致", "error");
    if (systemData.members.some((m) => m.name === regName.trim())) return showToast("此名稱已被使用", "error");

    const newMember: Member = {
      id: Date.now(),
      name: regName.trim(),
      instrument: regInstrument.trim(),
      color: selectedRegColor,
      password: regPassword,
    };
    const newData = { ...systemData, members: [...systemData.members, newMember] };
    saveData(newData);
    setCurrentUser({ id: newMember.id, role: "member", name: newMember.name });
    setShowRegisterModal(false);
    setRegName("");
    setRegInstrument("");
    setRegPassword("");
    setRegConfirm("");
    showToast(`註冊成功！歡迎加入，${regName}！`, "success");
  };

  // ============================================
  // EVENT MANAGEMENT
  // ============================================
  const openAddEventModal = (date?: string) => {
    if (!currentUser) return setShowLoginModal(true);
    if (currentUser.role !== "admin") return;
    const targetDate = date || formatDateStr(new Date());
    if (isDayCompleted(targetDate)) return showToast("此日期已過，不能添加活動", "error");

    setSelectedEventId(null);
    setEventModalMode("add");
    setEventTitle("");
    setEventDate(targetDate);
    setEventType("rehearsal");
    setEventLocation("");
    setEventNotes("");
    setStartHour("7");
    setStartMinute("00");
    setStartAmpm("PM");
    setEndHour("10");
    setEndMinute("00");
    setEndAmpm("PM");
    checkDateHolidayFor(targetDate);
    setShowEventModal(true);
  };

  const openEventModal = (eventId: number) => {
    if (!currentUser) return setShowLoginModal(true);
    const event = systemData.events.find((e) => e.id === eventId);
    if (!event) return;

    const isCompleted = isDayCompleted(event.date);
    setSelectedEventId(eventId);

    if (currentUser.role === "admin" && !isCompleted) {
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
    const holiday = hkHolidays.find((h) => h.date === date);
    setDateHolidayWarning(holiday ? holiday.name : "");
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDayCompleted(eventDate)) return showToast("此日期已過，不能添加或修改活動", "error");

    const startTime = parseTime12To24(startHour, startMinute, startAmpm);
    const endTime = parseTime12To24(endHour, endMinute, endAmpm);

    if (endTime <= startTime) return showToast("結束時間必須晚於開始時間", "error");

    const newData = { ...systemData, events: [...systemData.events] };

    if (selectedEventId) {
      const idx = newData.events.findIndex((e) => e.id === selectedEventId);
      if (idx !== -1) {
        newData.events[idx] = {
          ...newData.events[idx],
          title: eventTitle,
          date: eventDate,
          startTime,
          endTime,
          location: eventLocation,
          type: eventType,
          notes: eventNotes,
        };
        showToast("活動已更新", "success");
      }
    } else {
      newData.events.push({
        id: Date.now(),
        title: eventTitle,
        date: eventDate,
        startTime,
        endTime,
        location: eventLocation,
        type: eventType,
        notes: eventNotes,
        attendance: {},
      });
      showToast("活動已新增", "success");
    }
    saveData(newData);
    setShowEventModal(false);
  };

  const handleDeleteEvent = () => {
    if (!selectedEventId) return;
    const event = systemData.events.find((e) => e.id === selectedEventId);
    if (event && isDayCompleted(event.date)) return showToast("此活動已完結，不能刪除", "error");
    if (!confirm("確定要刪除這個活動嗎？")) return;
    const newData = { ...systemData, events: systemData.events.filter((e) => e.id !== selectedEventId) };
    saveData(newData);
    setShowEventModal(false);
    showToast("活動已刪除", "success");
  };

  const handleSetAttendance = (status: "going" | "not-going") => {
    if (!selectedEventId || currentUser?.role !== "member") return;
    const event = systemData.events.find((e) => e.id === selectedEventId);
    if (!event) return;
    if (isDayCompleted(event.date)) return showToast("此活動已完結，不能修改出席狀態", "error");

    const newData = { ...systemData, events: [...systemData.events] };
    const idx = newData.events.findIndex((e) => e.id === selectedEventId);
    newData.events[idx] = {
      ...newData.events[idx],
      attendance: { ...newData.events[idx].attendance, [currentUser.id as number]: status },
    };
    saveData(newData);
    showToast(status === "going" ? "已確認出席" : "已確認不出席", "success");
  };

  // ============================================
  // MEMBER MANAGEMENT
  // ============================================
  const handleResetMemberPassword = (memberId: number) => {
    const member = systemData.members.find((m) => m.id === memberId);
    if (!member) return;
    const newPassword = prompt(`為 ${member.name} 設定新密碼（最少4個字元）：`);
    if (!newPassword) return;
    if (newPassword.length < 4) return showToast("密碼太短", "error");
    const newData = { ...systemData };
    const idx = newData.members.findIndex((m) => m.id === memberId);
    newData.members[idx].password = newPassword;
    saveData(newData);
    showToast(`${member.name} 的密碼已重設`, "success");
  };

  const handleResetAdminPassword = () => {
    const currentPassword = prompt("請輸入現有主管密碼：");
    if (currentPassword !== systemData.adminPassword) return showToast("密碼錯誤", "error");
    const newPassword = prompt("請輸入新主管密碼（最少4個字元）：");
    if (!newPassword || newPassword.length < 4) return showToast("密碼太短", "error");
    const confirmPassword = prompt("請再次輸入新密碼確認：");
    if (newPassword !== confirmPassword) return showToast("兩次輸入不一致", "error");
    const newData = { ...systemData, adminPassword: newPassword };
    saveData(newData);
    showToast("主管密碼已重設", "success");
  };

  const handleDeleteMember = (memberId: number) => {
    if (!confirm("確定要刪除這位成員嗎？所有出席記錄也會被移除。")) return;
    const newData = {
      ...systemData,
      members: systemData.members.filter((m) => m.id !== memberId),
      events: systemData.events.map((e) => {
        const newAttendance = { ...e.attendance };
        delete newAttendance[memberId];
        return { ...e, attendance: newAttendance };
      }),
    };
    if (currentUser?.id === memberId) {
      setCurrentUser(null);
      setShowLoginModal(true);
    }
    saveData(newData);
    showToast("成員已刪除", "success");
  };

  // ============================================
  // CALENDAR RENDERING
  // ============================================
  const calendarYear = currentDate.getFullYear();
  const calendarMonth = currentDate.getMonth();

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const todayStr = formatDateStr(new Date());

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
      const dayEvents = systemData.events
        .filter((e) => e.date === dateStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      const maxEvents = 2;

      cells.push(
        <div
          key={dateStr}
          className={`calendar-day rounded-xl border p-1.5 cursor-pointer flex flex-col ${
            dayCompleted
              ? "completed-day bg-gray-50 border-gray-200"
              : isToday
              ? "today border-purple-400 bg-purple-50/30"
              : "bg-white border-gray-200 hover:border-purple-300"
          }`}
          onClick={() => {
            if (dayCompleted) return showToast("此日期已過，不能修改", "info");
            if (currentUser?.role === "admin") openAddEventModal(dateStr);
            else if (dayEvents.length > 0) openEventModal(dayEvents[0].id);
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                isToday
                  ? "band-gradient text-white text-xs"
                  : dayCompleted
                  ? "text-gray-400"
                  : "text-gray-700"
              }`}
            >
              {day}
            </span>
            {holidays.length > 0 && (
              <span className="holiday-badge">{holidays[0].name.length > 4 ? holidays[0].name.slice(0, 4) + "…" : holidays[0].name}</span>
            )}
          </div>
          <div className="flex-1 min-h-0">
            {dayEvents.slice(0, maxEvents).map((event) => {
              const isCompleted = isDayCompleted(event.date);
              const status = isCompleted ? "completed" : getEventStatus(event);
              const typeConf = TYPE_CONFIG[event.type];
              const goingMembers = systemData.members.filter((m) => event.attendance[m.id] === "going");
              const notGoingMembers = systemData.members.filter((m) => event.attendance[m.id] === "not-going");

              return (
                <div
                  key={event.id}
                  className={`event-chip ${isCompleted ? "completed" : ""} ${status === "ongoing" ? "ongoing" : ""} ${typeConf.color}`}
                  style={!isCompleted ? { borderColor: "transparent" } : {}}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEventModal(event.id);
                  }}
                >
                  {event.title}
                  {goingMembers.length > 0 && !isCompleted && (
                    <div className="attending-names-chip">
                      ✓ {goingMembers.map((m) => m.name).join(", ")}
                    </div>
                  )}
                  {notGoingMembers.length > 0 && !isCompleted && (
                    <div className="not-attending-names-chip">
                      ✗ {notGoingMembers.map((m) => m.name).join(", ")}
                    </div>
                  )}
                </div>
              );
            })}
            {dayEvents.length > maxEvents && (
              <div className="text-xs text-gray-400 text-center py-0.5">+{dayEvents.length - maxEvents} 更多</div>
            )}
          </div>
        </div>
      );
    }
    return cells;
  };

  // ============================================
  // LIST RENDERING
  // ============================================
  const getFilteredEvents = () => {
    let filtered = systemData.events.filter((e) => {
      const d = new Date(e.date);
      if (d.getFullYear() !== listYear) return false;
      if (listMonth !== "all" && d.getMonth() !== parseInt(listMonth)) return false;
      return true;
    });
    filtered.sort((a, b) => {
      const dateA = new Date(a.date + "T" + a.startTime);
      const dateB = new Date(b.date + "T" + b.startTime);
      return dateA.getTime() - dateB.getTime();
    });
    const incomplete = filtered.filter((e) => !isDayCompleted(e.date));
    const completed = filtered.filter((e) => isDayCompleted(e.date));
    return { incomplete, completed };
  };

  const { incomplete: incompleteEvents, completed: completedEvents } = getFilteredEvents();
  const displayEvents = currentListTab === "incomplete" ? incompleteEvents : completedEvents;

  // ============================================
  // SELECTED EVENT
  // ============================================
  const selectedEvent = selectedEventId ? systemData.events.find((e) => e.id === selectedEventId) : null;
  const selectedEventCompleted = selectedEvent ? isDayCompleted(selectedEvent.date) : false;

  // ============================================
  // YEAR OPTIONS
  // ============================================
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = 2026; y <= currentYear + 10; y++) yearOptions.push(y);

  const minuteOptions = [];
  for (let i = 0; i < 60; i++) minuteOptions.push(String(i).padStart(2, "0"));

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      {/* Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl max-w-md w-full p-6 modal-enter shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 band-gradient rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg">
                <i className="fas fa-music" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">首次設定</h2>
              <p className="text-gray-500 text-sm mt-1">請設定主管密碼以開始使用系統</p>
            </div>
            <form onSubmit={handleSetup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  設定主管密碼 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={setupPassword}
                  onChange={(e) => {
                    setSetupPassword(e.target.value);
                    const v = e.target.value;
                    setPasswordStrength(v.length < 4 ? "" : v.length < 6 ? "strength-weak" : v.length < 8 ? "strength-medium" : "strength-strong");
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                  placeholder="最少4個字元"
                />
                <div className="mt-2 bg-gray-200 rounded-full overflow-hidden h-1">
                  <div className={`password-strength-bar ${passwordStrength}`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  確認密碼 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={setupConfirm}
                  onChange={(e) => setSetupConfirm(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                  placeholder="再次輸入密碼"
                />
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
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl max-w-md w-full p-6 modal-enter shadow-2xl">
            <div className="flex mb-5 border-b border-gray-200">
              <button
                onClick={() => setLoginTab("member")}
                className={`flex-1 pb-3 text-sm font-medium transition-all ${loginTab === "member" ? "border-b-2 border-purple-500 text-purple-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                <i className="fas fa-user mr-2" />成員登入
              </button>
              <button
                onClick={() => setLoginTab("admin")}
                className={`flex-1 pb-3 text-sm font-medium transition-all ${loginTab === "admin" ? "border-b-2 border-purple-500 text-purple-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                <i className="fas fa-crown mr-2" />主管登入
              </button>
            </div>

            {loginTab === "member" ? (
              <div>
                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                  {systemData.members.length === 0 ? (
                    <p className="text-center text-gray-500 py-6 text-sm">暫無成員，請先註冊</p>
                  ) : (
                    systemData.members.map((member) => (
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
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl max-w-md w-full p-6 modal-enter shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-800">新成員註冊</h3>
              <button
                onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">名稱 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                    placeholder="你的名稱"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">職位/樂器</label>
                  <input
                    type="text"
                    value={regInstrument}
                    onChange={(e) => setRegInstrument(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                    placeholder="例：結他手"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">選擇顏色</label>
                <div className="flex gap-2 flex-wrap">
                  {MEMBER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedRegColor(color)}
                      className={`color-option ${COLOR_MAP[color]} ${selectedRegColor === color ? "selected" : ""}`}
                      style={selectedRegColor === color ? { boxShadow: `0 0 0 3px ${COLOR_HEX[color]}` } : {}}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">密碼 <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                  placeholder="最少4個字元"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">確認密碼 <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  required
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm"
                  placeholder="再次輸入密碼"
                />
              </div>
              <button
                type="submit"
                className="w-full band-gradient text-white py-3 rounded-xl hover:shadow-lg transition-all font-medium text-sm"
              >
                <i className="fas fa-user-check mr-2" />完成註冊
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowEventModal(false); }}
        >
          <div className="glass-panel rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-enter shadow-2xl">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/80 rounded-t-2xl sticky top-0">
              <h3 className="text-lg font-bold text-gray-800">
                {eventModalMode === "add" ? "新增活動" : eventModalMode === "edit" ? "編輯活動" : selectedEventCompleted ? "活動詳情（已完結）" : "活動詳情"}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
              >
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="p-5">
              {(eventModalMode === "add" || eventModalMode === "edit") ? (
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">開始時間 <span className="text-red-500">*</span></label>
                      <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-xl border border-gray-200">
                        <div className="flex flex-col items-center">
                          <label className="text-xs text-gray-500 mb-1">時</label>
                          <select value={startHour} onChange={(e) => setStartHour(e.target.value)} className="time-select w-12">
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                        <span className="text-gray-400 pt-5">:</span>
                        <div className="flex flex-col items-center">
                          <label className="text-xs text-gray-500 mb-1">分</label>
                          <select value={startMinute} onChange={(e) => setStartMinute(e.target.value)} className="time-select w-14">
                            {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col items-center">
                          <label className="text-xs text-gray-500 mb-1">時段</label>
                          <select value={startAmpm} onChange={(e) => setStartAmpm(e.target.value)} className="time-select w-16 bg-purple-50 font-medium">
                            <option value="AM">上午</option>
                            <option value="PM">下午</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">結束時間 <span className="text-red-500">*</span></label>
                      <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-xl border border-gray-200">
                        <div className="flex flex-col items-center">
                          <label className="text-xs text-gray-500 mb-1">時</label>
                          <select value={endHour} onChange={(e) => setEndHour(e.target.value)} className="time-select w-12">
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                        <span className="text-gray-400 pt-5">:</span>
                        <div className="flex flex-col items-center">
                          <label className="text-xs text-gray-500 mb-1">分</label>
                          <select value={endMinute} onChange={(e) => setEndMinute(e.target.value)} className="time-select w-14">
                            {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col items-center">
                          <label className="text-xs text-gray-500 mb-1">時段</label>
                          <select value={endAmpm} onChange={(e) => setEndAmpm(e.target.value)} className="time-select w-16 bg-purple-50 font-medium">
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
                          const status = selectedEventCompleted ? "completed" : getEventStatus(selectedEvent);
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
                  </div>
                )
              )}

              {/* Attendance Section */}
              {selectedEvent && (
                <div className="mt-5 pt-5 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-800">出席狀態</h4>
                    <span className="text-sm text-gray-500">
                      出席: {Object.values(selectedEvent.attendance).filter(v => v === "going").length} |
                      缺席: {Object.values(selectedEvent.attendance).filter(v => v === "not-going").length} |
                      待定: {systemData.members.length - Object.values(selectedEvent.attendance).filter(v => v === "going").length - Object.values(selectedEvent.attendance).filter(v => v === "not-going").length}
                      {selectedEventCompleted ? " (已完結)" : ""}
                    </span>
                  </div>

                  {currentUser?.role === "member" && !selectedEventCompleted && (
                    <div className="mb-5">
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-3">
                        <p className="text-purple-800 font-medium text-sm mb-0.5">
                          你好，{systemData.members.find(m => m.id === currentUser.id)?.name}！
                        </p>
                        <p className="text-purple-600 text-xs">請選擇你的出席狀態：</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSetAttendance("going")}
                          className={`attendance-btn flex-1 ${selectedEvent.attendance[currentUser.id as number] === "going" ? "going" : "pending"}`}
                        >
                          <i className="fas fa-check mr-2" />出席
                        </button>
                        <button
                          onClick={() => handleSetAttendance("not-going")}
                          className={`attendance-btn flex-1 ${selectedEvent.attendance[currentUser.id as number] === "not-going" ? "not-going" : "pending"}`}
                        >
                          <i className="fas fa-times mr-2" />不出席
                        </button>
                      </div>
                    </div>
                  )}

                  {!currentUser && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-center">
                      <p className="text-amber-800 text-sm">
                        <i className="fas fa-exclamation-triangle mr-2" />請先登入才能標記出席狀態
                      </p>
                      <button
                        onClick={() => { setShowEventModal(false); setShowLoginModal(true); }}
                        className="mt-2 text-amber-600 font-medium hover:underline text-sm"
                      >
                        立即登入
                      </button>
                    </div>
                  )}

                  {selectedEventCompleted && currentUser?.role === "member" && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                      <p className="text-gray-600 text-sm">
                        <i className="fas fa-info-circle mr-2" />此活動已完結，不能修改出席狀態
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {systemData.members.map((member) => {
                      const status = selectedEvent.attendance[member.id] || "pending";
                      const statusText = { going: "出席", "not-going": "不出席", pending: "待確認" };
                      const statusDot = { going: "bg-green-500", "not-going": "bg-red-500", pending: "bg-gray-300" };
                      const isCurrentUser = currentUser?.role === "member" && member.id === currentUser.id;
                      return (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between p-3 rounded-xl ${isCurrentUser ? "ring-2 ring-purple-200 bg-purple-50" : "bg-gray-50"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className={`w-9 h-9 rounded-full ${COLOR_MAP[member.color] || "bg-blue-500"} flex items-center justify-center text-white font-bold text-sm`}>
                                {member.name.charAt(0)}
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusDot[status]}`} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-800 text-sm flex items-center gap-2">
                                {member.name}
                                {isCurrentUser && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">你</span>}
                              </div>
                              {member.instrument && <div className="text-xs text-gray-500">{member.instrument}</div>}
                            </div>
                          </div>
                          <span className={`text-sm font-medium ${status === "going" ? "text-green-600" : status === "not-going" ? "text-red-600" : "text-gray-400"}`}>
                            {statusText[status]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main App */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="glass-panel rounded-2xl p-4 mb-5 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 band-gradient rounded-xl flex items-center justify-center text-white shadow-md">
                <i className="fas fa-music text-sm" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Band隊管理系統</h1>
                <p className="text-xs text-gray-500">
                  {currentUser ? (
                    currentUser.role === "admin" ? (
                      <span className="text-amber-600 font-medium"><i className="fas fa-crown mr-1" />主管模式 - 完整管理權限</span>
                    ) : (
                      <span className="text-purple-600 font-medium"><i className="fas fa-user mr-1" />成員模式 - {currentUser.name}</span>
                    )
                  ) : (
                    <span className="text-gray-400">未登入</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 font-medium">
                    {currentUser.role === "admin" ? <><i className="fas fa-crown text-amber-500 mr-1.5" />主管</> : currentUser.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <i className="fas fa-sign-out-alt mr-1" />登出
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="band-gradient text-white text-sm px-4 py-2 rounded-xl hover:shadow-md transition-all font-medium"
                >
                  <i className="fas fa-sign-in-alt mr-2" />登入
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
            {[
              { label: "本月活動", value: systemData.events.filter(e => { const d = new Date(e.date); return d.getMonth() === calendarMonth && d.getFullYear() === calendarYear; }).length, icon: "fa-calendar-check", color: "text-purple-600" },
              { label: "出席記錄", value: (() => { const monthEvents = systemData.events.filter(e => { const d = new Date(e.date); return d.getMonth() === calendarMonth && d.getFullYear() === calendarYear; }); let count = 0; monthEvents.forEach(e => systemData.members.forEach(m => { if (e.attendance[m.id] === "going") count++; })); return count; })(), icon: "fa-user-check", color: "text-green-600" },
              { label: "本月假期", value: hkHolidays.filter(h => { const d = new Date(h.date); return d.getMonth() === calendarMonth && d.getFullYear() === calendarYear; }).length, icon: "fa-umbrella-beach", color: "text-amber-600" },
              { label: "成員人數", value: systemData.members.length, icon: "fa-users", color: "text-blue-600" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <button onClick={() => setCurrentView("calendar")} className={`nav-tab ${currentView === "calendar" ? "active" : ""}`}>
              <i className="fas fa-calendar-alt" />月曆
            </button>
            <button onClick={() => setCurrentView("list")} className={`nav-tab ${currentView === "list" ? "active" : ""}`}>
              <i className="fas fa-list" />活動清單
            </button>
            {currentUser?.role === "admin" && (
              <button onClick={() => setCurrentView("members")} className={`nav-tab ${currentView === "members" ? "active" : ""}`}>
                <i className="fas fa-users" />成員管理
              </button>
            )}
          </div>
        </div>

        {/* Calendar View */}
        {currentView === "calendar" && (
          <div className="glass-panel rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentDate(new Date(calendarYear, calendarMonth - 1, 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-purple-100 hover:text-purple-600 transition-all text-gray-600"
                >
                  <i className="fas fa-chevron-left text-sm" />
                </button>
                <div className="flex items-center gap-2">
                  <select
                    value={calendarYear}
                    onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), calendarMonth, 1))}
                    className="text-lg font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer"
                  >
                    {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
                  </select>
                  <select
                    value={calendarMonth}
                    onChange={(e) => setCurrentDate(new Date(calendarYear, parseInt(e.target.value), 1))}
                    className="text-lg font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer"
                  >
                    {[0,1,2,3,4,5,6,7,8,9,10,11].map(m => (
                      <option key={m} value={m}>{m + 1}月</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setCurrentDate(new Date(calendarYear, calendarMonth + 1, 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-purple-100 hover:text-purple-600 transition-all text-gray-600"
                >
                  <i className="fas fa-chevron-right text-sm" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="text-xs text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-all font-medium"
                >
                  今天
                </button>
              </div>
              {currentUser?.role === "admin" && (
                <button
                  onClick={() => openAddEventModal()}
                  className="band-gradient text-white text-sm px-4 py-2 rounded-xl hover:shadow-md transition-all font-medium flex items-center gap-2"
                >
                  <i className="fas fa-plus" />新增活動
                </button>
              )}
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {["日", "一", "二", "三", "四", "五", "六"].map((d, i) => (
                <div key={d} className={`text-center text-xs font-semibold py-2 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {renderCalendar()}
            </div>
          </div>
        )}

        {/* List View */}
        {currentView === "list" && (
          <div className="glass-panel rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">活動清單</h2>
              {currentUser?.role === "admin" && (
                <button
                  onClick={() => openAddEventModal()}
                  className="band-gradient text-white text-sm px-4 py-2 rounded-xl hover:shadow-md transition-all font-medium flex items-center gap-2"
                >
                  <i className="fas fa-plus" />新增活動
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-5 flex-wrap">
              <select
                value={listYear}
                onChange={(e) => setListYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-400"
              >
                {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
              </select>
              <select
                value={listMonth}
                onChange={(e) => setListMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="all">全年</option>
                {[0,1,2,3,4,5,6,7,8,9,10,11].map(m => (
                  <option key={m} value={m}>{m + 1}月</option>
                ))}
              </select>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setCurrentListTab("incomplete")}
                className={`list-tab-btn flex-1 flex items-center justify-center gap-2 text-sm`}
                style={currentListTab === "incomplete" ? {} : {}}
              >
                <i className="fas fa-clock" />
                <span>未完成</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${currentListTab === "incomplete" ? "bg-white/20" : "bg-gray-200 text-gray-600"}`}>
                  {incompleteEvents.length}
                </span>
              </button>
              <button
                onClick={() => setCurrentListTab("completed")}
                className={`list-tab-btn flex-1 flex items-center justify-center gap-2 text-sm`}
              >
                <i className="fas fa-check-circle" />
                <span>已完成</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${currentListTab === "completed" ? "bg-white/20" : "bg-gray-200 text-gray-600"}`}>
                  {completedEvents.length}
                </span>
              </button>
            </div>

            {/* Events */}
            <div className="space-y-3">
              {displayEvents.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <i className="fas fa-calendar-times text-4xl mb-3 text-gray-300 block" />
                  <p>暫無{currentListTab === "incomplete" ? "未完成" : "已完成"}活動</p>
                  {currentListTab === "incomplete" && currentUser?.role === "admin" && (
                    <button onClick={() => openAddEventModal()} className="mt-3 text-purple-600 hover:underline text-sm">
                      新增活動
                    </button>
                  )}
                </div>
              ) : (
                displayEvents.map((event) => {
                  const isCompleted = isDayCompleted(event.date);
                  const status = isCompleted ? "completed" : getEventStatus(event);
                  const isOngoing = status === "ongoing";
                  const typeConf = TYPE_CONFIG[event.type];
                  const goingCount = Object.values(event.attendance).filter(v => v === "going").length;
                  const myStatus = currentUser?.role === "member" ? event.attendance[currentUser.id as number] : null;

                  return (
                    <div
                      key={event.id}
                      onClick={() => openEventModal(event.id)}
                      className={`event-card bg-white rounded-xl p-4 shadow-sm cursor-pointer ${typeConf.border} ${isOngoing ? "ongoing-card" : ""} ${isCompleted ? "completed-card" : ""}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`text-xs px-2.5 py-1 rounded-full ${typeConf.color} font-medium flex items-center gap-1`}>
                              <i className={`fas ${typeConf.icon} text-xs`} />{typeConf.text}
                            </span>
                            {isOngoing && <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-bold animate-pulse">進行中</span>}
                            {isCompleted && <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold">已完結</span>}
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
                        </div>
                        <div className="flex flex-col items-end gap-2 min-w-[80px]">
                          {currentUser?.role === "member" ? (
                            <div className="transform hover:scale-110 transition-transform">
                              {myStatus === "going" ? <i className="fas fa-check-circle text-green-500 text-2xl" /> :
                               myStatus === "not-going" ? <i className="fas fa-times-circle text-red-500 text-2xl" /> :
                               <i className="fas fa-question-circle text-gray-300 text-2xl" />}
                            </div>
                          ) : (
                            <div className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                              {goingCount}/{systemData.members.length} 人出席
                            </div>
                          )}
                          {goingCount === systemData.members.length && systemData.members.length > 0 && (
                            <span className="text-xs text-green-600 font-medium">全員出席</span>
                          )}
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
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">成員管理</h2>
              <button
                onClick={handleResetAdminPassword}
                className="bg-gray-100 text-gray-700 text-sm px-4 py-2 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <i className="fas fa-key" />重設主管密碼
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5">
              <p className="text-blue-800 text-sm">
                <i className="fas fa-info-circle mr-2" />香港公眾假期已自動載入（2026年起）。
              </p>
            </div>
            {systemData.members.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <i className="fas fa-users text-4xl mb-3 text-gray-300 block" />
                <p>暫無成員</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemData.members.map((member) => {
                  const eventCount = systemData.events.filter(e => e.attendance[member.id] === "going").length;
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
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
                        <span className="text-gray-500">已確認出席</span>
                        <span className="font-medium text-green-600">{eventCount} 次活動</span>
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
      <div
        className={`toast-notification fixed bottom-5 right-5 bg-gray-800 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 z-50 ${toast.visible ? "" : "hidden-toast"}`}
      >
        <i className={`fas ${toast.type === "success" ? "fa-check-circle text-green-400" : toast.type === "error" ? "fa-exclamation-circle text-red-400" : "fa-info-circle text-blue-400"}`} />
        <span className="text-sm">{toast.message}</span>
      </div>
    </div>
  );
}
