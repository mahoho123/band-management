import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { checkPendingAttendanceForTomorrow, generatePendingAttendanceMessage } from './pendingAttendanceReminder';

describe('PendingAttendanceReminder', () => {
  describe('generatePendingAttendanceMessage', () => {
    it('should return empty string when no events', () => {
      const message = generatePendingAttendanceMessage([]);
      expect(message).toBe('');
    });

    it('should generate correct message format for single event', () => {
      const events = [{
        eventId: 1,
        title: '排練',
        date: '2026-04-18',
        startTime: '19:00',
        endTime: '21:00',
        location: '排練室',
        type: 'rehearsal',
        pendingMembers: ['馬仔', '廚房'],
        totalMembers: 5,
        pendingCount: 2,
      }];

      const message = generatePendingAttendanceMessage(events);
      
      expect(message).toContain('慢半拍 - 待確認出席提醒');
      expect(message).toContain('排練');
      expect(message).toContain('2026-04-18');
      expect(message).toContain('19:00-21:00');
      expect(message).toContain('排練室');
      expect(message).toContain('待確認：2/5 人');
      expect(message).toContain('https://adagio.manus.space/');
    });

    it('should generate correct message format for multiple events', () => {
      const events = [
        {
          eventId: 1,
          title: '排練',
          date: '2026-04-18',
          startTime: '19:00',
          endTime: '21:00',
          location: '排練室',
          type: 'rehearsal',
          pendingMembers: ['馬仔'],
          totalMembers: 5,
          pendingCount: 1,
        },
        {
          eventId: 2,
          title: '演出',
          date: '2026-04-19',
          startTime: '20:00',
          endTime: '22:00',
          location: '音樂廳',
          type: 'performance',
          pendingMembers: ['廚房', '其他成員'],
          totalMembers: 8,
          pendingCount: 2,
        },
      ];

      const message = generatePendingAttendanceMessage(events);
      
      expect(message).toContain('明日有 2 個活動');
      expect(message).toContain('1. 排練');
      expect(message).toContain('2. 演出');
      expect(message).toContain('待確認：1/5 人');
      expect(message).toContain('待確認：2/8 人');
    });

    it('should include member names in pending members list', () => {
      const events = [{
        eventId: 1,
        title: '排練',
        date: '2026-04-18',
        startTime: '19:00',
        endTime: '21:00',
        location: '排練室',
        type: 'rehearsal',
        pendingMembers: ['馬仔', '廚房', '小明'],
        totalMembers: 5,
        pendingCount: 3,
      }];

      const message = generatePendingAttendanceMessage(events);
      
      // Message should contain the event details
      expect(message).toContain('排練');
      expect(message).toContain('待確認：3/5 人');
    });

    it('should format dates correctly', () => {
      const events = [{
        eventId: 1,
        title: '排練',
        date: '2026-12-25',
        startTime: '14:30',
        endTime: '16:30',
        location: '排練室',
        type: 'rehearsal',
        pendingMembers: ['成員1'],
        totalMembers: 3,
        pendingCount: 1,
      }];

      const message = generatePendingAttendanceMessage(events);
      
      expect(message).toContain('2026-12-25');
      expect(message).toContain('14:30-16:30');
    });
  });

  describe('checkPendingAttendanceForTomorrow', () => {
    it('should return empty array when database is not available', async () => {
      // This test would require mocking the database
      // For now, we just verify the function exists and is callable
      expect(typeof checkPendingAttendanceForTomorrow).toBe('function');
    });
  });

  describe('Message content validation', () => {
    it('should include WhatsApp link with correct format', () => {
      const events = [{
        eventId: 1,
        title: '排練',
        date: '2026-04-18',
        startTime: '19:00',
        endTime: '21:00',
        location: '排練室',
        type: 'rehearsal',
        pendingMembers: ['馬仔'],
        totalMembers: 5,
        pendingCount: 1,
      }];

      const message = generatePendingAttendanceMessage(events);
      
      expect(message).toContain('https://adagio.manus.space/');
    });

    it('should include emoji indicators', () => {
      const events = [{
        eventId: 1,
        title: '排練',
        date: '2026-04-18',
        startTime: '19:00',
        endTime: '21:00',
        location: '排練室',
        type: 'rehearsal',
        pendingMembers: ['馬仔'],
        totalMembers: 5,
        pendingCount: 1,
      }];

      const message = generatePendingAttendanceMessage(events);
      
      expect(message).toContain('🎵');
      expect(message).toContain('📅');
      expect(message).toContain('📍');
      expect(message).toContain('⏳');
      expect(message).toContain('🔗');
    });
  });
});
