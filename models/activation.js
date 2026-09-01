import email from "infra/email.js";
import database from "infra/database";
import webserver from "infra/webserver";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);

  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const result = await database.query({
      text: `INSERT INTO user_activation_tokens (user_id, expires_at)
       VALUES ($1, $2)
       RETURNING *`,
      values: [userId, expiresAt],
    });
    return result.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "OSControle <contato@oscontrole.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no OSControle!",
    text: `Olá ${user.username}, clique no link abaixo para ativar seu cadastro no OSControle.

${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente,
Equipe OSControle

`,
  });
}

async function findOneByUserId(userId) {
  const newToken = await runSelectQuery(userId);
  return newToken;

  async function runSelectQuery(userId) {
    const result = await database.query({
      text: `SELECT * FROM user_activation_tokens WHERE user_id = $1`,
      values: [userId],
    });
    return result.rows[0];
  }
}

const activation = {
  sendEmailToUser,
  create,
  findOneByUserId,
};

export default activation;
