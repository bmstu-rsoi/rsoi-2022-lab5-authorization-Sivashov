const express       = require('express')
var path            = require('path'); // модуль для парсинга пути
const app           = express()
var favicon         = require('serve-favicon');
var logger          = require('morgan');
var methodOverride  = require('method-override');
var bodyParser      = require('body-parser');
var errorHandler    = require('errorhandler');
var url             = require('url')

//const db            = require('./db/queries')
app.set('port', (process.env.PORT || 8060));

app.use(logger('combined')); // выводим все запросы со статусами в консоль
app.use(bodyParser.json()); // стандартный модуль, для парсинга JSON в запросах
app.use(methodOverride()); // поддержка put и delete


const pg = require('pg');
const flights_db = new pg.Client({
  user: 'postgres',
  //host: 'postgres',
  host: 'postgres-service',
  database: 'postgres',
  password: 'postgres',
  port: 5432,
  ssl: false,
});

flights_db.connect(function (err){
  if(err)
      console.log(err);
  else
      console.log("Connected to flights_db!");
      

});

/*const dbQuery = `SELECT * FROM Airport;`;
  console.log(dbQuery)
  flights_db.query(dbQuery, (err, dbRes) => {
  console.log(err);
  console.log(dbRes.rows)
  });*/

app.get('/api/v1/flights', async (req, res) => {
  const dbQuery = `SELECT * FROM Flight;`;
  console.log(dbQuery)
  flights_db.query(dbQuery, (err, dbRes) => {
  console.log(err);
  console.log(dbRes)
  res.status(200).json(dbRes.rows);
  });
});

app.get('/api/v1/airports', async (req, res) => {
  const dbQuery = `SELECT * FROM Airport;`;
  console.log(dbQuery)
  flights_db.query(dbQuery, (err, dbRes) => {
  console.log(err);
  console.log(dbRes)
  res.status(200).json(dbRes.rows);
  });
});

app.get('/', function (req, res) {
    res.send('flight service is running');
  });
  
app.get('/manage/health', function (req, res) {
    res.status(200).json(null)
});



app.listen(app.get('port'), function(){
    console.log(`Server listening on port `, app.get('port'));
  });

