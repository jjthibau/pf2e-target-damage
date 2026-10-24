const ID = 'pf2e-target-damage';
const pending = new Set();

function recordedTarget(message) {
  const uuid = message.flags.pf2e?.context?.target?.token;
  if (!uuid) return {reason: 'No target was recorded on this damage roll.'};
  const match = /^Scene\.(\w+)\.Token\.(\w+)$/.exec(uuid);
  const token = match && game.scenes.get(match[1])?.tokens.get(match[2]);
  if (!token?.actor) return {reason: 'The recorded target token is no longer available.'};
  return {token};
}

/** PF2e's native action reads getActiveTokens synchronously before its first await.
 * Supply its recipient for that call only; retain the complete native damage pipeline.
 * No canvas selection changes, global lasting patches, copied IWR logic, or socket messages.
 */
function invokeNativeDamage(button, token) {
  const action = ui.chat.options.actions.applyDamage;
  if (typeof action !== 'function') throw Error('PF2e native damage action is unavailable.');
  const user = game.user;
  const descriptor = Object.getOwnPropertyDescriptor(user, 'getActiveTokens');
  Object.defineProperty(user, 'getActiveTokens', {configurable: true, value: () => [token]});
  try {
    return action.call(ui.chat, {target: button, shiftKey: false}, button);
  } finally {
    if (descriptor) Object.defineProperty(user, 'getActiveTokens', descriptor);
    else delete user.getActiveTokens;
  }
}

async function apply(message, button, rollIndex) {
  if (!game.user.isGM || !message.isDamageRoll || message.flags.pf2e?.suppressDamageButtons) return;
  const key = `${message.id}:${rollIndex}`;
  if (pending.has(key)) return;
  const {token, reason} = recordedTarget(message);
  if (!token) return ui.notifications.warn(reason);
  // Cards explicitly aimed at their speaker use a separate native recipient path.
  // Never let that path supersede the recorded recipient.
  const card = button.closest('[data-message-id]');
  if (!card || card.dataset.actorIsTarget) return;
  pending.add(key);
  button.disabled = true;
  try {
    await invokeNativeDamage(button, token);
  } catch (error) {
    console.error(`${ID}: native damage application failed`, error);
    ui.notifications.error('Damage could not be applied. Check the target and use the normal damage controls.');
  } finally {
    pending.delete(key);
    button.disabled = !recordedTarget(message).token;
  }
}

function render(message, html) {
  if (!game.user.isGM || !message.isDamageRoll || message.flags.pf2e?.suppressDamageButtons || html.dataset.actorIsTarget) return;
  for (const group of html.querySelectorAll('.damage-application')) {
    if (group.querySelector('.pf2e-target-damage')) continue;
    group.classList.add('pf2e-target-damage-controls');
    const rollIndex = Number(group.dataset.rollIndex) || 0;
    const {token, reason} = recordedTarget(message);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pf2e-target-damage';
    button.dataset.multiplier = '1';
    button.disabled = !token;
    button.title = token ? `Apply this damage to ${token.name}, the target recorded on the roll.` : reason;
    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-crosshairs';
    icon.setAttribute('aria-hidden', 'true');
    button.append(icon, document.createTextNode(' Apply to Target'));
    if (token) {
      const image = document.createElement('img');
      image.src = token.actor.img;
      image.alt = '';
      button.append(image);
      const name = document.createElement('span');
      name.className = 'target-name';
      name.textContent = token.name;
      button.append(name);
    }
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      void apply(message, button, rollIndex);
    });
    group.append(button);
  }
}

Hooks.on('renderChatMessageHTML', render);
Hooks.once('ready', () => {
  game.modules.get(ID).api = Object.freeze({recordedTarget});
});
