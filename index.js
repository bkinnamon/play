const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const ttt = require('./games/ttt');
const tttRoutes = require('./routes/ttt');

const PORT = 3000;

const app = express();
app.set('view engine', 'ejs');

const server = http.createServer(app);
const io = socketio(server);

app.get('/', (req, res) => {
  res.render('index');
});

app.use('/ttt', tttRoutes);

io.on('connect', (socket) => {
  socket.on('join', (game) => {
    switch (game) {
      case 'ttt':
        ttt.setup(socket, io);
        break;
      default:
        socket.emit('error', `Unknown game: ${game}`);
    }
  });
});

server.listen(PORT);
