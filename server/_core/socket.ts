import type { Server as SocketIOServer } from "socket.io";

let globalIO: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return globalIO;
}

export function setIO(io: SocketIOServer): void {
  globalIO = io;
}
