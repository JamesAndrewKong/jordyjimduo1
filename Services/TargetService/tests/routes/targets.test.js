const request = require('supertest');
const app = require('../../index');
const db = require('../config/database');
const Target = require('../../models/target');
const pagination = require('../helpers/pagination');
jest.setTimeout(100000);

const agent = request.agent(app, {});

describe('Get Targets', () => {
    beforeAll(async () => await db.connect());
    afterEach(async () => await db.clear());
    afterAll(async () => await db.close());

    it('should get all targets', async () => {
        const target = await new Target({location: 'Amsterdam', userId: '123456789'}).save();

        const res = await agent.get('/targets');

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toEqual(1);
        expect(res.body).toMatchObject({
            ...pagination.responseValues,
            data: [
                {
                    _id: target._id.toString(),
                },
            ],
        });
    });

    it('should get all targets by userId', async () => {
        const target = await new Target({location: 'Amsterdam', userId: 'userId1'}).save();
        await new Target({location: 'Amsterdam', userId: 'userId2'}).save();

        const res = await agent.get('/targets?userId=userId1');

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toEqual(1);
        expect(res.body).toMatchObject({
            ...pagination.responseValues,
            data: [
                {
                    _id: target._id.toString(),
                },
            ],
        });
    });

    it('should get a target by id', async () => {
        const target = await new Target({location: 'Amsterdam', userId: 'userId'}).save();

        const res = await agent.get(`/targets/${target._id}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject({
            _id: target._id.toString(),
        });
    });
});
