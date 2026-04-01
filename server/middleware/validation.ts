import { z } from "zod";

/**
 * 輸入驗證中間件
 * 防止 SQL 注入、XSS 攻擊等安全問題
 */

// 基礎驗證規則
export const ValidationRules = {
  // 字符串驗證
  safeString: z.string()
    .min(1, "字符串不能為空")
    .max(255, "字符串過長")
    .refine(
      (val) => !/[<>\"'%;()&+]/.test(val),
      "字符串包含不安全字符"
    ),

  // 名稱驗證
  name: z.string()
    .min(1, "名稱不能為空")
    .max(50, "名稱過長")
    .refine(
      (val) => /^[\u4e00-\u9fff\w\s\-\.]+$/.test(val),
      "名稱包含不安全字符"
    ),

  // 密碼驗證
  password: z.string()
    .min(4, "密碼至少 4 個字符")
    .max(50, "密碼過長"),

  // 日期驗證
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式不正確 (YYYY-MM-DD)"),

  // 時間驗證
  time: z.string()
    .regex(/^\d{2}:\d{2}$/, "時間格式不正確 (HH:MM)"),

  // 顏色驗證
  color: z.enum(["blue", "purple", "green", "red", "yellow", "pink", "indigo", "orange"]),

  // 活動類型驗證
  eventType: z.enum(["rehearsal", "performance", "meeting", "other"]),

  // 出席狀態驗證
  attendanceStatus: z.enum(["going", "not-going", "unknown"]),

  // ID 驗證
  id: z.number().int().positive("ID 必須是正整數"),

  // 位置驗證
  location: z.string()
    .min(1, "位置不能為空")
    .max(100, "位置過長"),

  // 備註驗證
  notes: z.string()
    .max(500, "備註過長")
    .optional(),
};

/**
 * 清理字符串，移除潛在的危險字符
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>\"'%;()&+]/g, "")
    .trim();
}

/**
 * 驗證並清理輸入
 */
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`驗證失敗: ${firstError?.message || '未知錯誤'}`);
    }
    throw error;
  }
}

/**
 * 批量驗證規則
 */
export const BatchValidationSchemas = {
  addMember: z.object({
    name: ValidationRules.name,
    instrument: z.string().max(50).optional(),
    color: ValidationRules.color,
    password: ValidationRules.password,
  }),

  addEvent: z.object({
    title: ValidationRules.safeString,
    date: ValidationRules.date,
    startTime: ValidationRules.time,
    endTime: ValidationRules.time,
    location: ValidationRules.location,
    type: ValidationRules.eventType,
    notes: ValidationRules.notes,
  }),

  setAttendance: z.object({
    eventId: ValidationRules.id,
    memberId: ValidationRules.id,
    status: ValidationRules.attendanceStatus,
  }),

  addHoliday: z.object({
    date: ValidationRules.date,
    name: ValidationRules.safeString,
  }),
};
