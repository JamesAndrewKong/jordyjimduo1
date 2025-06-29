const express = require('express');
const router = express.Router();
const userService = require('../services/userservice');
const paginate = require('../helpers/paginatedResponse');
const createError = require('http-errors');

router.get('/', async (req, res, next) => {
    try {
        const data = await userService.getUsers(req.query.page, req.query.perPage);
        res.json(paginate(data, req));
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const data = await userService.getUserById(req.params.id);
        res.json(data);
    } catch (error) {
        next(error);
    }
});

router.get('/targets/:id', async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id);
        const targets = await userService.getTargetsByUser(user._id, req.query.page, req.query.perPage);
        res.json(paginate(targets, req));
    } catch (error) {
        next(createError('User not found', 404));
    }
});

router.get('/attempts/:id', async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id);
        const attempts = await userService.getAttemptsByUser(user._id, req.query.page, req.query.perPage);
        res.json(paginate(attempts, req));
    } catch (error) {
        next(createError('User not found', 404));
    }
});

router.post('/', async (req, res, next) => {
    try {
        const newUser = await userService.createUser(req.body);
        res.status(201).json(newUser);
    } catch (error) {
        next(createError(422, 'Could not create user'));
    }
});

module.exports = router;
