import { Connection } from "typeorm";
import request from "supertest";

import authConfig from "../../config/auth";
import createConnection from "../../database";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { UsersRepository } from "../../modules/users/repositories/UsersRepository";
import { User } from "../../modules/users/entities/User";
import { StatementsRepository } from "../../modules/statements/repositories/StatementsRepository";
import { app } from "../../app";
import { v4 as uuid } from "uuid";

let connection: Connection;
let token: String;
let senderUser: User;
let receiverUser: User;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Get Statement Operation", () => {

  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations()

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

  it("should be able to get statement operation", async () => {
    const statementsRepository = new StatementsRepository();

    const statement = await statementsRepository.create({
      amount: 100,
      description: "Withdraw",
      type: "withdraw" as OperationType,
      user_id: senderUser.id || ""
    });

    const response = await request(app)
      .get(`/api/v1/statements/${statement.id}`)
      .set({
        Authorization: `Bearer ${token}`
      })
      .send();

    expect(response.status).toBe(200);    
  });

  it("should not be able to get unexisting statement operation", async () => {
    const statementsRepository = new StatementsRepository();

    const statement = await statementsRepository.create({
      amount: 100,
      description: "Deposit",
      type: "deposit" as OperationType,
      user_id: senderUser.id || ""
    });

    const { secret, expiresIn } = authConfig.jwt;

    const fakeId = uuid();
    const fakeToken = sign({}, secret, {
      subject: fakeId,
      expiresIn
    });

    const response = await request(app)
    .get(`/api/v1/statements/${statement.id}`)
    .set({
      Authorization: `Bearer ${fakeToken}`
    })
    .send();

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "User not found"
    });
  });

  it("should not be able to get unexisting statement operation", async () => {
    const fakeId = uuid();

    const response = await request(app)
      .get(`/api/v1/statements/${fakeId}`)
      .set({
        Authorization: `Bearer ${token}`
      })
      .send();

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "Statement not found"
    });
  });

});