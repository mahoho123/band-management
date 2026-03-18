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
        className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer hover:text-amber-700 transition-colors flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-amber-50 whitespace-nowrap"
      >
        {year}年
        <i className={`fas fa-chevron-down text-xs transition-transform ${showYearPicker ? 'rotate-180' : ''}`} />
      </button>

      {/* Year Picker Dropdown - Expanded Size with Responsive Positioning */}
      {showYearPicker && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-2xl p-3 sm:p-4 z-50 border border-gray-200 w-full max-w-xs sm:max-w-sm md:max-w-md">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3 max-h-60 sm:max-h-72 overflow-y-auto">
            {yearOptions.map(y => (
              <button
                key={y}
                onClick={() => {
                  onYearChange(y);
                  setShowYearPicker(false);
                }}
                className={`px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg font-semibold text-sm sm:text-base md:text-lg transition-all ${
                  y === year
                    ? 'bg-gradient-to-br from-[#F4D03F] to-[#D4A017] text-white shadow-md scale-105'
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
        className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer hover:text-amber-700 transition-colors flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-amber-50 whitespace-nowrap"
      >
        {MONTHS_CN[month]}
        <i className={`fas fa-chevron-down text-xs transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
      </button>

      {/* Month Picker Dropdown - Expanded Size with Responsive Positioning */}
      {showMonthPicker && (
        <div className="absolute top-full left-0 sm:left-auto mt-1 bg-white rounded-lg shadow-2xl p-3 sm:p-4 z-50 border border-gray-200 w-full max-w-xs sm:max-w-sm md:max-w-md">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
            {MONTHS_CN.map((m, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onMonthChange(idx);
                  setShowMonthPicker(false);
                }}
                className={`px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg font-semibold text-sm sm:text-base md:text-lg transition-all ${
                  idx === month
                    ? 'bg-gradient-to-br from-[#F4D03F] to-[#D4A017] text-white shadow-md scale-105'
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
