const sql = require('mssql/msnodesqlv8');

const config = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=FactuEduDB;Trusted_Connection=Yes;'
};

const poolPromise = sql.connect(config)
  .then(pool => {
    console.log('✅ Conectado a SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('❌ Error de conexión a SQL Server:', err);
  });

module.exports = {
  sql,
  poolPromise
};
