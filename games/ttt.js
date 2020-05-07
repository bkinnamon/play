const id = require('../common/id');

const games = {};

const winCombos = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/**
 * @typedef {object} Game
 * @property {any} X The socket for player x
 * @property {any} Y The socket for player y
 * @property {string[]} board The current state of the board
 * @property {string} currentPlayer The symbol for the player with the current turn.
 */
const Game = {
  X: null,
  O: null,
  board: null,
  currentPlayer: null,
  winner: null,
};

/**
 * Generates a new game and returns the ID.
 * @returns {string} The ID of the new game.
 */
const createGame = () => {
  let newID = id.generate(4);
  while (games[newID]) {
    newID = id.generate(4);
  }
  games[newID] = { ...Game };
  return newID;
};

/**
 * Checks if a game is ready to play.
 * @param {Game} game The game to check.
 * @returns {boolean} Whether the game is ready or not.
 */
const ready = (game) => game.X && game.O;

/**
 * Creates a game object that is ready to begin a new game.
 * @param {Game} game The base game state
 * @returns {Game} The game state for a new game.
 */
const reset = (game) => ({
  ...game, board: Array(9).fill(), currentPlayer: 'X', winner: null,
});

/**
 * Makes a Tic Tac Toe move for the current player.
 * @param {Game} game The game to make the move in.
 * @param {string} symbol The symbol making the move.
 * @param {number} index The move the symbol is making.
 * @returns {Game} The update game state
 */
const move = (game, symbol, index) => {
  if (
    game.currentPlayer !== symbol
    || game.winner
    || index < 0
    || index >= game.board.length
    || game.board[index]) return game;

  const newBoard = [...game.board];
  newBoard[index] = symbol;
  return {
    ...game,
    board: newBoard,
    currentPlayer: symbol === 'X' ? 'O' : 'X',
  };
};

/**
 * Checks for a winner and returns their symbol.
 * @param {Game} game The game to check.
 * @returns {(string|null)} The winning symbol or null.
 */
const winner = (game) => winCombos.reduce((winSymbol, combo) => {
  if (winSymbol) return winSymbol;
  const [a, b, c] = combo;
  if (game.board[a] && game.board[a] === game.board[b] && game.board[a] === game.board[c]) {
    return game.board[a];
  }
  return null;
}, null);

/**
 * Starts and monitors a game.
 * @param {any} room The room to broadcast updates to.
 * @param {string} gameId The ID for the game to start and monitor.
 */
const start = (room, gameId) => {
  games[gameId] = reset(games[gameId]);
  room.emit('ready', { isReady: true });

  const update = () => {
    room.emit('update', { board: games[gameId].board, turn: games[gameId].currentPlayer });
    const w = winner(games[gameId]);
    if (w) {
      room.emit('winner', { winner: w });
    }
  };

  update();

  games[gameId].X.on('move', ({ index }) => {
    games[gameId] = move(games[gameId], 'X', index);
    update();
  });

  games[gameId].O.on('move', ({ index }) => {
    games[gameId] = move(games[gameId], 'O', index);
    update();
  });
};

/**
 * Joins a socket to a game.
 * @param {SocketIO.Server} io The socket server to create a room on.
 * @param {SocketIO.Socket} socket The currently active socket.
 * @param {string} gameId The ID of the game to join.
 */
const join = (io, socket, gameId) => {
  if (!games[gameId] || ready(games[gameId])) { return false; }

  const roomName = `ttt:${gameId}`;
  socket.join(roomName);

  if (!games[gameId].X) {
    games[gameId].X = socket;
    socket.emit('symbol', { symbol: 'X' });
  } else {
    games[gameId].O = socket;
    socket.emit('symbol', { symbol: 'O' });
  }

  if (ready(games[gameId])) {
    start(io.to(roomName), gameId);
  }

  return true;
};

module.exports = {
  createGame,
  join,
};
