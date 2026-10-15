const dns = require('dns');
const { Resolver } = require('dns');
const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

const origLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (hostname && hostname.includes('neon.tech')) {
    return resolver.resolve4(hostname, (err, addrs) => {
      if (!err && addrs && addrs.length > 0) {
        if (options && options.all) {
          return callback(null, addrs.map(a => ({ address: a, family: 4 })));
        }
        return callback(null, addrs[0], 4);
      }
      return origLookup(hostname, options, callback);
    });
  }
  return origLookup(hostname, options, callback);
};

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_u8e9bHatFTpY@ep-misty-recipe-b4mm6qtl-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected Neon Postgres client error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
