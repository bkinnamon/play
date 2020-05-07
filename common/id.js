const generate = (length) =>
  Array(length)
    .fill()
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')
    .toUpperCase();

module.exports = {
  generate,
};
