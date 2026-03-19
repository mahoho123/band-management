import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

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
  const [yearPageIndex, setYearPageIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 計算年份分頁（每頁 16 個年份，4x4 網格）
  const yearPages = useMemo(() => {
    const pages: number[][] = [];
    for (let i = 0; i < yearOptions.length; i += 16) {
      pages.push(yearOptions.slice(i, i + 16));
    }
    return pages;
  }, [yearOptions]);

  const currentYearPage = yearPages[yearPageIndex] || [];
  const totalYearPages = yearPages.length;

  // Click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowMonthPicker(false);
        setShowYearPicker(false);
      }
    };

    if (showMonthPicker || showYearPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMonthPicker, showYearPicker]);

  const handlePrevYearPage = () => {
    if (yearPageIndex > 0) {
      setYearPageIndex(yearPageIndex - 1);
    }
  };

  const handleNextYearPage = () => {
    if (yearPageIndex < totalYearPages - 1) {
      setYearPageIndex(yearPageIndex + 1);
    }
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2 min-w-0 relative" ref={containerRef}>
      {/* Year Button */}
      <button
        onClick={() => {
          setShowYearPicker(!showYearPicker);
          setShowMonthPicker(false);
        }}
        className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer hover:text-amber-700 transition-colors px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg hover:bg-amber-50 whitespace-nowrap"
      >
        {year}年
      </button>

      {/* Month Button */}
      <button
        onClick={() => {
          setShowMonthPicker(!showMonthPicker);
          setShowYearPicker(false);
        }}
        className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer hover:text-amber-700 transition-colors px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg hover:bg-amber-50 whitespace-nowrap"
      >
        {MONTHS_CN[month]}
      </button>

      {/* Year Picker Grid with Pagination */}
      {showYearPicker && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 bg-white rounded-lg shadow-2xl p-1 sm:p-2 z-50 border border-gray-200 w-80 sm:w-96">
          {/* Year Page Navigation */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <button
              onClick={handlePrevYearPage}
              disabled={yearPageIndex === 0}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronUp size={20} className="text-gray-600" />
            </button>
            <span className="text-xs sm:text-sm text-gray-600 font-medium">
              {currentYearPage[0]}-{currentYearPage[currentYearPage.length - 1]}
            </span>
            <button
              onClick={handleNextYearPage}
              disabled={yearPageIndex === totalYearPages - 1}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Year Grid 4x4 */}
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
            {currentYearPage.map(y => (
              <button
                key={y}
                onClick={() => {
                  onYearChange(y);
                  setShowYearPicker(false);
                }}
                className={`w-10 sm:w-12 md:w-14 h-11 sm:h-12 md:h-14 rounded-full transition-all flex items-center justify-center year-picker-text text-base sm:text-lg md:text-2xl ${
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
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 bg-white rounded-lg shadow-2xl p-1 sm:p-2 z-50 border border-gray-200 w-80 sm:w-96">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-1.5">
            {MONTHS_CN.map((m, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onMonthChange(idx);
                  setShowMonthPicker(false);
                }}
                className={`w-10 sm:w-12 md:w-14 h-11 sm:h-12 md:h-14 rounded-full transition-all flex items-center justify-center month-picker-text text-base sm:text-lg md:text-2xl ${
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
