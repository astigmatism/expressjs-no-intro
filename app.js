const createError = require('http-errors');
const express = require('express');
const path = require('path');
const utility = require('./server/application');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');

var indexRoutes = require('./routes/index');
var romsRoutes = require('./routes/roms');
var boxesRoutes = require('./routes/boxes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());

app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.text({limit: '50mb'}));

app.use('/', indexRoutes);
app.use('/roms', romsRoutes);
app.use('/boxes', boxesRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
