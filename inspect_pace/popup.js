const bookmark = '<svg viewBox="0 0 24 24"><path d="M6 4h12v17l-6-4-6 4Z"/></svg>';
const rewards = [
  { id: 'sony', brand: 'SONY', title: '<em>20% back.</em> More possibilities.', description: 'A little upgrade. A lot to love.<br>Activate before you shop at Sony.', points: 100, image: true },
  { id: 'amazon', brand: 'AMAZON', title: '<em>15% back.</em> Good finds.', description: 'Find something for your everyday.<br>Activate before you shop at Amazon.', points: 80 },
  { id: 'zara', brand: 'ZARA', title: '<em>10% back.</em> Fresh favorites.', description: 'Something new for your wardrobe.<br>Activate before you shop at Zara.', points: 60 }
];
let state = { saved: [], active: [], followed: false, notifications: true };
let tab = 'all', expanded = false, toastTimer;
const $ = (id) => document.getElementById(id);
function persist() { if (typeof chrome !== 'undefined' && chrome.storage?.local) chrome.storage.local.set({ pace: state }); }
function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2300); }
function render() {
  $('follow').innerHTML = state.followed ? 'Following <span>✓</span>' : 'Follow <span>+</span>';
  $('follow').setAttribute('aria-pressed', String(state.followed));
  $('saved-count').textContent = state.saved.length;
  $('active-count').textContent = state.active.length;
  $('claimed').textContent = state.active.length;
  $('notifications').setAttribute('aria-checked', String(state.notifications));
  const filtered = rewards.filter(r => tab === 'all' || state[tab].includes(r.id));
  const visible = tab === 'all' && !expanded ? filtered.slice(0, 1) : filtered;
  $('tasks').innerHTML = visible.length ? visible.map(r => {
    const saved = state.saved.includes(r.id), active = state.active.includes(r.id);
    return `<article class="reward-card"><div class="reward-image">${r.image ? '<img src="product.jpg" alt="Black wireless over-ear concept headphones">' : '<div class="intro brand-placeholder"><h1>' + r.brand + '</h1></div>'}<span class="offer-badge">${active ? 'ACTIVATED' : 'MEMBER EXCLUSIVE'}</span><button class="save-button ${saved ? 'saved' : ''}" data-save="${r.id}" aria-label="${saved ? 'Unsave' : 'Save'} ${r.brand} reward" aria-pressed="${saved}" title="${saved ? 'Unsave' : 'Save'} reward">${bookmark}</button></div><div class="reward-content"><div class="reward-overline">${r.brand} <span>·</span> ONLINE REWARD</div><h3>${r.title}</h3><p>${r.description}</p><div class="reward-bottom"><span class="reward-points">${r.points}+ <span class="point-symbol">P</span></span><button class="activate ${active ? 'activated' : ''}" data-activate="${r.id}" ${active ? 'disabled' : ''}>${active ? 'Activated ✓' : 'Activate reward <span>↗</span>'}</button></div></div></article>`;
  }).join('') : `<div class="empty">${tab === 'saved' ? 'No saved rewards yet.' : 'No activated rewards yet.'}</div>`;
  $('more').hidden = tab !== 'all';
  $('more').innerHTML = expanded ? 'Show fewer rewards <span>↑</span>' : 'Explore more rewards <span>↗</span>';
}
$('follow').onclick = () => { state.followed = !state.followed; persist(); render(); toast(state.followed ? 'You’re following Sony.' : 'Sony unfollowed.'); };
$('tasks').onclick = (event) => {
  const save = event.target.closest('[data-save]'), activate = event.target.closest('[data-activate]');
  if (save) { const id = save.dataset.save; const isSaved = state.saved.includes(id); state.saved = isSaved ? state.saved.filter(x => x !== id) : [...state.saved, id]; persist(); render(); toast(isSaved ? 'Reward removed from saved.' : 'Reward saved for later.'); }
  if (activate) { const id = activate.dataset.activate; if (!state.active.includes(id)) state.active.push(id); persist(); render(); toast('Demo reward activated. No real cashback is connected.'); }
};
document.querySelectorAll('[data-tab]').forEach(button => button.onclick = () => { tab = button.dataset.tab; document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b === button)); render(); });
$('more').onclick = () => { expanded = !expanded; render(); };
$('settings').onclick = () => { $('dashboard').hidden = true; $('settings-panel').hidden = false; };
$('back').onclick = () => { $('dashboard').hidden = false; $('settings-panel').hidden = true; };
$('notifications').onclick = () => { state.notifications = !state.notifications; persist(); render(); };
$('reset').onclick = () => { state = { saved: [], active: [], followed: false, notifications: true }; persist(); render(); toast('Demo preferences reset.'); };
document.querySelector('.brand').onclick = event => { event.preventDefault(); $('back').click(); };
render();
if (typeof chrome !== 'undefined' && chrome.storage?.local) chrome.storage.local.get('pace').then(data => { if (data.pace) { state = { ...state, ...data.pace }; render(); } });