import assert from 'node:assert/strict';
import {test} from 'node:test';

const hooks = new Map();
globalThis.Hooks = {on: (name, callback) => hooks.set(name, callback), once() {}};
const {invokeNativeDamage} = await import('../scripts/main.js');
const token = {name: 'Ogre', actor: {uuid: 'Actor.ogre', img: 'ogre.webp'}};
const tokens = new Map();
const notifications = [];
const originalTokens = () => ['selected elsewhere'];
globalThis.game = {user: {isGM: true, getActiveTokens: originalTokens}, scenes: new Map([['scene', {tokens}]])};
globalThis.ui = {chat: {options: {actions: {}}}, notifications: {
  warn: value => notifications.push(value), error: value => notifications.push(value),
}};

function element(tag) {
  return {
    tag, dataset: {}, children: [], classList: {add() {}}, attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(_name, callback) { this.activate = () => callback({preventDefault() {}, stopPropagation() {}}); },
    append(...children) {
      this.children.push(...children);
      for (const child of children) child.parentElement = this;
    },
    remove() { this.parentElement.children = this.parentElement.children.filter(child => child !== this); },
    querySelector(selector) {
      if (selector.startsWith('[data-action=')) return this.fullDamage ? {} : null;
      return this.children.find(child => selector === child.tag || selector === `.${child.className}`);
    },
  };
}
globalThis.document = {createElement: element, createTextNode: () => element('#text')};

function card(id, {fullDamage = true, actorIsTarget, actor} = {}) {
  const html = {dataset: {actorIsTarget}};
  const group = element('section');
  group.fullDamage = fullDamage;
  group.closest = () => ({dataset: {rollIndex: '3'}});
  html.querySelectorAll = () => [group];
  const message = {id, isDamageRoll: true, flags: {pf2e: {context: {target: {token: 'Scene.scene.Token.ogre', actor}}}}};
  hooks.get('renderChatMessageHTML')(message, html);
  const button = group.querySelector('.pf2e-target-damage');
  if (button) button.closest = () => html;
  return button;
}

const settle = () => new Promise(resolve => setImmediate(resolve));
const actions = ui.chat.options.actions;

test('positive shortcut follows native full-damage eligibility and excludes speaker-target cards', () => {
  tokens.set('ogre', token);
  assert.equal(card('healing', {fullDamage: false}), undefined);
  assert.equal(card('self', {actorIsTarget: 'true'}), undefined);
  assert.equal(card('damage').dataset.multiplier, '1');
});

test('missing and reassigned tokens retire rendered controls with a reason', () => {
  const button = card('delete');
  tokens.delete('ogre');
  button.activate();
  assert.equal(button.disabled, true);
  assert.match(button.title, /no longer available/);
  assert.equal(button.querySelector('.target-name'), undefined);
  assert.equal(card('missing').disabled, true);
  tokens.set('ogre', token);
  assert.equal(card('wrong-actor', {actor: 'Actor.other'}).disabled, true);
  assert.equal(card('linked', {actor: token.actor.uuid}).disabled, false);
  token.actor.uuid = 'Scene.scene.Token.ogre.Actor.ogre';
  assert.equal(card('unlinked', {actor: token.actor.uuid}).disabled, false);
});

test('temporary native recipient is restored after a return or synchronous throw', () => {
  actions.applyDamage = () => game.user.getActiveTokens();
  assert.deepEqual(invokeNativeDamage({}, token), [token]);
  assert.equal(game.user.getActiveTokens, originalTokens);
  actions.applyDamage = () => { throw new Error('request setup failed'); };
  assert.throws(() => invokeNativeDamage({}, token), /request setup failed/);
  assert.equal(game.user.getActiveTokens, originalTokens);
});

test('separate views share the pending and uncertain state for a roll', async context => {
  context.mock.method(console, 'error', () => {});
  let calls = 0;
  let rejectResult;
  actions.applyDamage = () => {
    calls += 1;
    return new Promise((_resolve, reject) => { rejectResult = reject; });
  };
  const main = card('overlap');
  const popout = card('overlap');
  main.activate();
  popout.activate();
  assert.equal(calls, 1);
  rejectResult(new Error('receipt failed after the actor update'));
  await settle();
  assert.equal(main.disabled, true);
  popout.activate();
  assert.equal(popout.disabled, true);
  assert.equal(card('overlap').disabled, true);
  assert.match(notifications.at(-1), /Check the recorded target’s HP/);
  assert.equal(calls, 1);
});

test('an action missing before dispatch and a successful application allow a new click', async context => {
  context.mock.method(console, 'error', () => {});
  const button = card('retry');
  delete actions.applyDamage;
  button.activate();
  assert.equal(button.disabled, false);
  let calls = 0;
  actions.applyDamage = async () => { calls += 1; };
  button.activate();
  await settle();
  assert.equal(button.disabled, false);
  button.activate();
  await settle();
  assert.equal(calls, 2);
});
