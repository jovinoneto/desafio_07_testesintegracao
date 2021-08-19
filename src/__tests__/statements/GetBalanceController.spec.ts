import { Connection } from "typeorm";
import request from "supertest";

import authConfig from "../../config/auth";
import createConnection from "../../database"
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { StatementsRepository } from "../../modules/statements/repositories/StatementsRepository";
import { User } from "../../modules/users/entities/User";
import { UsersRepository } from "../../modules/users/repositories/UsersRepository";
import { app } from "../../app";
import { v4 as uuid } from "uuid";

let connection: Connection;
let token: string;
let receiverUser: User;
let senderUser: User;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw"
 }

describe("Get Balance", () => {

  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const usersRepository = new UsersRepository();

    receiverUser = await usersRepository.create({
      name: "Receiver",
      email: "receiver@email.com",
      password: await hash("1234", 8)
    });

    senderUser = await usersRepository.create({
      email: "sender@email.com",
      name: "Sender",
      password: await hash("1234", 8)
    });

    const { secret, expiresIn } = authConfig.jwt;

    token = sign({ senderUser }, secret, {
      subject: senderUser.id,
      expiresIn
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to get balance", async () => {
    const statementsRepository = new StatementsRepository();
  
    const statementD = await statementsRepository.create({
      amount: 100,
      description: "Deposit",
      type: "deposit" as OperationType,
      user_id: senderUser.id || ""
    });
  
    const statementW = await statementsRepository.create({
      amount: 25,
      description: "Withdraw",
      type: "withdraw" as OperationType,
      user_id: senderUser.id || ""
    });
  
    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${token}`
      })
      .send();

    expect(response.status).toBe(200);
    expect(response.body.balance).toEqual(75);
  });

  it("should not be able to create statement with unexisting user", async () => {
    const { secret, expiresIn } = authConfig.jwt;

    const id = uuid();
    const token = sign({}, secret, {
      subject: id,
      expiresIn
    });

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({Authorization: `Bearer ${token}`})
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "User not found"
    });
  });

});