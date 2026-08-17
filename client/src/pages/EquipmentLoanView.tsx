import { useState } from "react";
import { EQUIPMENT_LOAN_EMBED_URL } from "@shared/equipmentLoan";

interface EquipmentLoanViewProps {
  onBack: () => void;
  notificationReady?: boolean;
}

export default function EquipmentLoanView({
  onBack,
  notificationReady = false,
}: EquipmentLoanViewProps) {
  const [showReminderNotice, setShowReminderNotice] = useState(true);

  return (
    <section className="glass-panel rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-5 shadow-lg">
      <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
            慢半拍器材借用平台
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            預約、批准、交收及歸還記錄
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-amber-100 hover:text-amber-700 transition-colors text-sm text-gray-700 whitespace-nowrap"
        >
          <i className="fas fa-arrow-left mr-1" />
          返回月曆
        </button>
      </div>
      {!notificationReady && showReminderNotice && (
        <div
          role="status"
          className="mb-3 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900"
        >
          <i className="fas fa-bell mt-0.5 text-amber-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">未登入或未允許通知時，手機不會收到交還提醒</p>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              請在器材平台按「登入帳戶」，登入後允許通知／推播，才可接收交還提示。
            </p>
            <a
              href={EQUIPMENT_LOAN_EMBED_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex font-medium text-amber-900 underline underline-offset-2"
            >
              開啟器材平台登入
            </a>
          </div>
          <button
            type="button"
            aria-label="關閉提醒提示"
            onClick={() => setShowReminderNotice(false)}
            className="shrink-0 rounded-md px-2 py-1 text-amber-700 hover:bg-amber-100"
          >
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </div>
      )}
      <iframe
        src={EQUIPMENT_LOAN_EMBED_URL}
        title="慢半拍器材借用平台"
        className="w-full min-h-[500px] h-[calc(100dvh-13rem)] sm:h-[min(900px,calc(100vh-180px))] border-0 rounded-xl overflow-hidden bg-white"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </section>
  );
}
