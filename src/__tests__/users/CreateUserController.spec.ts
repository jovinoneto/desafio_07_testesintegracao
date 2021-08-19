import { Connection } from "typeorm";
import request from "supertest";

import createConnection from "../../database";
import { app } from "../../app";

let connection: Connection;

describe("Create User", () => {

  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to create a new user", async () => {
  
    const response = await request(app).post("/api/v1/users").send({
      name: "User Create",
      email: "usercreate@email.com.br",
      password: "123",
    });
    
    expect(response.status).toBe(201);
  });

  it("should not be able to create a new user with already used email", async () => {
    
    const response = await request(app).post("/api/v1/users").send({
      name: "User Create Already",
      email: "usercreate@email.com.br",
      password: "123",
    });
    
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "User already exists"
    })
  });

});