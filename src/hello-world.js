const express = require('express'); //  Importa o modulo express
const app = express(); // Cria uma aplicação express

const port = 3000;

var wiki = require('./wiki.js');

app.get('/', (req, res) => { //Metodo GET escultando splicitações na / do site
    res.send('Olá Mundo!'); //Envia Olá Mundo ao solicitante
});

/* Mesma coisa que acima mas de modo padrão JS sem arrow function
app.get('/', function(req, res) {
    res.send('Olá Mundo!');
});
*/

app.all('/secret', (req, res, next) => { //Metodo GET escultando splicitações na / do site
    res.send('Acessando seção secreta!'); //Envia Olá Mundo ao solicitante
    next()
});

app.listen(port, () => console.log(`Serviço iniciado na porta: ${port}`)) //Inicia o servidor e imprime no LOG uma menssagem qualquer

/*Mesma coisa que acima mas de modo padrão JS sem arrow function
app.listen(3000, function() {
    console.log('App de Exemplo escutando na porta 3000!');
  });
*/

app.use('/wiki', wiki) //Usa as rotas disponiveis em wiki.js apartir de /wiki