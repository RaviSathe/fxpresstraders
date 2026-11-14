import { Component, DestroyRef, afterNextRender, inject } from '@angular/core';
import { cursorAndNav, greenBarCursor, spotlight } from './core/effects';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    const destroyRef = inject(DestroyRef);

    // Site-wide effects, started once in the browser and kept across page changes.
    afterNextRender(() => {
      const root = document.documentElement;
      const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      root.classList.add('fx-js');
      if (reduceMotion) root.classList.add('fx-reduce');

      const cleanups = [cursorAndNav(root, reduceMotion), greenBarCursor(root), spotlight()];
      destroyRef.onDestroy(() => cleanups.forEach((fn) => fn()));
    });
  }
}
