import { useState } from 'react';

interface DatePickerProps {
  year: number;
  month: number;
  yearOptions: number[];
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

const MONTHS_CN = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

export function DatePicker({ year, month, yearOptions, onYearChange, onMonthChange }: DatePickerProps) {
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  return (
    <div className="flex items-center gap-1 sm:gap-2 min-w-0 relative">
      {/* Year Selector Button */}
      <button
        onClick={() => {
          setShowYearPicker(!showYearPicker);
          setShowMonthPicker(false);
        }}
        className="text-sm sm:text-base md:text-lg font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer hover:text-amber-700 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-50"
      >
        {year}年
        <i className={`fas fa-chevron-down text-xs transition-transform ${showYearPicker ? 'rotate-180' : ''}`} />
      </button>

      {/* Year Picker Dropdown */}
      {showYearPicker && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl p-3 z-50 border border-gray-200">
          <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto">
            {yearOptions.map(y => (
              <button
                key={y}
                onClick={() => {
                  onYearChange(y);
                  setShowYearPicker(false);
                }}
                className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                  y === year
                    ? 'bg-gradient-to-br from-[#F4D03F] to-[#D4A017] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Month Selector Button */}
      <button
        onClick={() => {
          setShowMonthPicker(!showMonthPicker);
          setShowYearPicker(false);
        }}
        className="text-sm sm:text-base md:text-lg font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer hover:text-amber-700 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-50"
      >
        {MONTHS_CN[month]}
        <i className={`fas fa-chevron-down text-xs transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
      </button>

      {/* Month Picker Dropdown */}
      {showMonthPicker && (
        <div className="absolute top-full left-24 mt-1 bg-white rounded-lg shadow-xl p-3 z-50 border border-gray-200">
          <div className="grid grid-cols-3 gap-2">
            {MONTHS_CN.map((m, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onMonthChange(idx);
                  setShowMonthPicker(false);
                }}
                className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                  idx === month
                    ? 'bg-gradient-to-br from-[#F4D03F] to-[#D4A017] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
