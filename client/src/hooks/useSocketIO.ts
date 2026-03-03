import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { trpc } from '@/lib/trpc';

export function useSocketIO() {
  const socketRef = useRef<Socket | null>(null);
  const eventsQuery = trpc.band.getEvents.useQuery();
  const membersQuery = trpc.band.getMembers.useQuery();
  const holidaysQuery = trpc.band.getHolidays.useQuery();
  const systemDataQuery = trpc.band.getSystemData.useQuery();

  useEffect(() => {
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
    socket.on('event:added', () => {
      console.log('[Socket.IO] Event added, refetching...');
      eventsQuery.refetch();
    });

    socket.on('event:updated', () => {
      console.log('[Socket.IO] Event updated, refetching...');
      eventsQuery.refetch();
    });

    socket.on('event:deleted', () => {
      console.log('[Socket.IO] Event deleted, refetching...');
      eventsQuery.refetch();
    });

    // Member updates
    socket.on('member:added', () => {
      console.log('[Socket.IO] Member added, refetching...');
      membersQuery.refetch();
    });

    socket.on('member:updated', () => {
      console.log('[Socket.IO] Member updated, refetching...');
      membersQuery.refetch();
    });

    socket.on('member:deleted', () => {
      console.log('[Socket.IO] Member deleted, refetching...');
      membersQuery.refetch();
    });

    // Attendance updates
    socket.on('attendance:changed', () => {
      console.log('[Socket.IO] Attendance changed, refetching...');
      eventsQuery.refetch();
    });

    // Holiday updates
    socket.on('holiday:added', () => {
      console.log('[Socket.IO] Holiday added, refetching...');
      holidaysQuery.refetch();
    });

    // System data updates
    socket.on('system:updated', () => {
      console.log('[Socket.IO] System data updated, refetching...');
      systemDataQuery.refetch();
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [eventsQuery, membersQuery, holidaysQuery, systemDataQuery]);

  return socketRef.current;
}
