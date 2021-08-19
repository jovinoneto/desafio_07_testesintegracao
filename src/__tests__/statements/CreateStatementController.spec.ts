import { Connection } from "typeorm";
import request from "supertest";

import authConfig from "../../config/auth";
import createConnection from "../../database";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { UsersRepository } from "../../modules/users/repositories/UsersRepository";
import { User } from "../../modules/users/entities/User";
import { app } from "../../app";
import { v4 as uuid } from "uuid";

let connection: Connection;
let token: string;
let user: User;

describe("Create Statement", () => {

  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const usersRepository = new UsersRepository();

    user = await usersRepository.create({
      name: "Statement Create",
      email: "statementcreate@email.com.br",
      password: await hash("1234", 8),
    });

    const { secret, expiresIn } = authConfig.jwt;

    token = sign({ user }, secret, {
      subject: user.id,
      expiresIn
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to create deposit statement", async () => {
    const statement = {
      description: "Deposit",
      amount: 100
    }

    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .set({Authorization: `Bearer ${token}`})
      .send({
        amount: statement.amount,
        description: statement.description,
      });

    expect(response.status).toBe(201);
  });

  it("should be able to create withdraw statement", async () => {
    const statement = {
      description: "withdraw",
      amount: 100
    }

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .set({Authorization: `Bearer ${token}`})
      .send({
        amount: statement.amount,
        description: statement.description,
      });

    expect(response.status).toBe(201);
  });

  it("should not be able to create statement with unexisting user", async () => {
    const { secret, expiresIn } = authConfig.jwt;

    const id = uuid();
    const token = sign({}, secret, {
      subject: id,
      expiresIn
    });

    const statement = {
      description: "withdraw",
      amount: 100
    }

    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .set({Authorization: `Bearer ${token}`})
      .send({
        amount: statement.amount,
        description: statement.description,
      });

    expect(response.status).toBe(404);
  });
  
});