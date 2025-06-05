const express = require('express');
const router = express.Router();
const attemptService = require('../services/attemptService');
const paginate = require('../helpers/paginatedResponse');
const createError = require('http-errors');

router.get('/', async (req, res, next) => {
    try {
        const data = await attemptService.getAttempts(req.query.page, req.query.perPage, req.query.userId, req.query.targetId);
        res.json(paginate(data, req));
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const data = await attemptService.getAttemptById(req.params.id);
        res.json(data);
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const target = await attemptService.getTargetById(req.body.targetId);
        req.body.userId = req.user._id;
        req.body.targetImageId = target.imageId;

        const created = await attemptService.createAttempt(req.body);
        res.status(201).json(created);
    } catch (error) {
        next(createError('Target not found', 404));
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const result = await attemptService.deleteAttempt(req.params.id, req.user._id, req.user.role);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
