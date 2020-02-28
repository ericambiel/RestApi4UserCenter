var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const config = require('./config');
const mongoose = require('mongoose');
const cors = require('cors');

// Variáveis das Rotas
var indexRouter = require('./routes/index');
var usuariosRouter = require('./routes/usuarios');
var contratosRouter = require('./routes/contratos');

var app = express();

mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${config.dbHost}/${config.dbName}`, { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false}) // Para mais detalhes https://mongoosejs.com/docs/deprecations.html#-findandmodify-
  .then(client => {
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

// Configuração das Rotas
app.use('/', indexRouter);
app.use('/usuarios', usuariosRouter);
app.use('/contratos', contratosRouter);

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