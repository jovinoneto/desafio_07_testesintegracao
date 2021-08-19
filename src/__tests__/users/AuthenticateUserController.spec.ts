import { Connection } from "typeorm";
import request from "supertest";

import createConnection from "../../database";
import authConfig from "../../config/auth";
import { app } from "../../app";
import { verify } from "jsonwebtoken";

let connection: Connection;

describe("Authenticate User", () => {

  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const user = await request(app).post("/api/v1/users").send({
      name: "User Authenticate",
      email: "authenticate@teste.com",
      password: "12345"
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to authenticate an user", async () => {
        
    const response = await request(app).post("/api/v1/sessions").send({
      email: "authenticate@teste.com",
      password: "12345",
    })

    expect(response.status).toBe(200);
    expect(() => {
      verify(response.body.token, authConfig.jwt.secret);
    }).not.toThrowError();
  });

  it("should not be able to authenticate user with incorrect password", async () => {
    
    const response = await request(app).post("/api/v1/sessions").send({
      email: "authenticate@teste.com",
      password: "1234",
    })
    
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Incorrect email or password"
    });
  });

});