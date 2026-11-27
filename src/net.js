(function (global) {
  const Rivals = (global.Rivals = global.Rivals || {});

  const PEER_PREFIX = 'rivals-html-room-';
  const PUBLIC_BASE_URL = 'https://nyez2016.github.io/roblox-rivals-html/';

  function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 6; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }

  function buildInviteUrl(code) {
    try {
      if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        const u = new URL(window.location.href);
        u.searchParams.set('join', code);
        return u.toString();
      }
    } catch {
      // Fallback for file://
    }
    return `${PUBLIC_BASE_URL}?join=${code}`;
  }

  class NetManager {
    constructor(callbacks = {}) {
      this.cb = callbacks;
      this.peer = null;
      this.conn = null;
      this.roomCode = '';
      this.inviteUrl = '';
      this.isHost = true;
      this.connected = false;
      this.remoteName = 'FRIEND';
      this._init();
    }

    _init() {
      const params = new URLSearchParams(window.location.search || '');
      const joinCode = (params.get('join') || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

      if (typeof global.Peer === 'undefined') {
        this.roomCode = joinCode || generateRoomCode();
        this.inviteUrl = buildInviteUrl(this.roomCode);
        this._emitReady();
        this._emitStatus('OFFLINE MODE (P2P UNAVAILABLE)', false);
        return;
      }

      if (joinCode && joinCode.length >= 4) {
        this.joinRoom(joinCode);
      } else {
        this.hostRoom();
      }
    }

    _destroyPeer() {
      if (this.conn) {
        try {
          this.conn.close();
        } catch {}
        this.conn = null;
      }
      if (this.peer) {
        try {
          this.peer.destroy();
        } catch {}
        this.peer = null;
      }
      this.connected = false;
    }

    hostRoom(preferredCode = null) {
      this._destroyPeer();
      this.isHost = true;
      this.roomCode = preferredCode || generateRoomCode();
      this.inviteUrl = buildInviteUrl(this.roomCode);
      this._emitReady();
      this._emitStatus('HOSTING · WAITING FOR FRIEND...', false);

      if (typeof global.Peer === 'undefined') return;

      try {
        this.peer = new global.Peer(PEER_PREFIX + this.roomCode, {
          debug: 0,
        });

        this.peer.on('open', () => {
          this._emitReady();
          this._emitStatus('HOST READY · SHARE LINK!', false);
        });

        this.peer.on('connection', (conn) => {
          if (this.conn && this.conn.open) {
            try {
              conn.close();
            } catch {}
            return;
          }
          this._attachConnection(conn);
        });

        this.peer.on('error', (err) => {
          if (err && err.type === 'unavailable-id') {
            this.hostRoom(generateRoomCode());
          } else {
            this._emitStatus('HOST READY (RETRYING P2P...)', false);
          }
        });
      } catch {
        this._emitStatus('OFFLINE MODE', false);
      }
    }

    joinRoom(code) {
      const clean = String(code || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      if (!clean) return;

      this._destroyPeer();
      this.isHost = false;
      this.roomCode = clean;
      this.inviteUrl = buildInviteUrl(clean);
      this._emitReady();
      this._emitStatus(`JOINING ROOM ${clean}...`, false);

      if (typeof global.Peer === 'undefined') {
        this._emitStatus('P2P LIBRARY FAILED TO LOAD', false);
        return;
      }

      try {
        this.peer = new global.Peer(undefined, { debug: 0 });
        this.peer.on('open', () => {
          const conn = this.peer.connect(PEER_PREFIX + clean, { reliable: false });
          this._attachConnection(conn);
        });
        this.peer.on('error', () => {
          this._emitStatus(`ROOM ${clean} NOT FOUND · HOSTING OWN ROOM`, false);
          setTimeout(() => {
            if (!this.connected) this.hostRoom();
          }, 1600);
        });
      } catch {
        this._emitStatus('CONNECTION FAILED', false);
      }
    }

    _attachConnection(conn) {
      this.conn = conn;
      conn.on('open', () => {
        this.connected = true;
        this._emitStatus(this.isHost ? 'FRIEND JOINED!' : `CONNECTED TO ${this.roomCode}!`, true);
        this.send({ type: 'hello', isHost: this.isHost });
        if (this.cb.onPeerConnect) this.cb.onPeerConnect(this.isHost);
      });

      conn.on('data', (data) => {
        if (!data || typeof data !== 'object') return;
        if (this.cb.onMessage) this.cb.onMessage(data);
      });

      conn.on('close', () => {
        const wasConnected = this.connected;
        this.connected = false;
        this.conn = null;
        this._emitStatus(this.isHost ? 'FRIEND LEFT · WAITING...' : 'DISCONNECTED FROM HOST', false);
        if (wasConnected && this.cb.onPeerDisconnect) this.cb.onPeerDisconnect();
      });

      conn.on('error', () => {
        this.connected = false;
      });
    }

    send(payload) {
      if (!this.conn || !this.conn.open) return false;
      try {
        this.conn.send(payload);
        return true;
      } catch {
        return false;
      }
    }

    _emitReady() {
      if (this.cb.onReady) this.cb.onReady(this.roomCode, this.inviteUrl, this.isHost);
    }

    _emitStatus(text, connected) {
      if (this.cb.onStatus) this.cb.onStatus(text, connected);
    }
  }

  Rivals.NetManager = NetManager;
})(window);
