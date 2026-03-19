import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface DatePickerProps {
  year: number;
  month: number;
  yearOptions: number[];
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

const MONTHS_CN = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

interface DropdownPos {
  top: number;
  left: number;
}

function getDropdownPos(btnEl: HTMLButtonElement, dropW: number): DropdownPos {
  const r = btnEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const top = r.bottom + window.scrollY + 4;
  let left = r.left + window.scrollX;
  if (left + dropW > vw - 8) {
    left = vw - dropW - 8;
  }
  if (left < 8) left = 8;
  return { top, left };
}

export function DatePicker({ year, month, yearOptions, onYearChange, onMonthChange }: DatePickerProps) {
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [yearPageIndex, setYearPageIndex] = useState(0);
  const [yearPos, setYearPos] = useState<DropdownPos>({ top: 0, left: 0 });
  const [monthPos, setMonthPos] = useState<DropdownPos>({ top: 0, left: 0 });

  const yearBtnRef = useRef<HTMLButtonElement>(null);
  const monthBtnRef = useRef<HTMLButtonElement>(null);
  const yearDropRef = useRef<HTMLDivElement>(null);
  const monthDropRef = useRef<HTMLDivElement>(null);

  // 每個按鈕寬度約 56px，4列 + gap + padding = 約 260px
  const YEAR_W = 264;
  // 月份最長「十一月」約 44px，4列 + gap + padding = 約 240px
  const MONTH_W = 248;

  const yearPages = useMemo(() => {
    const pages: number[][] = [];
    for (let i = 0; i < yearOptions.length; i += 16) {
      pages.push(yearOptions.slice(i, i + 16));
    }
    return pages;
  }, [yearOptions]);

  const currentYearPage = yearPages[yearPageIndex] || [];
  const totalYearPages = yearPages.length;

  // Close on outside click
  useEffect(() => {
    if (!showYearPicker && !showMonthPicker) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      const inYear = yearBtnRef.current?.contains(t) || yearDropRef.current?.contains(t);
      const inMonth = monthBtnRef.current?.contains(t) || monthDropRef.current?.contains(t);
      if (!inYear && !inMonth) {
        setShowYearPicker(false);
        setShowMonthPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showYearPicker, showMonthPicker]);

  const openYear = () => {
    if (yearBtnRef.current) setYearPos(getDropdownPos(yearBtnRef.current, YEAR_W));
    setShowYearPicker(v => !v);
    setShowMonthPicker(false);
  };

  const openMonth = () => {
    if (monthBtnRef.current) setMonthPos(getDropdownPos(monthBtnRef.current, MONTH_W));
    setShowMonthPicker(v => !v);
    setShowYearPicker(false);
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
      {/* Year Button */}
      <button
        ref={yearBtnRef}
        onClick={openYear}
        className="text-sm sm:text-base font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer hover:text-amber-700 transition-colors px-1.5 py-1 rounded-lg hover:bg-amber-50 whitespace-nowrap"
      >
        {year}年
      </button>

      {/* Month Button */}
      <button
        ref={monthBtnRef}
        onClick={openMonth}
        className="text-sm sm:text-base font-bold text-gray-800 bg-transparent border-none outline-none cursor-pointer hover:text-amber-700 transition-colors px-1.5 py-1 rounded-lg hover:bg-amber-50 whitespace-nowrap"
      >
        {MONTHS_CN[month]}
      </button>

      {/* Year Picker — rendered via Portal to body */}
      {showYearPicker && createPortal(
        <div
          ref={yearDropRef}
          style={{
            position: 'absolute',
            top: yearPos.top,
            left: yearPos.left,
            width: YEAR_W,
            zIndex: 99999,
          }}
          className="bg-white rounded-xl shadow-2xl border border-gray-200"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <button
              onClick={() => yearPageIndex > 0 && setYearPageIndex(yearPageIndex - 1)}
              disabled={yearPageIndex === 0}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-40 transition-colors"
            >
              <ChevronUp size={16} className="text-gray-600" />
            </button>
            <span className="text-xs text-gray-500 font-medium">
              {currentYearPage[0]}–{currentYearPage[currentYearPage.length - 1]}
            </span>
            <button
              onClick={() => yearPageIndex < totalYearPages - 1 && setYearPageIndex(yearPageIndex + 1)}
              disabled={yearPageIndex === totalYearPages - 1}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-40 transition-colors"
            >
              <ChevronDown size={16} className="text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
            {currentYearPage.map(y => (
              <button
                key={y}
                onClick={() => { onYearChange(y); setShowYearPicker(false); }}
                className={`h-9 rounded-lg text-sm font-normal whitespace-nowrap transition-all ${
                  y === year
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* Month Picker — rendered via Portal to body */}
      {showMonthPicker && createPortal(
        <div
          ref={monthDropRef}
          style={{
            position: 'absolute',
            top: monthPos.top,
            left: monthPos.left,
            width: MONTH_W,
            zIndex: 99999,
          }}
          className="bg-white rounded-xl shadow-2xl border border-gray-200 p-3"
        >
          <div className="grid grid-cols-4 gap-1.5">
            {MONTHS_CN.map((m, idx) => (
              <button
                key={idx}
                onClick={() => { onMonthChange(idx); setShowMonthPicker(false); }}
                className={`h-9 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  idx === month
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
