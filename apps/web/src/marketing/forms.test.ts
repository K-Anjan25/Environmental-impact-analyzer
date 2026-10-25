import { describe, expect, it } from 'vitest';
import { EMPTY_CONTACT, formatMessageText, isHoneypotTripped, mailtoHref, validateContact, type ContactValues } from './forms';

const valid: ContactValues = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  topic: 'Data question',
  message: 'Which rows cover dyeing in a single geography?',
  website: '',
};

describe('validateContact', () => {
  it('accepts a complete, well-formed message', () => {
    expect(validateContact(valid)).toEqual({});
  });

  it('reports every empty required field', () => {
    const errors = validateContact(EMPTY_CONTACT);
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name', 'topic']);
  });

  it('rejects names that are too short or too long after trimming', () => {
    expect(validateContact({ ...valid, name: '  A  ' }).name).toBeDefined();
    expect(validateContact({ ...valid, name: 'x'.repeat(81) }).name).toBeDefined();
    expect(validateContact({ ...valid, name: 'Al' }).name).toBeUndefined();
  });

  it('rejects malformed email addresses', () => {
    for (const email of ['asha', 'asha@', 'asha@example', 'a b@example.com', 'asha@example.c']) {
      expect(validateContact({ ...valid, email }).email, email).toBeDefined();
    }
  });

  it('accepts a topic from the fixed list only', () => {
    expect(validateContact({ ...valid, topic: 'Partnership' }).topic).toBeDefined();
    expect(validateContact({ ...valid, topic: 'Pilot or partnership' }).topic).toBeUndefined();
  });

  it('enforces the message length bounds', () => {
    expect(validateContact({ ...valid, message: 'Too short' }).message).toBeDefined();
    expect(validateContact({ ...valid, message: 'a'.repeat(1001) }).message).toBeDefined();
    expect(validateContact({ ...valid, message: 'a'.repeat(1000) }).message).toBeUndefined();
  });

  it('flags a filled honeypot so the caller can drop the submission', () => {
    expect(isHoneypotTripped({ ...valid, website: 'https://spam.example' })).toBe(true);
    expect(isHoneypotTripped(valid)).toBe(false);
  });
});

describe('message formatting', () => {
  it('builds the copyable text with trimmed fields and no honeypot value', () => {
    const text = formatMessageText({ ...valid, name: '  Asha Rao  ', website: 'hidden' });
    expect(text).toBe('Topic: Data question\nName: Asha Rao\nReply to: asha@example.com\n\nWhich rows cover dyeing in a single geography?');
    expect(text).not.toContain('hidden');
  });

  it('encodes the mailto link so the body survives special characters', () => {
    const href = mailtoHref('team@example.org', { ...valid, message: 'Line one & two?\nLine three' });
    expect(href.startsWith('mailto:team@example.org?subject=')).toBe(true);
    expect(href).toContain('%26');
    expect(href).not.toContain(' ');
  });
});
