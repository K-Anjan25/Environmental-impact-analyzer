import { TOPICS } from './content';

/*
 * Validation rules for the public contact form. These are pure functions so they can be tested
 * without rendering. The form never sends data to this site's servers. See ContactForm.tsx.
 */

export type ContactValues = {
  name: string;
  email: string;
  topic: string;
  message: string;
  /** Honeypot field. Real visitors never see or fill it. */
  website: string;
};

export type ContactErrors = Partial<Record<'name' | 'email' | 'topic' | 'message', string>>;

export const EMPTY_CONTACT: ContactValues = { name: '', email: '', topic: '', message: '', website: '' };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {};
  const name = values.name.trim();
  if (name.length < 2 || name.length > 80) errors.name = 'Enter your name, 2 to 80 characters.';

  const email = values.email.trim();
  if (email.length === 0) errors.email = 'Enter an email address so we can reply.';
  else if (email.length > 254 || !EMAIL_PATTERN.test(email)) errors.email = 'Enter an email address in the form name@example.com.';

  if (!(TOPICS as readonly string[]).includes(values.topic)) errors.topic = 'Choose the topic closest to your message.';

  const message = values.message.trim();
  if (message.length < 10) errors.message = 'Write at least 10 characters so we know what to answer.';
  else if (message.length > 1000) errors.message = 'Keep the message to 1,000 characters or fewer.';

  return errors;
}

/** True when the honeypot was filled, which usually means an automated form submission. */
export function isHoneypotTripped(values: ContactValues): boolean {
  return values.website.trim() !== '';
}

/** Plain-text version of a valid message, ready to paste into a GitHub issue. */
export function formatMessageText(values: ContactValues): string {
  return [
    `Topic: ${values.topic}`,
    `Name: ${values.name.trim()}`,
    `Reply to: ${values.email.trim()}`,
    '',
    values.message.trim(),
  ].join('\n');
}

/** A mailto link for a configured mailbox. Opens the visitor's own mail client; nothing is sent by this site. */
export function mailtoHref(address: string, values: ContactValues): string {
  const subject = encodeURIComponent(`[EcoImpact Lab] ${values.topic}`);
  const body = encodeURIComponent(formatMessageText(values));
  return `mailto:${address}?subject=${subject}&body=${body}`;
}
