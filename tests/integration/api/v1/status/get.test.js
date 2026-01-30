test("GET  to /api/v1/status shoul retorn 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  expect(response.status).toBe(200);

  const responseBody = await response.json();

  const parsedUpdatesAt = new Date(responseBody.updated_at).toISOString(); // Verifica se é uma data válida
  expect(responseBody.updated_at).toEqual(parsedUpdatesAt);

  expect(responseBody.dependencies.database.version).toEqual("16.11");
  expect(responseBody.dependencies.database.opened_connections).toEqual(1);
  expect(responseBody.dependencies.database.max_connections).toEqual(100);
});
