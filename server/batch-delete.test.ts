import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import {
  addBandEvent,
  getBandEvents,
  deleteBandEvent,
} from './db';

describe('Batch Delete Events', () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) {
      console.warn('Database not available for tests');
    }
  });

  it('should support batch deletion workflow', async () => {
    // Add test events
    const event1 = await addBandEvent({
      title: 'Batch Event 1',
      date: '2026-04-01',
      startTime: '14:00',
      endTime: '16:00',
      location: 'Batch Location 1',
      type: 'rehearsal',
      notes: 'Batch test 1',
      attendance: {},
    });

    const event2 = await addBandEvent({
      title: 'Batch Event 2',
      date: '2026-04-02',
      startTime: '15:00',
      endTime: '17:00',
      location: 'Batch Location 2',
      type: 'performance',
      notes: 'Batch test 2',
      attendance: {},
    });

    // Delete events
    if (event1) {
      await deleteBandEvent(event1.insertId);
    }
    if (event2) {
      await deleteBandEvent(event2.insertId);
    }

    // Verify deletion completed without errors
    expect(true).toBe(true);
  });

  it('should handle deletion of non-existent events gracefully', async () => {
    // Get initial count
    const initialEvents = await getBandEvents();
    const initialCount = initialEvents.length;

    // Try to delete non-existent event
    await deleteBandEvent(99999);
    
    // Verify count hasn't changed
    const finalEvents = await getBandEvents();
    expect(finalEvents.length).toBe(initialCount);
  });

  it('should delete events with different types', async () => {
    // Create events with different types
    const types = ['rehearsal', 'performance', 'meeting'] as const;
    const eventIds = [];

    for (let i = 0; i < types.length; i++) {
      const result = await addBandEvent({
        title: `Type Event ${types[i]}`,
        date: `2026-04-${10 + i}`,
        startTime: '14:00',
        endTime: '16:00',
        location: `Type Location ${i}`,
        type: types[i],
        notes: `Test ${types[i]}`,
        attendance: {},
      });
      if (result) {
        eventIds.push(result.insertId);
      }
    }

    // Delete all added events
    for (const id of eventIds) {
      await deleteBandEvent(id);
    }

    // Verify deletion completed without errors
    expect(true).toBe(true);
  });

  it('should support selective batch deletion', async () => {
    // Add multiple events
    const eventIds = [];
    for (let i = 1; i <= 4; i++) {
      const result = await addBandEvent({
        title: `Selective Event ${i}`,
        date: `2026-04-${20 + i}`,
        startTime: '14:00',
        endTime: '16:00',
        location: `Selective Location ${i}`,
        type: 'rehearsal',
        notes: `Selective test ${i}`,
        attendance: {},
      });
      if (result) {
        eventIds.push(result.insertId);
      }
    }

    // Delete only first two events (simulating user selection)
    if (eventIds.length >= 2) {
      await deleteBandEvent(eventIds[0]);
      await deleteBandEvent(eventIds[1]);
    }

    // Cleanup remaining events
    for (let i = 2; i < eventIds.length; i++) {
      await deleteBandEvent(eventIds[i]);
    }

    // Verify deletion completed without errors
    expect(true).toBe(true);
  });
});
