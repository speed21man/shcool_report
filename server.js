const express = require('express'); 
const bcrypt = require('bcrypt'); 
const crypto = require('crypto');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
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

// 비밀 키 생성
const generateSecretKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// 새로운 비밀 키 생성 및 출력
const secretKey = generateSecretKey();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(flash());

app.use(
  session({
    secret: secretKey, // 세션 암호화를 위한 비밀키
    resave: false,
    saveUninitialized: true
  })
);

// const user = {
//   username:'test@test.com',
//   password:'test1234'
// };





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
  const username = req.session.username;
  connection.query(`SELECT id, userid, type_record, value, memo, DATE_FORMAT(time_record,"%Y-%m-%d") as time_record FROM account_data as a where a.userid = (select id from users where username = ? ) order by time_record desc`, [username] ,(err, results) => {
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

app.get('/calculate_month', (req, res) => {
  const username = req.session.username;
  connection.query(`SELECT DATE_FORMAT(time_record,"%Y-%m") as time_record, type_record, sum(value) as value FROM account_data as a where a.userid = (select id from users where username = ? ) group by DATE_FORMAT(time_record,"%Y-%m"), type_record order by time_record desc`, [username] ,(err, results) => {
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
    try{
      const isMatch = bcrypt.compareSync(password, rows[0].password);

      if(isMatch){
        req.session.username = username;
        res.redirect('/Analyze')
        //return res.json({ success: true });

      }else{
        return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
      }
    }
    catch{
      return res.status(401).json({ error: '로그인에 실패했습니다.' });
    }

  });
});

// 회원가입 처리
app.post('/signup', (req, res) => {
  // 클라이언트로부터 전달된 사용자명과 비밀번호 가져오기
  const join_username = req.body.join_email;
  const join_password = req.body.join_password;
  const join_conf_password = req.body.join_conf_password;

  console.log(join_username);
  console.log(join_password);
  // Hash the password with bcrypt.

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(join_password, salt);
  
  const sql =`insert into users ( username, password) values (? ,?);`;
  connection.query(sql, [join_username, hashedPassword], (err, result) => {
    if(err) {
      throw err; 
    }
    req.session.username = join_username;
    res.redirect('/Analyze');
    console.log('user created successfully');
  });
});

// 가계부 데이터 추가
app.post('/new_account_data', (req, res) => {
  // 클라이언트로부터 전달된 사용자명과 비밀번호 가져오기
    // 클라이언트로부터 전송된 데이터 가져오기
    const date1 = req.body.new_date;
    const type1 = req.body.new_select_type;
    const value1 = req.body.new_value;
    const memo1 = req.body.new_memo;
    const username = req.session.username;

  console.log(date1);
  console.log(type1);
  console.log(value1);
  console.log(memo1);

  const sql = `
    INSERT INTO account_data (userid, type_record, value, memo, time_record)
    SELECT id, ?, ?, ?, ?
    FROM users
    WHERE username = ?;
  `;

  connection.query(sql, [type1, value1, memo1, date1, username], (err, result) => {
    if (err) {
      throw err;
    }
    
    res.redirect('/calandar');
    console.log('account_data successfully added');
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

