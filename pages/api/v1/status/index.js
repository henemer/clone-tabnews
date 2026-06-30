import database from "infra/database.js";
import { InternalServerError } from "infra/errors.js";

async function status(request, response) {
  try {
    const updatedAt = new Date().toISOString();

    const databaseVersionResult = await database.query("SHOW server_version;");
    const databaseVersionValue = databaseVersionResult.rows[0].server_version;

    const dataBaseName = process.env.POSTGRES_DB;
    const databaseOpenedConnectionsResult = await database.query({
      text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
      values: [dataBaseName],
    });

    const databaseOpenedConnectionsValue =
      databaseOpenedConnectionsResult.rows[0].count;

    const databaseMaxConnectionsResult = await database.query(
      "SHOW max_connections;",
    );
    const databaseMaxConnectionsValue = parseInt(
      databaseMaxConnectionsResult.rows[0].max_connections,
    );

    response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          version: databaseVersionValue,
          opened_connections: databaseOpenedConnectionsValue,
          max_connections: databaseMaxConnectionsValue,
        },
      },
    });
  } catch (error) {
    const publicErrorObject = new InternalServerError({
      cause: error,
    });

    console.log("\n Erro dentro do catch do controller de status \n");
    console.error(publicErrorObject);
    response.status(500).json(publicErrorObject);
  }
}

export default status;
