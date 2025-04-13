const request = require('supertest');
const app = require('../../index');
const db = require('../config/database');
const User = require('../../models/user');
const pagination = require('../helpers/pagination');
jest.setTimeout(100000);

const agent = request.agent(app, {});

describe('Get Users', () => {
    beforeAll(async () => await db.connect());
    afterEach(async () => await db.clear());
    afterAll(async () => await db.close());

    it('should get all users', async () => {
        const user = await new User({userName: 'janklaas01', name: {first: 'Jan Klaas', last: 'van Keulen'}, email: 'jkvkeulen@avans.nl', password: 'password'}).save();

        const res = await agent.get('/users');

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toEqual(1);
        expect(res.body).toMatchObject({
            ...pagination.responseValues,
            data: [
                {
                    _id: user._id.toString(),
                },
            ],
        });
    });

    it('should get a user by id', async () => {
        const user = await new User({userName: 'janklaas01', name: {first: 'Jan Klaas', last: 'van Keulen'}, email: 'jkvkeulen@avans.nl', password: 'password'}).save();

        const res = await agent.get(`/users/${user._id}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject({
            _id: user._id.toString(),
        });
    });
});
