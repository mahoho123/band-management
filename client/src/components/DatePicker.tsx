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

// 計算下拉菜單的 fixed 定位，確保不超出屏幕
function calcDropdownStyle(triggerRef: React.RefObject<HTMLButtonElement | null>, dropdownWidth: number): React.CSSProperties {
  if (!triggerRef.current) return { top: 0, left: 0 };
  const rect = triggerRef.current.getBoundingClientRect();
  const top = rect.bottom + 4;
  const vw = window.innerWidth;
  let left = rect.left;
  // 如果右邊超出屏幕，向左移動
  if (left + dropdownWidth > vw - 8) {
    left = vw - dropdownWidth - 8;
  }
  if (left < 8) left = 8;
  return { position: 'fixed', top, left, zIndex: 9999 };
}

export function DatePicker({ year, month, yearOptions, onYearChange, onMonthChange }: DatePickerProps) {
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [yearPageIndex, setYearPageIndex] = useState(0);
  const [yearDropdownStyle, setYearDropdownStyle] = useState<React.CSSProperties>({});
  const [monthDropdownStyle, setMonthDropdownStyle] = useState<React.CSSProperties>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const yearBtnRef = useRef<HTMLButtonElement>(null);
  const monthBtnRef = useRef<HTMLButtonElement>(null);

  // 年份選擇器寬度：4列 × 約60px + padding
  const YEAR_DROPDOWN_WIDTH = 256;
  // 月份選擇器寬度：4列 × 約56px + padding
  const MONTH_DROPDOWN_WIDTH = 240;

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
    if (yearPageIndex > 0) setYearPageIndex(yearPageIndex - 1);
  };

  const handleNextYearPage = () => {
    if (yearPageIndex < totalYearPages - 1) setYearPageIndex(yearPageIndex + 1);
  };

  const openYearPicker = () => {
    setYearDropdownStyle(calcDropdownStyle(yearBtnRef, YEAR_DROPDOWN_WIDTH));
    setShowYearPicker(true);
    setShowMonthPicker(false);
  };

  const openMonthPicker = () => {
    setMonthDropdownStyle(calcDropdownStyle(monthBtnRef, MONTH_DROPDOWN_WIDTH));
    setShowMonthPicker(true);
    setShowYearPicker(false);
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2 min-w-0" ref={containerRef}>
      {/* Year Button */}
      <button
        ref={yearBtnRef}
        onClick={openYearPicker}
        className="text-sm sm:text-base md:text-lg font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer hover:text-amber-700 transition-colors px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg hover:bg-amber-50 whitespace-nowrap"
      >
        {year}年
      </button>

      {/* Month Button */}
      <button
        ref={monthBtnRef}
        onClick={openMonthPicker}
        className="text-sm sm:text-base md:text-lg font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer hover:text-amber-700 transition-colors px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg hover:bg-amber-50 whitespace-nowrap"
      >
        {MONTHS_CN[month]}
      </button>

      {/* Year Picker Grid with Pagination — fixed positioned */}
      {showYearPicker && (
        <div
          className="bg-white rounded-lg shadow-2xl border border-gray-200"
          style={{ ...yearDropdownStyle, width: YEAR_DROPDOWN_WIDTH }}
        >
          {/* Year Page Navigation */}
          <div className="flex items-center justify-between px-2 py-1.5 gap-2">
            <button
              onClick={handlePrevYearPage}
              disabled={yearPageIndex === 0}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronUp size={16} className="text-gray-600" />
            </button>
            <span className="text-xs text-gray-600 font-medium">
              {currentYearPage[0]}-{currentYearPage[currentYearPage.length - 1]}
            </span>
            <button
              onClick={handleNextYearPage}
              disabled={yearPageIndex === totalYearPages - 1}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Year Grid 4x4 */}
          <div className="grid grid-cols-4 gap-1 px-2 pb-2">
            {currentYearPage.map(y => (
              <button
                key={y}
                onClick={() => {
                  onYearChange(y);
                  setShowYearPicker(false);
                }}
                className={`h-9 rounded-full transition-all flex items-center justify-center whitespace-nowrap text-sm font-normal ${
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

      {/* Month Picker Grid — fixed positioned */}
      {showMonthPicker && (
        <div
          className="bg-white rounded-lg shadow-2xl border border-gray-200 p-2"
          style={{ ...monthDropdownStyle, width: MONTH_DROPDOWN_WIDTH }}
        >
          <div className="grid grid-cols-4 gap-1">
            {MONTHS_CN.map((m, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onMonthChange(idx);
                  setShowMonthPicker(false);
                }}
                className={`h-9 rounded-full transition-all flex items-center justify-center whitespace-nowrap text-sm font-medium ${
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
