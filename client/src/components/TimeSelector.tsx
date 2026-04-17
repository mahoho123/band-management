import React, { useState } from 'react';

export interface TimeSelectorState {
  startTime?: string | null; // HH:mm format, can be null/empty
  endTime?: string | null;   // HH:mm format, can be null/empty
  timeSlot?: 'pending' | 'morning' | 'afternoon' | 'evening'; // fallback when time is not specified
}

interface TimeSelectorProps {
  value: TimeSelectorState;
  onChange: (state: TimeSelectorState) => void;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({ value, onChange }) => {
  const hasSpecificTime = value.startTime && value.endTime;

  const handleTimeChange = (field: 'startTime' | 'endTime', newValue: string) => {
    onChange({
      ...value,
      [field]: newValue || null
    });
  };

  const handleTimeSlotChange = (slot: 'pending' | 'morning' | 'afternoon' | 'evening') => {
    onChange({
      ...value,
      timeSlot: slot
    });
  };

  const timeSlotLabels = {
    pending: '待定',
    morning: '上午 (09:00-12:00)',
    afternoon: '下午 (14:00-17:00)',
    evening: '晚上 (19:00-21:00)'
  };

  return (
    <div className="space-y-4">
      {/* Specific Time Input */}
      <div className="space-y-3">
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium text-gray-700 w-20">開始時間</label>
          <input
            type="time"
            value={value.startTime || ''}
            onChange={(e) => handleTimeChange('startTime', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="可選"
          />
          <span className="text-xs text-gray-500">可選</span>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium text-gray-700 w-20">結束時間</label>
          <input
            type="time"
            value={value.endTime || ''}
            onChange={(e) => handleTimeChange('endTime', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="可選"
          />
          <span className="text-xs text-gray-500">可選</span>
        </div>
      </div>

      {/* Time Slot Fallback */}
      <div className="border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">
          {hasSpecificTime ? '或選擇時間段（如未填具體時間）' : '選擇時間段'}
        </p>
        <div className="space-y-2">
          {(Object.keys(timeSlotLabels) as Array<'pending' | 'morning' | 'afternoon' | 'evening'>).map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => handleTimeSlotChange(slot)}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                value.timeSlot === slot
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {timeSlotLabels[slot]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <p className="text-gray-700">
          {hasSpecificTime ? (
            <>
              <span className="font-medium">具體時間：</span>
              {value.startTime} - {value.endTime}
              {value.timeSlot && <span className="ml-2 text-gray-500">（備選：{timeSlotLabels[value.timeSlot]}）</span>}
            </>
          ) : (
            <>
              <span className="font-medium">時間模式：</span>
              {value.timeSlot ? timeSlotLabels[value.timeSlot] : '未設定'}
            </>
          )}
        </p>
      </div>
    </div>
  );
};
