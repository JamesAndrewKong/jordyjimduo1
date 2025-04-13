process.env.JWT_SECRET = 'asd';

const request = require('supertest');
const app = require('../../app');
const db = require('../config/database');
const axios = require('axios');
const Bcrypt = require('bcryptjs');

jest.setTimeout(100000);

const agent = request.agent(app, {});

axios.get = jest.fn().mockResolvedValue({
    data: {
        _id: 'asd123',
        userName: 'user',
        password: Bcrypt.hashSync('password', 10),
    },
});

describe('Auth', () => {
    beforeAll(async () => await db.connect());
    afterEach(async () => await db.clear());
    afterAll(async () => await db.close());

    it('returns jwt token for valid user', async () => {
        const res = await agent.post('/auth/login').send({
            userName: 'user',
            password: 'password',
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject({
            message: 'ok',
            token: expect.any(String),
        });
    });
});