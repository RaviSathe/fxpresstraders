import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Course } from './pages/course/course';
import { Markets } from './pages/markets/markets';
import { HowItWorks } from './pages/how-it-works/how-it-works';
import { About } from './pages/about/about';
import { Community } from './pages/community/community';
import { Risk } from './pages/risk/risk';
import { Resources } from './pages/resources/resources';
import { Contact } from './pages/contact/contact';
import { NotFound } from './pages/not-found/not-found';

const routes: Routes = [
  { path: '', component: Home, title: 'fxpressTraders · Learn to trade forex & crypto' },
  { path: 'course', component: Course, title: 'The course · fxpressTraders' },
  { path: 'markets', component: Markets, title: 'Forex & crypto markets · fxpressTraders' },
  { path: 'how-it-works', component: HowItWorks, title: 'How it works & FAQ · fxpressTraders' },
  { path: 'about', component: About, title: 'About · fxpressTraders' },
  { path: 'resources', component: Resources, title: 'Free trading tools & resources · fxpressTraders' },
  { path: 'contact', component: Contact, title: 'Contact us · fxpressTraders' },
  { path: 'community', component: Community, title: 'Join the community · fxpressTraders' },
  { path: 'risk-disclosure', component: Risk, title: 'Risk disclosure · fxpressTraders' },
  { path: '**', component: NotFound, title: 'Page not found · fxpressTraders' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
      enableViewTransitions: true,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
