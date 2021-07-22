exports.get404 = (req, res, next) => {
  res
    .status(404)
    .render("404", {
      pageTitle: "404 - Page Not Found",
    //   isAuthenticated: req.session.isLoggedIn,
    });
  // res.status(404).sendFile(path.join(__dirname, 'views', '404.html')); //`${__dirname}/views/404.html`
};

exports.get500 = (req, res, next) => {
    res
      .status(500)
      .render("500", {
        pageTitle: "500 - Error!",
      });
};
