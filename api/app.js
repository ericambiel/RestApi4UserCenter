var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
//var logger = require('morgan');

require('dotenv-safe').config();
const mongoose = require('mongoose');
//const cors = require('cors'); //Habilitar caso esteja em DEV

// Variáveis das Rotas, add logo abaixo em use.nomeRouter
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var contratosRouter = require('./routes/contratos');
var fileRouter = require('./routes/file');

var app = express();

mongoose.Promise = global.Promise;

connectionString = 
  `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
mongoose.connect( connectionString, { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false}) // Para mais detalhes https://mongoosejs.com/docs/deprecations.html#-findandmodify-
  .then(client => {
    console.log(`Conectado ao BD em: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`Base de Dados: ${process.env.DB_NAME}`);
    console.log(`Contato: eric.ambiel@gmail.com.br - (19) 9 9747-4657`)
  })
  .catch(error => {
    console.log("Erro ao se conectar ao BD: " + error);
  });

// mongoose.connection.on('connected', function (err) {
//   console.log("Connected to DB using chain: " + connectionString);
// });

// Error handler
mongoose.connection.on('error', function (err) {
  console.log(err);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(cors()); //Habilitar caso esteja em DEV

// app.use((req, res, next) => {
//   const collection = req.app.locals[process.env.DB_COLLECTION];
//   req.collection = collection;
//   next();
// });

// Configuração das Rotas
app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/contratos', contratosRouter);
app.use('/api/file', fileRouter);

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
