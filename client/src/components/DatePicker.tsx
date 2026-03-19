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

// LOGO 色彩系統（慢半拍：金黃三角警告牌）
const logoColors = {
  // 下拉容器
  dropBg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
  dropBorder: '1.5px solid #fcd34d',
  dropShadow: '0 10px 40px rgba(0,0,0,0.15)',
  // 普通按鈕
  btnBg: '#fef9c3',
  btnColor: '#78350f',
  btnBorder: '1px solid #fde68a',
  // hover 狀態
  btnHoverBg: '#fde68a',
  btnHoverBorder: '#fcd34d',
  // 選中按鈕
  selectedBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  selectedColor: '#fff',
  selectedBorder: '1.5px solid #b45309',
  selectedShadow: '0 2px 6px rgba(217,119,6,0.4)',
  // 分頁導航
  navColor: '#92400e',
  navHoverBg: '#fde68a',
  rangeColor: '#92400e',
  dividerColor: '#fde68a',
};

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

  const YEAR_W = 264;
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
        className="text-sm sm:text-base font-bold border-none outline-none cursor-pointer px-1.5 py-1 rounded-lg whitespace-nowrap"
        style={{ color: '#92400e', background: 'transparent', transition: 'background 0.05s' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#fef3c7')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {year}年
      </button>

      {/* Month Button */}
      <button
        ref={monthBtnRef}
        onClick={openMonth}
        className="text-sm sm:text-base font-bold border-none outline-none cursor-pointer px-1.5 py-1 rounded-lg whitespace-nowrap"
        style={{ color: '#92400e', background: 'transparent', transition: 'background 0.05s' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#fef3c7')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {MONTHS_CN[month]}
      </button>

      {/* Year Picker Portal */}
      {showYearPicker && createPortal(
        <div
          ref={yearDropRef}
          style={{
            position: 'absolute',
            top: yearPos.top,
            left: yearPos.left,
            width: YEAR_W,
            zIndex: 99999,
            background: logoColors.dropBg,
            border: logoColors.dropBorder,
            borderRadius: '12px',
            boxShadow: logoColors.dropShadow,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px solid ${logoColors.dividerColor}` }}>
            <button
              onClick={() => yearPageIndex > 0 && setYearPageIndex(yearPageIndex - 1)}
              disabled={yearPageIndex === 0}
              style={{ padding: '4px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: logoColors.navColor, opacity: yearPageIndex === 0 ? 0.4 : 1 }}
              onMouseEnter={e => (e.currentTarget.style.background = logoColors.navHoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <ChevronUp size={16} />
            </button>
            <span style={{ fontSize: '12px', fontWeight: 600, color: logoColors.rangeColor }}>
              {currentYearPage[0]}–{currentYearPage[currentYearPage.length - 1]}
            </span>
            <button
              onClick={() => yearPageIndex < totalYearPages - 1 && setYearPageIndex(yearPageIndex + 1)}
              disabled={yearPageIndex === totalYearPages - 1}
              style={{ padding: '4px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: logoColors.navColor, opacity: yearPageIndex === totalYearPages - 1 ? 0.4 : 1 }}
              onMouseEnter={e => (e.currentTarget.style.background = logoColors.navHoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <ChevronDown size={16} />
            </button>
          </div>
          {/* Year Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '8px 12px 12px' }}>
            {currentYearPage.map(y => (
              <button
                key={y}
                onClick={() => { onYearChange(y); setShowYearPicker(false); }}
                style={y === year ? {
                  height: '36px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                  whiteSpace: 'nowrap', cursor: 'pointer', border: logoColors.selectedBorder,
                  background: logoColors.selectedBg, color: logoColors.selectedColor,
                  boxShadow: logoColors.selectedShadow, transition: 'all 0.05s',
                } : {
                  height: '36px', borderRadius: '8px', fontSize: '13px', fontWeight: 400,
                  whiteSpace: 'nowrap', cursor: 'pointer', border: logoColors.btnBorder,
                  background: logoColors.btnBg, color: logoColors.btnColor,
                  transition: 'all 0.05s',
                }}
                onMouseEnter={e => {
                  if (y !== year) {
                    e.currentTarget.style.background = logoColors.btnHoverBg;
                    e.currentTarget.style.borderColor = logoColors.btnHoverBorder;
                  }
                }}
                onMouseLeave={e => {
                  if (y !== year) {
                    e.currentTarget.style.background = logoColors.btnBg;
                    e.currentTarget.style.borderColor = '#fde68a';
                  }
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* Month Picker Portal */}
      {showMonthPicker && createPortal(
        <div
          ref={monthDropRef}
          style={{
            position: 'absolute',
            top: monthPos.top,
            left: monthPos.left,
            width: MONTH_W,
            zIndex: 99999,
            background: logoColors.dropBg,
            border: logoColors.dropBorder,
            borderRadius: '12px',
            padding: '12px',
            boxShadow: logoColors.dropShadow,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {MONTHS_CN.map((m, idx) => (
              <button
                key={idx}
                onClick={() => { onMonthChange(idx); setShowMonthPicker(false); }}
                style={idx === month ? {
                  height: '36px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                  whiteSpace: 'nowrap', cursor: 'pointer', border: logoColors.selectedBorder,
                  background: logoColors.selectedBg, color: logoColors.selectedColor,
                  boxShadow: logoColors.selectedShadow, transition: 'all 0.05s',
                } : {
                  height: '36px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  whiteSpace: 'nowrap', cursor: 'pointer', border: logoColors.btnBorder,
                  background: logoColors.btnBg, color: logoColors.btnColor,
                  transition: 'all 0.05s',
                }}
                onMouseEnter={e => {
                  if (idx !== month) {
                    e.currentTarget.style.background = logoColors.btnHoverBg;
                    e.currentTarget.style.borderColor = logoColors.btnHoverBorder;
                  }
                }}
                onMouseLeave={e => {
                  if (idx !== month) {
                    e.currentTarget.style.background = logoColors.btnBg;
                    e.currentTarget.style.borderColor = '#fde68a';
                  }
                }}
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
