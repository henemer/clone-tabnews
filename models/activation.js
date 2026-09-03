import email from "infra/email.js";
import database from "infra/database";
import webserver from "infra/webserver";
import { NotFoundError, ForbiddenError } from "infra/errors.js";
import user from "models/user.js";
import authorization from "./authorization";

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

async function markTokenAsUsed(activationTokenId) {
  const usedActivationToken = await runUpdateQuery(activationTokenId);
  return usedActivationToken;

  async function runUpdateQuery(activationTokenId) {
    const result = await database.query({
      text: `UPDATE user_activation_tokens SET 
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now()) 
        WHERE 
          id = $1 
        RETURNING *`,
      values: [activationTokenId],
    });
    return result.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const userToActivate = await user.findOneById(userId);

  if (!authorization.can(userToActivate, "read:activation_token")) {
    throw new ForbiddenError({
      message: "Você não pode mais utilizar tokens de ativação.",
      action: "Entre em contato com o suporte.",
    });
  }

  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);
  return activatedUser;
}

const activation = {
  sendEmailToUser,
  create,
  findOneValidById,
  markTokenAsUsed,
  activateUserByUserId,
  EXPIRATION_IN_MILLISECONDS,
};

export default activation;
