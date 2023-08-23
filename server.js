const express = require('express');
const app = express();
const cors = require('cors');
const port = 8000;
//const {login, register, search} = require('./db.js');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require('body-parser')
const {Pool} = require('pg');
//require('dotenv').config()

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});


const login = async (user) => {
  const client = await pool.connect(); 
  const { rows } = await client.query(`SELECT * FROM users WHERE email_address = '${user.emailAddress}'`);
  await client.release();
  if(rows.length === 0){
    return false;
  }else{
    return rows[0].password;
  }
  
};

const register = async (user) => {
  const client = await pool.connect(); 
  const query = 'INSERT INTO users (first_name, last_name, email_address, password) VALUES ($1, $2, $3, $4)';
  const values = [user.firstName, user.lastName, user.emailAddress, user.password]
  const {rows} = await client.query(query, values);
  await client.release();
  return 'User added successfully';
};

const search = async (user) => {
  const client = await pool.connect(); 
  const { rows } = await client.query(`SELECT * FROM users WHERE email_address = '${user.emailAddress}'`);
  console.log(rows[0].email_address);
  await client.release();
  return rows[0].email_address;
}

app.use(cors());
app.use(bodyParser.json());

const auth = async (req, res, next) => {
  try {
    //   get the token from the authorization header
    const token = await req.headers.authorization.split(" ")[1];

    //check if the token matches the supposed origin
    const decodedToken = await jwt.verify(token, "RANDOM-TOKEN");

    // retrieve the user details of the logged in user
    const user = await decodedToken;

    // pass the the user down to the endpoints here
    req.user = user;

    // pass down functionality to the endpoint
    next();
    
  } catch (error) {
    res.status(401).json({
      error: "You need to login first to access this page"
    });
  }
};

app.get('/', (req, res) => {
  res.send('Server functioning correctly');
})

app.post('/login', async (req, res) => {
  const user = req.body;
  const password = await login(user);
  if(!password){
    res.status(404).send('User not found, please check that the email address entered is correct')
    return;
  }
  const passwordsMatch = await bcrypt.compare(user.password, password);
  if(!passwordsMatch){
    res.status(400).send('Incorrect password');
    return;
  }else{
    const token = jwt.sign(
      {
        email: user.emailAddress,
      },
      "RANDOM-TOKEN",
      { expiresIn: "24h" }
    );
    res.status(200).send({response: "Login successful", email: user.emailAddress, token});
  }
  
})

app.post('/register', async (req, res) => {
  const user = req.body;
  const address = await search(user);
  if(address){
    res.status(400).send('Email address already exists');
    return;
  }
  const hpassword = await bcrypt.hash(user.password, parseInt(process.env.SALT, 10))
  console.log(hpassword);
  user.password = hpassword;
  const response = await register(user);
  console.log(response);
  res.send('User registered successfully');
})

app.get('/secret', auth , (req, res) => {
  res.status(200).send({user: req.user, response: 'Login successful'})
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
})
