(function() {
  const firebaseConfig = {
    apiKey: "AIzaSyBhYvKXywwSNYJe-Uly3gfwRrS454ZUIeg",
    authDomain: "loyalty-card-aa0ca.firebaseapp.com",
    databaseURL: "https://loyalty-card-aa0ca-default-rtdb.firebaseio.com",
    projectId: "loyalty-card-aa0ca",
    storageBucket: "loyalty-card-aa0ca.firebasestorage.app",
    messagingSenderId: "228659249891",
    appId: "1:228659249891:web:9837cf0a5afaf4e0fd7bd6"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  const HEARTS_TARGET = 10;

  function generateId() {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let id = '';
    for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  }

  function getCardIdFromUrl() {
    const hash = window.location.hash.slice(1);
    const match = hash.match(/^\/?card\/([a-z0-9]+)/i);
    return match ? match[1] : null;
  }

  function updateUrl(cardId) {
    const newHash = '#/card/' + cardId;
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', window.location.pathname + newHash);
    }
  }

  function getHearts(cardId) {
    return db.ref('cards/' + cardId + '/hearts').once('value').then(function(snap) {
      return snap.exists() ? snap.val() : 0;
    }).catch(function() {
      return parseInt(localStorage.getItem('heartcard_' + cardId) || '0', 10);
    });
  }

  function setHearts(cardId, count) {
    return db.ref('cards/' + cardId).set({
      hearts: count,
      updatedAt: Date.now()
    });
  }

  function subscribeToHearts(cardId, callback) {
    db.ref('cards/' + cardId + '/hearts').on('value', function(snap) {
      callback(snap.exists() ? snap.val() : 0);
    });
  }

  function renderHearts(count) {
    let html = '';
    for (let i = 0; i < HEARTS_TARGET; i++) {
      const filled = i < count;
      html += '<span class="heart ' + (filled ? 'filled' : 'empty') + '">♥</span>';
    }
    return html;
  }

  function renderCard(cardId, hearts) {
    return '<div class="loyalty-card">' +
      '<h2 class="card-title">Heart Card</h2>' +
      '<p class="card-subtitle">Collect ' + HEARTS_TARGET + ' hearts for something special</p>' +
      '<div class="hearts-container">' + renderHearts(hearts) + '</div>' +
      '<p class="points-text">' + hearts + ' of ' + HEARTS_TARGET + ' hearts</p>' +
      '<div class="heart-buttons">' +
        '<button class="add-heart-btn" data-action="add"><span class="btn-icon">♥</span> Add a heart</button>' +
        '<button class="remove-heart-btn" data-action="remove"' + (hearts === 0 ? ' disabled' : '') + '><span class="btn-icon">−</span> Remove</button>' +
      '</div>' +
    '</div>' +
    '<div class="share-section">' +
      '<p>Share this link so they can add the card to their home screen:</p>' +
      '<p class="share-link">' + window.location.origin + window.location.pathname + '#/card/' + cardId + '</p>' +
    '</div>';
  }

  function renderCreate() {
    return '<div class="setup-screen">' +
      '<h1>Heart Card</h1>' +
      '<p>A loyalty card for love. Add hearts when they do something sweet—pick you up on time, bring coffee, make you laugh.</p>' +
      '<button class="btn" data-action="create">Create your card</button>' +
      '<a href="#/join" class="btn btn-secondary">I have a code to join</a>' +
    '</div>';
  }

  function renderJoin() {
    return '<div class="setup-screen">' +
      '<h1>Join a card</h1>' +
      '<p>Enter the code from your partner\'s card:</p>' +
      '<div class="join-form">' +
        '<input type="text" id="card-code" placeholder="e.g. abc123xy" maxlength="8" autocomplete="off" />' +
        '<button class="btn" data-action="join">Open card</button>' +
      '</div>' +
    '</div>';
  }

  function showCard(cardId, hearts) {
    let currentHearts = hearts;
    const app = document.getElementById('app');
    app.innerHTML = '<div class="card-container">' + renderCard(cardId, hearts) + '</div>';
    updateUrl(cardId);

    const addBtn = app.querySelector('.add-heart-btn');
    const removeBtn = app.querySelector('.remove-heart-btn');

    function updateRemoveButton() {
      if (removeBtn) removeBtn.disabled = currentHearts === 0;
    }

    addBtn.addEventListener('click', function() {
      currentHearts = Math.min(currentHearts + 1, HEARTS_TARGET);
      setHearts(cardId, currentHearts);
      addBtn.classList.add('sent');
      addBtn.innerHTML = '<span class="btn-icon">✓</span> Heart added!';
      setTimeout(function() {
        addBtn.classList.remove('sent');
        addBtn.innerHTML = '<span class="btn-icon">♥</span> Add a heart';
      }, 1500);
    });

    removeBtn.addEventListener('click', function() {
      if (currentHearts > 0) {
        currentHearts = Math.max(0, currentHearts - 1);
        setHearts(cardId, currentHearts);
        removeBtn.innerHTML = '<span class="btn-icon">✓</span> Removed!';
        setTimeout(function() {
          removeBtn.innerHTML = '<span class="btn-icon">−</span> Remove';
        }, 800);
      }
    });

    updateRemoveButton();
    subscribeToHearts(cardId, function(newHearts) {
      currentHearts = newHearts;
      const container = app.querySelector('.hearts-container');
      const pointsText = app.querySelector('.points-text');
      if (container) container.innerHTML = renderHearts(newHearts);
      if (pointsText) pointsText.textContent = newHearts + ' of ' + HEARTS_TARGET + ' hearts';
      updateRemoveButton();
    });
  }

  function showSetup(mode) {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="card-container">' + (mode === 'join' ? renderJoin() : renderCreate()) + '</div>';

    const createBtn = app.querySelector('[data-action="create"]');
    if (createBtn) {
      createBtn.addEventListener('click', function() {
        const cardId = generateId();
        setHearts(cardId, 0).then(function() { showCard(cardId, 0); });
      });
    }

    const joinBtn = app.querySelector('[data-action="join"]');
    const joinInput = app.querySelector('#card-code');
    if (joinBtn) {
      joinBtn.addEventListener('click', function() {
        const code = (joinInput && joinInput.value || '').trim().toLowerCase();
        if (code.length >= 4) {
          getHearts(code).then(function(h) { showCard(code, h); });
        }
      });
    }
  }

  function init() {
    const cardId = getCardIdFromUrl();
    const app = document.getElementById('app');

    if (cardId) {
      app.innerHTML = '<div class="card-container"><p class="loading">Loading…</p></div>';
      getHearts(cardId).then(function(hearts) {
        showCard(cardId, hearts);
      }).catch(function() {
        showSetup('join');
      });
    } else {
      showSetup(window.location.hash.indexOf('join') >= 0 ? 'join' : 'create');
    }
  }

  window.addEventListener('hashchange', init);
  init();
})();
