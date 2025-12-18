(function () {
  'use strict';

  var STORAGE_USER = 'bb_currentUser';
  var STORAGE_ACTIVITIES = 'bb_activities';
  var STORAGE_RATINGS = 'bb_ratings';
  var STORAGE_SEEDED = 'bb_seeded_v1';

  var acceptedDomains = ['@ug.bilkent.edu.tr', '@bilkent.edu.tr'];
  var selectedActivityId = null;

  function isValidBilkentEmail(email) {
    if (!email) return false;
    var lower = String(email).trim().toLowerCase();
    for (var i = 0; i < acceptedDomains.length; i++) {
      if (lower.endsWith(acceptedDomains[i])) return true;
    }
    return false;
  }

  function mustGetCurrentUser() {
    var u = localStorage.getItem(STORAGE_USER);
    if (!u || u.trim() === '' || !isValidBilkentEmail(u)) {
      window.location.href = 'index.html';
      return null;
    }
    return u.trim().toLowerCase();
  }

  function uid(prefix) {
    var rnd = Math.random().toString(16).slice(2, 8);
    return prefix + '-' + Date.now().toString(16) + '-' + rnd;
  }

  function loadActivities() {
    var raw = localStorage.getItem(STORAGE_ACTIVITIES);
    if (!raw) return [];
    try {
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveActivities(list) {
    localStorage.setItem(STORAGE_ACTIVITIES, JSON.stringify(list));
  }

  function loadRatings() {
    var raw = localStorage.getItem(STORAGE_RATINGS);
    if (!raw) return [];
    try {
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveRatings(list) {
    localStorage.setItem(STORAGE_RATINGS, JSON.stringify(list));
  }

  function show(elId) { document.getElementById(elId).classList.remove('hidden'); }
  function hide(elId) { document.getElementById(elId).classList.add('hidden'); }
  function setText(elId, text) { document.getElementById(elId).textContent = text; }

  function setFormMessage(type, msg) {
    if (type === 'error') {
      setText('formError', msg); show('formError'); hide('formSuccess');
    } else if (type === 'success') {
      setText('formSuccess', msg); show('formSuccess'); hide('formError');
    } else {
      hide('formError'); hide('formSuccess');
    }
  }

  function setModalMessage(type, msg) {
    if (type === 'error') {
      setText('modalError', msg); show('modalError'); hide('modalSuccess');
    } else if (type === 'success') {
      setText('modalSuccess', msg); show('modalSuccess'); hide('modalError');
    } else {
      hide('modalError'); hide('modalSuccess');
    }
  }

  function seedIfNeeded(currentUser) {
    var already = localStorage.getItem(STORAGE_SEEDED);
    if (already === 'yes') return;

    var seed = [
      {
        id: uid('act'),
        title: 'Reading books at MayFest',
        location: 'MayFest area (Main Campus)',
        time: '2025-12-22 16:30',
        notes: 'Bring a book; we can read quietly and chat later.',
        maxParticipants: 4,
        creatorEmail: currentUser,
        participants: [currentUser],
        status: 'active',
        createdAt: Date.now()
      },
      {
        id: uid('act'),
        title: 'Lunch buddy at Bilkent Center',
        location: 'Bilkent Center food court',
        time: '2025-12-23 12:30',
        notes: 'Quick lunch + talk about courses and campus life.',
        maxParticipants: 3,
        creatorEmail: 'demo.user@ug.bilkent.edu.tr',
        participants: ['demo.user@ug.bilkent.edu.tr'],
        status: 'active',
        createdAt: Date.now() - 120000
      },
      {
        id: uid('act'),
        title: 'Study session (CTIS 261) in the library',
        location: 'Bilkent Library (2nd floor)',
        time: '2025-12-24 15:00',
        notes: 'Subnetting practice + short breaks.',
        maxParticipants: 5,
        creatorEmail: 'study.host@ug.bilkent.edu.tr',
        participants: ['study.host@ug.bilkent.edu.tr'],
        status: 'active',
        createdAt: Date.now() - 240000
      },
      {
        id: uid('act'),
        title: 'Evening walk on campus',
        location: 'Main Campus / Dorms path',
        time: '2025-12-20 20:00',
        notes: 'Chill walk and talk. (Completed for rating demo.)',
        maxParticipants: 2,
        creatorEmail: 'walk.host@ug.bilkent.edu.tr',
        participants: ['walk.host@ug.bilkent.edu.tr', currentUser],
        status: 'completed',
        createdAt: Date.now() - 999999
      }
    ];

    saveActivities(seed);
    localStorage.setItem(STORAGE_SEEDED, 'yes');
  }

  function validateActivityInput(payload, mode) {
    if (!payload.title) return 'Activity title is required.';
    if (!payload.location) return 'Location is required.';
    if (!payload.time) return 'Date & time is required.';
    if (!payload.maxParticipants || isNaN(payload.maxParticipants)) return 'Max participants must be a number.';
    if (payload.maxParticipants < 2) return 'Max participants must be at least 2.';
    if (payload.maxParticipants > 50) return 'Max participants cannot exceed 50.';
    if (mode === 'update' && !payload.id) return 'Activity ID is required for update/delete.';
    return null;
  }

  function clearForm() {
    document.getElementById('actTitle').value = '';
    document.getElementById('actLocation').value = '';
    document.getElementById('actTime').value = '';
    document.getElementById('actNotes').value = '';
    document.getElementById('actMax').value = '';
    document.getElementById('actId').value = '';
    selectedActivityId = null;
  }

  function copyActivityToForm(activity) {
    document.getElementById('actTitle').value = activity.title;
    document.getElementById('actLocation').value = activity.location;
    document.getElementById('actTime').value = activity.time;
    document.getElementById('actNotes').value = activity.notes || '';
    document.getElementById('actMax').value = String(activity.maxParticipants);
    document.getElementById('actId').value = activity.id;
    selectedActivityId = activity.id;
    setFormMessage('none', '');
  }

  function addActivity(currentUser) {
    setFormMessage('none', '');

    var payload = {
      title: document.getElementById('actTitle').value.trim(),
      location: document.getElementById('actLocation').value.trim(),
      time: document.getElementById('actTime').value.trim(),
      notes: document.getElementById('actNotes').value.trim(),
      maxParticipants: parseInt(document.getElementById('actMax').value.trim(), 10)
    };

    var err = validateActivityInput(payload, 'add');
    if (err) { setFormMessage('error', err); return; }

    var list = loadActivities();
    var newAct = {
      id: uid('act'),
      title: payload.title,
      location: payload.location,
      time: payload.time,
      notes: payload.notes,
      maxParticipants: payload.maxParticipants,
      creatorEmail: currentUser,
      participants: [currentUser],
      status: 'active',
      createdAt: Date.now()
    };
    list.unshift(newAct);
    saveActivities(list);
    clearForm();
    setFormMessage('success', 'Activity added.');
    renderFeed(currentUser);
  }

  function updateActivity(currentUser) {
    setFormMessage('none', '');

    var payload = {
      id: document.getElementById('actId').value.trim(),
      title: document.getElementById('actTitle').value.trim(),
      location: document.getElementById('actLocation').value.trim(),
      time: document.getElementById('actTime').value.trim(),
      notes: document.getElementById('actNotes').value.trim(),
      maxParticipants: parseInt(document.getElementById('actMax').value.trim(), 10)
    };

    var err = validateActivityInput(payload, 'update');
    if (err) { setFormMessage('error', err); return; }

    var list = loadActivities();
    var idx = list.findIndex(function (a) { return a.id === payload.id; });
    if (idx === -1) { setFormMessage('error', 'Activity not found. Check the ID.'); return; }

    if (list[idx].creatorEmail !== currentUser) { setFormMessage('error', 'Only the creator can update this activity.'); return; }
    if (list[idx].status === 'completed') { setFormMessage('error', 'Completed activities cannot be edited.'); return; }

    if (list[idx].participants.length > payload.maxParticipants) {
      setFormMessage('error', 'Max participants cannot be less than current participant count.');
      return;
    }

    list[idx].title = payload.title;
    list[idx].location = payload.location;
    list[idx].time = payload.time;
    list[idx].notes = payload.notes;
    list[idx].maxParticipants = payload.maxParticipants;

    saveActivities(list);
    setFormMessage('success', 'Activity updated.');
    renderFeed(currentUser);
  }

  function deleteActivity(currentUser) {
    setFormMessage('none', '');

    var id = document.getElementById('actId').value.trim();
    if (!id) { setFormMessage('error', 'Activity ID is required for delete.'); return; }

    var list = loadActivities();
    var idx = list.findIndex(function (a) { return a.id === id; });
    if (idx === -1) { setFormMessage('error', 'Activity not found. Check the ID.'); return; }
    if (list[idx].creatorEmail !== currentUser) { setFormMessage('error', 'Only the creator can delete this activity.'); return; }

    list.splice(idx, 1);
    saveActivities(list);
    clearForm();
    setFormMessage('success', 'Activity deleted.');
    renderFeed(currentUser);
  }

  function joinActivity(currentUser, activityId) {
    var list = loadActivities();
    var a = list.find(function (x) { return x.id === activityId; });
    if (!a) return { ok: false, msg: 'Activity not found.' };
    if (a.status !== 'active') return { ok: false, msg: 'You can only join active activities.' };
    if (a.participants.indexOf(currentUser) !== -1) return { ok: false, msg: 'You already joined.' };
    if (a.participants.length >= a.maxParticipants) return { ok: false, msg: 'This activity is full.' };
    a.participants.push(currentUser);
    saveActivities(list);
    return { ok: true, msg: 'Joined the activity.' };
  }

  function leaveActivity(currentUser, activityId) {
    var list = loadActivities();
    var a = list.find(function (x) { return x.id === activityId; });
    if (!a) return { ok: false, msg: 'Activity not found.' };
    if (a.creatorEmail === currentUser) return { ok: false, msg: 'Creator cannot leave their own activity.' };
    var pIdx = a.participants.indexOf(currentUser);
    if (pIdx === -1) return { ok: false, msg: 'You are not a participant.' };
    a.participants.splice(pIdx, 1);
    saveActivities(list);
    return { ok: true, msg: 'Left the activity.' };
  }

  function markCompleted(currentUser, activityId) {
    var list = loadActivities();
    var a = list.find(function (x) { return x.id === activityId; });
    if (!a) return { ok: false, msg: 'Activity not found.' };
    if (a.creatorEmail !== currentUser) return { ok: false, msg: 'Only the creator can mark as completed.' };
    if (a.status === 'completed') return { ok: false, msg: 'Already completed.' };
    a.status = 'completed';
    saveActivities(list);
    return { ok: true, msg: 'Marked as completed.' };
  }

  function rateUser(currentUser, activityId, toEmail, stars) {
    if (!toEmail || toEmail.trim() === '') return { ok: false, msg: 'Please choose a user to rate.' };
    if (!stars || isNaN(stars)) return { ok: false, msg: 'Stars must be a number.' };
    if (stars < 1 || stars > 5) return { ok: false, msg: 'Stars must be between 1 and 5.' };

    var list = loadActivities();
    var act = list.find(function (a) { return a.id === activityId; });
    if (!act) return { ok: false, msg: 'Activity not found.' };
    if (act.status !== 'completed') return { ok: false, msg: 'You can rate only after completion.' };
    if (act.participants.indexOf(currentUser) === -1) return { ok: false, msg: 'You are not a participant.' };
    if (act.participants.indexOf(toEmail) === -1) return { ok: false, msg: 'Selected user is not a participant.' };
    if (toEmail === currentUser) return { ok: false, msg: 'You cannot rate yourself.' };

    var ratings = loadRatings();
    var already = ratings.find(function (r) {
      return r.activityId === activityId && r.from === currentUser && r.to === toEmail;
    });
    if (already) return { ok: false, msg: 'You already rated this user for this activity.' };

    ratings.push({
      id: uid('rate'),
      activityId: activityId,
      from: currentUser,
      to: toEmail,
      stars: stars,
      createdAt: Date.now()
    });
    saveRatings(ratings);
    return { ok: true, msg: 'Rating submitted.' };
  }

  function getRatingStatsForUser(email) {
    var ratings = loadRatings().filter(function (r) { return r.to === email; });
    if (ratings.length === 0) return { avg: null, count: 0 };
    var sum = ratings.reduce(function (acc, r) { return acc + r.stars; }, 0);
    return { avg: sum / ratings.length, count: ratings.length };
  }

  function renderMyRating(currentUser) {
    var stats = getRatingStatsForUser(currentUser);
    if (!stats.avg) { setText('myAvg', '—'); setText('myCount', '0'); return; }
    setText('myAvg', stats.avg.toFixed(2) + ' ★');
    setText('myCount', String(stats.count));
  }

  function passesFilter(activity, currentUser, filterValue) {
    if (filterValue === 'all') return true;
    if (filterValue === 'active') return activity.status === 'active';
    if (filterValue === 'completed') return activity.status === 'completed';
    if (filterValue === 'mine') return activity.creatorEmail === currentUser;
    if (filterValue === 'joined') return activity.participants.indexOf(currentUser) !== -1;
    return true;
  }

  function passesSearch(activity, q) {
    if (!q) return true;
    var s = q.toLowerCase();
    return ((activity.title || '').toLowerCase().indexOf(s) !== -1) ||
           ((activity.location || '').toLowerCase().indexOf(s) !== -1);
  }

  function escapeHtml(str) {
    return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  function activityCardHTML(a, currentUser) {
    var statusBadge = a.status === 'completed'
      ? '<span class="badge badge-completed">COMPLETED</span>'
      : '<span class="badge badge-active">ACTIVE</span>';

    var joined = a.participants.indexOf(currentUser) !== -1;
    var isCreator = a.creatorEmail === currentUser;

    var btn1 = '';
    var btn2 = '';
    var btn3 = '<button class="btn btn-ghost" data-action="details" data-id="' + a.id + '">Open</button>';

    if (a.status === 'active') {
      if (!joined) btn1 = '<button class="btn btn-primary" data-action="join" data-id="' + a.id + '">Join</button>';
      else if (!isCreator) btn1 = '<button class="btn btn-secondary" data-action="leave" data-id="' + a.id + '">Leave</button>';
      else btn1 = '<button class="btn btn-secondary" disabled>Creator</button>';

      if (isCreator) btn2 = '<button class="btn btn-danger" data-action="complete" data-id="' + a.id + '">Mark completed</button>';
      else btn2 = '<button class="btn btn-ghost" disabled>Active</button>';
    } else {
      btn1 = '<button class="btn btn-primary" data-action="details" data-id="' + a.id + '">Details</button>';
      btn2 = '<button class="btn btn-ghost" disabled>Completed</button>';
    }

    var meta = [
      '<span>📍 ' + escapeHtml(a.location) + '</span>',
      '<span>🕒 ' + escapeHtml(a.time) + '</span>',
      '<span>👥 ' + a.participants.length + '/' + a.maxParticipants + '</span>',
      '<span>👤 ' + escapeHtml(a.creatorEmail) + '</span>'
    ].join('');

    return (
      '<div class="card-item" data-id="' + a.id + '">' +
        '<div>' + statusBadge + '</div>' +
        '<div class="item-main">' +
          '<div class="item-title">' + escapeHtml(a.title) + '</div>' +
          '<div class="item-meta">' + meta + '</div>' +
          (a.notes ? '<div class="muted" style="margin-top:8px; font-size:13px;">' + escapeHtml(a.notes) + '</div>' : '') +
        '</div>' +
        '<div class="item-actions">' + btn1 + btn2 + btn3 + '</div>' +
      '</div>'
    );
  }

  function renderFeed(currentUser) {
    var list = loadActivities();
    var filterValue = document.getElementById('filterSelect').value;
    var q = document.getElementById('searchBox').value.trim();

    var filtered = list.filter(function (a) {
      return passesFilter(a, currentUser, filterValue) && passesSearch(a, q);
    });

    var feed = document.getElementById('feed');
    if (filtered.length === 0) {
      feed.innerHTML = '<div class="muted">No activities found.</div>';
      setText('feedCount', '0 activities');
      return;
    }

    feed.innerHTML = filtered.map(function (a) { return activityCardHTML(a, currentUser); }).join('');
    setText('feedCount', filtered.length + ' activities');
  }

  function openModal(currentUser, activityId) {
    var list = loadActivities();
    var act = list.find(function (a) { return a.id === activityId; });
    if (!act) return;

    selectedActivityId = activityId;
    setModalMessage('none', '');

    setText('modalSubtitle', act.status === 'completed' ? 'Completed activity' : 'Active activity');
    setText('mId', act.id);
    setText('mTitle', act.title);
    setText('mLocation', act.location);
    setText('mTime', act.time);
    setText('mCreator', act.creatorEmail);
    setText('mStatus', act.status.toUpperCase());
    setText('mParticipants', act.participants.join(', '));
    setText('mNotes', act.notes ? act.notes : '—');

    var joined = act.participants.indexOf(currentUser) !== -1;
    var isCreator = act.creatorEmail === currentUser;

    if (act.status === 'active') {
      document.getElementById('joinBtn').disabled = joined;
      document.getElementById('leaveBtn').disabled = (!joined || isCreator);
      document.getElementById('completeBtn').disabled = !isCreator;
    } else {
      document.getElementById('joinBtn').disabled = true;
      document.getElementById('leaveBtn').disabled = true;
      document.getElementById('completeBtn').disabled = true;
    }

    var rateableUsers = [];
    if (act.status === 'completed' && act.participants.indexOf(currentUser) !== -1) {
      rateableUsers = act.participants.filter(function (p) { return p !== currentUser; });
    }

    var rateSelect = document.getElementById('rateUserSelect');
    if (rateableUsers.length === 0) {
      rateSelect.innerHTML = '<option value="">No users available</option>';
      rateSelect.disabled = true;
      document.getElementById('rateBtn').disabled = true;
    } else {
      rateSelect.disabled = false;
      document.getElementById('rateBtn').disabled = false;
      rateSelect.innerHTML = '<option value="">Select a user</option>' +
        rateableUsers.map(function (u) { return '<option value="' + u + '">' + u + '</option>'; }).join('');
    }

    var backdrop = document.getElementById('modalBackdrop');
    backdrop.classList.remove('hidden');
    backdrop.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    var backdrop = document.getElementById('modalBackdrop');
    backdrop.classList.add('hidden');
    backdrop.setAttribute('aria-hidden', 'true');
    setModalMessage('none', '');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var currentUser = mustGetCurrentUser();
    if (!currentUser) return;

    seedIfNeeded(currentUser);
    setText('currentUser', currentUser);

    document.getElementById('logoutBtn').addEventListener('click', function () {
      localStorage.removeItem(STORAGE_USER);
      window.location.href = 'index.html';
    });

    document.getElementById('addBtn').addEventListener('click', function () { addActivity(currentUser); });
    document.getElementById('updateBtn').addEventListener('click', function () { updateActivity(currentUser); });
    document.getElementById('deleteBtn').addEventListener('click', function () { deleteActivity(currentUser); });
    document.getElementById('clearBtn').addEventListener('click', function () { clearForm(); setFormMessage('none',''); });

    document.getElementById('filterSelect').addEventListener('change', function () { renderFeed(currentUser); });
    document.getElementById('searchBox').addEventListener('input', function () { renderFeed(currentUser); });
    document.getElementById('refreshBtn').addEventListener('click', function () { renderFeed(currentUser); renderMyRating(currentUser); });

    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('modalCloseX').addEventListener('click', closeModal);
    document.getElementById('modalBackdrop').addEventListener('click', function (e) {
      if (e.target && e.target.id === 'modalBackdrop') closeModal();
    });

    document.getElementById('joinBtn').addEventListener('click', function () {
      if (!selectedActivityId) return;
      var res = joinActivity(currentUser, selectedActivityId);
      openModal(currentUser, selectedActivityId);
      setModalMessage(res.ok ? 'success' : 'error', res.msg);
      renderFeed(currentUser);
    });

    document.getElementById('leaveBtn').addEventListener('click', function () {
      if (!selectedActivityId) return;
      var res = leaveActivity(currentUser, selectedActivityId);
      openModal(currentUser, selectedActivityId);
      setModalMessage(res.ok ? 'success' : 'error', res.msg);
      renderFeed(currentUser);
    });

    document.getElementById('completeBtn').addEventListener('click', function () {
      if (!selectedActivityId) return;
      var res = markCompleted(currentUser, selectedActivityId);
      openModal(currentUser, selectedActivityId);
      setModalMessage(res.ok ? 'success' : 'error', res.msg);
      renderFeed(currentUser);
    });

    document.getElementById('copyToFormBtn').addEventListener('click', function () {
      if (!selectedActivityId) return;
      var list = loadActivities();
      var act = list.find(function (a) { return a.id === selectedActivityId; });
      if (!act) return;
      copyActivityToForm(act);
      setModalMessage('success', 'Copied activity data to the edit form.');
    });

    document.getElementById('rateBtn').addEventListener('click', function () {
      if (!selectedActivityId) return;
      var toEmail = document.getElementById('rateUserSelect').value;
      var stars = parseInt(document.getElementById('rateStars').value, 10);
      var res = rateUser(currentUser, selectedActivityId, toEmail, stars);
      setModalMessage(res.ok ? 'success' : 'error', res.msg);
      renderMyRating(currentUser);
    });

    document.getElementById('feed').addEventListener('click', function (e) {
      var target = e.target;
      if (!target) return;

      if (target.matches('button[data-action]')) {
        var action = target.getAttribute('data-action');
        var id = target.getAttribute('data-id');

        if (action === 'join') {
          var rj = joinActivity(currentUser, id);
          renderFeed(currentUser);
          openModal(currentUser, id);
          setModalMessage(rj.ok ? 'success' : 'error', rj.msg);
          return;
        }
        if (action === 'leave') {
          var rl = leaveActivity(currentUser, id);
          renderFeed(currentUser);
          openModal(currentUser, id);
          setModalMessage(rl.ok ? 'success' : 'error', rl.msg);
          return;
        }
        if (action === 'complete') {
          var rc = markCompleted(currentUser, id);
          renderFeed(currentUser);
          openModal(currentUser, id);
          setModalMessage(rc.ok ? 'success' : 'error', rc.msg);
          return;
        }
        if (action === 'details') {
          openModal(currentUser, id);
          return;
        }
      }

      var card = target.closest('.card-item');
      if (card && card.getAttribute('data-id')) {
        var id2 = card.getAttribute('data-id');
        openModal(currentUser, id2);
        var list2 = loadActivities();
        var act2 = list2.find(function (a) { return a.id === id2; });
        if (act2) copyActivityToForm(act2);
      }
    });

    renderFeed(currentUser);
    renderMyRating(currentUser);
  });
})();
