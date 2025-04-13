const request = require('supertest');
const app = require('../../index');
const db = require('../config/database');
const Image = require('../../models/image');

const agent = request.agent(app, {});

describe('Get Images', () => {
    beforeAll(async () => await db.connect());
    afterEach(async () => await db.clear());
    afterAll(async () => await db.close());

    it('should get an image by id', async () => {
        const image = await new Image({content: 'https://picsum.photos/10'}).save();

        const res = await agent.get(`/images/${image._id}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject({
            _id: image._id.toString(),
        });
    });
});
