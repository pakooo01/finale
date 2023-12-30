const { getAllAste, addAsta, aggiornaPrezzo, addAstaToUser, getAsteByUserId, addAstaByCodice } = require('../controllers/astaController');
const router = require('express').Router();

router.get("/getAllAste", getAllAste);
router.get("/getAsteByUserId/:userId", getAsteByUserId);
router.post("/addAsta", addAsta);
router.put("/aggiornaPrezzo/:astaId/:userid/:puntata", aggiornaPrezzo);
router.post("/addAstaByCodice/:userId/:codiceAsta", addAstaByCodice);
router.post("/addToCartAsta/:userId/:astaId/:quantity", addAstaToUser);

module.exports = router;
