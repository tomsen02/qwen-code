/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import type { SkillConfig } from '@qwen-code/qwen-code-core';
import { mapSkillConfigToStatus } from './workspace-skills-mapping.js';

function makeSkill(overrides: Partial<SkillConfig> = {}): SkillConfig {
  return {
    name: 'review',
    description: 'Review changed code',
    level: 'bundled',
    ...overrides,
  } as SkillConfig;
}

describe('mapSkillConfigToStatus', () => {
  it('maps an invocable skill to an ok status with its core fields', () => {
    const status = mapSkillConfigToStatus(
      makeSkill({ argumentHint: '[pr-number]' }),
    );

    expect(status).toEqual({
      kind: 'skill',
      status: 'ok',
      name: 'review',
      description: 'Review changed code',
      level: 'bundled',
      modelInvocable: true,
      argumentHint: '[pr-number]',
    });
  });

  it('marks a disable-model-invocation skill as disabled', () => {
    const status = mapSkillConfigToStatus(
      makeSkill({ name: 'internal', disableModelInvocation: true }),
    );

    expect(status.status).toBe('disabled');
    expect(status.modelInvocable).toBe(false);
    expect(status.name).toBe('internal');
  });

  it('surfaces optional model and extensionName only when present', () => {
    expect(mapSkillConfigToStatus(makeSkill())).not.toHaveProperty('model');
    expect(mapSkillConfigToStatus(makeSkill())).not.toHaveProperty(
      'extensionName',
    );

    const status = mapSkillConfigToStatus(
      makeSkill({ model: 'gpt-4o', extensionName: 'acme' }),
    );
    expect(status.model).toBe('gpt-4o');
    expect(status.extensionName).toBe('acme');
  });

  it('does not set disabled when disabledSkillNames is omitted', () => {
    const status = mapSkillConfigToStatus(makeSkill());
    expect(status).not.toHaveProperty('disabled');
    expect(status.status).toBe('ok');
  });

  it('marks a user-disabled skill with disabled: true and status disabled', () => {
    const disabled = new Set(['review']);
    const status = mapSkillConfigToStatus(makeSkill(), disabled);

    expect(status.disabled).toBe(true);
    expect(status.status).toBe('disabled');
    expect(status.modelInvocable).toBe(true);
  });

  it('does not set disabled for skills not in the disabled set', () => {
    const disabled = new Set(['other-skill']);
    const status = mapSkillConfigToStatus(
      makeSkill({ name: 'review' }),
      disabled,
    );

    expect(status).not.toHaveProperty('disabled');
    expect(status.status).toBe('ok');
  });

  it('matches disabled skill names case-insensitively', () => {
    const disabled = new Set(['review']);
    const status = mapSkillConfigToStatus(
      makeSkill({ name: 'Review' }),
      disabled,
    );

    expect(status.disabled).toBe(true);
    expect(status.status).toBe('disabled');
  });

  it('sets disabled and preserves modelInvocable when both mechanisms apply', () => {
    const disabled = new Set(['internal']);
    const status = mapSkillConfigToStatus(
      makeSkill({ name: 'internal', disableModelInvocation: true }),
      disabled,
    );

    expect(status.disabled).toBe(true);
    expect(status.modelInvocable).toBe(false);
    expect(status.status).toBe('disabled');
  });
});
