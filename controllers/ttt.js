const { createGame } = require('../games/ttt');

const index = (req, res) => {
  res.render('ttt');
};

const create = (req, res) => {
  res.redirect(`/ttt/${createGame()}`);
};

const game = (req, res) => {
  res.render('ttt-game', { gameID: req.params.id });
};

module.exports = { index, create, game };
