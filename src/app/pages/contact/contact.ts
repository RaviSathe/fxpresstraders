import { Component, signal } from '@angular/core';
import { CONTACT_EMAIL, PHONE_DISPLAY, PHONE_URL, TELEGRAM_URL, WHATSAPP_URL } from '../../core/site-data';

type State = 'form' | 'sending' | 'done';

const MESSAGES: Record<string, string> = {
  name: 'Please enter your name.',
  email: 'Please enter a valid email.',
  phone: 'Please enter a valid phone number.',
  topic: 'Please choose a topic.',
  message: 'Please write a little more (at least 10 characters).',
  consent: 'Please agree so we can reply to you.',
};

@Component({
  selector: 'app-contact',
  templateUrl: './contact.html',
  standalone: false,
})
export class Contact {
  protected readonly telegramUrl = TELEGRAM_URL;
  protected readonly whatsappUrl = WHATSAPP_URL;
  protected readonly email = CONTACT_EMAIL;
  protected readonly phone = PHONE_DISPLAY;
  protected readonly phoneUrl = PHONE_URL;

  protected readonly state = signal<State>('form');
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly formError = signal('');
  protected readonly chars = signal(0);

  protected async submit(e: SubmitEvent): Promise<void> {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    this.formError.set('');

    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      phone: String(data.get('phone') ?? '').trim(),
      topic: String(data.get('topic') ?? ''),
      message: String(data.get('message') ?? '').trim(),
      consent: data.get('consent') === 'on',
      website: String(data.get('website') ?? ''),
    };

    // Native checks first, plus "email or phone" which HTML can't express.
    const errs: Record<string, string> = {};
    for (const el of Array.from(form.elements) as HTMLInputElement[]) {
      if (el.name && !el.validity.valid && !errs[el.name]) errs[el.name] = MESSAGES[el.name] ?? 'Please check this field.';
    }
    if (!payload.email && !payload.phone) errs['email'] = 'Add an email or a phone number so we can reply.';
    if (Object.keys(errs).length) {
      this.errors.set(errs);
      form.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    this.errors.set({});

    this.state.set('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { errors?: Record<string, string>; error?: string };
      if (!res.ok) {
        this.state.set('form');
        if (json.errors) this.errors.set(json.errors);
        else this.formError.set(json.error ?? 'Something went wrong. Please try again.');
        return;
      }
      this.state.set('done');
      form.reset();
      this.chars.set(0);
    } catch {
      this.state.set('form');
      this.formError.set("We couldn't reach the server. Check your connection and try again.");
    }
  }

  protected clearError(field: string): void {
    if (!this.errors()[field]) return;
    this.errors.update((e) => {
      const next = { ...e };
      delete next[field];
      return next;
    });
  }

  protected again(): void {
    this.state.set('form');
  }
}
