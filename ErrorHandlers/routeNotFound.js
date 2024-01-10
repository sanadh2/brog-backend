const routeNotFound = (req, res) => {
  res.status(404).send(`<h3>This route doesn't exist</h3>`);
};
module.exports = routeNotFound;
