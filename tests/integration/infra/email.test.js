import email from "infra/email.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "OSControle <contato@oscontrole.com.br>",
      to: "contato@henning.com.br",
      subject: "teste de assunto",
      text: "Teste de corpo.",
    });

    await email.send({
      from: "OSControle <contato@oscontrole.com.br>",
      to: "contato@henning.com.br",
      subject: "Ultimo Email",
      text: "Corpo do Último email.",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<contato@oscontrole.com.br>");
    expect(lastEmail.recipients[0]).toBe("<contato@henning.com.br>");
    expect(lastEmail.subject).toBe("Ultimo Email");
    expect(lastEmail.text).toBe("Corpo do Último email.\r\n");
  });
});
