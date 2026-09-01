import orchestration from "tests/orchestrator.js";
import activation from "models/activation.js";

beforeAll(async () => {
  await orchestration.waitForAllServices();
  await orchestration.clearDatabase();
  await orchestration.runPendingMigrations();
  await orchestration.deleteAllEmails();
});

describe("Use case: Registration flow (all successful)", () => {
  let createUserResponseBody;
  test("Create user account", async () => {
    const createUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlow",
          email: "registration.flow@henning.com.br",
          password: "RegistrationFlowPassword",
        }),
      },
    );

    expect(createUserResponse.status).toBe(201);

    createUserResponseBody = await createUserResponse.json();

    expect(createUserResponseBody).toEqual({
      id: expect.any(String),
      username: "RegistrationFlow",
      email: "registration.flow@henning.com.br",
      features: ["read:activation_token"],
      password: createUserResponseBody.password,
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestration.getLastEmail();
    expect(lastEmail.sender).toBe("<contato@oscontrole.com.br>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@henning.com.br>");
    expect(lastEmail.subject).toContain("Ative seu cadastro no OSControle!");
    expect(lastEmail.text).toContain("RegistrationFlow");

    const activationToken = await activation.findOneByUserId(
      createUserResponseBody.id,
    );
    expect(lastEmail.text).toContain(activationToken.id);

    console.log(lastEmail.text);
  });

  test("Activate user account", async () => {});
  test("Login", async () => {});

  test("Get user information", async () => {});
});
