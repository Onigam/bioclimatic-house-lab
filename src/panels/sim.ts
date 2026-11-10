import {
  fill,
  h,
  icon,
  ICONS,
  LineChart,
  SERIES_COLORS,
  section as kitSection,
  select as kitSelect,
  slider as kitSlider,
  toggle as kitToggle,
  type AppContext,
  type PanelController,
} from '@onigam/lab-kit/ui';
import { RECORDS, SITE_IDS, type RecordId, type SiteId, type SkyMode } from '../sim/climate';
import type { HouseSim } from '../sim/engine';
import type { WallMaterialId } from '../sim/machine';
import type { SeasonMode, VentMode } from '../sim/plant';
import { PARAM_TEXTS, VENT_TEXTS, MODE_TEXTS, MATERIAL_TEXTS, SKY_TEXTS } from '../sim/texts';
import { PRESET_IDS, RANGES, SCENARIO_IDS, type RangedKey } from '../sim/presets';
import type { Ladder } from '../sim/runs';
import type { HouseParams, PresetId, ScenarioId } from '../sim/types';
import {
  mainReadouts,
  moreReadouts,
  niceCeil3,
  scopeDays,
  seasonKey,
  statusOf,
  wallProfile,
  type Readout,
} from './model';
import { claims, dateText, hourText, num, st, sx, type PanelKey } from './strings';

// Simulation mode: starting points and scenarios, what is happening now, the clock and the settings the sheets and lessons name, the charts, the season (the film's question, with who says what), and the rest folded. Built only from the
// kit's widgets and charts.

/** The air's dashed line, a reference: the same grey as the other labs', readable on both cards, which a canvas cannot read from a token. */
const AIR_LINE = '#78838d';

interface Control {
  key: keyof HouseParams;
  el: HTMLElement;
  kind: 'slider' | 'toggle' | 'select';
  fmt?: (v: number) => string;
}

type ChartOpts = ConstructorParameters<typeof LineChart>[0];

export class SimPanel implements PanelController {
  readonly el = h('div', { class: 'sim' });
  private presetSelect: HTMLSelectElement | null = null;
  private lesson = h('div', {});
  private status = h('div', {});
  private readouts = h('div', { class: 'readouts' });
  private more = h('div', { class: 'loss-legend' });
  private season = h('div', {});
  private extras = h('div', {});
  private controls: Control[] = [];
  private shownScenario: ScenarioId | null = null;
  private lastReadouts = 0;
  private lastLive = 0;
  /** The season's answer for the settings it was run on. */
  private ladder: { key: string; value: Ladder } | null = null;
  private busy = false;

  private tempChart: LineChart;
  private sunChart: LineChart;
  private flowChart: LineChart;
  private elecChart: LineChart;
  private wallChart: LineChart;
  private tempOpts: ChartOpts;
  private sunOpts: ChartOpts;
  private flowOpts: ChartOpts;
  private elecOpts: ChartOpts;
  private wallOpts: ChartOpts;

  constructor(private ctx: AppContext<HouseSim>) {
    const plain = (v: number) => num(v);
    const x = (v: number) => `${num(v, 1)} ${st('unitDays')}`;
    this.tempOpts = {
      height: 150,
      series: [
        { key: 'outer', label: () => st('seriesOuter'), color: SERIES_COLORS.dump, bold: true },
        { key: 'inner', label: () => st('seriesInner'), color: SERIES_COLORS.load, bold: true },
        { key: 'gapOut', label: () => st('seriesGapOut'), color: SERIES_COLORS.pv },
        { key: 'room', label: () => st('seriesRoom'), color: SERIES_COLORS.hydro },
        { key: 'air', label: () => st('seriesAir'), color: AIR_LINE, dash: true },
      ],
      yFmt: plain,
      xFmt: x,
    };
    this.tempChart = new LineChart(this.tempOpts);
    this.sunOpts = {
      height: 100,
      series: [{ key: 'sun', label: () => st('seriesSun'), color: SERIES_COLORS.pv, bold: true }],
      yMin: 0,
      yFmt: plain,
      xFmt: x,
      legend: false,
    };
    this.sunChart = new LineChart(this.sunOpts);
    this.flowOpts = {
      height: 100,
      series: [{ key: 'flow', label: () => st('seriesFlow'), color: SERIES_COLORS.hydro, bold: true }],
      yFmt: plain,
      xFmt: x,
      legend: false,
    };
    this.flowChart = new LineChart(this.flowOpts);
    this.elecOpts = {
      height: 100,
      series: [{ key: 'aux', label: () => st('seriesElec'), color: SERIES_COLORS.load, bold: true }],
      yMin: 0,
      yFmt: (v) => num(v, v < 3 ? 1 : 0),
      xFmt: x,
      legend: false,
    };
    this.elecChart = new LineChart(this.elecOpts);
    this.wallOpts = {
      height: 120,
      series: [{ key: 'wall', label: () => st('seriesWall'), color: SERIES_COLORS.dump, bold: true }],
      yFmt: plain,
      xFmt: (v) => `${num(v * 100)} cm`,
      legend: false,
    };
    this.wallChart = new LineChart(this.wallOpts);
  }

  /** Apply a change live: the panel is not rebuilt, so the dragged input survives. */
  private set(patch: Partial<HouseParams>): void {
    this.ctx.sim.set(patch);
    this.renderStatus();
    this.renderReadouts();
    this.renderSeason();
    this.renderExtras();
  }

  render(): void {
    const sim = this.ctx.sim;
    const p = sim.params;
    this.controls = [];
    this.shownScenario = sim.scenarioNow;

    const presetSelect = h(
      'select',
      {
        'aria-label': st('preset'),
        onchange: (ev: Event) => {
          sim.applyPreset((ev.target as HTMLSelectElement).value as PresetId);
          this.render();
        },
      },
      ...PRESET_IDS.map((id) => h('option', { value: id, selected: p.preset === id }, sx('preset', id))),
      h('option', { value: 'custom', selected: p.preset === 'custom', disabled: true }, st('custom')),
    );
    this.presetSelect = presetSelect;

    const track = (key: keyof HouseParams, el: HTMLElement, kind: Control['kind'], fmt?: (v: number) => string) => {
      this.controls.push({ key, el, kind, fmt });
      return el;
    };
    /** A slider of a ranged parameter, named as the sheets name it (src/sim/texts.ts) unless a label is given. */
    const slider = (field: RangedKey, fmt: (v: number) => string, label?: string) => {
      const r = RANGES[field];
      const words = label ?? this.paramLabel(field);
      return track(
        field,
        kitSlider(words, p[field] as number, r.min, r.max, r.step, fmt, (v) =>
          this.set({ [field]: v } as Partial<HouseParams>),
        ),
        'slider',
        fmt,
      );
    };
    const choose = <T extends string>(
      key: keyof HouseParams,
      label: string,
      value: T,
      options: [T, string][],
      on: (v: T) => void,
    ) => track(key, kitSelect<T>(label, value, options, on), 'select');
    const flip = (key: keyof HouseParams, label: string, on: (v: boolean) => void) =>
      track(key, kitToggle(label, Boolean(p[key]), on), 'toggle');
    const hint = (key: PanelKey | 'modelNote') => h('p', { class: 'hint' }, st(key));
    const folded = (title: string, open: boolean, ...children: (HTMLElement | null)[]) => {
      const d = kitSection(title, ...children) as HTMLDetailsElement;
      d.open = open;
      return d;
    };
    const chartTitle = (key: PanelKey, unit: string) =>
      h(
        'div',
        { class: 'eyebrow' },
        st(key),
        ...(unit ? [h('span', { style: 'text-transform:none' }, ` (${unit})`)] : []),
      );
    const star = (v: string) => `${v} *`;

    fill(
      this.el,
      h('div', { class: 'eyebrow eyebrow--accent' }, st('simTitle')),
      hint('simIntro'),
      hint('modelNote'),
      h(
        'div',
        { class: 'sim-top' },
        presetSelect,
        h(
          'button',
          {
            class: 'btn',
            'aria-label': st('resetSim'),
            title: st('resetSim'),
            onclick: () => (sim.reset(), this.render()),
          },
          icon(ICONS.reset, 16),
        ),
      ),
      h('div', { class: 'eyebrow' }, st('scenarios')),
      h(
        'div',
        { class: 'part-chips' },
        ...SCENARIO_IDS.map((id) =>
          h(
            'button',
            {
              class: 'part-chip',
              onclick: () => {
                sim.applyScenario(id);
                this.render();
              },
            },
            sx('scenario', id),
          ),
        ),
      ),
      this.lesson,
      this.status,
      this.readouts,
      hint('speedHint'),

      h('div', { class: 'eyebrow' }, st('secClock')),
      slider('day', dateText, st('dayLabel')),
      slider('hour', hourText, st('hourLabel')),

      h('div', { class: 'eyebrow' }, st('secWall')),
      slider('wallThickness', (v) => `${num(v * 100)} cm`),
      slider('glazingLayers', (v) => `${num(v)} ${st(v === 1 ? 'unitSheet' : 'unitSheets')}`),
      slider('gap', (v) => `${num(v * 100)} cm`),
      slider('ductScale', (v) => `× ${num(v, 2)}`),
      choose<WallMaterialId>(
        'wallMaterial',
        st('materialLabel'),
        p.wallMaterial,
        (Object.keys(MATERIAL_TEXTS) as WallMaterialId[]).map((id) => [id, sx('material', id)]),
        (v) => this.set({ wallMaterial: v }),
      ),
      choose<SeasonMode>(
        'mode',
        st('modeLabel'),
        p.mode,
        (Object.keys(MODE_TEXTS) as SeasonMode[]).map((id) => [id, sx('mode', id)]),
        (v) => this.set({ mode: v }),
      ),
      choose<VentMode>(
        'vents',
        st('ventsLabel'),
        p.vents,
        (Object.keys(VENT_TEXTS) as VentMode[]).map((id) => [id, sx('vents', id)]),
        (v) => this.set({ vents: v }),
      ),
      flip('nightShutter', st('nightLabel'), (v) => this.set({ nightShutter: v })),

      h('div', { class: 'eyebrow' }, st('secHouse')),
      slider('G', (v) => `${num(v, 2)} W/m³·K`),
      slider('southWindows', (v) => star(`${num(v, 1)} m²`)),
      slider('collectorArea', (v) => `${num(v)} m²`),
      h('p', { class: 'hint' }, st('collectorHint')),
      slider('setpoint', (v) => `${num(v, 1)} °C`),
      slider('gains', (v) => star(`${num(v)} W`)),
      flip('backup', st('backupLabel'), (v) => this.set({ backup: v })),
      flip('earthTube', st('earthTubeLabel'), (v) => this.set({ earthTube: v })),

      h('div', { class: 'eyebrow' }, st('secPlace')),
      choose<SiteId>(
        'site',
        st('siteLabel'),
        p.site,
        SITE_IDS.map((id) => [id, sx('site', id)]),
        (v) => this.set({ site: v }),
      ),
      this.extras,
      choose<SkyMode>(
        'sky',
        st('skyLabel'),
        p.sky,
        (Object.keys(SKY_TEXTS) as SkyMode[]).map((id) => [id, sx('sky', id)]),
        (v) => this.set({ sky: v }),
      ),
      slider('airOffset', (v) => `${v > 0 ? '+' : ''}${num(v, 1)} K`),
      slider('wind', (v) => star(`${num(v, 1)} m/s`)),

      chartTitle('chartTemps', '°C'),
      this.tempChart.el,
      chartTitle('chartSun', 'W/m²'),
      this.sunChart.el,
      chartTitle('chartFlow', 'L/s'),
      this.flowChart.el,
      chartTitle('chartElec', 'kW'),
      this.elecChart.el,
      hint('chartsHint'),
      chartTitle('chartWall', '°C'),
      this.wallChart.el,

      h('div', { class: 'eyebrow' }, st('secSeason')),
      hint('seasonHint'),
      this.season,

      h('div', { class: 'eyebrow' }, st('limitsTitle')),
      ...(['limitFlow', 'limitSplit', 'limitChristmas', 'limitShare'] as const).map((k) => hint(k)),

      folded(
        st('secEstimates'),
        false,
        slider('absorptance', (v) => star(num(v, 2))),
        slider('lossK', (v) => star(num(v, 1))),
        choose<'source' | 'kit'>(
          'innerFilm',
          st('filmLabel'),
          p.innerFilm,
          [
            ['source', st('filmSource')],
            ['kit', st('filmKit')],
          ],
          (v) => this.set({ innerFilm: v }),
        ),
        flip('holdRoom', st('holdLabel'), (v) => this.set({ holdRoom: v })),
        flip('gvHoldsWall', st('gvLabel'), (v) => this.set({ gvHoldsWall: v })),
        hint('gvHint'),
        hint('estimatesHint'),
      ),
      folded(st('secMore'), false, this.more),
    );
    this.renderLesson();
    this.refresh();
  }

  /** Called every frame while the panel is open: figures at 5 Hz, charts at 2 Hz. */
  tick(dt: number): void {
    this.lastReadouts += dt;
    this.lastLive += dt;
    // a lesson or the spoken guide can start a scenario from outside
    if (this.ctx.sim.scenarioNow !== this.shownScenario) {
      this.render();
      return;
    }
    if (this.lastReadouts > 0.2) {
      this.lastReadouts = 0;
      this.renderStatus();
      this.renderReadouts();
      this.followScript();
    }
    if (this.lastLive > 0.5) {
      this.lastLive = 0;
      this.drawCharts();
      this.renderSeason();
    }
  }

  private paramLabel(key: keyof HouseParams): string {
    const text = PARAM_TEXTS[key];
    if (!text) return key;
    return sx('param', key);
  }

  private refresh(): void {
    this.renderStatus();
    this.renderReadouts();
    this.renderSeason();
    this.renderExtras();
    this.drawCharts();
  }

  private renderLesson(): void {
    const id = this.ctx.sim.scenarioNow;
    if (id) {
      fill(
        this.lesson,
        // the callout's own `b` is a narrow column for one word: the name stays in the running text
        h(
          'div',
          { class: 'callout callout--tip' },
          h('span', {}, h('strong', {}, sx('scenario', id)), '. ', sx('lesson', id)),
        ),
      );
    } else fill(this.lesson, h('p', { class: 'hint' }, st('scenarioHint')));
  }

  private renderStatus(): void {
    const sim = this.ctx.sim;
    if (this.presetSelect && this.presetSelect.value !== sim.params.preset) this.presetSelect.value = sim.params.preset;
    const status = statusOf(sim.state);
    if ('alarms' in status) {
      fill(
        this.status,
        ...status.alarms.map((a) =>
          a.severe
            ? h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, sx('alarm', a.key)))
            : h('p', { class: 'hint' }, sx('alarm', a.key)),
        ),
      );
    } else fill(this.status, h('p', { class: 'hint' }, st(status.key)));
  }

  /** Said only when it applies: the 3D stays the plateau of Odeillo and the record's choice needs its sky. */
  private renderExtras(): void {
    const p = this.ctx.sim.params;
    const record = h(
      'div',
      {},
      kitSelect<RecordId>(
        st('recordLabel'),
        p.record,
        (Object.keys(RECORDS) as RecordId[]).map((id) => [id, sx('record', id)]),
        (v) => this.set({ record: v }),
      ),
    );
    fill(
      this.extras,
      ...(p.site === 'odeillo' ? [] : [h('p', { class: 'hint' }, st('siteHint'))]),
      ...(p.sky === 'recorded' ? [record] : []),
    );
  }

  private renderReadouts(): void {
    const s = this.ctx.sim.state;
    const small = (x: Readout) =>
      h(
        'small',
        {},
        [x.unit, x.mark]
          .filter(Boolean)
          .join(' ')
          .replace(/^(?=.)/, ' '),
      );
    fill(
      this.readouts,
      ...mainReadouts(s).map((x) =>
        h('div', { class: 'readout' }, h('span', {}, st(x.key)), h('b', {}, num(x.value, x.digits), small(x))),
      ),
    );
    fill(
      this.more,
      ...moreReadouts(s).map((x) => h('span', {}, `${st(x.key)} `, h('b', {}, num(x.value, x.digits)), small(x))),
    );
  }

  /** The season's rungs and who says what: the answer is kept for the settings it was run on. */
  private renderSeason(): void {
    const sim = this.ctx.sim;
    const key = seasonKey(sim.params);
    const have = this.ladder && this.ladder.key === key ? this.ladder.value : null;
    const stale = this.ladder !== null && this.ladder.key !== key;
    const pct = (v: number, digits = 0) => `${num(v, digits)} % †`;
    const line = (label: string, value: string) =>
      h('div', { class: 'readout' }, h('span', {}, label), h('b', {}, value));
    const l = this.ladder?.value;
    fill(
      this.season,
      h(
        'button',
        {
          class: 'btn btn--primary',
          disabled: this.busy,
          onclick: () => this.runSeason(),
        },
        this.busy ? st('seasonBusy') : st('seasonRun'),
      ),
      ...(stale ? [h('p', { class: 'hint' }, st('seasonStale'))] : []),
      ...(l
        ? [
            h(
              'div',
              { class: 'readouts' },
              line(st('rungWall'), pct(l.wallOnly.share, 1)),
              line(st('rungWindows'), pct(l.wallAndWindows.share, 1)),
              line(st('rungAll'), pct(l.all.share, 1)),
              line(st('rungDark'), pct(l.allAgainstDark, 1)),
            ),
            h('div', { class: 'eyebrow' }, st('linesTitle')),
            h(
              'div',
              { class: 'readouts' },
              line(st('lineWallAir'), pct(l.all.wallAirShare)),
              line(st('lineWallConduction'), pct(l.all.wallConductionShare)),
              line(st('lineWindows'), pct(l.all.windowShare)),
              line(st('linePeople'), pct(l.all.gainsShare)),
              line(st('lineElectric'), pct(l.all.auxShare)),
              line(st('seasonLoad'), `${num(l.all.load)} kWh †`),
              line(st('seasonAir'), `${num(l.all.airMean, 1)} °C †`),
            ),
          ]
        : []),
      h('div', { class: 'eyebrow' }, st('claimsTitle')),
      h(
        'div',
        { class: 'readouts' },
        ...claims().map((c) => line(c.who, c.value)),
        ...(have ? [line(st('claimsOurs'), pct(have.all.share))] : []),
      ),
      h('p', { class: 'hint' }, st('claimsHint')),
    );
  }

  /** A long run: about two seconds for the four rungs. The button says so first, the run comes on the next turn of the event loop. */
  private runSeason(): void {
    if (this.busy) return;
    this.busy = true;
    this.renderSeason();
    setTimeout(() => {
      try {
        const sim = this.ctx.sim;
        const value = sim.ladder();
        this.ladder = { key: seasonKey(sim.params), value };
      } finally {
        this.busy = false;
        this.renderSeason();
      }
    }, 30);
  }

  /** A scenario can move a slider or flip a switch by itself, and the clock moves the day and the hour: the controls follow, but not the one being dragged. */
  private followScript(): void {
    const sim = this.ctx.sim;
    const p = sim.params;
    const active = typeof document !== 'undefined' ? document.activeElement : null;
    for (const c of this.controls) {
      const value = p[c.key];
      if (c.kind === 'select') {
        const sel = c.el.querySelector('select') as HTMLSelectElement | null;
        if (sel && active !== sel && sel.value !== String(value)) sel.value = String(value);
        continue;
      }
      const input = c.el.querySelector('input') as HTMLInputElement | null;
      if (!input || active === input) continue;
      if (c.kind === 'toggle') {
        if (input.checked !== value) input.checked = Boolean(value);
      } else if (typeof value === 'number' && Math.abs(Number(input.value) - value) > 1e-9) {
        input.value = String(value);
        const out = c.el.querySelector('output');
        if (out && c.fmt) out.textContent = c.fmt(value);
      }
    }
  }

  private drawCharts(): void {
    const sim = this.ctx.sim;
    const sc = sim.scope;
    const xs = scopeDays(sc);
    const all = [...sc.outer, ...sc.inner, ...sc.gapOut, ...sc.room, ...sc.air];
    const low = all.length ? Math.floor(Math.min(...all) / 10) * 10 : 0;
    this.tempOpts.yMin = low;
    this.tempOpts.yMax = low + niceCeil3(Math.max(all.length ? Math.max(...all) - low : 30, 3) * 1.05);
    this.tempChart.setData(xs, { outer: sc.outer, inner: sc.inner, gapOut: sc.gapOut, room: sc.room, air: sc.air });
    this.tempChart.draw();
    this.sunOpts.yMax = niceCeil3(Math.max(300, ...sc.sun) * 1.05);
    this.sunChart.setData(xs, { sun: sc.sun });
    this.sunChart.draw();
    const flowMax = Math.max(10, ...sc.flow);
    const flowMin = Math.min(0, ...sc.flow);
    this.flowOpts.yMin = flowMin < 0 ? -niceCeil3(-flowMin * 1.1) : 0;
    this.flowOpts.yMax = niceCeil3(flowMax * 1.05);
    this.flowChart.setData(xs, { flow: sc.flow });
    this.flowChart.draw();
    const kw = sc.aux.map((w) => w / 1000);
    this.elecOpts.yMax = niceCeil3(Math.max(3, ...kw) * 1.05);
    this.elecChart.setData(xs, { aux: kw });
    this.elecChart.draw();
    const wall = wallProfile(sim.state);
    const t = [...wall.ys];
    const wl = Math.floor(Math.min(...t) / 10) * 10;
    this.wallOpts.yMin = wl;
    this.wallOpts.yMax = wl + niceCeil3(Math.max(Math.max(...t) - wl, 3) * 1.05);
    this.wallChart.setData(wall.xs, { wall: wall.ys });
    this.wallChart.draw();
  }
}
