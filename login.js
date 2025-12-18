(function () {
  'use strict';

  var STORAGE_USER = 'bb_currentUser';
  var acceptedDomains = ['@ug.bilkent.edu.tr', '@bilkent.edu.tr'];

  function isValidBilkentEmail(email) {
    if (!email) return false;
    var lower = String(email).trim().toLowerCase();
    for (var i = 0; i < acceptedDomains.length; i++) {
      if (lower.endsWith(acceptedDomains[i])) return true;
    }
    return false;
  }

  function setError(msg) {
    var el = document.getElementById('loginError');
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function clearError() {
    var el = document.getElementById('loginError');
    el.textContent = '';
    el.classList.add('hidden');
  }

  function redirectIfLoggedIn() {
    var current = localStorage.getItem(STORAGE_USER);
    if (current && current.trim() !== '') {
      window.location.href = 'app.html';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    redirectIfLoggedIn();

    var form = document.getElementById('loginForm');
    var emailInput = document.getElementById('email');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearError();

      var email = emailInput.value.trim();

      if (email === '') {
        setError('Email is required.');
        return;
      }

      if (!isValidBilkentEmail(email)) {
        setError('Invalid email. Please use a Bilkent email (e.g., name@ug.bilkent.edu.tr).');
        return;
      }

      localStorage.setItem(STORAGE_USER, email.toLowerCase());
      window.location.href = 'app.html';
    });
  });
})();
