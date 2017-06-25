var pg = require('pg')
pg.defaults.ssl = true;

var config = {
  url: 'ec2-54-163-254-76.compute-1.amazonaws.com',
  user: 'dmevjejangdqdf', // name of the user account
  database: 'detl5lhln3583p', // name of the database
  password: '075885152140cafe91c44c910183efcdd5dc8bf1b43261ee57064b23adbd57ef',
  max: 50, // max number of clients in the pool
  idleTimeoutMillis: 30000 
}

var pool = new pg.Pool(config);

module.exports = pool;