/**
 * MethodologyPage.js
 * Editorial methodology companion for the Municipal Ideological Score.
 */

import { t } from '../i18n/index.js';

const tocItems = [
  ['what-is-mis', '01', 'methodology.navWhat'],
  ['project-continuity', '02', 'methodology.navContinuity'],
  ['how-it-works', '03', 'methodology.navConstruction'],
  ['imputation', '04', 'methodology.navImputation'],
  ['sources', '05', 'methodology.navSources'],
  ['variables', '06', 'methodology.navVariables'],
  ['interpretation', '07', 'methodology.navInterpretation'],
  ['limitations', '08', 'methodology.navLimitations'],
  ['references', '09', 'methodology.navReferences'],
];

const variables = [
  ['ideo_imp', '[-1.0, +1.0]', 'methodology.varIdeoImp'],
  ['ideo_na', '[-1.0, +1.0]', 'methodology.varIdeoNa'],
  ['closeness', '[0.0, 1.0]', 'methodology.varCloseness'],
  ['ideo_pres', '[-1.0, +1.0]', 'methodology.varIdeoPres'],
  ['supp_pres', '[0.0, 1.0]', 'methodology.varSuppPres'],
  ['fragf', '[0.0, 1.0]', 'methodology.varFragf'],
  ['comp', '[0.0, 1.0]', 'methodology.varComp'],
  ['pol_pi', '[0.0, 10.0]', 'methodology.varPolPi'],
  ['var_pob', 'percent', 'methodology.varVarPob'],
];

const sources = [
  ['TSE', 'methodology.sourceTse'],
  ['BLS', 'methodology.sourceBls'],
  ['IBGE', 'methodology.sourceIbge'],
  ['UNDP', 'methodology.sourceUndp'],
  ['IPEAData', 'methodology.sourceIpea'],
  ['STN / Siconfi', 'methodology.sourceStn'],
];

const imputationGroups = [
  ['methodology.imputationLeftTitle', 'methodology.imputationLeftBody'],
  ['methodology.imputationCenterLeftTitle', 'methodology.imputationCenterLeftBody'],
  ['methodology.imputationCenterRightTitle', 'methodology.imputationCenterRightBody'],
  ['methodology.imputationRightTitle', 'methodology.imputationRightBody'],
];

const references = [
  {
    title: 'Power, Timothy J., and Rodrigo Rodrigues-Silveira. "Mapping Ideological Preferences in Brazilian Elections, 1994-2018: A Municipal-Level Study."',
    body: 'Brazilian Political Science Review 13, no. 1 (2019). DOI: 10.1590/1981-3821201900010001',
  },
  {
    title: 'Power, Timothy J., and Cesar Zucco. "Elite Preferences in a Consolidating Democracy: The Brazilian Legislative Surveys, 1990-2009."',
    body: 'Latin American Politics and Society 54, no. 4 (2012): 1-27.',
  },
  {
    title: 'Dalton, Russell J. "The Quantity and the Quality of Party Systems: Party System Polarization, Its Measurement, and Its Consequences."',
    body: 'Comparative Political Studies 41, no. 7 (2008): 899-920.',
  },
  {
    title: 'Gross, Donald A., and Lee Sigelman. "Comparing Party Systems: A Multidimensional Approach."',
    body: 'Comparative Politics 16, no. 4 (1984): 463-479.',
  },
];

function buildScale() {
  return `
    <div class="space-y-3">
      <div class="grid grid-cols-3 gap-px bg-outline-variant/10 border border-outline-variant/10 overflow-hidden">
        <div class="bg-ideo-left px-4 py-4 text-center text-white">
          <p class="font-label text-[9px] uppercase tracking-[0.18em]">-1.0</p>
          <p class="font-headline text-lg mt-1">${t('ideo.extremeLeft')}</p>
        </div>
        <div class="bg-ideo-center px-4 py-4 text-center text-white">
          <p class="font-label text-[9px] uppercase tracking-[0.18em]">0.0</p>
          <p class="font-headline text-lg mt-1">${t('ideo.center')}</p>
        </div>
        <div class="bg-ideo-right px-4 py-4 text-center text-white">
          <p class="font-label text-[9px] uppercase tracking-[0.18em]">+1.0</p>
          <p class="font-headline text-lg mt-1">${t('ideo.extremeRight')}</p>
        </div>
      </div>
      <p class="text-sm leading-[1.75] text-on-surface-variant">${t('methodology.scaleCaption')}</p>
    </div>
  `;
}

export function createMethodologyPage() {
  return `
    <div class="min-h-screen bg-background">
      <main class="max-w-[1440px] mx-auto px-6 md:px-8 py-8 md:py-12 space-y-10 md:space-y-14">
        <section class="grid grid-cols-1 xl:grid-cols-12 gap-10 xl:gap-14 items-end border-b border-outline-variant/10 pb-10 md:pb-14">
          <div class="xl:col-span-8 space-y-5">
            <span class="font-label text-[10px] uppercase tracking-[0.22em] text-primary font-bold block">${t('methodology.kicker')}</span>
            <h1 class="font-headline text-[3.2rem] md:text-[5.2rem] leading-[0.9] tracking-[-0.04em] max-w-[11ch]">
              ${t('methodology.heroLine1')}<br><span class="italic">${t('methodology.heroLine2')}</span>
            </h1>
            <p class="text-lg md:text-[1.28rem] leading-[1.65] text-on-surface-variant max-w-[48rem]">${t('methodology.heroBody')}</p>
          </div>

          <div class="xl:col-span-4 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4">
            <div class="border border-outline-variant/10 bg-surface-container-lowest px-5 py-5">
              <p class="font-label text-[9px] uppercase tracking-[0.18em] text-stone-500 mb-2">${t('methodology.coverageLabel')}</p>
              <p class="font-headline text-2xl text-on-background">1994-2024</p>
              <p class="text-sm leading-[1.7] text-on-surface-variant mt-2">${t('methodology.coverageBody')}</p>
            </div>
            <div class="border border-outline-variant/10 bg-surface-container-lowest px-5 py-5">
              <p class="font-label text-[9px] uppercase tracking-[0.18em] text-stone-500 mb-2">${t('methodology.paperLabel')}</p>
              <p class="font-headline text-2xl text-on-background">BPSR 2019</p>
              <p class="text-sm leading-[1.7] text-on-surface-variant mt-2">${t('methodology.paperBody')}</p>
            </div>
            <div class="border border-outline-variant/10 bg-surface-container-lowest px-5 py-5">
              <p class="font-label text-[9px] uppercase tracking-[0.18em] text-stone-500 mb-2">${t('methodology.updateLabel')}</p>
              <p class="font-headline text-2xl text-on-background">2020 · 2022 · 2024</p>
              <p class="text-sm leading-[1.7] text-on-surface-variant mt-2">${t('methodology.updateBody')}</p>
            </div>
          </div>
        </section>

        <section class="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-12 items-start">
          <aside class="xl:col-span-4 xl:sticky xl:top-24 space-y-6">
            <div class="border border-outline-variant/10 bg-surface-container-lowest p-6">
              <div class="flex items-center justify-between gap-4 mb-5">
                <h2 class="font-headline text-2xl text-on-background">${t('methodology.tableOfContents')}</h2>
                <a href="#references" class="font-label text-[10px] uppercase tracking-[0.18em] text-secondary hover:text-primary transition-colors">${t('methodology.jumpReferences')}</a>
              </div>
              <nav class="grid grid-cols-1 gap-2">
                ${tocItems.map(([id, num, key]) => `
                  <a href="#${id}" class="grid grid-cols-[36px_minmax(0,1fr)] gap-3 items-start px-3 py-3 border border-transparent hover:border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                    <span class="font-label text-[10px] uppercase tracking-[0.18em] text-primary">${num}</span>
                    <span class="font-headline text-base leading-[1.3] text-on-background">${t(key)}</span>
                  </a>
                `).join('')}
              </nav>
            </div>

            <div class="border border-outline-variant/10 bg-surface-container-lowest p-6 space-y-4">
              <p class="font-label text-[10px] uppercase tracking-[0.18em] text-stone-500">${t('methodology.quickAccess')}</p>
              <div class="flex flex-wrap gap-3">
                <a href="https://doi.org/10.1590/1981-3821201900010001" target="_blank" class="inline-flex items-center px-4 py-3 bg-primary text-on-primary font-label text-[11px] uppercase tracking-[0.18em] hover:bg-primary-container transition-colors">${t('methodology.openDoi')}</a>
                <a href="https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/8USPML" target="_blank" rel="noreferrer" class="inline-flex items-center px-4 py-3 border border-outline-variant/20 text-on-background font-label text-[11px] uppercase tracking-[0.18em] hover:border-primary hover:text-primary transition-colors">${t('methodology.openDataverse')}</a>
              </div>
            </div>
          </aside>

          <div class="xl:col-span-8 space-y-10 md:space-y-12">
            <section id="what-is-mis" class="scroll-mt-24 border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8 space-y-6">
              <div class="space-y-3">
                <span class="font-label text-[10px] uppercase tracking-[0.18em] text-primary">01</span>
                <h2 class="font-headline text-3xl md:text-4xl leading-tight">${t('methodology.whatTitle')}</h2>
              </div>
              <p class="text-lg leading-[1.8] text-on-surface-variant max-w-[64ch]">${t('methodology.whatBody')}</p>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-px bg-outline-variant/10 border border-outline-variant/10">
                ${['methodology.flowVotes', 'methodology.flowPartyScores', 'methodology.flowWeights', 'methodology.flowResult'].map((key) => `
                  <div class="bg-background px-5 py-5">
                    <p class="font-headline text-lg leading-[1.3] text-on-background">${t(key)}</p>
                  </div>
                `).join('')}
              </div>
              ${buildScale()}
            </section>

            <section id="project-continuity" class="scroll-mt-24 border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8 space-y-6">
              <div class="space-y-3">
                <span class="font-label text-[10px] uppercase tracking-[0.18em] text-primary">02</span>
                <h2 class="font-headline text-3xl md:text-4xl leading-tight">${t('methodology.continuityTitle')}</h2>
              </div>
              <p class="text-lg leading-[1.8] text-on-surface-variant max-w-[64ch]">${t('methodology.continuityBody')}</p>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-px bg-outline-variant/10 border border-outline-variant/10">
                <div class="bg-background px-5 py-6">
                  <p class="font-label text-[9px] uppercase tracking-[0.18em] text-stone-500 mb-2">1994-2018</p>
                  <p class="font-headline text-2xl text-on-background mb-2">${t('methodology.timelineOriginalTitle')}</p>
                  <p class="text-sm leading-[1.7] text-on-surface-variant">${t('methodology.timelineOriginalBody')}</p>
                </div>
                <div class="bg-background px-5 py-6">
                  <p class="font-label text-[9px] uppercase tracking-[0.18em] text-stone-500 mb-2">2019</p>
                  <p class="font-headline text-2xl text-on-background mb-2">${t('methodology.timelinePaperTitle')}</p>
                  <p class="text-sm leading-[1.7] text-on-surface-variant">${t('methodology.timelinePaperBody')}</p>
                </div>
                <div class="bg-background px-5 py-6">
                  <p class="font-label text-[9px] uppercase tracking-[0.18em] text-stone-500 mb-2">2020-2024</p>
                  <p class="font-headline text-2xl text-on-background mb-2">${t('methodology.timelineUpdateTitle')}</p>
                  <p class="text-sm leading-[1.7] text-on-surface-variant">${t('methodology.timelineUpdateBody')}</p>
                </div>
              </div>
            </section>

            <section id="how-it-works" class="scroll-mt-24 border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8 space-y-6">
              <div class="space-y-3">
                <span class="font-label text-[10px] uppercase tracking-[0.18em] text-primary">03</span>
                <h2 class="font-headline text-3xl md:text-4xl leading-tight">${t('methodology.constructionTitle')}</h2>
              </div>
              <p class="text-lg leading-[1.8] text-on-surface-variant max-w-[64ch]">${t('methodology.constructionBody')}</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${[1, 2, 3, 4].map((n) => `
                  <div class="border border-outline-variant/10 bg-background px-5 py-5">
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-primary mb-2">0${n}</p>
                    <h3 class="font-headline text-2xl text-on-background mb-3">${t(`methodology.step${n}Title`)}</h3>
                    <p class="text-sm leading-[1.75] text-on-surface-variant">${t(`methodology.step${n}Body`)}</p>
                  </div>
                `).join('')}
              </div>
              <div class="border border-outline-variant/10 bg-background px-5 py-5 space-y-4">
                <p class="font-label text-[10px] uppercase tracking-[0.18em] text-stone-500">${t('methodology.formulaLabel')}</p>
                <div class="font-mono text-base md:text-lg leading-[1.9] text-on-background overflow-x-auto">MIS = Σ (vote share of party i × ideological score of party i)</div>
                <p class="text-sm leading-[1.75] text-on-surface-variant">${t('methodology.formulaBody')}</p>
              </div>
            </section>

            <section id="imputation" class="scroll-mt-24 border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8 space-y-6">
              <div class="space-y-3">
                <span class="font-label text-[10px] uppercase tracking-[0.18em] text-primary">04</span>
                <h2 class="font-headline text-3xl md:text-4xl leading-tight">${t('methodology.imputationTitle')}</h2>
              </div>
              <p class="text-lg leading-[1.8] text-on-surface-variant max-w-[64ch]">${t('methodology.imputationBody')}</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="border border-outline-variant/10 bg-background px-5 py-5 space-y-3">
                  <p class="font-label text-[10px] uppercase tracking-[0.18em] text-stone-500">ideo_na</p>
                  <p class="font-headline text-2xl text-on-background">${t('methodology.variantNaTitle')}</p>
                  <p class="text-sm leading-[1.75] text-on-surface-variant">${t('methodology.variantNaBody')}</p>
                </div>
                <div class="border border-outline-variant/10 bg-background px-5 py-5 space-y-3">
                  <p class="font-label text-[10px] uppercase tracking-[0.18em] text-stone-500">ideo_imp</p>
                  <p class="font-headline text-2xl text-on-background">${t('methodology.variantImpTitle')}</p>
                  <p class="text-sm leading-[1.75] text-on-surface-variant">${t('methodology.variantImpBody')}</p>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${imputationGroups.map(([titleKey, bodyKey]) => `
                  <div class="border border-outline-variant/10 bg-background px-5 py-5">
                    <h3 class="font-headline text-2xl text-on-background mb-3">${t(titleKey)}</h3>
                    <p class="text-sm leading-[1.75] text-on-surface-variant">${t(bodyKey)}</p>
                  </div>
                `).join('')}
              </div>
              <p class="text-sm leading-[1.75] text-on-surface-variant max-w-[64ch]">${t('methodology.imputationRobustness')}</p>
            </section>

            <section id="sources" class="scroll-mt-24 border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8 space-y-6">
              <div class="space-y-3">
                <span class="font-label text-[10px] uppercase tracking-[0.18em] text-primary">05</span>
                <h2 class="font-headline text-3xl md:text-4xl leading-tight">${t('methodology.sourcesTitle')}</h2>
              </div>
              <p class="text-lg leading-[1.8] text-on-surface-variant max-w-[64ch]">${t('methodology.sourcesBody')}</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-outline-variant/10 border border-outline-variant/10">
                ${sources.map(([label, key]) => `
                  <div class="bg-background px-5 py-5">
                    <p class="font-label text-[9px] uppercase tracking-[0.18em] text-stone-500 mb-2">${label}</p>
                    <p class="text-sm leading-[1.75] text-on-surface-variant">${t(key)}</p>
                  </div>
                `).join('')}
              </div>
              <div class="border border-outline-variant/10 bg-error-container/20 px-5 py-5">
                <p class="font-label text-[10px] uppercase tracking-[0.18em] text-error mb-2">${t('methodology.coverageNoteLabel')}</p>
                <p class="text-sm leading-[1.75] text-on-surface-variant">${t('methodology.coverageNoteBody')}</p>
              </div>
            </section>

            <section id="variables" class="scroll-mt-24 border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8 space-y-6">
              <div class="space-y-3">
                <span class="font-label text-[10px] uppercase tracking-[0.18em] text-primary">06</span>
                <h2 class="font-headline text-3xl md:text-4xl leading-tight">${t('methodology.variablesTitleNew')}</h2>
              </div>
              <p class="text-lg leading-[1.8] text-on-surface-variant max-w-[64ch]">${t('methodology.variablesBodyNew')}</p>
              <div class="space-y-3">
                ${variables.map(([name, range, key]) => `
                  <div class="grid grid-cols-1 md:grid-cols-[160px_120px_minmax(0,1fr)] gap-px bg-outline-variant/10 border border-outline-variant/10">
                    <div class="bg-background px-4 py-4 font-mono text-sm text-primary">${name}</div>
                    <div class="bg-background px-4 py-4 font-label text-[11px] uppercase tracking-[0.12em] text-stone-500">${range}</div>
                    <div class="bg-background px-4 py-4 text-sm leading-[1.75] text-on-surface-variant">${t(key)}</div>
                  </div>
                `).join('')}
              </div>
            </section>

            <section id="interpretation" class="scroll-mt-24 border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8 space-y-6">
              <div class="space-y-3">
                <span class="font-label text-[10px] uppercase tracking-[0.18em] text-primary">07</span>
                <h2 class="font-headline text-3xl md:text-4xl leading-tight">${t('methodology.interpretationTitle')}</h2>
              </div>
              <div class="space-y-4 max-w-[68ch]">
                ${[1, 2, 3, 4].map((n) => `
                  <div class="border border-outline-variant/10 bg-background px-5 py-5">
                    <h3 class="font-headline text-2xl text-on-background mb-2">${t(`methodology.interpretation${n}Title`)}</h3>
                    <p class="text-sm leading-[1.8] text-on-surface-variant">${t(`methodology.interpretation${n}Body`)}</p>
                  </div>
                `).join('')}
              </div>
            </section>

            <section id="limitations" class="scroll-mt-24 border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8 space-y-6">
              <div class="space-y-3">
                <span class="font-label text-[10px] uppercase tracking-[0.18em] text-primary">08</span>
                <h2 class="font-headline text-3xl md:text-4xl leading-tight">${t('methodology.limitationsTitleNew')}</h2>
              </div>
              <div class="space-y-4 max-w-[68ch]">
                ${[1, 2, 3, 4].map((n) => `
                  <div class="border border-outline-variant/10 bg-error-container/20 px-5 py-5">
                    <h3 class="font-headline text-2xl text-error mb-2">${t(`methodology.limitationNew${n}Title`)}</h3>
                    <p class="text-sm leading-[1.8] text-on-surface-variant">${t(`methodology.limitationNew${n}Body`)}</p>
                  </div>
                `).join('')}
              </div>
            </section>

            <section id="references" class="scroll-mt-24 border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8 space-y-6">
              <div class="space-y-3">
                <span class="font-label text-[10px] uppercase tracking-[0.18em] text-primary">09</span>
                <h2 class="font-headline text-3xl md:text-4xl leading-tight">${t('methodology.referencesTitleNew')}</h2>
              </div>
              <div class="space-y-3">
                ${references.map((ref) => `
                  <div class="border border-outline-variant/10 bg-background px-5 py-5">
                    <p class="font-headline text-lg text-on-background mb-2 leading-[1.35]">${ref.title}</p>
                    <p class="text-sm leading-[1.75] text-on-surface-variant">${ref.body}</p>
                  </div>
                `).join('')}
              </div>
            </section>

            <section class="border border-outline-variant/10 bg-primary text-on-primary px-6 md:px-8 py-8 md:py-10">
              <div class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-6 items-end">
                <div class="space-y-3 max-w-[52ch]">
                  <p class="font-label text-[10px] uppercase tracking-[0.18em] opacity-80">${t('methodology.ctaEyebrow')}</p>
                  <h2 class="font-headline text-3xl md:text-4xl leading-tight">${t('methodology.ctaTitle')}</h2>
                  <p class="text-base md:text-lg leading-[1.75] opacity-90">${t('methodology.ctaBody')}</p>
                </div>
                <div class="flex flex-wrap gap-3">
                  <a href="https://doi.org/10.1590/1981-3821201900010001" target="_blank" class="inline-flex items-center px-5 py-3 bg-on-primary text-primary font-label text-[11px] uppercase tracking-[0.18em] hover:bg-surface-container-lowest transition-colors">${t('methodology.openDoi')}</a>
                  <a href="https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/8USPML" target="_blank" rel="noreferrer" class="inline-flex items-center px-5 py-3 border border-on-primary/30 text-on-primary font-label text-[11px] uppercase tracking-[0.18em] hover:border-on-primary transition-colors">${t('methodology.openDataverse')}</a>
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  `;
}

export function initMethodologyPage() {
  document.querySelectorAll('a[href^="#"]:not([href^="#/"])').forEach((anchor) => {
    anchor.addEventListener('click', function onClick(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}
