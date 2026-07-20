import retry from "async-retry";
import { faker } from "@faker-js/faker";

import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/user.js";

async function waitForAllServices() {
  await waitforWebServer();

  async function waitforWebServer() {
    return retry(fechStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fechStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (response.status !== 200) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userObject) {
  return await user.create({
    username:
      userObject.username ||
      faker.internet.username().replace(/[^a-zA-Z0-9]/g, ""),

    email: userObject.email || faker.internet.email(),
    password: userObject.password || faker.internet.password(),
  });
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
};

export default orchestrator;
