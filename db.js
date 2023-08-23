const {Pool} = require('pg');
require('dotenv').config();

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
  if(rows.length === 0){
    return false;
  }
  console.log(rows[0].email_address);
  await client.release();
  return rows[0].email_address;
}

module.exports = {login, register, search}
