import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { trpc } from '@/lib/trpc';

export function useSocketIO() {
  const socketRef = useRef<Socket | null>(null);
  const eventsQuery = trpc.band.getEvents.useQuery();
  const membersQuery = trpc.band.getMembers.useQuery();
  const holidaysQuery = trpc.band.getHolidays.useQuery();
  const systemDataQuery = trpc.band.getSystemData.useQuery();

  // Use useCallback to create stable handler functions
  const handleEventAdded = useCallback(() => {
    console.log('[Socket.IO] Event added, refetching...');
    eventsQuery.refetch();
  }, [eventsQuery]);

  const handleEventUpdated = useCallback(() => {
    console.log('[Socket.IO] Event updated, refetching...');
    eventsQuery.refetch();
  }, [eventsQuery]);

  const handleEventDeleted = useCallback(() => {
    console.log('[Socket.IO] Event deleted, refetching...');
    eventsQuery.refetch();
  }, [eventsQuery]);

  const handleMemberAdded = useCallback(() => {
    console.log('[Socket.IO] Member added, refetching...');
    membersQuery.refetch();
  }, [membersQuery]);

  const handleMemberUpdated = useCallback(() => {
    console.log('[Socket.IO] Member updated, refetching...');
    membersQuery.refetch();
  }, [membersQuery]);

  const handleMemberDeleted = useCallback(() => {
    console.log('[Socket.IO] Member deleted, refetching...');
    membersQuery.refetch();
  }, [membersQuery]);

  const handleAttendanceChanged = useCallback(() => {
    console.log('[Socket.IO] Attendance changed, refetching...');
    eventsQuery.refetch();
  }, [eventsQuery]);

  const handleHolidayAdded = useCallback(() => {
    console.log('[Socket.IO] Holiday added, refetching...');
    holidaysQuery.refetch();
  }, [holidaysQuery]);

  const handleSystemUpdated = useCallback(() => {
    console.log('[Socket.IO] System data updated, refetching...');
    systemDataQuery.refetch();
  }, [systemDataQuery]);

  useEffect(() => {
    // Only connect if not already connected
    if (socketRef.current?.connected) {
      return;
    }

    // Connect to Socket.IO server
    const socket = io(window.location.origin, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Listen for real-time events
    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket.id);
    });

    // Event updates
    socket.on('event:added', handleEventAdded);
    socket.on('event:updated', handleEventUpdated);
    socket.on('event:deleted', handleEventDeleted);

    // Member updates
    socket.on('member:added', handleMemberAdded);
    socket.on('member:updated', handleMemberUpdated);
    socket.on('member:deleted', handleMemberDeleted);

    // Attendance updates
    socket.on('attendance:changed', handleAttendanceChanged);

    // Holiday updates
    socket.on('holiday:added', handleHolidayAdded);

    // System data updates
    socket.on('system:updated', handleSystemUpdated);

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected');
    });

    return () => {
      socket.off('event:added', handleEventAdded);
      socket.off('event:updated', handleEventUpdated);
      socket.off('event:deleted', handleEventDeleted);
      socket.off('member:added', handleMemberAdded);
      socket.off('member:updated', handleMemberUpdated);
      socket.off('member:deleted', handleMemberDeleted);
      socket.off('attendance:changed', handleAttendanceChanged);
      socket.off('holiday:added', handleHolidayAdded);
      socket.off('system:updated', handleSystemUpdated);
      socket.disconnect();
    };
  }, [
    handleEventAdded,
    handleEventUpdated,
    handleEventDeleted,
    handleMemberAdded,
    handleMemberUpdated,
    handleMemberDeleted,
    handleAttendanceChanged,
    handleHolidayAdded,
    handleSystemUpdated,
  ]);

  return socketRef.current;
}
