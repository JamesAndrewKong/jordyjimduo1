const express = require('express');
const router = express.Router();
const targetService = require('../services/targetservice');
const paginate = require('../helpers/paginatedResponse');
const adminRole = require('../helpers/adminRole');

router.get('/', async (req, res, next) => {
    try {
        const data = await targetService.getTargets(req.query.page, req.query.perPage);
        res.json(paginate(data, req));
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const data = await targetService.getTargetById(req.params.id);
        res.json(data);
    } catch (error) {
        next(error);
    }
});

router.get('/attempts/:id', adminRole, async (req, res, next) => {
    try {
        const data = await targetService.getAttemptsForTarget(req.params.id, req.query.page, req.query.perPage);
        res.json(paginate(data, req));
    } catch (error) {
        next(error);
    }
});

router.get('/location/:location', async (req, res, next) => {
    try {
        const data = await targetService.getTargetsByLocation(req.params.location);
        res.json(data);
    } catch (error) {
        next(error);
    }
});

router.post('/', adminRole, async (req, res, next) => {
    try {
        req.body.userId = req.user._id;
        const data = await targetService.createTarget(req.body);
        res.status(201).json(data);
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', adminRole, async (req, res, next) => {
    try {
        await targetService.deleteTarget(req.params.id, req.user._id);
        res.status(204).json([]);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
