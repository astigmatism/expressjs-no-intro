const createError = require('http-errors');
const express = require('express');
const path = require('path');
const utility = require('./server/application');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');

//production routes
var indexRoutes = require('./routes/index');
var romsRoutes = require('./routes/roms');
var boxesRoutes = require('./routes/boxes');

//development routes
var indexRoutesDev = require('./routes-dev/index');
var romsRoutesDev = require('./routes-dev/roms');
var boxesRoutesDev = require('./routes-dev/boxes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));

//CORS
app.use(express.static('public', {
  setHeaders: (res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
  }
}));

app.use(cookieParser());

app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.text({limit: '50mb'}));

app.use('/', indexRoutes);
app.use('/roms', romsRoutes);
app.use('/boxes', boxesRoutes);

if (app.get('env') == 'development') {

  app.use('/dev', indexRoutesDev);
  app.use('/dev/roms', romsRoutesDev);
  app.use('/dev/boxes', boxesRoutesDev);
}

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
