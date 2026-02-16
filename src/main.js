import { initFirebase, getDb, ref, onValue, set, get } from './firebase.js'

const HEARTS_TARGET = 10

function generateId() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let id = ''
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

function getCardIdFromUrl() {
  const hash = window.location.hash.slice(1)
  const match = hash.match(/^\/?card\/([a-z0-9]+)/i)
  return match ? match[1] : null
}

function updateUrl(cardId) {
  const newHash = `#/card/${cardId}`
  if (window.location.hash !== newHash) {
    history.replaceState(null, '', `${window.location.pathname}${newHash}`)
  }
}

// Storage abstraction - Firebase or localStorage
async function getHearts(cardId) {
  const db = getDb()
  if (db) {
    const snap = await get(ref(db, `cards/${cardId}/hearts`))
    return snap.exists() ? snap.val() : 0
  }
  return parseInt(localStorage.getItem(`heartcard_${cardId}`) || '0', 10)
}

function setHearts(cardId, count) {
  const db = getDb()
  if (db) {
    return set(ref(db, `cards/${cardId}`), {
      hearts: count,
      updatedAt: Date.now()
    })
  }
  localStorage.setItem(`heartcard_${cardId}`, String(count))
}

function subscribeToHearts(cardId, callback) {
  const db = getDb()
  if (db) {
    return onValue(ref(db, `cards/${cardId}/hearts`), (snap) => {
      callback(snap.exists() ? snap.val() : 0)
    })
  }
  // Poll localStorage when no Firebase (single device only)
  const interval = setInterval(() => {
    callback(parseInt(localStorage.getItem(`heartcard_${cardId}`) || '0', 10))
  }, 1000)
  return () => clearInterval(interval)
}

// UI
function renderHearts(count) {
  const hearts = []
  for (let i = 0; i < HEARTS_TARGET; i++) {
    const filled = i < count
    hearts.push(`<span class="heart ${filled ? 'filled' : 'empty'}">♥</span>`)
  }
  return hearts.join('')
}

function renderCard(cardId, hearts, onAddHeart) {
  return `
    <div class="loyalty-card">
      <h2 class="card-title">Heart Card</h2>
      <p class="card-subtitle">Collect ${HEARTS_TARGET} hearts for something special</p>
      <div class="hearts-container">${renderHearts(hearts)}</div>
      <p class="points-text">${hearts} of ${HEARTS_TARGET} hearts</p>
      <div class="heart-buttons">
        <button class="add-heart-btn" data-action="add">
          <span class="btn-icon">♥</span> Add a heart
        </button>
        <button class="remove-heart-btn" data-action="remove" ${hearts === 0 ? 'disabled' : ''}>
          <span class="btn-icon">−</span> Remove
        </button>
      </div>
    </div>
    <div class="share-section">
      <p>Share this link so they can add the card to their home screen:</p>
      <p class="share-link">${window.location.origin}${window.location.pathname}#/card/${cardId}</p>
    </div>
  `
}

function renderCreate() {
  return `
    <div class="setup-screen">
      <h1>Heart Card</h1>
      <p>A loyalty card for love. Add hearts when they do something sweet—pick you up on time, bring coffee, make you laugh.</p>
      <button class="btn" data-action="create">Create your card</button>
      <a href="#/join" class="btn btn-secondary">I have a code to join</a>
    </div>
  `
}

function renderJoin() {
  return `
    <div class="setup-screen">
      <h1>Join a card</h1>
      <p>Enter the code from your partner's card:</p>
      <div class="join-form">
        <input type="text" id="card-code" placeholder="e.g. abc123xy" maxlength="8" autocomplete="off" />
        <button class="btn" data-action="join">Open card</button>
      </div>
    </div>
  `
}

function showCard(cardId, hearts = 0) {
  let currentHearts = hearts
  const app = document.getElementById('app')
  app.innerHTML = `<div class="card-container">${renderCard(cardId, hearts)}</div>`
  updateUrl(cardId)

  const addBtn = app.querySelector('.add-heart-btn')
  const removeBtn = app.querySelector('.remove-heart-btn')

  const updateRemoveButton = () => {
    if (removeBtn) {
      removeBtn.disabled = currentHearts === 0
    }
  }

  addBtn?.addEventListener('click', async () => {
    currentHearts = Math.min(currentHearts + 1, HEARTS_TARGET)
    await setHearts(cardId, currentHearts)
    addBtn.classList.add('sent')
    addBtn.innerHTML = '<span class="btn-icon">✓</span> Heart added!'
    setTimeout(() => {
      addBtn.classList.remove('sent')
      addBtn.innerHTML = '<span class="btn-icon">♥</span> Add a heart'
    }, 1500)
  })

  updateRemoveButton()

  removeBtn?.addEventListener('click', async () => {
    if (currentHearts > 0) {
      currentHearts = Math.max(0, currentHearts - 1)
      await setHearts(cardId, currentHearts)
      removeBtn.innerHTML = '<span class="btn-icon">✓</span> Removed!'
      setTimeout(() => {
        removeBtn.innerHTML = '<span class="btn-icon">−</span> Remove'
      }, 800)
    }
  })

  subscribeToHearts(cardId, (newHearts) => {
    currentHearts = newHearts
    const container = app.querySelector('.hearts-container')
    const pointsText = app.querySelector('.points-text')
    if (container) container.innerHTML = renderHearts(newHearts)
    if (pointsText) pointsText.textContent = `${newHearts} of ${HEARTS_TARGET} hearts`
    updateRemoveButton()
  })
}

function showSetup(mode = 'create') {
  const app = document.getElementById('app')
  app.innerHTML = `<div class="card-container">${mode === 'join' ? renderJoin() : renderCreate()}</div>`

  app.querySelector('[data-action="create"]')?.addEventListener('click', () => {
    const cardId = generateId()
    setHearts(cardId, 0).then(() => showCard(cardId, 0))
  })

  const joinBtn = app.querySelector('[data-action="join"]')
  const joinInput = app.querySelector('#card-code')
  joinBtn?.addEventListener('click', () => {
    const code = (joinInput?.value || '').trim().toLowerCase()
    if (code.length >= 4) {
      getHearts(code).then((h) => showCard(code, h))
    }
  })
}

// Router
function init() {
  initFirebase()
  const cardId = getCardIdFromUrl()

  if (cardId) {
    const app = document.getElementById('app')
    app.innerHTML = '<div class="card-container"><p class="loading">Loading…</p></div>'
    getHearts(cardId).then((hearts) => {
      showCard(cardId, hearts)
    }).catch(() => showSetup('join'))
  } else {
    const hash = window.location.hash
    showSetup(hash.includes('join') ? 'join' : 'create')
  }
}

// Handle hash changes (e.g. browser back)
window.addEventListener('hashchange', init)
init()
