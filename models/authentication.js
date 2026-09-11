import user from "models/user.js";
import password from "models/password.js";
import { UnauthorizedError, NotFoundError } from "infra/errors.js";

async function getUser(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);
    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "dados de autenticação não conferem",
        action: "verifique se os dados enviados estão corretos",
      });
    }
    throw error;
  }

  async function findUserByEmail(providedEmail) {
    let storedUser;
    try {
      storedUser = await user.findOneByEmail(providedEmail);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "usuário não encontrado",
          action: "verifique se o email enviado está correto",
        });
      }
      throw error;
    }
    return storedUser;
  }

  async function validatePassword(providedPassword, storedPassword) {
    const correctPasswordMatch = await password.compare(
      providedPassword,
      storedPassword,
    );

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "senha não confere",
        action: "verifique se este dado enviado está correto",
      });
    }
  }
}

const authentication = {
  getUser,
};

export default authentication;
