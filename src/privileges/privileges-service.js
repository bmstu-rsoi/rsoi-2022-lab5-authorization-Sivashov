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
app.set('port', (process.env.PORT || 8050));
app.set('UserName', 'Test Max')

app.use(logger('combined')); // выводим все запросы со статусами в консоль
app.use(bodyParser.json()); // стандартный модуль, для парсинга JSON в запросах
app.use(methodOverride()); // поддержка put и delete


const pg = require('pg');
const privileges_db = new pg.Client({
  user: 'postgres',
  host: 'postgres-service',
  database: 'postgres',
  password: 'postgres',
  port: 5432,
  ssl: false,
});

privileges_db.connect(function (err){
  if(err)
      console.log(err);
  else
      console.log("Connected to privilegies_db!");
});

app.get('/', function (req, res) {
    res.send('bonus service is running');
  });
  

app.get('/api/v1/me', async (req, res) => {
  let name = req.headers['x-user-name'];
  if (typeof name === 'undefined' || name === null) {
    name = app.get('UserName')
  }
  console.log(name);
  const dbQuery = `SELECT * FROM Privilege where username = '${name}';`;
  //console.log(dbQuery)
  privileges_db.query(dbQuery, (err, dbRes) => {
  console.log(err);
  console.log(dbRes)
  if (typeof dbRes !== 'undefined') {
      if (dbRes.rows[0]['username'] === name) {
          console.log(dbRes.rows)
          res.status(200).json(dbRes.rows);
          return dbRes.rows;
      }
      else {
          res.status(400).json(null)
      }
  }
  else {
      res.status(400).json(null)
  }
  })
    
});

app.get('/api/v1/history', async (req, res) => {
  let priv_id = req.params['id'];
  if (typeof priv_id === 'undefined' || priv_id === null) {
    priv_id = 1
  }
  console.log(priv_id);
  const dbQuery = `SELECT * FROM Privilege_history where privilege_id = '${priv_id}';`;
  //console.log(dbQuery)
  privileges_db.query(dbQuery, (err, dbRes) => {
  console.log(err);
  console.log(dbRes)
  if (typeof dbRes !== 'undefined') {
        console.log(dbRes.rows)
        res.status(200).json(dbRes.rows);
        return dbRes.rows;
  }
  else {
      res.status(400).json(null)
  }
  })
    
});

app.patch('/api/v1/privileges', async (req, res) => {
  //let name = req.headers['x-user-name'];
  const { username, ticket_price } = req.body
  console.log(username, ticket_price)
  const dbQuery = `SELECT * FROM Privilege where username = '${username}';`;
  const data = privileges_db.query(dbQuery)
  const balance = (await data).rows[0].balance
  const privilege_id = (await data).rows[0].id
  console.log(balance)
  if ((await balance) !== undefined)
  {
    let value = (await balance) - ticket_price
    if (value < 0){
      value = 0
    }
    console.log("Value: ", value)
    const dQuery = `update Privilege set balance = ${value} where username = '${username}';`;
    const result = privileges_db.query(dQuery)
    //console.log((await result).rows[0])

    let value_diff;
    if (ticket_price >= balance) {
      value_diff = balance * -1
    }
    else {
      value_diff = ticket_price * -1
    }
    let hQuery;
    let fQuery =
    `select max(id) from Privilege_history;`
    let cnt = privileges_db.query(fQuery)
    console.log("History data 1: ", await cnt)
    if (value_diff < 0) {
      hQuery =
      `insert into Privilege_history(id, privilege_id, ticket_uid, datetime, balance_diff, operation_type) values (${(await cnt).rows[0].max + 1}, ${privilege_id}, uuid_generate_v4(), now(), ${value_diff}, 'DEBIT_THE_ACCOUNT') returning ticket_uid;`;
    }
    else {
      hQuery =
      `insert into Privilege_history(id, privilege_id, ticket_uid, datetime, balance_diff, operation_type) values (${(await cnt).rows[0].max + 1}, ${privilege_id}, uuid_generate_v4(), now(), ${value_diff}, 'FILL_IN_BALANCE') returning ticket_uid;`;
    
    }
    const res_insert = privileges_db.query(hQuery)
    console.log((await res_insert))
    console.log(res_insert)
    res.status(200).json({difference: value_diff, uuid: (await res_insert).rows[0].ticket_uid})
  }
  else {
    res.status(400).json(null)
  }
}); 

app.post('/api/v1/privileges', async (req, res) => {
  let name = req.headers['x-user-name'];
  const { ticket_uid } = req.body
  console.log(ticket_uid)
  const dbQuery = `SELECT * FROM Privilege_history where ticket_uid = '${ticket_uid}';`;
  const result = privileges_db.query(dbQuery)
  console.log((await result).rows[0])
  let value = (await result).rows[0].balance_diff
  let priv_id = (await result).rows[0].privilege_id
  console.log("Ins values: ", value, priv_id)
  const dhQuery = `SELECT * FROM Privilege where id = ${priv_id};`;
  const resul = privileges_db.query(dhQuery)
  console.log((await resul).rows[0])
  let val = (await resul).rows[0].balance
  val = val - value
  if (val < 0) {
    val = 0
  }

  //const dQuery = `update Privilege set balance = ${val} where id = ${priv_id};`;
  const dQuery = `update Privilege set balance = ${val} where id = 1;`;
  console.log(dQuery)
  const result2 = privileges_db.query(dQuery)
  //console.log((await result2).rows[0])

  let data = (await result).rows[0]
  let hQuery;
  let fQuery =
    `select max(id) from Privilege_history;`
  let cnt = privileges_db.query(fQuery)
  console.log("History data: ", await cnt)
  if (data.operation_type === 'FILL_IN_BALANCE') {
    hQuery =
    `insert into Privilege_history(id, privilege_id, ticket_uid, datetime, balance_diff, operation_type) values (${(await cnt).rows[0].max + 1}, ${priv_id}, '${ticket_uid}', now(), ${value * -1}, 'DEBIT_THE_ACCOUNT') returning ticket_uid;`;
  }
  else {
    hQuery =
    `insert into Privilege_history(id, privilege_id, ticket_uid, datetime, balance_diff, operation_type) values (${(await cnt).rows[0].max + 1}, ${priv_id}, '${ticket_uid}', now(), ${value * -1}, 'FILL_IN_BALANCE') returning ticket_uid;`;
  }
  const res_insert = privileges_db.query(hQuery)
  console.log((await res_insert))

  res.status(200).json({uuid: (await res_insert).rows[0].ticket_uid})
}); 

app.get('/manage/health', function (req, res) {
    res.status(200).json(null)
});



app.listen(app.get('port'), function(){
    console.log(`Server listening on port `, app.get('port'));
  });

