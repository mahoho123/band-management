import { EQUIPMENT_LOAN_EMBED_URL } from "@shared/equipmentLoan";

interface EquipmentLoanViewProps {
  onBack: () => void;
}

export default function EquipmentLoanView({ onBack }: EquipmentLoanViewProps) {
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
      <iframe
        src={EQUIPMENT_LOAN_EMBED_URL}
        title="慢半拍器材借用平台"
        className="w-full min-h-[650px] h-[min(900px,calc(100vh-180px))] border-0 rounded-xl overflow-hidden bg-white"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </section>
  );
}
