const state = {
  players: {
    X: null,
    Y: null,
  },
  board: Array(9).fill(),
  currentPlayer: 'X',
};

const update = (io) => {
  io.to('ttt').emit('board', { board: state.board });
};

const switchPlayers = () => {
  state.players[state.currentPlayer].emit('turn', { yourTurn: false });
  state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
  state.players[state.currentPlayer].emit('turn', { yourTurn: true });
};

const ready = () => !!state.players.X && !!state.players.O;

const sendReady = (io) => {
  io.to('ttt').emit('ready', ready());
};

const reset = () => {
  if (!ready()) return;
  state.board = Array(9).fill();
  state.currentPlayer = 'X';
  state.players.X.emit('turn', { yourTurn: true });
  state.players.O.emit('turn', { yourTurn: false });
};

const setup = (socket, io) => {
  socket.join('ttt');
  if (!state.players.X) {
    state.players.X = socket;
    state.players.X.emit('symbol', 'X');
    state.players.X.emit('turn', { yourTurn: true });
    sendReady(io);
    update(io);

    state.players.X.on('move', (index) => {
      if (!ready()) return;
      if (state.currentPlayer === 'X' && !state.board[index]) {
        state.board[index] = 'X';
        switchPlayers();
        update(io);
      }
    });

    state.players.X.on('disconnect', () => {
      sendReady(io);
      reset();
      update(io);
      state.players.X = null;
    });
  } else if (!state.players.O) {
    state.players.O = socket;
    reset();
    update(io);
    state.players.O.emit('symbol', 'O');
    state.players.O.emit('turn', { yourTurn: false });
    sendReady(io);
    update(io);

    state.players.O.on('move', (index) => {
      if (!ready()) return;
      if (state.currentPlayer === 'O' && !state.board[index]) {
        state.board[index] = 'O';
        switchPlayers();
        update(io);
      }
    });

    state.players.O.on('disconnect', () => {
      sendReady(io);
      reset();
      update(io);
      state.players.O = null;
    });
  } else {
    socket.emit('symbol');
    update(io);
  }

  socket.on('reset', () => {
    reset();
    update(io);
  });
};

module.exports = {
  setup,
};
