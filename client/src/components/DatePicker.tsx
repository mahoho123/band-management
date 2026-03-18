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
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 relative">
      {/* Year Button */}
      <button
        onClick={() => {
          setShowYearPicker(!showYearPicker);
          setShowMonthPicker(false);
        }}
        className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer hover:text-amber-700 transition-colors px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-amber-50 whitespace-nowrap"
      >
        {year}年
      </button>

      {/* Month Button */}
      <button
        onClick={() => {
          setShowMonthPicker(!showMonthPicker);
          setShowYearPicker(false);
        }}
        className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer hover:text-amber-700 transition-colors px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-amber-50 whitespace-nowrap"
      >
        {MONTHS_CN[month]}
      </button>

      {/* Year Picker Grid */}
      {showYearPicker && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl p-4 sm:p-5 z-50 border border-gray-200 min-w-max">
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {yearOptions.map(y => (
              <button
                key={y}
                onClick={() => {
                  onYearChange(y);
                  setShowYearPicker(false);
                }}
                className={`w-16 sm:w-20 h-16 sm:h-20 rounded-full font-semibold text-base sm:text-lg md:text-xl transition-all flex items-center justify-center ${
                  y === year
                    ? 'bg-blue-500 text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Month Picker Grid */}
      {showMonthPicker && (
        <div className="absolute top-full left-0 sm:left-auto mt-2 bg-white rounded-lg shadow-2xl p-4 sm:p-5 z-50 border border-gray-200 min-w-max">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
            {MONTHS_CN.map((m, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onMonthChange(idx);
                  setShowMonthPicker(false);
                }}
                className={`w-16 sm:w-20 h-16 sm:h-20 rounded-full font-semibold text-base sm:text-lg md:text-lg transition-all flex items-center justify-center ${
                  idx === month
                    ? 'bg-blue-500 text-white shadow-md scale-105'
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
