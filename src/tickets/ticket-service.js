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
app.set('port', (process.env.PORT || 8070));

app.use(logger('combined')); // выводим все запросы со статусами в консоль
app.use(bodyParser.json()); // стандартный модуль, для парсинга JSON в запросах
app.use(methodOverride()); // поддержка put и delete


const pg = require('pg');
//connectionstr = process.env.DATABASE_URL
const tickets_db = new pg.Client({
    user: 'postgres',
    //host: 'postgres',
    host: 'postgres-service',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
  ssl: false,
});
tickets_db.connect(function (err){
  if(err)
      console.log(err);
  else
      console.log("Connected to tickets_db!");
});


app.get('/', function (req, res) {
    res.send('ticket service is running');
});

app.get('/api/v1/tickets', async (req, res) => {
    const name = req.headers['x-user-name'];
    //console.log(a);
    //const dbQuery = `SELECT * FROM Ticket where username = '${name}';`;
    const dbQuery = `SELECT * FROM Ticket;`;
    console.log(dbQuery)
    tickets_db.query(dbQuery, (err, dbRes) => {
    console.log(err);
    console.log(dbRes)
    res.status(200).json(dbRes.rows);
    });
});

app.get('/api/v1/tickets/:ticketUid', async (req, res) => {
    const id = req.params.ticketUid;
    const name = req.headers['x-user-name'];
    console.log(id);
    const dbQuery = `SELECT * FROM Ticket where ticket_uid = '${id}';`;
    console.log(dbQuery)
    tickets_db.query(dbQuery, (err, dbRes) => {
    //console.log(err);
    if (typeof dbRes !== 'undefined') {
        console.log(dbRes.rows)
        res.status(200).json(dbRes.rows);
    }
    else {
        res.status(404).json(null)
    }
    })
    
});

app.patch('/api/v1/tickets/:ticketUid', async (req, res) => {
    const id = req.params.ticketUid;
    const name = req.headers['x-user-name'];
    const { status } = req.body;
    console.log(id, status);
    const dbQuery = `update Ticket set status = '${status}' where ticket_uid = '${id}' returning *;`;
    console.log(dbQuery)
    tickets_db.query(dbQuery, (err, dbRes) => {
    console.log("Res: ", dbRes, "err: ", err);
    if (typeof dbRes !== 'undefined') {
        if (dbRes.rows[0]['username'] === name) {
            console.log(dbRes.rows)
            res.status(200).json(dbRes.rows);
        }
        else {
            res.status(404).json(null)
        }
    }
    else {
        res.status(404)
    }
    })
    
});

app.post('/api/v1/tickets', async (req, res) => {
    let name = req.headers['x-user-name'];
    const { ticket_uid, flight_number, price } = req.body
    console.log(ticket_uid, flight_number, price)
    let fQuery =
    `select * from Ticket;`
    let cnt = tickets_db.query(fQuery)
    console.log((await cnt).rows.length)
    let hQuery =
    `insert into Ticket(id, ticket_uid, username, flight_number, price, status) values (${(await cnt).rows.length + 1}, '${ticket_uid}', '${name}', '${flight_number}', ${price}, 'PAID') returning *;`;
    console.log(hQuery)
    const res_insert = tickets_db.query(hQuery)
    console.log((await res_insert))
    res.status(200).json(res_insert)
  }); 

app.get('/manage/health', function (req, res) {
    res.status(200).json(null)
});



app.listen(app.get('port'), function(){
    console.log(`Server listening on port `, app.get('port'));
});

