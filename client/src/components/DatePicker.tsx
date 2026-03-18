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
  return (
    <div className="w-full flex flex-col gap-4 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg sm:rounded-xl border border-amber-200">
      {/* Year Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">選擇年份</label>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {yearOptions.map(y => (
            <button
              key={y}
              onClick={() => onYearChange(y)}
              className={`px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                y === year
                  ? 'bg-gradient-to-br from-[#F4D03F] to-[#D4A017] text-white shadow-md scale-105'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-amber-300'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">選擇月份</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {MONTHS_CN.map((m, idx) => (
            <button
              key={idx}
              onClick={() => onMonthChange(idx)}
              className={`px-2 sm:px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                idx === month
                  ? 'bg-gradient-to-br from-[#F4D03F] to-[#D4A017] text-white shadow-md scale-105'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-amber-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Display Current Selection */}
      <div className="text-center text-sm text-gray-600 pt-2 border-t border-amber-200">
        當前選擇: <span className="font-semibold text-amber-700">{year} 年 {MONTHS_CN[month]}</span>
      </div>
    </div>
  );
}
