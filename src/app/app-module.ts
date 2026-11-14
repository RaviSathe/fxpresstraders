import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

import { MagneticDirective, RevealDirective } from './shared/directives';
import { SiteNav } from './shared/site-nav/site-nav';
import { SiteFooter } from './shared/site-footer/site-footer';
import { PageHero } from './shared/page-hero/page-hero';
import { JoinCta } from './shared/join-cta/join-cta';
import { SessionsPanel } from './shared/sessions-panel/sessions-panel';
import { AreaChart } from './shared/area-chart/area-chart';
import { LeadPopup } from './shared/lead-popup/lead-popup';

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

@NgModule({
  declarations: [
    App,
    // shared
    RevealDirective,
    MagneticDirective,
    SiteNav,
    SiteFooter,
    PageHero,
    JoinCta,
    SessionsPanel,
    AreaChart,
    LeadPopup,
    // pages
    Home,
    Course,
    Markets,
    HowItWorks,
    About,
    Community,
    Risk,
    Resources,
    Contact,
    NotFound,
  ],
  imports: [BrowserModule, AppRoutingModule],
  providers: [provideBrowserGlobalErrorListeners(), provideClientHydration(withEventReplay())],
  bootstrap: [App],
})
export class AppModule {}
