import { describe, expect, it } from 'vitest';
import { validateAbout, validateContact } from '../components/AboutContactModel';
import { validateSlots } from '../components/ProjectModel';
import { SAMPLE_DRAFT } from './sampleDraft';

describe('sample draft', () => {
  it('respects every documented slot limit', () => {
    expect(validateAbout(SAMPLE_DRAFT.about ?? {})).toEqual([]);
    expect(validateContact(SAMPLE_DRAFT.contact ?? {})).toEqual([]);
    for (const slots of Object.values(SAMPLE_DRAFT.projects ?? {})) expect(validateSlots(slots)).toEqual([]);
  });
});
