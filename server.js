const express = require('express'); 
const mime = require('mime');
const app = express();
var path = require('path');
const mysql = require('mysql');
var labels = [];
var data = [];

const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: '3306',
  user: 'myUser1',
  password: '1111',
  database: 'account_books'
});



app.use(express.static(path.join(__dirname, 'www')));
app.use('/js', express.static(path.join(__dirname,  'node_modules', 'bootstrap', 'dist', 'js')));
app.use('/css', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'css')));

mime.define({
  'text/css': ['css'],
  'text/javascript': ['js'],
});



app.get('/', (req,res)=>{
  res.sendFile(__dirname+'/index.html');
});

app.get('/calandar', (req,res)=>{
  res.sendFile(__dirname+'/calandar.html');
});


connection.connect((err)=>{
  if(err){
    console.error('Error connecting to database: ', err);
    return;
  }
  console.log('Connect to database');
});

app.get('/data', (req, res) => {
  connection.query('SELECT * FROM test1', (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      return;
    }
    
    // Do something with the query results
    // 결과를 JSON 형식으로 변환합니다.
    const jsonData = JSON.stringify(results);

    // JSON 형식의 데이터를 클라이언트로 전송합니다.
    res.send(jsonData);
  });
});




app.listen(3000,(err)=>{
  if(!err){
    console.log('server has started');
  }
});




/*app.get('/', function (req, res) {
	res.send('Hello World Express'); 
}); 

app.listen(8005);*/
