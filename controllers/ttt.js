const index = (req, res) => {
  res.render('ttt');
};

const game = (req, res) => {
  res.render('ttt-game', { gameID: req.params.id });
};

module.exports = { index, game };
