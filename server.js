const express = require('express'); 
const bcrypt = require('bcrypt'); 
const bodyParser = require('body-parser');
const session = require('express-session');
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

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    secret: 'your_session_secret', // 세션 암호화를 위한 비밀키
    resave: false,
    saveUninitialized: true
  })
);

// const user = {
//   username:'test@test.com',
//   password:'test1234'
// };


// // Hash the password with bcrypt.
// const salt = bcrypt.genSaltSync(10);
// const hashedPassword = bcrypt.hashSync(user.password, salt);

// connection.connect((err)=> {
//   if(err) {
//     throw err;
//   }
  
//   const sql =`insert into users ( username, password) values (? ,?);`;
//   connection.query(sql, [user.username, hashedPassword], (err, result) => {
//     if(err) {
//       throw err; 
//     }
    
//     console.log('user created successfully');
//   })
// });




app.use(express.static(path.join(__dirname, 'www')));
app.use('/js', express.static(path.join(__dirname,  'node_modules', 'bootstrap', 'dist', 'js')));
app.use('/css', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'css')));

mime.define({
  'text/css': ['css'],
  'text/javascript': ['js'],
});



app.get('/login', (req,res)=>{
  res.sendFile(__dirname+'/login.html');
});

app.get('/Analyze', (req,res)=>{
  if (req.session.username) {
    res.sendFile(__dirname+'/Analyze.html');
  }
});

app.get('/calandar', (req,res)=>{
  if (req.session.username) {
    res.sendFile(__dirname+'/calandar.html');
  }
});



app.get('/logout',(req, res) => {
  req.session.destroy((err) => {
    if(err) {
      console.error('Error destroying session:', err);
      res.sendStatus(500);
      return;
    }
  });
  res.redirect('/login');
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

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  console.log(username);
  console.log(password);
  connection.query(`select * from users where username = ?`, [username], (err, rows) => {
    if(err){
      console.log(err);
      res.send(500);
    } else if(rows.length == 0){
      console.log(rows[0].username);
      res.send(401);
    } else {
      const isMatch = bcrypt.compareSync(password, rows[0].password);

      if(isMatch){
        req.session.username = username;
        res.redirect('/Analyze')
      }else{
        res.send(401);
      }
    }
  });
});

app.get('/', (req,res)=>{
  res.redirect('/login');
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
