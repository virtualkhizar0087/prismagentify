const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analysisController');
const auth = require('../middleware/auth');
const planLimits = require('../middleware/planLimits');
const { saveAnalysis, incrementAnalysisCount } = require('../lib/supabase');

// Intercept res.json to save result + increment count after each successful analysis
function withSave(moduleName) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      if (data && data.success && req.user) {
        saveAnalysis(req.user.id, moduleName, req.body, data.analysis).catch(console.error);
        incrementAnalysisCount(req.user.id).catch(console.error);
      }
      return originalJson(data);
    };
    next();
  };
}

const guard = [auth, planLimits];

router.post('/screener',           ...guard, withSave('Goldman Sachs Stock Screener'),   ctrl.stockScreener);
router.post('/dcf',                ...guard, withSave('Morgan Stanley DCF Valuation'),   ctrl.dcfValuation);
router.post('/risk',               ...guard, withSave('Bridgewater Risk Analysis'),       ctrl.riskAnalysis);
router.post('/earnings-breakdown', ...guard, withSave('JPMorgan Earnings Breakdown'),    ctrl.earningsBreakdown);
router.post('/portfolio-builder',  ...guard, withSave('BlackRock Portfolio Builder'),    ctrl.portfolioBuilder);
router.post('/stock-breakdown',    ...guard, withSave('Stock Breakdown'),                ctrl.stockBreakdown);
router.post('/trade-setup',        ...guard, withSave('Trade Setup Builder'),            ctrl.tradeSetup);
router.post('/earnings-reaction',  ...guard, withSave('Earnings Reaction Analyzer'),     ctrl.earningsReaction);
router.post('/portfolio-risk',     ...guard, withSave('Portfolio Risk Scanner'),         ctrl.portfolioRiskScan);
router.post('/sector-finder',      ...guard, withSave('Sector Finder'),                  ctrl.sectorFinder);
router.post('/compounder-finder',  ...guard, withSave('Compounder Finder'),              ctrl.compounderFinder);
router.post('/news-sentiment',     ...guard, withSave('News Sentiment Analyzer'),         ctrl.newsSentiment);
router.post('/options-strategy',   ...guard, withSave('Options Strategy Builder'),        ctrl.optionsStrategy);

module.exports = router;
