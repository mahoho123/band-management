import React, { useState } from 'react';

export interface TimeSelectorState {
  mode: 'specific' | 'slot'; // Must choose one mode
  // Mode A: Specific Time
  startTime?: string; // HH:mm format, required if mode='specific'
  startAmpm?: 'AM' | 'PM'; // required if mode='specific'
  endTime?: string; // HH:mm format, required if mode='specific'
  endAmpm?: 'AM' | 'PM'; // required if mode='specific'
  // Mode B: Time Slot
  timeSlot?: 'pending' | 'morning' | 'afternoon' | 'evening'; // required if mode='slot'
}

interface TimeSelectorProps {
  value: TimeSelectorState;
  onChange: (state: TimeSelectorState) => void;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({ value, onChange }) => {
  const mode = value.mode || 'slot'; // default to slot mode

  const handleModeChange = (newMode: 'specific' | 'slot') => {
    onChange({
      mode: newMode,
      // Clear the other mode's data
      ...(newMode === 'specific' ? { timeSlot: undefined } : {
        startTime: undefined,
        startAmpm: undefined,
        endTime: undefined,
        endAmpm: undefined
      })
    });
  };

  const handleSpecificTimeChange = (field: 'startTime' | 'startAmpm' | 'endTime' | 'endAmpm', newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
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
    morning: '上午',
    afternoon: '下午',
    evening: '晚上'
  };

  const isSpecificTimeValid = mode === 'specific' && 
    value.startTime && value.startAmpm && value.endTime && value.endAmpm;
  
  const isSlotTimeValid = mode === 'slot' && value.timeSlot;

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModeChange('specific')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'specific'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          填具體時間
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('slot')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'slot'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          選時間段
        </button>
      </div>

      {/* Mode A: Specific Time */}
      {mode === 'specific' && (
        <div className="space-y-3 border border-blue-300 rounded-lg p-4 bg-blue-50">
          <p className="text-sm font-medium text-gray-700">開始時間（必填）</p>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              max="12"
              value={value.startTime ? parseInt(value.startTime.split(':')[0]) % 12 || 12 : ''}
              onChange={(e) => {
                const hour = parseInt(e.target.value) || 0;
                const minute = value.startTime ? value.startTime.split(':')[1] : '00';
                handleSpecificTimeChange('startTime', `${hour}:${minute}`);
              }}
              placeholder="時"
              className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-700">時</span>
            <input
              type="number"
              min="0"
              max="59"
              value={value.startTime ? value.startTime.split(':')[1] : ''}
              onChange={(e) => {
                const hour = value.startTime ? value.startTime.split(':')[0] : '1';
                const minute = String(parseInt(e.target.value) || 0).padStart(2, '0');
                handleSpecificTimeChange('startTime', `${hour}:${minute}`);
              }}
              placeholder="分"
              className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-700">分</span>
            <select
              value={value.startAmpm || 'AM'}
              onChange={(e) => handleSpecificTimeChange('startAmpm', e.target.value as 'AM' | 'PM')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="AM">上午</option>
              <option value="PM">下午</option>
            </select>
          </div>

          <p className="text-sm font-medium text-gray-700 mt-3">結束時間（必填）</p>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              max="12"
              value={value.endTime ? parseInt(value.endTime.split(':')[0]) % 12 || 12 : ''}
              onChange={(e) => {
                const hour = parseInt(e.target.value) || 0;
                const minute = value.endTime ? value.endTime.split(':')[1] : '00';
                handleSpecificTimeChange('endTime', `${hour}:${minute}`);
              }}
              placeholder="時"
              className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-700">時</span>
            <input
              type="number"
              min="0"
              max="59"
              value={value.endTime ? value.endTime.split(':')[1] : ''}
              onChange={(e) => {
                const hour = value.endTime ? value.endTime.split(':')[0] : '1';
                const minute = String(parseInt(e.target.value) || 0).padStart(2, '0');
                handleSpecificTimeChange('endTime', `${hour}:${minute}`);
              }}
              placeholder="分"
              className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-700">分</span>
            <select
              value={value.endAmpm || 'AM'}
              onChange={(e) => handleSpecificTimeChange('endAmpm', e.target.value as 'AM' | 'PM')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="AM">上午</option>
              <option value="PM">下午</option>
            </select>
          </div>

          {!isSpecificTimeValid && (
            <p className="text-xs text-red-600 mt-2">⚠️ 開始時間和結束時間都必須填寫</p>
          )}
        </div>
      )}

      {/* Mode B: Time Slot */}
      {mode === 'slot' && (
        <div className="space-y-3 border border-blue-300 rounded-lg p-4 bg-blue-50">
          <p className="text-sm font-medium text-gray-700">選擇時間段（必選其一）</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(timeSlotLabels) as Array<'pending' | 'morning' | 'afternoon' | 'evening'>).map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => handleTimeSlotChange(slot)}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  value.timeSlot === slot
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {timeSlotLabels[slot]}
              </button>
            ))}
          </div>

          {!isSlotTimeValid && (
            <p className="text-xs text-red-600 mt-2">⚠️ 必須選擇一個時間段</p>
          )}
        </div>
      )}

      {/* Validation Status */}
      <div className={`p-3 rounded-lg text-sm ${
        (mode === 'specific' && isSpecificTimeValid) || (mode === 'slot' && isSlotTimeValid)
          ? 'bg-green-50 border border-green-200 text-green-700'
          : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
      }`}>
        {mode === 'specific' && isSpecificTimeValid && (
          <p>✓ 具體時間已設定：{value.startTime} {value.startAmpm} - {value.endTime} {value.endAmpm}</p>
        )}
        {mode === 'slot' && isSlotTimeValid && (
          <p>✓ 時間段已設定：{timeSlotLabels[value.timeSlot!]}</p>
        )}
        {!((mode === 'specific' && isSpecificTimeValid) || (mode === 'slot' && isSlotTimeValid)) && (
          <p>⚠️ 請完成時間設定</p>
        )}
      </div>
    </div>
  );
};
