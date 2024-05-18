var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db/sqlite.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQlite database.');
});
db.run(`CREATE TABLE IF NOT EXISTS egg_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INT NOT NULL,
      month INT NOT NULL, 
      price DECIMAL(10,2) NOT NULL,
      UNIQUE (year, month)
    )`);
db.run(`CREATE TABLE IF NOT EXISTS milk_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INT NOT NULL,
      month INT NOT NULL, 
      price DECIMAL(10,2) NOT NULL,
      UNIQUE (year, month)
    )`);
app.get('/api/quotes', (req, res) => {
    db.all('SELECT * FROM egg_prices UNION SELECT * FROM milk_prices', (err, rows) => {
        if (err) {
            console.error(err.message);
        }
        res.json(rows);
    });
});

app.get('/api/search', (req, res) => {
    const year = req.query.year;
    const month = req.query.month;
    const products = req.query.products;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;

    let sql = 'SELECT year, month, price FROM ';
    if (products === 'both') {
        sql += '(SELECT year, month, price FROM egg_prices UNION SELECT year, month, price FROM milk_prices) data ';
    } else if (products === 'egg') {
        sql += 'egg_prices ';
    } else {
        sql += 'milk_prices ';
    }

    // 添加查詢條件
    const conditions = [];
    const params = [];

    if (year && month) {
        conditions.push('year = ? AND month = ?');
        params.push(year, month);
    }

    if (minPrice && maxPrice) {
        conditions.push('price BETWEEN ? AND ?');
        params.push(minPrice, maxPrice);
    }

    if (conditions.length > 0) {
        sql += 'WHERE ' + conditions.join(' AND ');
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error querying database:', err.message);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(rows);
        }
    });
});
module.exports = app;
