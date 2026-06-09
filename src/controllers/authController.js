'use strict';

const authService = require('../services/authService');
const log = require('../lib/logger');

function loginForm(req, res) {
  res.render('mplogin/login', {
    error: null,
    username: '',
    company: req.query.co || '',
    next: req.query.next || '/mamenu/mainmenuwc',
  });
}

async function loginSubmit(req, res, next) {
  try {
    const { username, password, company } = req.body;
    const result = await authService.login(username, password, company);

    if (!result.ok) {
      const MSG = {
        ambiguous_tenant: 'Multiple accounts found — please enter your company code.',
        unknown_company: 'Sorry, that company code was not found.',
        inactive_company: 'Not Active Customer!',
      };
      const msg = MSG[result.reason] || 'Login failed!! Incorrect User Name or Password. Please try again.';
      log.warn({ username, company, reason: result.reason }, 'login failed'); // never log password
      return res.status(401).render('mplogin/login', {
        error: msg,
        username: username || '',
        company: company || '',
        next: req.body.next || '/mamenu/mainmenuwc',
      });
    }

    // Prevent session fixation: regenerate session on privilege change.
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.user = result.user;
      log.info({ userid: result.user.userid, custid: result.user.custid }, 'login ok');
      res.redirect(req.body.next || '/mamenu/mainmenuwc');
    });
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  req.session.destroy(() => res.redirect('/mplogin'));
}

module.exports = { loginForm, loginSubmit, logout };
