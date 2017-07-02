var pg = require('pg');
if (process.env.DATABASE_URL) {
    pg.defaults.ssl = true;
}

var connString = process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/sequence';
const {
    Pool
} = require('pg');

const pool = new Pool({
    connectionString: connString,
    max: 1000
});

module.exports = pool;