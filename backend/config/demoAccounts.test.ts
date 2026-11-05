import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEMO_ACCOUNTS,
  getDemoAccountMutationMessage,
  isDemoAccount,
  isDemoAccountEmail,
} from './demoAccounts.js';
import { getPermissionsForRole, hasAuthorizedRole } from '../middleware/permissions.js';

test('demo account restrictions cover each seeded identity and protected mutation', () => {
  const mutations = [
    ['password', 'Demo accounts cannot change their password.'],
    ['email', 'Demo accounts cannot change their email.'],
    ['role', 'Demo account roles cannot be changed.'],
    ['deletion', 'Demo accounts cannot be deleted.'],
  ] as const;

  for (const account of DEMO_ACCOUNTS) {
    assert.equal(isDemoAccountEmail(account.email.toUpperCase()), true);
    assert.equal(isDemoAccount({ email: account.email }), true);
    assert.equal(isDemoAccount({ _id: account._id, email: 'renamed@example.com' }), true);

    for (const [mutation, message] of mutations) {
      assert.equal(getDemoAccountMutationMessage(account, mutation), message);
    }
  }

  assert.equal(isDemoAccount({ _id: 'normal-user', email: 'user@example.com' }), false);
  assert.equal(getDemoAccountMutationMessage(null, 'password'), null);
});

test('demo account roles cannot access administrator-only routes or permissions', () => {
  for (const account of DEMO_ACCOUNTS) {
    assert.notEqual(account.role, 'admin');
    assert.equal(hasAuthorizedRole(account.role, ['admin']), false);
    assert.equal(getPermissionsForRole(account.role).includes('users.manage'), false);
    assert.equal(getPermissionsForRole(account.role).includes('audit.read'), false);
  }

  assert.equal(hasAuthorizedRole('admin', ['admin']), true);
});
