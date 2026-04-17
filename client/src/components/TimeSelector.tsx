import React from 'react';

export interface TimeSelectorState {
  mode: 'specific' | 'slot';
  // Specific time mode (optional)
  startTime?: string; // HH:mm format
  startAmpm?: 'AM' | 'PM';
  endTime?: string; // HH:mm format
  endAmpm?: 'AM' | 'PM';
  // Slot mode (required when mode is 'slot')
  timeSlot?: 'pending' | 'morning' | 'afternoon' | 'evening';
}

interface TimeSelectorProps {
  value: TimeSelectorState;
  onChange: (state: TimeSelectorState) => void;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({ value, onChange }) => {
  const handleModeChange = (newMode: 'specific' | 'slot') => {
    onChange({
      ...value,
      mode: newMode
    });
  };

  const handleTimeChange = (field: 'startTime' | 'startAmpm' | 'endTime' | 'endAmpm', newValue: string) => {
    onChange({
      ...value,
      [field]: newValue || undefined
    });
  };

  const handleSlotChange = (slot: 'pending' | 'morning' | 'afternoon' | 'evening') => {
    onChange({
      ...value,
      mode: 'slot',
      timeSlot: slot
    });
  };

  const isSpecificTimeValid = value.startTime && value.startAmpm && value.endTime && value.endAmpm;
  const isSlotValid = value.mode === 'slot' && value.timeSlot;
  const isValid = isSpecificTimeValid || isSlotValid;

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModeChange('specific')}
          className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
            value.mode === 'specific'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          填具體時間
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('slot')}
          className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
            value.mode === 'slot'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          選時間段
        </button>
      </div>

      {/* Specific Time Mode */}
      {value.mode === 'specific' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">開始時間</p>
            <div className="flex gap-2 items-center">
              <select
                value={value.startTime ? parseInt(value.startTime.split(':')[0]) % 12 || 12 : ''}
                onChange={(e) => {
                  const hour = e.target.value;
                  const minute = value.startTime ? value.startTime.split(':')[1] : '00';
                  handleTimeChange('startTime', hour ? `${hour}:${minute}` : '');
                }}
                className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">--</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
              </select>
              <span className="text-gray-700">時</span>
              <select
                value={value.startTime ? value.startTime.split(':')[1] : ''}
                onChange={(e) => {
                  const hour = value.startTime ? value.startTime.split(':')[0] : '';
                  const minute = e.target.value;
                  handleTimeChange('startTime', hour && minute ? `${hour}:${minute}` : '');
                }}
                className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">--</option>
                {[0,15,30,45].map(m => <option key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}</option>)}
              </select>
              <span className="text-gray-700">分</span>
              <select
                value={value.startAmpm || ''}
                onChange={(e) => handleTimeChange('startAmpm', e.target.value as 'AM' | 'PM')}
                className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">--</option>
                <option value="AM">上午</option>
                <option value="PM">下午</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">結束時間</p>
            <div className="flex gap-2 items-center">
              <select
                value={value.endTime ? parseInt(value.endTime.split(':')[0]) % 12 || 12 : ''}
                onChange={(e) => {
                  const hour = e.target.value;
                  const minute = value.endTime ? value.endTime.split(':')[1] : '00';
                  handleTimeChange('endTime', hour ? `${hour}:${minute}` : '');
                }}
                className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">--</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
              </select>
              <span className="text-gray-700">時</span>
              <select
                value={value.endTime ? value.endTime.split(':')[1] : ''}
                onChange={(e) => {
                  const hour = value.endTime ? value.endTime.split(':')[0] : '';
                  const minute = e.target.value;
                  handleTimeChange('endTime', hour && minute ? `${hour}:${minute}` : '');
                }}
                className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">--</option>
                {[0,15,30,45].map(m => <option key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}</option>)}
              </select>
              <span className="text-gray-700">分</span>
              <select
                value={value.endAmpm || ''}
                onChange={(e) => handleTimeChange('endAmpm', e.target.value as 'AM' | 'PM')}
                className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">--</option>
                <option value="AM">上午</option>
                <option value="PM">下午</option>
              </select>
            </div>
          </div>

          {isSpecificTimeValid && (
            <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              ✓ 時間已設定
            </div>
          )}
        </div>
      )}

      {/* Time Slot Mode */}
      {value.mode === 'slot' && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">選擇時間段（必選其一）</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['pending', 'morning', 'afternoon', 'evening'] as const).map((slot) => {
              const labels = {
                pending: '待定',
                morning: '上午',
                afternoon: '下午',
                evening: '晚上'
              };
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => handleSlotChange(slot)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    value.timeSlot === slot
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {labels[slot]}
                </button>
              );
            })}
          </div>

          {isSlotValid && (
            <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              ✓ 時間段已選定：{value.timeSlot === 'pending' ? '待定' : value.timeSlot === 'morning' ? '上午' : value.timeSlot === 'afternoon' ? '下午' : '晚上'}
            </div>
          )}
        </div>
      )}

      {/* Overall Validation Status */}
      {!isValid && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          ⚠️ 請完成時間設定
        </div>
      )}
    </div>
  );
};
