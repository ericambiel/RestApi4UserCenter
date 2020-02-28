var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const config = require('./config');
const mongoose = require('mongoose');
const cors = require('cors');

var indexRouter = require('./routes/index');
//var usersRouter = require('./routes/users');

var app = express();

mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${config.dbHost}/${config.dbName}`, { 
    useNewUrlParser: true,
    useUnifiedTopology: true})
  .then(client => {
    //const db = client.db(config.dbName);
    //const collection = db.collection(config.dbCollection);    
    //app.locals[config.dbCollection] = collection;
    ////app.locals[config.dbCollection] = config.dbCollection;
    console.log("Conectado a Base de Dados: " + config.dbName);
  })
  .catch(error => {
    console.log("Erro ao se conectar ao BD: " + error);
  });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use((req, res, next) => {
  const collection = req.app.locals[config.dbCollection];
  req.collection = collection;
  next();
});

app.use('/', indexRouter);
//app.use('/users', usersRouter);

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
