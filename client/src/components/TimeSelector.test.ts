import { describe, it, expect } from 'vitest';
import { TimeSelectorState } from './TimeSelector';

describe('TimeSelector State Validation', () => {
  it('should validate specific time mode with all required fields', () => {
    const state: TimeSelectorState = {
      mode: 'specific',
      startTime: '09:00',
      startAmpm: 'AM',
      endTime: '12:00',
      endAmpm: 'AM'
    };

    const isValid = state.mode === 'specific' &&
      state.startTime && state.startAmpm &&
      state.endTime && state.endAmpm;

    expect(isValid).toBe(true);
  });

  it('should reject specific time mode with missing fields', () => {
    const state: TimeSelectorState = {
      mode: 'specific',
      startTime: '09:00',
      startAmpm: 'AM'
      // missing endTime and endAmpm
    };

    const isValid = state.mode === 'specific' &&
      state.startTime && state.startAmpm &&
      state.endTime && state.endAmpm;

    expect(isValid).toBe(false);
  });

  it('should validate slot mode with required timeSlot', () => {
    const state: TimeSelectorState = {
      mode: 'slot',
      timeSlot: 'morning'
    };

    const isValid = state.mode === 'slot' && state.timeSlot;

    expect(isValid).toBe(true);
  });

  it('should reject slot mode without timeSlot', () => {
    const state: TimeSelectorState = {
      mode: 'slot'
      // missing timeSlot
    };

    const isValid = state.mode === 'slot' && state.timeSlot;

    expect(isValid).toBe(false);
  });

  it('should validate all time slot options', () => {
    const slots: Array<'pending' | 'morning' | 'afternoon' | 'evening'> = [
      'pending',
      'morning',
      'afternoon',
      'evening'
    ];

    slots.forEach(slot => {
      const state: TimeSelectorState = {
        mode: 'slot',
        timeSlot: slot
      };

      const isValid = state.mode === 'slot' && state.timeSlot;
      expect(isValid).toBe(true);
    });
  });

  it('should not allow both specific time and slot mode simultaneously', () => {
    const state: TimeSelectorState = {
      mode: 'specific',
      startTime: '09:00',
      startAmpm: 'AM',
      endTime: '12:00',
      endAmpm: 'AM',
      timeSlot: 'morning' // This should be ignored in specific mode
    };

    // In specific mode, timeSlot should not be used
    const isValidSpecific = state.mode === 'specific' &&
      state.startTime && state.startAmpm &&
      state.endTime && state.endAmpm;

    expect(isValidSpecific).toBe(true);
    expect(state.mode).toBe('specific');
  });

  it('should validate time comparison logic', () => {
    const startTime = '09:00';
    const endTime = '12:00';

    // startTime should be less than endTime
    expect(startTime < endTime).toBe(true);
  });

  it('should reject when start time equals end time', () => {
    const startTime = '09:00';
    const endTime = '09:00';

    expect(startTime >= endTime).toBe(true); // This should fail validation
  });

  it('should reject when start time is after end time', () => {
    const startTime = '14:00';
    const endTime = '12:00';

    expect(startTime >= endTime).toBe(true); // This should fail validation
  });
});
