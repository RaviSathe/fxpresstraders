import { Component, DestroyRef, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TELEGRAM_URL, WHATSAPP_URL } from '../../core/site-data';

/** How long after arriving before the form appears. */
const DELAY_MS = 10_000;
/** After someone closes the form, wait this long before showing it again. */
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;
const STORE_KEY = 'fx-lead-v1';

type State = 'form' | 'sending' | 'done';

/**
 * Sign-up form shown in a modal 10 seconds after a visitor arrives.
 * Closing it (X, Cancel, Esc or clicking outside) snoozes it for 3 days;
 * submitting it means it never appears again for that visitor.
 */
@Component({
  selector: 'app-lead-popup',
  templateUrl: './lead-popup.html',
  standalone: false,
})
export class LeadPopup {
  protected readonly telegramUrl = TELEGRAM_URL;
  protected readonly whatsappUrl = WHATSAPP_URL;

  protected readonly state = signal<State>('form');
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly formError = signal('');
  protected readonly firstName = signal('');

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly router = inject(Router);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (!this.shouldShow()) return;
      const timer = window.setTimeout(() => this.open(), DELAY_MS);
      destroyRef.onDestroy(() => window.clearTimeout(timer));
    });
  }

  private shouldShow(): boolean {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (!saved) return true;
      if (saved === 'submitted') return false;
      return Date.now() - Number(saved) > SNOOZE_MS;
    } catch {
      return true; // storage blocked (private mode): show it once per page load
    }
  }

  private remember(value: string): void {
    try {
      localStorage.setItem(STORE_KEY, value);
    } catch {
      /* storage blocked: nothing to remember */
    }
  }

  private open(): void {
    const d = this.dialog().nativeElement;
    // Don't interrupt someone who is in the middle of another dialog or menu.
    if (d.open || document.querySelector('dialog[open]') || document.querySelector('.drawer.is-open')) {
      window.setTimeout(() => this.open(), 4000);
      return;
    }
    d.showModal();
    document.documentElement.classList.add('fx-modal');
  }

  /** X button, Cancel button, Esc key and backdrop clicks all land here. */
  protected close(): void {
    const d = this.dialog().nativeElement;
    if (this.state() !== 'done') this.remember(String(Date.now()));
    d.classList.add('is-closing');
    window.setTimeout(() => {
      d.close();
      d.classList.remove('is-closing');
      document.documentElement.classList.remove('fx-modal');
    }, 220);
  }

  /** Esc fires "cancel"; route it through close() so the exit animation and snooze run. */
  protected onCancel(e: Event): void {
    e.preventDefault();
    this.close();
  }

  /** A click on the dialog element itself (not its card) is a click on the backdrop. */
  protected onDialogClick(e: MouseEvent): void {
    if (e.target === this.dialog().nativeElement) this.close();
  }

  protected async submit(e: SubmitEvent): Promise<void> {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    this.formError.set('');

    if (!form.checkValidity()) {
      this.errors.set(collectNativeErrors(form));
      form.querySelector<HTMLElement>(':invalid')?.focus();
      return;
    }
    this.errors.set({});

    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') ?? ''),
      phone: String(data.get('phone') ?? ''),
      email: String(data.get('email') ?? ''),
      interest: String(data.get('interest') ?? ''),
      experience: String(data.get('experience') ?? ''),
      consent: data.get('consent') === 'on',
      website: String(data.get('website') ?? ''),
      page: this.router.url,
    };

    this.state.set('sending');
    try {
      const res = await fetch('/api/leads', {
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
      this.firstName.set(payload.name.split(' ')[0]);
      this.remember('submitted');
      this.state.set('done');
    } catch {
      this.state.set('form');
      this.formError.set("We couldn't reach the server. Check your connection and try again.");
    }
  }

  /** Clear a field's error as soon as the visitor edits it. */
  protected clearError(field: string): void {
    if (!this.errors()[field]) return;
    this.errors.update((e) => {
      const next = { ...e };
      delete next[field];
      return next;
    });
  }
}

const MESSAGES: Record<string, string> = {
  name: 'Please enter your name.',
  phone: 'Please enter a valid phone number.',
  email: 'Please enter a valid email.',
  interest: 'Please choose one.',
  experience: 'Please choose one.',
  consent: 'Please agree so we can contact you.',
};

function collectNativeErrors(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {};
  for (const el of Array.from(form.elements) as HTMLInputElement[]) {
    if (el.name && !el.validity.valid && !out[el.name]) out[el.name] = MESSAGES[el.name] ?? 'Please check this field.';
  }
  return out;
}
