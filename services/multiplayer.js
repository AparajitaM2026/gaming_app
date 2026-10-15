const { verifyToken } = require('../middleware/auth');
const antiFraud = require('./antiFraud');
const db = require('../db');

// In-memory Quick Match queues & 1v1 rooms
const matchmakingQueues = new Map(); // gameSlug -> [{ ws, user, timer }]
const activeRooms = new Map(); // roomId -> RoomState

// In-memory Party Rooms (Friends Multiplayer)
const partyRooms = new Map(); // roomCode -> PartyRoom

const SMART_BOT_NAMES = [
  'NeonNinja', 'CyberApex', 'AstroViper', 'ShadowGamer', 
  'QuantumPulse', 'BlitzStriker', 'TitanRider', 'NovaByte'
];

const PLAYER_COLORS = ['#00F0FF', '#FF0055', '#FFD700', '#00FF66']; // Cyan, Magenta, Gold, Neon Green

function getRandomBot() {
  const name = SMART_BOT_NAMES[Math.floor(Math.random() * SMART_BOT_NAMES.length)];
  return {
    id: -1 * Math.floor(Math.random() * 1000 + 1),
    username: name,
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
    isBot: true
  };
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'VX-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function broadcastToParty(room, payload, excludeWs = null) {
  const msgStr = JSON.stringify(payload);
  room.players.forEach(p => {
    if (p.ws && p.ws !== excludeWs && p.ws.readyState === 1) {
      try { p.ws.send(msgStr); } catch (e) {}
    }
  });
}

function setupMultiplayer(wss) {
  wss.on('error', (err) => {
    console.warn('WSS server error caught:', err.message);
  });

  wss.on('connection', (ws, req) => {
    let currentUser = null;
    let currentPartyCode = null;

    ws.on('error', (err) => {
      console.warn('WS client error caught:', err.message);
    });

    // Welcome handshake
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'WebSocket Connected to Voltixz Gaming Server' }));

    ws.on('message', async (rawMsg) => {
      try {
        const msg = JSON.parse(rawMsg);

        switch (msg.type) {
          // -------------------------------------------------------------
          // 1. AUTHENTICATION (Registered JWT or Instant Guest Profile)
          // -------------------------------------------------------------
          case 'AUTH': {
            if (msg.token) {
              const decoded = verifyToken(msg.token);
              if (decoded) {
                currentUser = decoded;
                ws.userId = decoded.id;
                ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', user: decoded, isGuest: false }));
                break;
              }
            }
            // Fallback or explicit Guest Login
            const guestName = (msg.guestName || '').trim() || `Player_${Math.floor(1000 + Math.random() * 9000)}`;
            const guestId = msg.guestId || `guest_${Math.floor(100000 + Math.random() * 900000)}`;
            const guestAvatar = msg.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(guestName)}`;
            
            currentUser = {
              id: guestId,
              username: guestName,
              avatar_url: guestAvatar,
              isGuest: true
            };
            ws.userId = guestId;
            ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', user: currentUser, isGuest: true }));
            break;
          }

          // -------------------------------------------------------------
          // 2. QUICK MATCH (1v1 Instant Battle with 5s Bot Fallback)
          // -------------------------------------------------------------
          case 'QUICK_MATCH': {
            if (!currentUser) {
              return ws.send(JSON.stringify({ type: 'ERROR', message: 'Please login or provide guest name first' }));
            }

            const { gameSlug = 'dice-duel' } = msg;
            const check = await antiFraud.canUserJoinMatch(currentUser.id, 0);
            if (!check.allowed) {
              return ws.send(JSON.stringify({ type: 'JOIN_REJECTED', reason: check.reason }));
            }

            if (!matchmakingQueues.has(gameSlug)) {
              matchmakingQueues.set(gameSlug, []);
            }
            const queue = matchmakingQueues.get(gameSlug);

            // Check if another player is waiting in queue
            if (queue.length > 0) {
              const opponent = queue.shift();
              clearTimeout(opponent.timer);
              createMatch(gameSlug, 0, { ws, user: currentUser }, opponent);
            } else {
              // First in queue: set 5-second Smart Bot fallback
              const queueItem = {
                ws,
                user: currentUser,
                entryFee: 0,
                timer: setTimeout(() => {
                  const q = matchmakingQueues.get(gameSlug) || [];
                  const idx = q.findIndex(item => item.user.id === currentUser.id);
                  if (idx !== -1) q.splice(idx, 1);

                  // Pair with Smart Bot!
                  const bot = getRandomBot();
                  createMatchWithBot(gameSlug, 0, { ws, user: currentUser }, bot);
                }, 5000)
              };

              queue.push(queueItem);
              ws.send(JSON.stringify({ type: 'MATCHMAKING_STARTED', timeoutSec: 5 }));
            }
            break;
          }

          case 'CANCEL_MATCHMAKING': {
            if (!currentUser) return;
            const { gameSlug = 'dice-duel' } = msg;
            const q = matchmakingQueues.get(gameSlug);
            if (q) {
              const idx = q.findIndex(item => item.user.id === currentUser.id);
              if (idx !== -1) {
                clearTimeout(q[idx].timer);
                q.splice(idx, 1);
                ws.send(JSON.stringify({ type: 'MATCHMAKING_CANCELLED' }));
              }
            }
            break;
          }

          case 'GAME_ACTION': {
            const { roomId, action, data } = msg;
            handleGameAction(roomId, currentUser ? currentUser.id : null, action, data);
            break;
          }

          // -------------------------------------------------------------
          // 3. PARTY / PRIVATE ROOMS (Friends Multiplayer)
          // -------------------------------------------------------------
          case 'PARTY_CREATE': {
            if (!currentUser) {
              return ws.send(JSON.stringify({ type: 'PARTY_ERROR', message: 'Auth required before creating a party' }));
            }

            // Cleanup any existing room user might be hosting
            if (currentPartyCode && partyRooms.has(currentPartyCode)) {
              removePlayerFromParty(currentPartyCode, currentUser.id);
            }

            const roomCode = generateRoomCode();
            const gameSlug = msg.gameSlug || 'dice-duel';
            const maxPlayers = Math.min(4, Math.max(2, parseInt(msg.maxPlayers) || 4));

            const room = {
              code: roomCode,
              gameSlug,
              maxPlayers,
              hostId: currentUser.id,
              status: 'LOBBY',
              createdAt: Date.now(),
              currentTurnIndex: 0,
              players: [
                {
                  ws,
                  user: currentUser,
                  color: PLAYER_COLORS[0],
                  isHost: true,
                  ready: true,
                  score: 0,
                  position: 0
                }
              ],
              gameState: {
                targetScore: 30,
                boardTiles: 30,
                boostTiles: [7, 14, 21], // +3 boost
                trapTiles: [11, 23],    // -2 trap
                turnHistory: []
              }
            };

            partyRooms.set(roomCode, room);
            currentPartyCode = roomCode;

            ws.send(JSON.stringify({
              type: 'PARTY_CREATED',
              roomCode,
              gameSlug,
              maxPlayers,
              hostId: currentUser.id,
              players: room.players.map(p => ({
                id: p.user.id,
                username: p.user.username,
                avatar_url: p.user.avatar_url,
                color: p.color,
                isHost: p.isHost,
                ready: p.ready
              }))
            }));
            break;
          }

          case 'PARTY_JOIN': {
            if (!currentUser) {
              return ws.send(JSON.stringify({ type: 'PARTY_ERROR', message: 'Auth required before joining a party' }));
            }

            const rawCode = (msg.roomCode || '').toUpperCase().trim();
            const roomCode = rawCode.startsWith('VX-') ? rawCode : (rawCode.startsWith('VX') ? `VX-${rawCode.slice(2)}` : `VX-${rawCode}`);
            const room = partyRooms.get(roomCode) || partyRooms.get(rawCode);

            if (!room) {
              return ws.send(JSON.stringify({ type: 'PARTY_ERROR', message: `Room "${rawCode}" not found. Check code & try again!` }));
            }

            if (room.status !== 'LOBBY') {
              return ws.send(JSON.stringify({ type: 'PARTY_ERROR', message: 'Game has already started in this room.' }));
            }

            if (room.players.length >= room.maxPlayers) {
              return ws.send(JSON.stringify({ type: 'PARTY_ERROR', message: `Room is full (Max ${room.maxPlayers} players).` }));
            }

            // Check if player is already inside
            const existingIdx = room.players.findIndex(p => p.user.id === currentUser.id);
            if (existingIdx !== -1) {
              room.players[existingIdx].ws = ws;
            } else {
              const assignedColor = PLAYER_COLORS[room.players.length % PLAYER_COLORS.length];
              room.players.push({
                ws,
                user: currentUser,
                color: assignedColor,
                isHost: false,
                ready: true,
                score: 0,
                position: 0
              });
            }

            currentPartyCode = room.code;

            // Broadcast updated lobby to all players
            const partyPayload = {
              type: 'PARTY_UPDATED',
              roomCode: room.code,
              gameSlug: room.gameSlug,
              maxPlayers: room.maxPlayers,
              hostId: room.hostId,
              status: room.status,
              players: room.players.map(p => ({
                id: p.user.id,
                username: p.user.username,
                avatar_url: p.user.avatar_url,
                color: p.color,
                isHost: p.isHost,
                ready: p.ready,
                isBot: p.isBot || false
              }))
            };

            broadcastToParty(room, partyPayload);
            break;
          }

          case 'PARTY_ADD_BOT': {
            if (!currentPartyCode) return;
            const room = partyRooms.get(currentPartyCode);
            if (!room) return;

            if (room.hostId !== currentUser.id) {
              return ws.send(JSON.stringify({ type: 'PARTY_ERROR', message: 'Only the party host can add bots.' }));
            }

            if (room.status !== 'LOBBY') {
              return ws.send(JSON.stringify({ type: 'PARTY_ERROR', message: 'Cannot add bots after match has started.' }));
            }

            if (room.players.length >= room.maxPlayers) {
              return ws.send(JSON.stringify({ type: 'PARTY_ERROR', message: `Room is full (Max ${room.maxPlayers} players).` }));
            }

            const bot = getRandomBot();
            const assignedColor = PLAYER_COLORS[room.players.length % PLAYER_COLORS.length];
            room.players.push({
              ws: null,
              user: bot,
              isBot: true,
              color: assignedColor,
              isHost: false,
              ready: true,
              score: 0,
              position: 0
            });

            const partyPayload = {
              type: 'PARTY_UPDATED',
              roomCode: room.code,
              gameSlug: room.gameSlug,
              maxPlayers: room.maxPlayers,
              hostId: room.hostId,
              status: room.status,
              players: room.players.map(p => ({
                id: p.user.id,
                username: p.user.username,
                avatar_url: p.user.avatar_url,
                color: p.color,
                isHost: p.isHost,
                ready: p.ready,
                isBot: p.isBot || false
              }))
            };

            broadcastToParty(room, partyPayload);
            break;
          }

          case 'PARTY_REMOVE_BOT': {
            if (!currentPartyCode) return;
            const room = partyRooms.get(currentPartyCode);
            if (!room || room.hostId !== currentUser.id) return;

            const botIdx = room.players.findIndex(p => p.isBot);
            if (botIdx !== -1) {
              room.players.splice(botIdx, 1);
              broadcastToParty(room, {
                type: 'PARTY_UPDATED',
                roomCode: room.code,
                gameSlug: room.gameSlug,
                maxPlayers: room.maxPlayers,
                hostId: room.hostId,
                status: room.status,
                players: room.players.map(p => ({
                  id: p.user.id,
                  username: p.user.username,
                  avatar_url: p.user.avatar_url,
                  color: p.color,
                  isHost: p.isHost,
                  ready: p.ready,
                  isBot: p.isBot || false
                }))
              });
            }
            break;
          }

          case 'PARTY_START': {
            if (!currentPartyCode) return;
            const room = partyRooms.get(currentPartyCode);
            if (!room) return;

            if (room.hostId !== currentUser.id) {
              return ws.send(JSON.stringify({ type: 'PARTY_ERROR', message: 'Only the party host can start the game.' }));
            }

            if (room.players.length < 2) {
              return ws.send(JSON.stringify({ type: 'PARTY_ERROR', message: 'At least 2 players are needed to start the party match. Add an AI bot or invite a friend!' }));
            }

            room.status = 'PLAYING';
            room.currentTurnIndex = 0;
            room.startedAt = Date.now();

            // Initialize game specific state
            if (room.gameSlug === 'tictactoe-neon') {
              room.gameState = {
                grid: Array(9).fill(null),
                symbols: {
                  [room.players[0].user.id]: 'X',
                  [room.players[1].user.id]: 'O'
                }
              };
            } else {
              // Default: Dice Duel Neon Board Race
              room.gameState = {
                targetScore: 30,
                boardTiles: 30,
                boostTiles: [7, 14, 21],
                trapTiles: [11, 23],
                turnHistory: []
              };
              room.players.forEach(p => {
                p.score = 0;
                p.position = 0;
              });
            }

            const startPayload = {
              type: 'PARTY_GAME_STARTED',
              roomCode: room.code,
              gameSlug: room.gameSlug,
              currentTurn: room.players[0].user.id,
              gameState: room.gameState,
              players: room.players.map(p => ({
                id: p.user.id,
                username: p.user.username,
                avatar_url: p.user.avatar_url,
                color: p.color,
                score: p.score,
                position: p.position,
                isBot: p.isBot || false,
                symbol: room.gameState.symbols ? room.gameState.symbols[p.user.id] : null
              }))
            };

            broadcastToParty(room, startPayload);

            if (room.players[0].isBot) {
              triggerPartyBotTurn(room);
            }
            break;
          }

          case 'PARTY_ACTION': {
            if (!currentPartyCode) return;
            const room = partyRooms.get(currentPartyCode);
            if (!room || room.status !== 'PLAYING') return;

            const activePlayer = room.players[room.currentTurnIndex];
            if (!activePlayer || activePlayer.user.id !== currentUser.id) {
              return ws.send(JSON.stringify({ type: 'ACTION_REJECTED', reason: 'Not your turn!' }));
            }

            const { action, data } = msg;

            // GAME 1: DICE DUEL NEON RACE
            if (action === 'ROLL_DICE' || room.gameSlug === 'dice-duel') {
              const roll = Math.floor(Math.random() * 6) + 1;
              let nextPos = activePlayer.position + roll;
              let tileEvent = null;

              if (room.gameState.boostTiles.includes(nextPos)) {
                nextPos = Math.min(30, nextPos + 3);
                tileEvent = 'BOOST +3!';
              } else if (room.gameState.trapTiles.includes(nextPos)) {
                nextPos = Math.max(0, nextPos - 2);
                tileEvent = 'TRAP -2!';
              }

              activePlayer.position = Math.min(30, nextPos);
              activePlayer.score = activePlayer.position;

              const actionResult = {
                type: 'PARTY_GAME_UPDATE',
                roomCode: room.code,
                action: 'ROLL_DICE',
                rollerId: activePlayer.user.id,
                roll,
                newPosition: activePlayer.position,
                tileEvent,
                players: room.players.map(p => ({
                  id: p.user.id,
                  username: p.user.username,
                  color: p.color,
                  score: p.score,
                  position: p.position
                }))
              };

              // Check Victory
              if (activePlayer.position >= 30) {
                room.status = 'FINISHED';
                actionResult.gameOver = true;
                actionResult.winner = {
                  id: activePlayer.user.id,
                  username: activePlayer.user.username,
                  avatar_url: activePlayer.user.avatar_url,
                  prizeCoins: 50
                };

                // Award registered users winner coins
                if (!activePlayer.user.isGuest) {
                  antiFraud.recordMatchOutcome(room.code, activePlayer.user.id, null, 0, room.gameSlug).catch(console.error);
                }

                broadcastToParty(room, actionResult);
              } else {
                // Advance turn to next player
                room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
                actionResult.nextTurn = room.players[room.currentTurnIndex].user.id;
                broadcastToParty(room, actionResult);

                if (room.players[room.currentTurnIndex].isBot) {
                  triggerPartyBotTurn(room);
                }
              }
            }

            // GAME 2: TIC-TAC-TOE NEON
            else if (action === 'TICTACTOE_MOVE' || room.gameSlug === 'tictactoe-neon') {
              const cellIdx = parseInt(data.index);
              if (isNaN(cellIdx) || cellIdx < 0 || cellIdx > 8 || room.gameState.grid[cellIdx] !== null) {
                return ws.send(JSON.stringify({ type: 'ACTION_REJECTED', reason: 'Invalid move' }));
              }

              const symbol = room.gameState.symbols[activePlayer.user.id];
              room.gameState.grid[cellIdx] = symbol;

              // Check win conditions
              const winLines = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
                [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
                [0, 4, 8], [2, 4, 6]             // Diagonals
              ];

              let winningLine = null;
              for (const line of winLines) {
                const [a, b, c] = line;
                if (room.gameState.grid[a] && room.gameState.grid[a] === room.gameState.grid[b] && room.gameState.grid[a] === room.gameState.grid[c]) {
                  winningLine = line;
                  break;
                }
              }

              const isDraw = !winningLine && room.gameState.grid.every(c => c !== null);

              const updatePayload = {
                type: 'PARTY_GAME_UPDATE',
                roomCode: room.code,
                action: 'TICTACTOE_MOVE',
                cellIdx,
                symbol,
                grid: room.gameState.grid,
                playerId: activePlayer.user.id
              };

              if (winningLine) {
                room.status = 'FINISHED';
                updatePayload.gameOver = true;
                updatePayload.winningLine = winningLine;
                updatePayload.winner = {
                  id: activePlayer.user.id,
                  username: activePlayer.user.username,
                  avatar_url: activePlayer.user.avatar_url,
                  prizeCoins: 50
                };
                if (!activePlayer.user.isGuest) {
                  antiFraud.recordMatchOutcome(room.code, activePlayer.user.id, null, 0, room.gameSlug).catch(console.error);
                }
                broadcastToParty(room, updatePayload);
              } else if (isDraw) {
                room.status = 'FINISHED';
                updatePayload.gameOver = true;
                updatePayload.isDraw = true;
                broadcastToParty(room, updatePayload);
              } else {
                room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
                updatePayload.nextTurn = room.players[room.currentTurnIndex].user.id;
                broadcastToParty(room, updatePayload);

                if (room.players[room.currentTurnIndex].isBot) {
                  triggerPartyBotTurn(room);
                }
              }
            }
            break;
          }

          // In-Game Live Chat & Reaction Emojis
          case 'PARTY_CHAT': {
            if (!currentPartyCode) return;
            const room = partyRooms.get(currentPartyCode);
            if (!room) return;

            const chatMsg = {
              type: 'PARTY_CHAT_MESSAGE',
              roomCode: room.code,
              senderId: currentUser.id,
              senderName: currentUser.username,
              avatar_url: currentUser.avatar_url,
              text: (msg.text || '').slice(0, 100),
              emoji: msg.emoji || null,
              timestamp: Date.now()
            };

            broadcastToParty(room, chatMsg);
            break;
          }

          case 'PARTY_LEAVE': {
            if (currentPartyCode) {
              removePlayerFromParty(currentPartyCode, currentUser.id);
              currentPartyCode = null;
              ws.send(JSON.stringify({ type: 'PARTY_LEFT' }));
            }
            break;
          }

          // Heartbeat keep-alive
          case 'PING': {
            ws.send(JSON.stringify({ type: 'PONG', time: Date.now() }));
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      // 1. Remove from matchmaking queues
      for (const [slug, q] of matchmakingQueues.entries()) {
        const idx = q.findIndex(item => item.ws === ws);
        if (idx !== -1) {
          clearTimeout(q[idx].timer);
          q.splice(idx, 1);
        }
      }

      // 2. Remove from active party
      if (currentPartyCode && currentUser) {
        removePlayerFromParty(currentPartyCode, currentUser.id);
      }
    });
  });
}

function triggerPartyBotTurn(room) {
  if (!room || room.status !== 'PLAYING') return;
  const botPlayer = room.players[room.currentTurnIndex];
  if (!botPlayer || !botPlayer.isBot) return;

  setTimeout(() => {
    if (room.status !== 'PLAYING') return;
    const current = room.players[room.currentTurnIndex];
    if (!current || current.user.id !== botPlayer.user.id) return;

    if (room.gameSlug === 'dice-duel') {
      const roll = Math.floor(Math.random() * 6) + 1;
      let nextPos = botPlayer.position + roll;
      let tileEvent = null;

      if (room.gameState.boostTiles && room.gameState.boostTiles.includes(nextPos)) {
        nextPos = Math.min(30, nextPos + 3);
        tileEvent = 'BOOST +3!';
      } else if (room.gameState.trapTiles && room.gameState.trapTiles.includes(nextPos)) {
        nextPos = Math.max(0, nextPos - 2);
        tileEvent = 'TRAP -2!';
      }

      botPlayer.position = Math.min(30, nextPos);
      botPlayer.score = botPlayer.position;

      const actionResult = {
        type: 'PARTY_GAME_UPDATE',
        roomCode: room.code,
        action: 'ROLL_DICE',
        rollerId: botPlayer.user.id,
        roll,
        newPosition: botPlayer.position,
        tileEvent,
        players: room.players.map(p => ({
          id: p.user.id,
          username: p.user.username,
          color: p.color,
          score: p.score,
          position: p.position
        }))
      };

      if (botPlayer.position >= 30) {
        room.status = 'FINISHED';
        actionResult.gameOver = true;
        actionResult.winner = {
          id: botPlayer.user.id,
          username: botPlayer.user.username,
          avatar_url: botPlayer.user.avatar_url,
          prizeCoins: 50
        };
        broadcastToParty(room, actionResult);
      } else {
        room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
        actionResult.nextTurn = room.players[room.currentTurnIndex].user.id;
        broadcastToParty(room, actionResult);

        if (room.players[room.currentTurnIndex].isBot) {
          triggerPartyBotTurn(room);
        }
      }
    } else if (room.gameSlug === 'tictactoe-neon') {
      const emptyIndices = [];
      room.gameState.grid.forEach((val, idx) => {
        if (val === null) emptyIndices.push(idx);
      });
      if (emptyIndices.length === 0) return;

      const cellIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      const symbol = (room.gameState.symbols && room.gameState.symbols[botPlayer.user.id]) || 'O';
      room.gameState.grid[cellIdx] = symbol;

      const winLines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
      ];

      let winningLine = null;
      for (const line of winLines) {
        const [a, b, c] = line;
        if (room.gameState.grid[a] && room.gameState.grid[a] === room.gameState.grid[b] && room.gameState.grid[a] === room.gameState.grid[c]) {
          winningLine = line;
          break;
        }
      }

      const isDraw = !winningLine && room.gameState.grid.every(c => c !== null);

      const updatePayload = {
        type: 'PARTY_GAME_UPDATE',
        roomCode: room.code,
        action: 'TICTACTOE_MOVE',
        cellIdx,
        symbol,
        grid: room.gameState.grid,
        playerId: botPlayer.user.id
      };

      if (winningLine) {
        room.status = 'FINISHED';
        updatePayload.gameOver = true;
        updatePayload.winningLine = winningLine;
        updatePayload.winner = {
          id: botPlayer.user.id,
          username: botPlayer.user.username,
          avatar_url: botPlayer.user.avatar_url,
          prizeCoins: 50
        };
        broadcastToParty(room, updatePayload);
      } else if (isDraw) {
        room.status = 'FINISHED';
        updatePayload.gameOver = true;
        updatePayload.isDraw = true;
        broadcastToParty(room, updatePayload);
      } else {
        room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
        updatePayload.nextTurn = room.players[room.currentTurnIndex].user.id;
        broadcastToParty(room, updatePayload);

        if (room.players[room.currentTurnIndex].isBot) {
          triggerPartyBotTurn(room);
        }
      }
    }
  }, 1200);
}

function removePlayerFromParty(roomCode, userId) {
  const room = partyRooms.get(roomCode);
  if (!room) return;

  const idx = room.players.findIndex(p => p.user.id === userId);
  if (idx !== -1) {
    const wasHost = room.players[idx].isHost;
    room.players.splice(idx, 1);

    if (room.players.length === 0) {
      partyRooms.delete(roomCode);
    } else {
      if (wasHost) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].user.id;
      }
      broadcastToParty(room, {
        type: 'PARTY_UPDATED',
        roomCode: room.code,
        gameSlug: room.gameSlug,
        maxPlayers: room.maxPlayers,
        hostId: room.hostId,
        status: room.status,
        players: room.players.map(p => ({
          id: p.user.id,
          username: p.user.username,
          avatar_url: p.user.avatar_url,
          color: p.color,
          isHost: p.isHost,
          ready: p.ready
        }))
      });
    }
  }
}

/**
 * Creates 1v1 match between two human players
 */
async function createMatch(gameSlug, entryFee, p1, p2) {
  const roomId = `MATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const prizeData = antiFraud.calculatePrizePool(entryFee, 2);

  const room = {
    id: roomId,
    gameSlug,
    entryFee,
    prizePool: prizeData.winnerPrize,
    p1: { ws: p1.ws, user: p1.user, score: 0, turnsTaken: 0 },
    p2: { ws: p2.ws, user: p2.user, score: 0, turnsTaken: 0 },
    currentTurn: p1.user.id,
    targetScore: 25,
    isBotMatch: false,
    startedAt: Date.now()
  };

  activeRooms.set(roomId, room);

  // Record in DB if registered
  if (!p1.user.isGuest && !p2.user.isGuest) {
    db.query(
      `INSERT INTO game_matches (id, game_slug, game_name, entry_fee, prize_pool, platform_rake, status, player1_id, player2_id)
       VALUES ($1, $2, $2, $3, $4, $5, 'ACTIVE', $6, $7)`,
      [roomId, gameSlug, entryFee, prizeData.winnerPrize, prizeData.platformRake, p1.user.id, p2.user.id]
    ).catch(console.warn);
  }

  const matchPayload = {
    type: 'MATCH_FOUND',
    roomId,
    gameSlug,
    entryFee,
    prizePool: prizeData.winnerPrize,
    player1: { id: p1.user.id, username: p1.user.username, avatar_url: p1.user.avatar_url },
    player2: { id: p2.user.id, username: p2.user.username, avatar_url: p2.user.avatar_url },
    currentTurn: room.currentTurn
  };

  p1.ws.send(JSON.stringify(matchPayload));
  p2.ws.send(JSON.stringify(matchPayload));
}

/**
 * Creates 1v1 match with Smart Bot (Instant 5-sec fallback)
 */
async function createMatchWithBot(gameSlug, entryFee, p1, bot) {
  const roomId = `BOT-MATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const prizeData = antiFraud.calculatePrizePool(entryFee, 2);

  const room = {
    id: roomId,
    gameSlug,
    entryFee,
    prizePool: prizeData.winnerPrize,
    p1: { ws: p1.ws, user: p1.user, score: 0, turnsTaken: 0 },
    p2: { isBot: true, user: bot, score: 0, turnsTaken: 0 },
    currentTurn: p1.user.id,
    targetScore: 25,
    isBotMatch: true,
    startedAt: Date.now()
  };

  activeRooms.set(roomId, room);

  if (!p1.user.isGuest) {
    db.query(
      `INSERT INTO game_matches (id, game_slug, game_name, entry_fee, prize_pool, platform_rake, status, player1_id)
       VALUES ($1, $2, $2, $3, $4, $5, 'ACTIVE', $6)`,
      [roomId, gameSlug, entryFee, prizeData.winnerPrize, prizeData.platformRake, p1.user.id]
    ).catch(console.warn);
  }

  p1.ws.send(JSON.stringify({
    type: 'MATCH_FOUND',
    roomId,
    gameSlug,
    entryFee,
    prizePool: prizeData.winnerPrize,
    player1: { id: p1.user.id, username: p1.user.username, avatar_url: p1.user.avatar_url },
    player2: { id: bot.id, username: bot.username, avatar_url: bot.avatar_url, isBot: true },
    currentTurn: room.currentTurn
  }));
}

/**
 * Handles Game Turn actions for 1v1 Quick Matches
 */
async function handleGameAction(roomId, userId, action, data) {
  const room = activeRooms.get(roomId);
  if (!room) return;

  if (action === 'ROLL_DICE') {
    const roll = Math.floor(Math.random() * 6) + 1;
    let isP1 = room.p1.user.id === userId;
    let playerObj = isP1 ? room.p1 : room.p2;

    playerObj.score += roll;
    playerObj.turnsTaken += 1;

    const rollPayload = {
      type: 'DICE_ROLLED',
      roomId,
      rollerId: userId,
      roll,
      p1Score: room.p1.score,
      p2Score: room.p2.score,
      targetScore: room.targetScore
    };

    if (room.p1.ws) room.p1.ws.send(JSON.stringify(rollPayload));
    if (!room.isBotMatch && room.p2.ws) room.p2.ws.send(JSON.stringify(rollPayload));

    // Win condition
    if (playerObj.score >= room.targetScore) {
      return finishMatch(roomId, playerObj.user.id);
    }

    // Switch turn
    if (room.isBotMatch) {
      setTimeout(() => {
        const botRoll = Math.floor(Math.random() * 6) + 1;
        room.p2.score += botRoll;
        room.p2.turnsTaken += 1;

        if (room.p1.ws) {
          room.p1.ws.send(JSON.stringify({
            type: 'DICE_ROLLED',
            roomId,
            rollerId: room.p2.user.id,
            roll: botRoll,
            p1Score: room.p1.score,
            p2Score: room.p2.score,
            targetScore: room.targetScore
          }));
        }

        if (room.p2.score >= room.targetScore) {
          finishMatch(roomId, room.p2.user.id);
        }
      }, 1500);
    } else {
      room.currentTurn = isP1 ? room.p2.user.id : room.p1.user.id;
    }
  }
}

/**
 * Concludes 1v1 match, dispenses prize coins and updates stats
 */
async function finishMatch(roomId, winnerId) {
  const room = activeRooms.get(roomId);
  if (!room) return;

  const isP1Winner = room.p1.user.id === winnerId;
  const loserId = isP1Winner ? (room.p2.isBot ? null : room.p2.user.id) : room.p1.user.id;

  let outcome = { winnerPrize: room.prizePool || 25 };
  if (!room.p2.isBot || isP1Winner) {
    outcome = await antiFraud.recordMatchOutcome(roomId, winnerId, loserId, room.entryFee, room.gameSlug);
  }

  const resultMsg = {
    type: 'MATCH_COMPLETED',
    roomId,
    winnerId,
    winnerName: isP1Winner ? room.p1.user.username : (room.p2.user.username || 'SmartBot'),
    prizeCoins: outcome.winnerPrize,
    p1Score: room.p1.score,
    p2Score: room.p2.score
  };

  if (room.p1.ws) room.p1.ws.send(JSON.stringify(resultMsg));
  if (!room.isBotMatch && room.p2.ws) room.p2.ws.send(JSON.stringify(resultMsg));

  activeRooms.delete(roomId);
}

module.exports = {
  setupMultiplayer
};
