import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDemoProfile } from '../src/config/demoProfile.ts';

test('the root keeps the general depot dashboard', () => {
  assert.equal(getDemoProfile('/').id, 'general');
  assert.equal(getDemoProfile('/').initialView, 'dashboard');
});

test('the shareable Translink path opens the tailored controller example', () => {
  assert.equal(getDemoProfile('/Translink').id, 'translink');
  assert.equal(getDemoProfile('/Translink').initialView, 'control');
});

test('Translink routing handles trailing slashes and typed lowercase', () => {
  for (const path of ['/Translink/', '/translink', '/translink/', '/TRANSLINK']) {
    assert.equal(getDemoProfile(path).id, 'translink', path);
  }
});

test('unrelated paths do not accidentally select the customer profile', () => {
  for (const path of ['/Translink-other', '/other/Translink', '/Translink/other']) {
    assert.equal(getDemoProfile(path).id, 'general', path);
  }
});

test('both variants carry distinct page titles and map labels', () => {
  const general = getDemoProfile('/');
  const translink = getDemoProfile('/Translink');
  assert.notEqual(general.title, translink.title);
  assert.ok(translink.mapDescription.includes('Belfast'));
  assert.ok(!general.mapDescription.includes('Belfast'));
});
