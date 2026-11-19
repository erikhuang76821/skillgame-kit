// Tests for precommit.mjs: which games a set of staged paths puts under `npm test` + audit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { stagedGames } from './precommit.mjs';

const hasGame = g => ['TwinStrike', 'SwarmDuel'].includes(g);

test('a profile-only commit checks that game: its flags decide which documents and tests the game owes', () => {
  assert.deepEqual(stagedGames(['TwinStrike/game.profile.json'], hasGame), ['TwinStrike']);
});

test('art-only changes, shared files and folders without a game/ are not game checks', () => {
  assert.deepEqual(stagedGames(['TwinStrike/art/manifest.json', 'shared/tools/loop.mjs', 'knowledge-base/README.md', '.claude/launch.json'], hasGame), []);
  assert.deepEqual(stagedGames(['SwarmDuel/gdd/05_game_spec.md', 'SwarmDuel/art/a.png', 'TwinStrike/docs/loop/x.md', 'SwarmDuel/README.md'], hasGame), ['SwarmDuel', 'TwinStrike']);
});
