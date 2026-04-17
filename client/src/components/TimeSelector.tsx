import React, { useState } from 'react';

export interface TimeSelectorState {
  mode: 'specific' | 'slot'; // 'specific' = 精確時間, 'slot' = 上/下午
  startTime?: string; // HH:mm format, only for 'specific' mode
  endTime?: string;   // HH:mm format, only for 'specific' mode
  timeSlot?: 'morning' | 'afternoon' | 'evening'; // only for 'slot' mode
}

interface TimeSelectorProps {
  value: TimeSelectorState;
  onChange: (state: TimeSelectorState) => void;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({ value, onChange }) => {
  const handleModeChange = (mode: 'specific' | 'slot') => {
    onChange({
      ...value,
      mode,
      // Clear the other mode's data
      ...(mode === 'specific' ? { timeSlot: undefined } : { startTime: undefined, endTime: undefined })
    });
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const handleTimeSlotChange = (slot: 'morning' | 'afternoon' | 'evening') => {
    onChange({
      ...value,
      timeSlot: slot
    });
  };

  const timeSlotLabels = {
    morning: '上午 (09:00-12:00)',
    afternoon: '下午 (14:00-17:00)',
    evening: '晚上 (19:00-21:00)'
  };

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModeChange('specific')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            value.mode === 'specific'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          精確時間
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('slot')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            value.mode === 'slot'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          上午/下午
        </button>
      </div>

      {/* Specific Time Mode */}
      {value.mode === 'specific' && (
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-gray-700 w-16">開始時間</label>
            <input
              type="time"
              value={value.startTime || ''}
              onChange={(e) => handleTimeChange('startTime', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-gray-700 w-16">結束時間</label>
            <input
              type="time"
              value={value.endTime || ''}
              onChange={(e) => handleTimeChange('endTime', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Time Slot Mode */}
      {value.mode === 'slot' && (
        <div className="space-y-2">
          {(Object.keys(timeSlotLabels) as Array<'morning' | 'afternoon' | 'evening'>).map((slot) => (
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
      )}
    </div>
  );
};
