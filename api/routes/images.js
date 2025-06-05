const express = require('express');
const router = express.Router();
const imageService = require('../services/imageservice');

router.get('/:id', async (req, res, next) => {
    try {
        const image = await imageService.fetchImage(req.params.id);
        res.json(image);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
