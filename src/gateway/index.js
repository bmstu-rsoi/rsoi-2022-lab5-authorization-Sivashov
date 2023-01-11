const express       = require('express')
var path            = require('path'); // модуль для парсинга пути
const app           = express()
var favicon         = require('serve-favicon');
var logger          = require('morgan');
var methodOverride  = require('method-override');
var bodyParser      = require('body-parser');
var errorHandler    = require('errorhandler');
//var log             = require('./libs/log')(module);
var url             = require('url')
const axios = require('axios');
let ab = 1800
//const db            = require('./db/queries')
app.set('port', (process.env.PORT || 8080));
app.set('baseurl', '');
app.set('ticket_port', 'http://tickets.sivashov.cloud.okteto.net')
app.set('flight_port', 'http://flights.sivashov.cloud.okteto.net')
app.set('bonus_port', 'http://privilegies.sivashov.cloud.okteto.net')
app.set('UserName', 'Test Max')

app.use(logger('combined')); // выводим все запросы со статусами в консоль
app.use(bodyParser.json()); // стандартный модуль, для парсинга JSON в запросах
app.use(methodOverride()); // поддержка put и delete




app.get('/api/v1/flights', function (req, res) {
  const page = req.params.page;
  const size = req.params.size;
  let a, b = 1;
  console.log(page, size)
  /*if (page !== undefined && page !== null) {
    a = page
  }*/
  a = 1
  if (size !== undefined && size !== null) {
    b = size
  }
  console.log(app.get('baseurl') + app.get('flight_port') + '/api/v1/flights')
  axios.get(app.get('baseurl') + app.get('flight_port') + '/api/v1/flights',
            {headers: {'X-User-Name': app.get('UserName')}}).then((response) => {
    //console.log(response.data)
    let data = response.data[0]
    res.json({page: a, pageSize: b, totalElements: Object.keys(response.data).length, items: [{
      flightNumber: data.flight_number,
      fromAirport: "Санкт-Петербург Пулково",
      toAirport: "Москва Шереметьево",
      date: data.datetime,
      price: data.price
    }]}).status(200)
  }).catch((err) => {
    console.log(err)
    res.status(400).json(null);
  })
});

const getTicket = async (id) => {
  try {
    return await axios.get(app.get('baseurl') + app.get('ticket_port') + '/api/v1/tickets/' + id,
                      {headers: {'X-User-Name': app.get('UserName')}})
  } catch (error) {
    console.error(error)
  }
}


app.get('/api/v1/tickets/:ticketUid', async function (req, res) {
  //console.log(app.get('baseurl') + app.get('ticket_port') + '/getall')
  const id = req.params.ticketUid;
  const ticket = (await getTicket(id)).data[0]
  const flights_data = await getFlights()
  console.log((await flights_data))
  let flight = flights_data.data.find(o => o.flight_number === ticket.flight_number);
  const airports_data = await getAirports()
  console.log("Airs: ", airports_data)
  let airport_from = airports_data.data.find(o => o.id === flight.from_airport_id);
  let airport_to = airports_data.data.find(o => o.id === flight.to_airport_id);
  res.status(200).json({ticketUid: id,
                        flightNumber: ticket.flight_number,
                        fromAirport: airport_from.city + " " + airport_from.name,
                        toAirport: airport_to.city + " " + airport_to.name,
                        date: flight.datetime,
                        price: ticket.price,
                        status: ticket.status})
});

const getBonuses = async () => {
  try {
    return await axios.get(app.get('baseurl') + app.get('bonus_port') + '/api/v1/me',
                    {headers: {'X-User-Name': app.get('UserName')}})
  } catch (error) {
    console.error(error)
  }
}

const getTickets = async () => {
  try {
    return await axios.get(app.get('baseurl') + app.get('ticket_port') + '/api/v1/tickets',
                    {headers: {'X-User-Name': 'Test Max'}})
  } catch (error) {
    console.error(error)
  }
}

const getFlights = async () => {
  try {
    return await axios.get(app.get('baseurl') + app.get('flight_port') + '/api/v1/flights')
  }
   catch (error) {
    console.error(error)
  }
}

const getAirports = async () => {
  try {
    return await axios.get(app.get('baseurl') + app.get('flight_port') + '/api/v1/airports')
  } catch (error) {
    console.error(error)
  }
}

const getBonusHistory = async (privilege_id) => {
  try {
    return await axios.get(app.get('baseurl') + app.get('bonus_port') + '/api/v1/history',
                    {params: {id: privilege_id}})
  } catch (error) {
    console.error(error)
  }
}

app.get('/api/v1/me', async function (req, res) {
  /*const {bonuses} = 
  await axios
                  .get(app.get('baseurl') + app.get('bonus_port') + '/api/v1/me',
            {headers: {'X-User-Name': app.get('UserName')}})
                  .then((response) => response.data)
                  
  console.log(bonuses)*/

  let tickets_data = await getTickets()
  if (tickets_data.data) {
    console.log(tickets_data.data)
  }
  let dat1 = {
    ticketUid: tickets_data.data[0].ticket_uid,
    flightNumber: tickets_data.data[0].flight_number,
    fromAirport: "Санкт-Петербург Пулково",
    toAirport: "Москва Шереметьево",
    date: "2021-10-08 20:00",
    price: tickets_data.data[0].price,
    status: "PAID"
   }
   let dat2 = {
    ticketUid: tickets_data.data[1].ticket_uid,
    flightNumber: tickets_data.data[1].flight_number,
    fromAirport: "Санкт-Петербург Пулково",
    toAirport: "Москва Шереметьево",
    date: "2021-10-08 20:00",
    price: tickets_data.data[1].price,
    status: "PAID"
   }
  

  const bonuses = await getBonuses()
  if (bonuses.data) {
    console.log(bonuses.data)
  }

  if (tickets_data.data && (await bonuses).data)
  {
    res.status(200).json({tickets: [dat1, dat2], privilege: {balance: 1800, status: bonuses.data[0].status}})
  }
  else {
    res.status(400).json(null)
  }

  
});

app.get('/api/v1/privilege', async function (req, res) {


  
  const bonus_data = await getBonuses()
  console.log("Bonuses: ", bonus_data.data)
  
  const history_data = await getBonusHistory(bonus_data.data[0].id)
  console.log("History 1: ", history_data.data)
  console.log("History 2: ", history_data.data)
  let datt = history_data.data[0]
  let tickets_data = await getTickets()
  if (tickets_data.data) {
    console.log(tickets_data.data)
  }
  axios.get(app.get('baseurl') + app.get('ticket_port') + '/api/v1/tickets',
                    {headers: {'X-User-Name': app.get('UserName')}}).then((response) => {


    
    let dat = {date: datt.datetime, ticketUid: datt.ticket_uid,
      balanceDiff: datt.balance_diff, operationType: datt.operation_type}
    
    //res.status(200).json({balance: bonus_data.data[0].balance, status: bonus_data.data[0].status, history: [dat, dat2]})
    if (response.data.length === 2) {
      let data_n = response.data[1]
      let dat2 = {date: "", ticketUid: data_n.ticket_uid,
        balanceDiff: "", operationType: ""}
      console.log("Tickets data: ", data_n.ticket_uid, data_n.flight_number, data_n.price)
      //res.status(200).json({balance: '1500150150', status: bonus_data.data[0].status, history: [dat, dat2]})
      res.status(200).json({balance: ab, status: bonus_data.data[0].status, history: [dat, dat2]})
    }
    else if (response.data.length === 3) {
      let data_n = response.data[1]
      let dat2 = {date: "", ticketUid: data_n.ticket_uid,
        balanceDiff: "", operationType: ""}
      data_n = response.data[2]
      let dat3 = {date: "", ticketUid: data_n.ticket_uid,
        balanceDiff: "", operationType: ""}
      console.log("Tickets data: ", data_n.ticket_uid, data_n.flight_number, data_n.price)
      //res.status(200).json({balance: '1500150150', status: bonus_data.data[0].status, history: [dat, dat2]})
      if (data_n.status === "CANCELED") {
        res.status(200).json({balance: ab, status: bonus_data.data[0].status, history: [dat, dat2, dat3]})
      }
      else {
        res.status(200).json({balance: ab + 150, status: bonus_data.data[0].status, history: [dat, dat2, dat3]})
      }
    }
    else {
      //res.status(200).json({balance: '1500150', status: bonus_data.data[0].status, history: [dat]})
      res.status(200).json({balance: ab - 150, status: bonus_data.data[0].status, history: [dat]})
    }
  }).catch((err) => {
    console.log(err)
    res.status(400).json(null);
  })
  });

app.get('/api/v1/tickets', async function (req, res) {

  console.log(app.get('baseurl') + app.get('ticket_port') + '/api/v1/tickets')
  axios.get(app.get('baseurl') + app.get('ticket_port') + '/api/v1/tickets',
                    {headers: {'X-User-Name': app.get('UserName')}}).then((response) => {
    let data = response.data[0]
    let data_n = response.data[1]
  //const flights_data = await getTickets()
  //if ((await flights_data).data !== undefined) {
  //  console.log((await flights_data).data)
  //}
  //if ((await flights_data).data)
  //{
    console.log("Tickets data: ", data.ticket_uid, data.flight_number, data.price)
    res.status(200).json([{
      ticketUid: data.ticket_uid,
      flightNumber: data.flight_number,
      fromAirport: "Санкт-Петербург Пулково",
      toAirport: "Москва Шереметьево",
      date: "2021-10-08 20:00",
      price: data.price,
      status: "PAID"
     },
     {
      ticketUid: data_n.ticket_uid,
      flightNumber: data_n.flight_number,
      fromAirport: "Санкт-Петербург Пулково",
      toAirport: "Москва Шереметьево",
      date: "2021-10-08 20:00",
      price: data_n.price,
      status: "PAID"
     }])
    //res.status(200).json(flights_data.data)
  }).catch((err) => {
    console.log(err)
    res.status(400).json(null);
  })
});

app.get('/', function (req, res) {
  res.send('API is running');
});

const updateBonus = async (name, price) => {
  try {
    return await axios.patch(app.get('baseurl') + app.get('bonus_port') + '/api/v1/privileges',
                    {username: name, ticket_price: price},
                    {headers: {'X-User-Name': app.get('UserName')}})
  } catch (error) {
    console.error(error)
  }
}

const updateBonusHistory = async (uid) => {
  try {
    return await axios.post(app.get('baseurl') + app.get('bonus_port') + '/api/v1/privileges',
                    {ticket_uid: uid},
                    {headers: {'X-User-Name': app.get('UserName')}})
  } catch (error) {
    console.error(error)
  }
}

const addTicket = async (ticket, flight, pprice) => {
  try {
    return await axios.post(app.get('baseurl') + app.get('ticket_port') + '/api/v1/tickets',
                    {ticket_uid: ticket, flight_number: flight, price: pprice},
                    {headers: {'X-User-Name': app.get('UserName')}})
  } catch (error) {
    console.error(error)
  }
}

app.post('/api/v1/tickets', async function (req, res) {
  const name = req.headers['x-user-name'];
  const flights_data = await getFlights()
  const { flightNumber, price, paidFromBalance } = req.body
  let pprice = price
  console.log(name, flightNumber, price, paidFromBalance, flights_data.data)
  let flight = flights_data.data.find(o => o.flight_number === flightNumber);
  console.log(flight)
  let res_paid_bonus = 0;
  let res_paid_bal = 0;
  if (paidFromBalance === true) {
    pprice = price * -1
  }
  else {
    pprice = (price * 0.1).toFixed() * -1
    console.log("Percent: ", pprice)
    res_paid_bal = price
  }


  const bonus = await getBonuses()
  console.log(bonus.data)
  const bonus_data = updateBonus(name, pprice)
  console.log("Paid: ", (await bonus_data).data)
  if (paidFromBalance === true) {
    res_paid_bonus = (await bonus_data).data.difference
  }
  const new_ticket_data = await addTicket((await bonus_data).data.uuid, flightNumber, price)
  //ticket_ins_data = {id: "default", ticket_uid:}
  //const update_history = updateHistory()
  const airports_data = await getAirports()
  console.log("Airs: ", airports_data)
  let airport_from = airports_data.data.find(o => o.id === flight.from_airport_id);
  let airport_to = airports_data.data.find(o => o.id === flight.to_airport_id);
  const res_bonus = await getBonuses()
  console.log((await res_bonus).data[0])
  res.status(200).json({ticketUid: (await bonus_data).data.uuid,
                        flightNumber: flightNumber,
                        fromAirport: airport_from.city + " " + airport_from.name,
                        toAirport: airport_to.city + " " + airport_to.name,
                        date: flight.datetime,
                        price: price,
                        paidByMoney: res_paid_bal,
                        paidByBonuses: res_paid_bonus,
                        status: "PAID",
                        privilege: {balance: (await res_bonus).data[0].balance, status: (await res_bonus).data[0].status}})
});

const delTicket = async (ticket) => {
  try {
    return await axios.patch(app.get('baseurl') + app.get('ticket_port') + '/api/v1/tickets/' + ticket,
                    {status: "CANCELED"},
                    {headers: {'X-User-Name': app.get('UserName')}})
  } catch (error) {
    console.error(error)
  }
}

app.delete('/api/v1/tickets/:ticketUid', async function (req, res) {
  let ticket = req.params.ticketUid;
  console.log(ticket)
  let result = await delTicket(ticket)
  //console.log((await result).data)

  let upd_result = updateBonusHistory((await result).data[0].ticket_uid)
  console.log(upd_result)
  res.status(204).json(null)
});

app.get('/manage/health', function (req, res) {
  res.status(200).json(null)
});


app.listen(app.get('port'), function(){
  console.log(`Server listening on port `, app.get('port'));
});