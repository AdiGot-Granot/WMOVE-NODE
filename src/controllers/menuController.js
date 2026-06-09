'use strict';

// MAMENU module controller. mainmenuwc = the main navigation hub (requires login).

const menuService = require('../services/menuService');
const estimateTypeService = require('../services/estimateTypeService');

async function mainmenu(req, res, next) {
  try {
    const model = await menuService.getMenu(req.user);
    res.render('mamenu/mainmenu', model);
  } catch (err) {
    next(err);
  }
}

// New Estimate — estimate-type chooser (legacy selectesttype).
async function selectEstType(req, res, next) {
  try {
    const model = await estimateTypeService.getSelectModel(req.user);
    if (model.redirectAuto) return res.redirect('/mpest/entryautowc');
    res.render('mamenu/selectest', model);
  } catch (err) {
    next(err);
  }
}

// Estimate type chosen — route to the entry form (legacy selectestret).
function selectEstRet(req, res) {
  const type = req.params.type || req.query.type || '';
  const dept = req.body.DEPT || req.query.DEPT || '';
  res.redirect(estimateTypeService.resolveEntry(type, dept));
}

module.exports = { mainmenu, selectEstType, selectEstRet };
