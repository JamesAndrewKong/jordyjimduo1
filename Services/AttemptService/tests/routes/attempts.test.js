const request = require('supertest');
const app = require('../../index');
const db = require('../config/database');
const Attempt = require('../../models/attempt');
const pagination = require('../helpers/pagination');
jest.setTimeout(100000);

const agent = request.agent(app, {});

describe('Get Attempts', () => {
    beforeAll(async () => await db.connect());
    afterEach(async () => await db.clear());
    afterAll(async () => await db.close());

    it('should get all attempts', async () => {
        const attempt = await new Attempt({imageId: 'imageId', score: '123', targetId: 'targetId', userId: 'userId'}).save();

        const res = await agent.get('/attempts');

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toEqual(1);
        expect(res.body).toMatchObject({
            ...pagination.responseValues,
            data: [
                {
                    _id: attempt._id.toString(),
                },
            ],
        });
    });

    it('should get all attempts based on userId', async () => {
        const attempt = await new Attempt({imageId: 'imageId', score: '123', targetId: 'targetId', userId: 'userId1'}).save();
        await new Attempt({imageId: 'imageId', score: '123', targetId: 'targetId', userId: 'userId2'}).save();

        const res = await agent.get('/attempts?userId=userId1');

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toEqual(1);
        expect(res.body).toMatchObject({
            ...pagination.responseValues,
            data: [
                {
                    _id: attempt._id.toString(),
                },
            ],
        });
    });

    it('should get all attempts based on targetId', async () => {
        const attempt = await new Attempt({imageId: 'imageId', score: '123', targetId: 'targetId1', userId: 'userId'}).save();
        await new Attempt({imageId: 'imageId', score: '123', targetId: 'targetId2', userId: 'userId'}).save();

        const res = await agent.get('/attempts?targetId=targetId1');

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toEqual(1);
        expect(res.body).toMatchObject({
            ...pagination.responseValues,
            data: [
                {
                    _id: attempt._id.toString(),
                },
            ],
        });
    });

    it('should get an attempt by id', async () => {
        const attempt = await new Attempt({imageId: 'imageId', score: '123', targetId: 'targetId', userId: 'userId'}).save();

        const res = await agent.get(`/attempts/${attempt._id}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject({
            _id: attempt._id.toString(),
            score: expect.any(Number),
        });
    });
});
