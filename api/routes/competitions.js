const express = require('express');
const router = express.Router();

// Route to fetch all competitions
router.get('/', async (req, res, next) => {
  try {
    const competitions = await competitionService.getCompetitions();
    res.json(competitions);
  } catch (err) {
    next(err);
  }
});

// Route to fetch a specific competition
router.get('/:id', async (req, res, next) => {
  try {
    const competition = await competitionService.getCompetition(req.params.id);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }
    res.json(competition);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
