import email from "infra/email.js";
import database from "infra/database";
import webserver from "infra/webserver";
import { NotFoundError } from "infra/errors.js";

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

async function findOneValidById(activationTokenId) {
  const activationTokenObject = await runSelectQuery(activationTokenId);

  return activationTokenObject;

  async function runSelectQuery(activationTokenId) {
    const results = await database.query({
      text: `SELECT * FROM user_activation_tokens WHERE id = $1 AND used_at IS NULL AND expires_at > NOW()`,
      values: [activationTokenId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação não foi encontrado no sistema ou já expirou",
        action: "Faça um novo cadastro",
      });
    }

    return results.rows[0];
  }
}

const activation = {
  sendEmailToUser,
  create,
  findOneValidById,
};

export default activation;
