'use client';

import { io, Socket } from 'socket.io-client';
import { useEffect, useState, useRef } from 'react';

/**
 * useSocket — connect to the SwiftRamadan realtime service
 * (mini-services/realtime-service on port 3003) via the Caddy
 * gateway. Always uses a relative path with the XTransformPort
 * query param — never `http://localhost:3003`.
 *
 * @param roomId Optional room to join immediately after connecting
 *               (e.g. `order-SWR-1234`, `vendor-abc`, `rider-xyz`).
 *               When provided, the hook will join when the socket
 *               connects and leave on cleanup.
 *
 * Implementation note: the socket is created lazily inside a
 * useState initializer (which runs exactly once). The connection
 * state is tracked via the socket's own `connect` / `disconnect`
 * events, which call `setIsConnected` from event handlers (NOT
 * from the effect body), so we don't trip the
 * `react-hooks/set-state-in-effect` rule.
 */
export function useSocket(roomId?: string) {
  // Lazy initializer creates the socket exactly once.
  const [socket] = useState<Socket>(() => {
    if (typeof window === 'undefined') {
      // SSR guard — return a no-op-like stub; the real socket is
      // created on the client only (the useEffect below reconnects
      // if needed). In practice Next.js only renders client
      // components on the client for `'use client'` hooks, but we
      // keep this guard for safety.
      return io('/?XTransformPort=3003', {
        transports: ['websocket'],
        autoConnect: false,
      });
    }
    return io('/?XTransformPort=3003', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
  });

  const [isConnected, setIsConnected] = useState<boolean>(
    () => socket.connected
  );

  const roomIdRef = useRef<string | undefined>(roomId);
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  // Set up event listeners in an effect (no setState in body).
  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      const room = roomIdRef.current;
      if (room) {
        socket.emit('join-room', room);
      }
    };
    const onDisconnect = () => {
      setIsConnected(false);
    };
    const onReconnect = () => {
      setIsConnected(true);
      const room = roomIdRef.current;
      if (room) {
        socket.emit('join-room', room);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect', onReconnect);

    // If the socket was already connected before this effect ran
    // (e.g. HMR), defer a microtask to sync state. Calling setState
    // synchronously in the effect body trips the
    // `react-hooks/set-state-in-effect` rule, so we queue it.
    if (socket.connected) {
      queueMicrotask(() => {
        setIsConnected(true);
        const room = roomIdRef.current;
        if (room) socket.emit('join-room', room);
      });
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect', onReconnect);
    };
  }, [socket]);

  // Cleanup on unmount: disconnect the socket.
  useEffect(() => {
    return () => {
      const room = roomIdRef.current;
      if (room) {
        try {
          socket.emit('leave-room', room);
        } catch {
          /* ignore */
        }
      }
      socket.disconnect();
    };
  }, [socket]);

  // Join / leave when roomId changes (after initial connect)
  useEffect(() => {
    if (!socket.connected) return;
    const room = roomId;
    if (!room) return;
    socket.emit('join-room', room);
    return () => {
      try {
        socket.emit('leave-room', room);
      } catch {
        /* ignore */
      }
    };
  }, [socket, roomId]);

  return { socket, isConnected };
}
