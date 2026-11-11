import { h, icon, ICONS } from '@onigam/lab-kit/ui';
import { t } from '../i18n/ui';
import { ACCESS, LAW, SOURCES } from './sources';

// The content of the Sources panel, for `about` in src/lab.ts (`about: aboutPanel`): the notices, the warning and the law, said once here, the credits and every link, each source saying how it was read. The lab has no main video: its main
// source is a paper, and the panel says so.

/** The notices, then the law, then every source with a link. */
export function aboutPanel(): HTMLElement[] {
  const fr = document.documentElement.lang !== 'en';
  const link = (href: string, label: string) => h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, label);
  return [
    h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, t('safety'))),
    h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, t('hazards'))),
    h('div', { class: 'callout callout--tip' }, h('span', {}, t('disclaimer'))),
    h('div', { class: 'callout callout--tip' }, h('span', {}, t('noticeReading'))),
    h('h3', { class: 'section-title' }, t('lawTitle')),
    h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, t('legal'))),
    h(
      'ul',
      { class: 'links' },
      ...LAW.map(([place, f, e]) => h('li', {}, h('strong', {}, fr ? place[0] : place[1]), ' — ', fr ? f : e)),
    ),
    h('p', {}, t('mainSource'), ' ', t('mainSourceNote')),
    ...SOURCES.flatMap((group) => [
      h('h3', { class: 'section-title' }, fr ? group.fr : group.en),
      h(
        'ul',
        { class: 'links' },
        ...group.items.map((s) => {
          const access = ACCESS[s.access];
          return h(
            'li',
            {},
            s.href ? link(s.href, fr ? s.label[0] : s.label[1]) : fr ? s.label[0] : s.label[1],
            ' — ',
            fr ? s.fr : s.en,
            ' (',
            fr ? access[0] : access[1],
            ')',
          );
        }),
      ),
    ]),
    h('p', { class: 'hint' }, t('sourcesNotLinked')),
    h('p', { class: 'hint' }, t('sourcesCredits')),
    h('p', { class: 'hint' }, 'Three.js · TypeScript · Vite — MIT'),
  ];
}
