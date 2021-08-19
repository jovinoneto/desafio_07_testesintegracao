import { Connection } from "typeorm";
import request from "supertest";

import createConnection from "../../database";
import authConfig from "../../config/auth"
import { app } from "../../app";
import { UsersRepository } from "../../modules/users/repositories/UsersRepository";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";

let connection: Connection;

describe("Show User Profile", () => {

  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to show user profile", async () => {
    const usersRepository = new UsersRepository();

    const user = await usersRepository.create({
      name: "User Profile",
      email: "userprofile@email.com",
      password: "12345"
    });
    
    const { secret, expiresIn } = authConfig.jwt;

    const token = sign({ user }, secret, {
      subject: user.id,
      expiresIn
    });
   
    const response = await request(app).get("/api/v1/profile").set({
      Authorization: `Bearer ${token}`
    }).send()
   
    expect(response.status).toBe(200)
  });

  it("should not be able to show user profile of non-existing user", async () => {
    const usersRepository = new UsersRepository();

    const user = await usersRepository.create({
      name: "Profiel Non Existing",
      email: "profileno-existing@email.com",
      password: await hash("12345", 8),
  });

  const id = user.id;

  const response = await request(app).get("/api/v1/profile").send(id);

    expect(response.status).toBe(401);
  });
  
});