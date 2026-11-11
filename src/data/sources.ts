// The Sources panel as data: the credits and the links to the sources of docs/research.md §1, in the lab's own words, and for each source how it was read. A source read only through a summary is linked and credited, never quoted: nothing here
// is a quotation. No image, drawing or footage from any source is reused. The main source is the paper of the team that built the house, not a video: the lab has no main video. The roadmap's film that sells a document and says 1956 and 20 cm is not credited
// (research §8, question 4: the owner's answer is pending; docs/data.md says what changes if he keeps it). Nothing here says where the houses stand beyond « Odeillo »: the open data are credited for their outline, not their place; a heritage fact is credited to
// the national database by its home page, never by the page of a building's record (those print an address); no link, label or text names a commune, a département, a region or a town of the houses (`src/guard.test.ts` holds it).
// `src/data/about.ts` builds the panel from this for `about` in src/lab.ts.

export type Access =
  'read' | 'summary' | 'abstract' | 'extract' | 'search' | 'found' | 'transcript' | 'queried' | 'title' | 'none';

/** A label that is French and English: a title in a language is kept, what we write around it is translated. A plain string is the same in both, but for the quotes around a title (« » in French, “ ” in English). */
export type Label = string | readonly [fr: string, en: string];

const inFr = (t: string): string => t.replace(/“([^”]*)”/g, '« $1 »');
const inEn = (t: string): string => t.replace(/«\s*([^»]*?)\s*»/g, '“$1”');

export interface SourceEntry {
  href?: string;
  label: readonly [fr: string, en: string];
  fr: string;
  en: string;
  access: Access;
}

/** How a source was read, printed after it: the research's status, in words. */
export const ACCESS: Record<Access, readonly [string, string]> = {
  read: ['texte lu', 'text read'],
  summary: ['lu en résumé, à relire', 'read in summary, to re-read'],
  abstract: ['résumé lu, article non lu', 'abstract read, paper not read'],
  extract: ['articles lus en extraits', 'articles read as extracts'],
  search: ['vu dans un résumé de recherche seulement', 'seen in a search summary only'],
  found: ['trouvé et daté, texte non lu', 'found and dated, text not read'],
  transcript: ['transcription locale, chiffres à vérifier à l’oreille', 'a local transcript, figures to check by ear'],
  queried: ['interrogé par nous', 'queried by us'],
  title: ['titre et chaîne seulement, non vu', 'title and channel only, not watched'],
  none: ['non lu : le site n’a pas répondu', 'not read: the site did not answer'],
};

const s = (href: string | undefined, label: Label, fr: string, en: string, access: Access): SourceEntry => ({
  ...(href === undefined ? {} : { href }),
  label: typeof label === 'string' ? [inFr(label), inEn(label)] : [inFr(label[0]), inEn(label[1])],
  fr,
  en,
  access,
});

/** Groups of links, in reading order. */
export const SOURCES: { fr: string; en: string; items: SourceEntry[] }[] = [
  {
    fr: 'La source principale : la maison, par l’équipe qui l’a bâtie',
    en: 'The main source: the house, by the team that built it',
    items: [
      s(
        'https://www.osti.gov/servlets/purl/7287449',
        'F. Trombe, J.-F. Robert, M. Cabanat, B. Sesolis, “Some performance characteristics of the CNRS solar house collectors”, in Passive Solar Heating and Cooling, LA-6637-C, 1976, pp. 201-222',
        'Le tableau des cotes, les éléments, les bilans jour par jour, quatre enregistrements de quatre jours, les rendements du jour et du mois : presque tous les chiffres du labo viennent de là. Rapport du laboratoire de Los Alamos, en ligne sur OSTI.',
        'The table of dimensions, the elements, the day-by-day balances, four recordings of four days, the day’s and the month’s efficiencies: nearly all the lab’s figures come from here. A report of the Los Alamos laboratory, online at OSTI.',
        'read',
      ),
    ],
  },
  {
    fr: 'La maison, son lieu, ses ancêtres',
    en: 'The house, its place, its ancestors',
    items: [
      s(
        'https://pop.culture.gouv.fr/',
        [
          'Ministère de la Culture, base Mérimée (POP), page d’accueil',
          'Ministry of Culture, Mérimée database (POP), home page',
        ],
        'Les faits sur le bâtiment de 1974 viennent de la base nationale du patrimoine, citée ici par sa page d’accueil, sans lien vers une notice : inscrit le 25 mai 2011, trois logements, béton armé, fondations en gradins dans le rocher ; Jacques Michel y est l’architecte, Félix Trombe l’ingénieur.',
        'The facts about the building of 1974 come from the national heritage database, credited here by its home page, with no link to a record: listed on 25 May 2011, three dwellings, reinforced concrete, stepped foundations in the rock; Jacques Michel is its architect, Félix Trombe its engineer.',
        'summary',
      ),
      s(
        undefined,
        [
          'Dossier de protection de l’immeuble des maisons solaires, mars 2011',
          'Protection file of the solar houses building, March 2011',
        ],
        'Le document que nous voudrions le plus lire : la chronologie des maisons solaires. Son hébergeur n’a pas répondu, nous ne l’avons pas lu, et nous n’en reprenons pas le lien.',
        'The document we would most like to read: the chronology of the solar houses. Its host did not answer, we have not read it, and we do not reproduce its link.',
        'none',
      ),
      s(
        'https://www.insis.cnrs.fr/sites/institut_insis/files/news/2022-02/CP%20FOUR%20SOLAIRE%20D%27ODEILLO%202022.pdf',
        [
          'La Poste avec le CNRS, communiqué « Four solaire d’Odeillo », février 2022',
          'La Poste with the CNRS, press release “Four solaire d’Odeillo”, February 2022',
        ],
        'Le bâtiment de 48 m de haut et 54 m de large, inauguré en 1969, 1 000 kW.',
        'The building 48 m high and 54 m wide, inaugurated in 1969, 1,000 kW.',
        'read',
      ),
      s(
        'https://images.cnrs.fr/en/photo/20180105_0002',
        [
          'CNRS Images, légendes du four solaire ; Wikipédia, « Odeillo solar furnace »',
          'CNRS Images, captions of the solar furnace; Wikipedia, “Odeillo solar furnace”',
        ],
        'Le miroir de 1 830 m², la distance focale de 18 m, les 63 héliostats pour 2 835 m². Le CNRS parle d’une mise en service en 1970.',
        'The mirror of 1,830 m², the 18 m focal length, the 63 heliostats for 2,835 m². The CNRS speaks of entering service in 1970.',
        'summary',
      ),
      s(
        'https://fr.wikipedia.org/wiki/Four_solaire_d%27Odeillo',
        ['Wikipédia, « Four solaire d’Odeillo »', 'Wikipedia, “Four solaire d’Odeillo” (in French)'],
        'Le four solaire est inscrit au titre des monuments historiques depuis mai 2009.',
        'The solar furnace has been listed as a historic monument since May 2009.',
        'summary',
      ),
      s(
        'https://re.jrc.ec.europa.eu/pvg_tools/en/',
        [
          'PVGIS 5.3, Commission européenne, Centre commun de recherche',
          'PVGIS 5.3, European Commission, Joint Research Centre',
        ],
        'Le soleil sur un plan vertical plein sud et sur l’horizontale, l’air, l’horizon du terrain, 2005 à 2023. Gratuit avec crédit : nous l’avons interrogé nous-mêmes.',
        'The sun on a vertical south plane and on the horizontal, the air, the terrain’s horizon, 2005 to 2023. Free with credit: we queried it ourselves.',
        'queried',
      ),
      s(
        'https://data.geopf.fr/wfs/ows',
        ['IGN, BD TOPO (Géoplateforme), Licence Ouverte', 'IGN, BD TOPO (Géoplateforme), Open Licence'],
        'Les empreintes, les hauteurs et les dates de première apparition dans les données de deux bâtiments jumeaux et du bâtiment de 1974 : le gabarit de la maison, sans la situer. Rien de plus n’en est repris.',
        'The footprints, heights and dates of first appearance in the data of two twin buildings and of the 1974 building: the house’s outline, without placing it. Nothing more is taken from it.',
        'queried',
      ),
      s(
        'https://patents.google.com/patent/US3832992A/en',
        [
          'F. Trombe et J. Michel, brevet US 3,832,992, « Naturally air-conditioned dwellings », priorité du 29 juin 1971',
          'F. Trombe and J. Michel, US patent 3,832,992, “Naturally air-conditioned dwellings”, priority of 29 June 1971',
        ],
        'Une position de chauffage et une position de rafraîchissement pour une habitation, avec un effet de cheminée.',
        'A heating position and a cooling position for a dwelling, with a chimney effect.',
        'summary',
      ),
      s(
        'https://patents.google.com/patent/US246626',
        [
          'E. S. Morse, brevet US 246,626, « Warming and ventilating apartments by the sun’s rays », 1881',
          'E. S. Morse, US patent 246,626, “Warming and ventilating apartments by the sun’s rays”, 1881',
        ],
        'L’ancêtre : une plaque noircie, du verre, deux ouvertures. Pas de réserve de chaleur décrite.',
        'The ancestor: a blackened plate, glass, two openings. No store of heat described.',
        'summary',
      ),
      s(
        'https://en.wikipedia.org/wiki/Edward_S._Morse',
        ['Wikipédia, « Edward S. Morse »', 'Wikipedia, “Edward S. Morse”'],
        'L’auteur du brevet de 1881 était zoologiste.',
        'The author of the 1881 patent was a zoologist.',
        'summary',
      ),
    ],
  },
  {
    fr: 'D’autres maisons, d’autres mesures, d’autres modèles',
    en: 'Other houses, other measurements, other models',
    items: [
      s(
        'https://www.osti.gov/servlets/purl/7287449',
        [
          'D. Kelbaugh, « Kelbaugh House », et B. Anderson, « Heat transfer mechanisms: the 1967 Odeillo house… », dans le même volume',
          'D. Kelbaugh, “Kelbaugh House”, and B. Anderson, “Heat transfer mechanisms: the 1967 Odeillo house…”, in the same volume',
        ],
        'Le premier hiver d’une maison à mur Trombe à Princeton, 1975-76 : 72 % économisés sur un calcul au gaz, un courant inverse la nuit, les évents d’au moins la moitié de la lame. Et l’estimation d’un collègue, 75 à 90 %, pour des maisons de ce genre en France.',
        'The first winter of a Trombe-wall house at Princeton, 1975–76: 72 % saved against a calculation for gas, a reverse flow at night, vents at least half the gap. And a colleague’s estimate, 75 to 90 %, for houses of that kind in France.',
        'read',
      ),
      s(
        'https://www.osti.gov/servlets/purl/7287449',
        [
          'J. D. Balcomb, J. C. Hedstrom, R. D. McFarland, « Simulation as a design tool », même volume',
          'J. D. Balcomb, J. C. Hedstrom, R. D. McFarland, “Simulation as a design tool”, same volume',
        ],
        'Un modèle de mur de maçonnerie de 0,5, 1 et 2 pieds : une maison où le mur donne 68 % à un pied.',
        'A model of a masonry wall of 0.5, 1 and 2 feet: a house where the wall gives 68 % at one foot.',
        'read',
      ),
      s(
        'https://www.osti.gov/servlets/purl/6748432',
        'J. D. Balcomb, “State of the art in passive solar heating and cooling”, LA-UR-78-774, 1978',
        'Les pièces d’essai de Los Alamos en février : gain direct, mur ventilé ou sans évents, avec leur amplitude et l’heure du maximum.',
        'The Los Alamos test rooms in February: direct gain, vented or unvented wall, with their swing and the hour of the peak.',
        'read',
      ),
      s(
        undefined,
        [
          'P. Ohanessian et W. W. S. Charters, “Thermal simulation of a passive solar house using a Trombe-Michel wall structure”, Solar Energy 20, 275-281, 1978 (doi 10.1016/0038-092X(78)90106-8)',
          'P. Ohanessian and W. W. S. Charters, “Thermal simulation of a passive solar house using a Trombe-Michel wall structure”, Solar Energy 20, 275-281, 1978 (doi 10.1016/0038-092X(78)90106-8)',
        ],
        'Une contribution solaire d’hiver « de l’ordre de 40 % », selon un résumé : nous n’avons pas pu lire l’article.',
        'A winter solar contribution “of the order of 40 per cent”, according to a summary: we could not read the paper.',
        'search',
      ),
      s(
        'https://passivehouse.com/former_conferences/Kran/First_Passive_House_Kranichstein_en.html',
        [
          'Passive House Institute, “15 years Passive House in Darmstadt-Kranichstein”, 2006, et W. Feist, “Passive House at Spring, Summer, Autumn and Winter”',
          'Passive House Institute, “15 years Passive House in Darmstadt-Kranichstein”, 2006, and W. Feist, “Passive House at Spring, Summer, Autumn and Winter”',
        ],
        'La maison passive de 1991 : l’isolation, l’étanchéité à l’air, la récupération de chaleur, le chauffage mesuré année par année, la puissance qui ne dépasse jamais 7,4 W/m².',
        'The passive house of 1991: insulation, airtightness, heat recovery, the heating measured year by year, the power that never exceeds 7.4 W/m².',
        'summary',
      ),
      s(
        'https://doi.org/10.1007/s12053-019-09781-3',
        'W. Feist, R. Pfluger, W. Hasper, “Durability of building fabric components and ventilation systems in passive houses”, Energy Efficiency, 2019',
        'Vingt-cinq ans de maison passive : un chiffre de chauffage stable, lu dans le résumé de l’éditeur.',
        'Twenty-five years of a passive house: a stable heating figure, read in the publisher’s abstract.',
        'abstract',
      ),
      s(
        'https://www.fiabitat.com/doctypes/science_e2a_pfafferott.pdf',
        'J. Pfafferott, “Evaluation of earth-to-air heat exchangers with a standardised method to calculate energy efficiency”, Energy and Buildings 35, 2003',
        'Trois puits canadiens de bureaux mesurés en Allemagne : dimensions, débit, sol, énergie d’une année, efficacité de 0,77 à 0,94. Copie tierce de l’article.',
        'Three office earth tubes measured in Germany: dimensions, flow, soil, a year’s energy, effectiveness of 0.77 to 0.94. A third-party copy of the paper.',
        'read',
      ),
      s(
        'https://en.wikipedia.org/wiki/Trombe_wall',
        ['Wikipédia, « Trombe wall » et « Mur Trombe »', 'Wikipedia, “Trombe wall” and “Mur Trombe”'],
        'Ce qui circule : « deux pieds » et « 70 % », par un livre de 2013. Utilisés seulement pour dire ce qui se répète.',
        'What circulates: “two feet” and “70 %”, through a book of 2013. Used only to say what is repeated.',
        'summary',
      ),
      s(
        undefined,
        ['Base Mérimée : une villa solaire de 1986', 'Mérimée database: a solar villa of 1986'],
        'Une maison à murs Trombe, des évents qui se manœuvrent selon la saison, une transformation pour ouvrir ses fenêtres hautes et les laver. Fait tiré d’une notice de la base nationale du patrimoine, que nous ne lions pas.',
        'A house with Trombe walls, vents operated by season, an alteration so that its high windows open for cleaning. A fact from a record of the national heritage database, which we do not link.',
        'summary',
      ),
      s(
        'https://www.nrel.gov/docs/fy04osti/36277.pdf',
        [
          'P. Torcellini et S. Pless, “Trombe walls in low-energy buildings: practical experiences”, NREL/TP-550-36277, 2004',
          'P. Torcellini and S. Pless, “Trombe walls in low-energy buildings: practical experiences”, NREL/TP-550-36277, 2004',
        ],
        'Deux bâtiments à mur Trombe conçus avec le NREL : un centre de visiteurs et un bâtiment d’entrée de site. Le site de l’article n’a pas répondu.',
        'Two buildings with Trombe walls, designed with NREL: a visitor centre and a site-entrance building. The paper’s site did not answer.',
        'abstract',
      ),
    ],
  },
  {
    fr: 'Les vidéos',
    en: 'The videos',
    items: [
      s(
        'https://www.youtube.com/watch?v=66W5NvNotc4',
        'Penn Ar Web, « La maison bioclimatique de Benoit »',
        'Un film d’accompagnement que nous n’avons pas encore vu ; nous n’en reprenons rien.',
        'A companion film that we have not yet watched; we reuse nothing from it.',
        'title',
      ),
      s(
        'https://www.youtube.com/watch?v=mBtSYFQ21A0',
        'Stéphen Mure Architecte, « Le puits canadien : mon avis d’architecte », 2020',
        'Un architecte, dans une vidéo que nous n’avons pu transcrire qu’à peu près, dit n’en avoir jamais posé.',
        'An architect, in a video we could only transcribe roughly, says he has never fitted one.',
        'transcript',
      ),
    ],
  },
  {
    fr: 'Les règles et leur lecture',
    en: 'The rules and how they were read',
    items: [
      s(
        'https://fr.wikipedia.org/wiki/R%C3%A9glementation_environnementale_2020',
        [
          'Wikipédia, « Réglementation environnementale 2020 »',
          'Wikipedia, “Réglementation environnementale 2020” (in French)',
        ],
        'Un indicateur de confort d’été en degrés-heures, avec un seuil bas de 350 °C·h et, dans le cas le plus courant, un plafond de 1 250 °C·h : lus dans cette page secondaire seulement. Le décret et l’arrêté ne sont pas lus.',
        'A summer-comfort indicator in degree-hours, with a low threshold of 350 °C·h and, in the commonest case, a ceiling of 1,250 °C·h: read in this secondary page only. The decree and the order are not read.',
        'summary',
      ),
      s(
        'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000037131346/',
        [
          'Légifrance, arrêté du 27 juin 2018 portant délimitation des zones à potentiel radon du territoire français',
          'Légifrance, order of 27 June 2018 delimiting the radon-potential zones of French territory',
        ],
        'Les communes sont classées en trois zones, la zone 3 étant la plus haute. Odeillo se trouve dans une commune de la zone 3 : lu sur Légifrance et sur Géorisques.',
        'Communes are classed in three zones, zone 3 being the highest. Odeillo lies in a commune of zone 3: read on Légifrance and on Géorisques.',
        'read',
      ),
      s(
        'https://www.georisques.gouv.fr/consulter-les-dossiers-thematiques/radon',
        ['Géorisques, dossier thématique « Radon »', 'Géorisques, thematic file “Radon”'],
        'Le potentiel radon par commune, établi par l’IRSN et fixé par l’arrêté ci-dessus.',
        'The radon potential by commune, established by the IRSN and fixed by the order above.',
        'read',
      ),
      s(
        'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006074236',
        [
          'Légifrance, Code du patrimoine, articles L621-27 et L621-31 à L621-32',
          'Légifrance, Heritage Code, articles L621-27 and L621-31 to L621-32',
        ],
        'Les travaux sur un immeuble inscrit et dans ses abords : les articles existent et disent bien cela ; ils ne sont lus qu’en extraits.',
        'Works on a listed building and in its surroundings: the articles exist and say so; they are read as extracts only.',
        'extract',
      ),
      s(
        'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000862344',
        [
          'Légifrance, arrêté du 24 mars 1982 relatif à l’aération des logements',
          'Légifrance, order of 24 March 1982 on the ventilation of dwellings',
        ],
        'Le texte existe, consolidé et en vigueur ; nous ne l’avons pas lu en détail.',
        'The text exists, consolidated and in force; we have not read it in detail.',
        'found',
      ),
      s(
        'https://fr.wikipedia.org/wiki/Puits_canadien',
        [
          'Wikipédia, « Puits canadien », qui cite l’ADEME (2012)',
          'Wikipedia, “Puits canadien” (in French), citing ADEME (2012)',
        ],
        'L’entretien d’un filtre, la condensation et les moisissures, l’étanchéité à l’air contre le radon, la pente et la purge, d’après cette page secondaire. Le guide de l’ADEME et les fiches d’xpair et d’une direction régionale de l’environnement n’ont pas été lus.',
        'Filter upkeep, condensation and mould, airtightness against radon, slope and drain, according to this secondary page. The ADEME guide and the sheets of xpair and of a regional environment directorate were not read.',
        'summary',
      ),
    ],
  },
];

/** The law and the rules, place by place, and how each line was reached. [place fr, place en], then the line. A line says what was read and what was not, and « à vérifier » where nothing was. */
export const LAW: [place: readonly [string, string], fr: string, en: string][] = [
  [
    ['France, le patrimoine', 'France, heritage'],
    'Le bâtiment de 1974 est inscrit depuis le 25 mai 2011 (façades, toits, système du mur), d’après la base nationale du patrimoine, le four depuis mai 2009, d’après Wikipédia. Les travaux sur un immeuble inscrit et dans ses abords relèvent du Code du patrimoine : les articles L621-27 et L621-31 à L621-32 existent et disent cela, lus en extraits sur Légifrance.',
    'The building of 1974 has been listed since 25 May 2011 (façades, roofs, the wall system), according to the national heritage database, the furnace since May 2009, according to Wikipedia. Works on a listed building and in its surroundings fall under the Heritage Code: articles L621-27 and L621-31 to L621-32 exist and say so, read as extracts on Légifrance.',
  ],
  [
    ['France, la construction', 'France, building'],
    'Une maison neuve relève de la RE2020, qui a un indicateur de confort d’été en degrés-heures : ses seuils, 350 et 1 250 °C·h, ne sont lus que dans une page secondaire, le décret et l’arrêté ne sont pas lus. L’arrêté du 24 mars 1982 sur l’aération des logements existe, consolidé et en vigueur, et n’est pas lu en détail. Ce que demandent des travaux de façade, une déclaration ou un permis : à vérifier.',
    'A new house falls under the RE2020, which has a summer-comfort indicator in degree-hours: its thresholds, 350 and 1,250 °C·h, are read in a secondary page only, the decree and the order are not read. The order of 24 March 1982 on the ventilation of dwellings exists, consolidated and in force, and is not read in detail. What façade works ask for, a declaration or a permit: to check.',
  ],
  [
    ['France, le radon', 'France, radon'],
    'Odeillo se trouve dans une commune classée en zone 3 du potentiel radon, la plus haute des trois, par l’arrêté du 27 juin 2018 : lu sur Légifrance et sur Géorisques. Les obligations d’information à la vente et à la location qui s’y attachent : à vérifier.',
    'Odeillo lies in a commune classed in radon-potential zone 3, the highest of three, by the order of 27 June 2018: read on Légifrance and on Géorisques. The duties to inform on sale and rental that go with it: to check.',
  ],
  [
    ['L’architecture et l’image', 'Architecture and images'],
    'L’œuvre d’un architecte peut être protégée. L’exception de panorama du droit français ne couvre que les personnes physiques, hors usage commercial ; celle de l’Allemagne est plus large pour les extérieurs : lu dans Wikipédia, une source secondaire. Ce que cela change pour une reconstitution publique à partir de données publiées, sans but lucratif, n’est pas tranché ici : à vérifier, et un film monétisé est une autre question.',
    'An architect’s work may be protected. The French panorama exception covers natural persons only, outside commercial use; Germany’s is wider for exteriors: read in Wikipedia, a secondary source. What this changes for a public reconstruction from published data, not for profit, is not settled here: to check, and a monetised film is another question.',
  ],
  [
    ['Ailleurs', 'Elsewhere'],
    'Allemagne, Suisse, Union européenne, États-Unis : les normes de l’énergie et de la construction y existent aussi, nous les nommons sans les avoir lues. La certification de maison passive est une norme privée. Les règles de votre pays s’appliquent.',
    'Germany, Switzerland, the European Union, the United States: energy and building standards exist there too, we name them without having read them. Passive House certification is a private standard. The rules of your country apply.',
  ],
  [
    ['Les données', 'The data'],
    'Les articles du volume de Los Alamos sont des rapports financés par l’État américain, dont les droits d’auteur ne sont pas précisés : seuls des faits et des chiffres en sont repris, refaits d’après notre modèle ou lus à l’œil sur les courbes. PVGIS est libre avec crédit, l’IGN en Licence Ouverte avec crédit.',
    'The papers of the Los Alamos volume are reports funded by the US government, whose copyright is not stated: only facts and figures are taken from them, redrawn from our model or read by eye on the curves. PVGIS is free with credit, the IGN under the Open Licence with credit.',
  ],
];
