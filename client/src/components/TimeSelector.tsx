import React from 'react';

export interface TimeSelectorState {
  startTime?: string; // HH:mm format
  startAmpm?: 'AM' | 'PM';
  endTime?: string; // HH:mm format
  endAmpm?: 'AM' | 'PM';
}

interface TimeSelectorProps {
  value: TimeSelectorState;
  onChange: (state: TimeSelectorState) => void;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({ value, onChange }) => {
  const handleTimeChange = (field: 'startTime' | 'startAmpm' | 'endTime' | 'endAmpm', newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const isValid = value.startTime && value.startAmpm && value.endTime && value.endAmpm;

  return (
    <div className="space-y-4">
      {/* Start Time */}
      <div className="space-y-2">
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
              handleTimeChange('startTime', `${hour}:${minute}`);
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
              handleTimeChange('startTime', `${hour}:${minute}`);
            }}
            placeholder="分"
            className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-700">分</span>
          <select
            value={value.startAmpm || 'AM'}
            onChange={(e) => handleTimeChange('startAmpm', e.target.value as 'AM' | 'PM')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="AM">上午</option>
            <option value="PM">下午</option>
          </select>
        </div>
      </div>

      {/* End Time */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">結束時間（必填）</p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min="1"
            max="12"
            value={value.endTime ? parseInt(value.endTime.split(':')[0]) % 12 || 12 : ''}
            onChange={(e) => {
              const hour = parseInt(e.target.value) || 0;
              const minute = value.endTime ? value.endTime.split(':')[1] : '00';
              handleTimeChange('endTime', `${hour}:${minute}`);
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
              handleTimeChange('endTime', `${hour}:${minute}`);
            }}
            placeholder="分"
            className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-700">分</span>
          <select
            value={value.endAmpm || 'AM'}
            onChange={(e) => handleTimeChange('endAmpm', e.target.value as 'AM' | 'PM')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="AM">上午</option>
            <option value="PM">下午</option>
          </select>
        </div>
      </div>

      {/* Validation Status */}
      <div className={`p-3 rounded-lg text-sm ${
        isValid
          ? 'bg-green-50 border border-green-200 text-green-700'
          : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
      }`}>
        {isValid ? (
          <p>✓ 時間已設定：{value.startTime} {value.startAmpm} - {value.endTime} {value.endAmpm}</p>
        ) : (
          <p>⚠️ 請填寫開始時間和結束時間</p>
        )}
      </div>
    </div>
  );
};
