(function (global) {
  const Rivals = (global.Rivals = global.Rivals || {});

  const PEER_PREFIX = 'rivals-priv-srv-';
  const PUBLIC_BASE_URL = 'https://nyez2016.github.io/roblox-rivals-html/';
  const RELAY_TYPES = new Set(['state', 'shot', 'pvp_hit', 'pvp_dead', 'chat', 'emote']);

  function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 6; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }

  function buildInviteUrl(code, pass = '') {
    try {
      if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        const u = new URL(window.location.href);
        u.searchParams.delete('join');
        u.searchParams.set('server', code);
        if (pass) u.searchParams.set('pin', pass);
        else u.searchParams.delete('pin');
        return u.toString();
      }
    } catch {
      // Fallback for file://
    }
    return `${PUBLIC_BASE_URL}?server=${code}${pass ? '&pin=' + encodeURIComponent(pass) : ''}`;
  }

  class NetManager {
    constructor(options = {}, callbacks = {}) {
      this.cb = callbacks;
      this.peer = null;
      this.hostConn = null;
      this.clients = new Map(); // host only: peerId -> { conn, info }
      this.players = new Map(); // all peers: playerId -> info

      this.myId = 'local_' + generateRoomCode();
      this.myName = options.playerName || 'Player_' + Math.floor(100 + Math.random() * 899);
      this.isMobile = Boolean(options.isMobile);
      this.streak = options.streak || 0;

      this.serverName = options.serverName || `${this.myName}'s Server`;
      this.serverPass = '';
      this.maxPlayers = 8;
      this.roomCode = '';
      this.inviteUrl = '';
      this.isHost = true;
      this.connected = false;
      this.nextColorIdx = 1;

      this._init();
    }

    _init() {
      const params = new URLSearchParams(window.location.search || '');
      const joinCode = (params.get('server') || params.get('join') || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      const joinPin = (params.get('pin') || '').trim();

      if (typeof global.Peer === 'undefined') {
        this.roomCode = joinCode || generateRoomCode();
        this.inviteUrl = buildInviteUrl(this.roomCode);
        this._resetLocalRoster();
        this._emitReady();
        this._emitStatus('OFFLINE MODE (P2P UNAVAILABLE)', false);
        return;
      }

      if (joinCode && joinCode.length >= 4) {
        this.joinServer(joinCode, joinPin);
      } else {
        this.createPrivateServer({
          name: this.serverName,
          pass: '',
          maxPlayers: 8,
        });
      }
    }

    setLocalProfile({ name, isMobile, streak }) {
      if (name) this.myName = String(name).trim().slice(0, 16) || this.myName;
      if (typeof isMobile === 'boolean') this.isMobile = isMobile;
      if (typeof streak === 'number') this.streak = streak;

      const me = this.players.get(this.myId);
      if (me) {
        me.name = this.myName;
        me.isMobile = this.isMobile;
        me.streak = this.streak;
      }
      if (this.isHost) {
        this._broadcastRoster();
      } else {
        this.sendToHost({
          type: 'profile_update',
          name: this.myName,
          isMobile: this.isMobile,
          streak: this.streak,
        });
      }
      this._emitRoster();
    }

    _destroyPeer() {
      for (const entry of this.clients.values()) {
        try {
          entry.conn.close();
        } catch {}
      }
      this.clients.clear();

      if (this.hostConn) {
        try {
          this.hostConn.close();
        } catch {}
        this.hostConn = null;
      }
      if (this.peer) {
        try {
          this.peer.destroy();
        } catch {}
        this.peer = null;
      }
      this.players.clear();
      this.connected = false;
    }

    _resetLocalRoster() {
      this.players.clear();
      this.players.set(this.myId, {
        id: this.myId,
        name: this.myName,
        isHost: this.isHost,
        isMobile: this.isMobile,
        streak: this.streak,
        colorIdx: 0,
      });
      this._emitRoster();
    }

    createPrivateServer(opts = {}) {
      this._destroyPeer();
      this.isHost = true;
      this.serverName = (opts.name || `${this.myName}'s Server`).trim().slice(0, 26) || 'Private Server';
      this.serverPass = (opts.pass || '').trim().slice(0, 12);
      this.maxPlayers = Math.max(2, Math.min(8, parseInt(opts.maxPlayers, 10) || 8));
      this.roomCode = (opts.code || generateRoomCode()).toUpperCase().replace(/[^A-Z0-9]/g, '');
      this.inviteUrl = buildInviteUrl(this.roomCode, this.serverPass);
      this.nextColorIdx = 1;

      this.myId = PEER_PREFIX + this.roomCode;
      this._resetLocalRoster();
      this._emitReady();
      this._emitStatus('PRIVATE SERVER READY · INVITE FRIENDS!', false);

      if (typeof global.Peer === 'undefined') return;

      try {
        this.peer = new global.Peer(PEER_PREFIX + this.roomCode, { debug: 0 });

        this.peer.on('open', (id) => {
          this.myId = id;
          this._resetLocalRoster();
          this._emitReady();
          this._emitStatus('PRIVATE SERVER LIVE · SHARE LINK!', false);
        });

        this.peer.on('connection', (conn) => {
          this._handleIncomingClient(conn);
        });

        this.peer.on('error', (err) => {
          if (err && err.type === 'unavailable-id') {
            this.createPrivateServer({
              name: this.serverName,
              pass: this.serverPass,
              maxPlayers: this.maxPlayers,
              code: generateRoomCode(),
            });
          } else {
            this._emitStatus('SERVER ONLINE (P2P RECONNECTING...)', this.clients.size > 0);
          }
        });
      } catch {
        this._emitStatus('OFFLINE MODE', false);
      }
    }

    joinServer(code, pass = '') {
      const clean = String(code || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      if (!clean) return;

      this._destroyPeer();
      this.isHost = false;
      this.roomCode = clean;
      this.serverPass = String(pass || '').trim();
      this.inviteUrl = buildInviteUrl(clean, this.serverPass);
      this._emitReady();
      this._emitStatus(`JOINING PRIVATE SERVER ${clean}...`, false);

      if (typeof global.Peer === 'undefined') {
        this._emitStatus('P2P LIBRARY FAILED TO LOAD', false);
        return;
      }

      try {
        this.peer = new global.Peer(undefined, { debug: 0 });
        this.peer.on('open', (id) => {
          this.myId = id;
          const conn = this.peer.connect(PEER_PREFIX + clean, { reliable: true });
          this.hostConn = conn;

          conn.on('open', () => {
            conn.send({
              type: 'join_req',
              name: this.myName,
              pass: this.serverPass,
              isMobile: this.isMobile,
              streak: this.streak,
            });
          });

          conn.on('data', (data) => {
            if (!data || typeof data !== 'object') return;
            this._handleHostPacket(data);
          });

          conn.on('close', () => {
            const wasConn = this.connected;
            this.connected = false;
            this.hostConn = null;
            this.players.clear();
            this._emitRoster();
            this._emitStatus('LEFT PRIVATE SERVER', false);
            if (wasConn && this.cb.onDisconnect) this.cb.onDisconnect();
          });

          conn.on('error', () => {
            this.connected = false;
          });
        });

        this.peer.on('error', () => {
          this._emitStatus(`SERVER ${clean} NOT FOUND · CREATING YOUR OWN`, false);
          setTimeout(() => {
            if (!this.connected) {
              this.createPrivateServer({ name: `${this.myName}'s Server`, pass: '', maxPlayers: 8 });
            }
          }, 1800);
        });
      } catch {
        this._emitStatus('JOIN FAILED', false);
      }
    }

    _handleIncomingClient(conn) {
      const peerId = conn.peer;

      conn.on('data', (data) => {
        if (!data || typeof data !== 'object') return;

        if (data.type === 'join_req') {
          if (this.clients.size + 1 >= this.maxPlayers) {
            conn.send({ type: 'join_denied', reason: 'PRIVATE SERVER IS FULL' });
            setTimeout(() => conn.close(), 200);
            return;
          }
          if (this.serverPass && String(data.pass || '').trim() !== this.serverPass) {
            conn.send({ type: 'join_denied', reason: 'INCORRECT SERVER PIN' });
            setTimeout(() => conn.close(), 200);
            return;
          }

          const info = {
            id: peerId,
            name: String(data.name || 'Friend').trim().slice(0, 16) || 'Friend',
            isHost: false,
            isMobile: Boolean(data.isMobile),
            streak: Number(data.streak) || 0,
            colorIdx: this.nextColorIdx++,
          };
          this.clients.set(peerId, { conn, info });
          this.players.set(peerId, info);
          this.connected = this.clients.size > 0;

          conn.send({
            type: 'join_ok',
            hostId: this.myId,
            yourId: peerId,
            serverName: this.serverName,
            maxPlayers: this.maxPlayers,
          });
          this._broadcastRoster();
          this._emitStatus(`${this.players.size}/${this.maxPlayers} IN PRIVATE SERVER`, true);
          if (this.cb.onPeerJoin) this.cb.onPeerJoin(info);
          return;
        }

        if (!this.clients.has(peerId)) return;

        if (data.type === 'profile_update') {
          const info = this.players.get(peerId);
          if (info) {
            if (data.name) info.name = String(data.name).trim().slice(0, 16);
            if (typeof data.isMobile === 'boolean') info.isMobile = data.isMobile;
            if (typeof data.streak === 'number') info.streak = data.streak;
            this._broadcastRoster();
          }
          return;
        }

        data.from = peerId;

        // Route targeted packet OR relay broadcast to all other friends!
        if (data.to) {
          if (data.to === this.myId) {
            if (this.cb.onMessage) this.cb.onMessage(data);
          } else {
            const target = this.clients.get(data.to);
            if (target && target.conn.open) {
              try {
                target.conn.send(data);
              } catch {}
            }
          }
          return;
        }

        if (RELAY_TYPES.has(data.type)) {
          for (const [otherId, entry] of this.clients.entries()) {
            if (otherId !== peerId && entry.conn.open) {
              try {
                entry.conn.send(data);
              } catch {}
            }
          }
        }
        if (this.cb.onMessage) this.cb.onMessage(data);
      });

      const removeClient = () => {
        const entry = this.clients.get(peerId);
        if (!entry) return;
        const info = entry.info;
        this.clients.delete(peerId);
        this.players.delete(peerId);
        this.connected = this.clients.size > 0;
        this._broadcastRoster();
        this._emitStatus(
          this.connected ? `${this.players.size}/${this.maxPlayers} IN PRIVATE SERVER` : 'PRIVATE SERVER LIVE · SHARE LINK!',
          this.connected
        );
        if (this.cb.onPeerLeave) this.cb.onPeerLeave(info);
      };

      conn.on('close', removeClient);
      conn.on('error', removeClient);
    }

    _handleHostPacket(data) {
      if (data.type === 'join_denied') {
        this._emitStatus(`DENIED: ${data.reason || 'CANNOT JOIN'}`, false);
        if (this.cb.onJoinDenied) this.cb.onJoinDenied(data.reason || 'CANNOT JOIN');
        return;
      }

      if (data.type === 'kicked') {
        this._emitStatus('KICKED FROM PRIVATE SERVER', false);
        if (this.hostConn) this.hostConn.close();
        return;
      }

      if (data.type === 'join_ok') {
        this.connected = true;
        this.myId = data.yourId || this.myId;
        this.serverName = data.serverName || this.serverName;
        this.maxPlayers = data.maxPlayers || 8;
        this._emitReady();
        this._emitStatus(`JOINED ${this.serverName}`, true);
        if (this.cb.onConnectedToServer) this.cb.onConnectedToServer(this.serverName);
        return;
      }

      if (data.type === 'roster') {
        this.serverName = data.serverName || this.serverName;
        this.maxPlayers = data.maxPlayers || this.maxPlayers;
        const oldIds = new Set(this.players.keys());
        const newIds = new Set();
        this.players.clear();
        for (const p of data.players || []) {
          this.players.set(p.id, p);
          newIds.add(p.id);
          if (p.id !== this.myId && !oldIds.has(p.id) && this.cb.onPeerJoin) {
            this.cb.onPeerJoin(p);
          }
        }
        for (const oid of oldIds) {
          if (oid !== this.myId && !newIds.has(oid) && this.cb.onPeerLeave) {
            this.cb.onPeerLeave({ id: oid, name: 'Friend' });
          }
        }
        this._emitStatus(`${this.players.size}/${this.maxPlayers} IN ${this.serverName}`, true);
        this._emitRoster();
        return;
      }

      if (this.cb.onMessage) this.cb.onMessage(data);
    }

    _broadcastRoster() {
      const list = Array.from(this.players.values());
      const packet = {
        type: 'roster',
        serverName: this.serverName,
        maxPlayers: this.maxPlayers,
        players: list,
      };
      for (const entry of this.clients.values()) {
        if (entry.conn.open) {
          try {
            entry.conn.send(packet);
          } catch {}
        }
      }
      this._emitRoster();
    }

    kickPlayer(peerId) {
      if (!this.isHost) return;
      const entry = this.clients.get(peerId);
      if (!entry) return;
      try {
        entry.conn.send({ type: 'kicked' });
        setTimeout(() => entry.conn.close(), 120);
      } catch {}
    }

    sendToHost(payload) {
      if (!this.hostConn || !this.hostConn.open) return false;
      try {
        this.hostConn.send({ ...payload, from: this.myId });
        return true;
      } catch {
        return false;
      }
    }

    sendTo(targetId, payload) {
      const msg = { ...payload, from: this.myId, to: targetId };
      if (this.isHost) {
        const entry = this.clients.get(targetId);
        if (entry && entry.conn.open) {
          try {
            entry.conn.send(msg);
            return true;
          } catch {}
        }
        return false;
      }
      return this.sendToHost(msg);
    }

    broadcast(payload) {
      const msg = { ...payload, from: this.myId };
      if (this.isHost) {
        let sent = false;
        for (const entry of this.clients.values()) {
          if (entry.conn.open) {
            try {
              entry.conn.send(msg);
              sent = true;
            } catch {}
          }
        }
        return sent;
      }
      return this.sendToHost(msg);
    }

    getOtherPlayersCount() {
      return Math.max(0, this.players.size - 1);
    }

    getRosterList() {
      return Array.from(this.players.values());
    }

    _emitReady() {
      if (this.cb.onReady) {
        this.cb.onReady({
          roomCode: this.roomCode,
          inviteUrl: this.inviteUrl,
          serverName: this.serverName,
          maxPlayers: this.maxPlayers,
          hasPin: Boolean(this.serverPass),
          isHost: this.isHost,
        });
      }
    }

    _emitStatus(text, connected) {
      if (this.cb.onStatus) this.cb.onStatus(text, connected);
    }

    _emitRoster() {
      if (this.cb.onRoster) this.cb.onRoster(this.getRosterList(), this.maxPlayers, this.serverName);
    }
  }

  Rivals.NetManager = NetManager;
})(window);
