const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const PORT = 3000;

const app = express();
app.set('view engine', 'ejs');

const server = http.createServer(app);
const io = socketio(server);

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/ttt', (req, res) => {
  res.render('ttt');
});

const state = {
  players: {
    X: null,
    Y: null,
  },
  board: Array(9).fill(),
  currentPlayer: 'X',
};

const update = () => {
  io.to('ttt').emit('board', { board: state.board });
};

const switchPlayers = () => {
  state.players[state.currentPlayer].emit('turn', { yourTurn: false });
  state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
  state.players[state.currentPlayer].emit('turn', { yourTurn: true });
};

const ready = () => !!state.players.X && !!state.players.O;

const reset = () => {
  if (!ready()) return;
  state.board = Array(9).fill();
  state.currentPlayer = 'X';
  update();
  state.players.X.emit('turn', { yourTurn: true });
  state.players.O.emit('turn', { yourTurn: false });
};

io.on('connect', (socket) => {
  socket.join('ttt');
  if (!state.players.X) {
    state.players.X = socket;
    state.players.X.emit('symbol', 'X');
    state.players.X.emit('turn', { yourTurn: true });
    update();

    state.players.X.on('move', (index) => {
      if (!ready()) return;
      if (state.currentPlayer === 'X' && !state.board[index]) {
        state.board[index] = 'X';
        switchPlayers();
        update();
      }
    });

    state.players.X.on('disconnect', () => {
      reset();
      state.players.X = null;
    });
  } else if (!state.players.O) {
    state.players.O = socket;
    reset();
    state.players.O.emit('symbol', 'O');
    state.players.O.emit('turn', { yourTurn: false });
    update();

    state.players.O.on('move', (index) => {
      if (!ready()) return;
      if (state.currentPlayer === 'O' && !state.board[index]) {
        state.board[index] = 'O';
        switchPlayers();
        update();
      }
    });

    state.players.O.on('disconnect', () => {
      reset();
      state.players.O = null;
    });
  } else {
    socket.emit('symbol');
    update();
  }

  socket.on('reset', () => {
    reset();
  });
});

server.listen(PORT);
