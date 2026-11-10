// The Sources panel as data: the credits and the links to the sources of docs/research.md §1, in the lab's own words, and for each source how it was read. A source read only through a summary is linked and credited, never quoted: nothing here
// is a quotation. No image, drawing or footage from any source is reused. The main source is the inventors' own paper, not a video: the lab has no main video. The roadmap's film that sells a document and says 1956 and 20 cm is not credited
// (research §8, question 4: the owner's answer is pending; docs/data.md says what changes if he keeps it). Nothing here says where the houses stand beyond « Odeillo »: the open data are credited for their outline, not their place.
// `src/data/about.ts` builds the panel from this for `about` in src/lab.ts.

export type Access = 'read' | 'summary' | 'search' | 'transcript' | 'queried' | 'metadata' | 'none';

export interface SourceEntry {
  href?: string;
  label: string;
  fr: string;
  en: string;
  access: Access;
}

/** How a source was read, printed after it: the research's status, in words. */
export const ACCESS: Record<Access, readonly [string, string]> = {
  read: ['texte lu', 'text read'],
  summary: ['lu en résumé, à relire', 'read in summary, to re-read'],
  search: ['vu dans un résumé de recherche seulement', 'seen in a search summary only'],
  transcript: ['transcription locale, chiffres à vérifier à l’oreille', 'a local transcript, figures to check by ear'],
  queried: ['interrogé par nous', 'queried by us'],
  metadata: ['description seulement, non écouté', 'description only, not heard'],
  none: ['non lu : le site n’a pas répondu', 'not read: the site did not answer'],
};

const s = (href: string | undefined, label: string, fr: string, en: string, access: Access): SourceEntry => ({
  ...(href === undefined ? {} : { href }),
  label,
  fr,
  en,
  access,
});

/** Groups of links, in reading order. */
export const SOURCES: { fr: string; en: string; items: SourceEntry[] }[] = [
  {
    fr: 'La source principale : la maison, par ses inventeurs',
    en: 'The main source: the house, by its inventors',
    items: [
      s(
        'https://www.osti.gov/servlets/purl/7287449',
        'F. Trombe, J.-F. Robert, M. Cabanat, B. Sesolis, « Some performance characteristics of the CNRS solar house collectors », in Passive Solar Heating and Cooling, LA-6637-C, 1976, pp. 201-222',
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
        'https://pop.culture.gouv.fr/notice/merimee/PA66000030',
        'Ministère de la Culture, base Mérimée, « Immeuble des maisons solaires Trombe-Michel »',
        'Le bâtiment de 1974, inscrit le 25 mai 2011 : trois logements, béton armé, fondations en gradins dans le rocher. Jacques Michel y est l’architecte, Félix Trombe l’ingénieur.',
        'The building of 1974, listed on 25 May 2011: three dwellings, reinforced concrete, stepped foundations in the rock. Jacques Michel is its architect, Félix Trombe its engineer.',
        'summary',
      ),
      s(
        undefined,
        'Dossier de protection de l’immeuble des maisons solaires, mars 2011',
        'Le document que nous voudrions le plus lire : la chronologie des maisons solaires. Son hébergeur n’a pas répondu, nous ne l’avons pas lu, et nous n’en reprenons pas le lien.',
        'The document we would most like to read: the chronology of the solar houses. Its host did not answer, we have not read it, and we do not reproduce its link.',
        'none',
      ),
      s(
        'https://www.insis.cnrs.fr/sites/institut_insis/files/news/2022-02/CP%20FOUR%20SOLAIRE%20D%27ODEILLO%202022.pdf',
        'La Poste avec le CNRS, communiqué « Four solaire d’Odeillo », février 2022',
        'Le bâtiment de 48 m de haut et 54 m de large, inauguré en 1969, 1 000 kW.',
        'The building 48 m high and 54 m wide, inaugurated in 1969, 1,000 kW.',
        'read',
      ),
      s(
        'https://images.cnrs.fr/en/photo/20180105_0002',
        'CNRS Images, légendes du four solaire ; Wikipédia, « Odeillo solar furnace »',
        'Le miroir de 1 830 m², la distance focale de 18 m, les 63 héliostats pour 2 835 m². Le CNRS parle d’une mise en service en 1970.',
        'The mirror of 1,830 m², the 18 m focal length, the 63 heliostats for 2,835 m². The CNRS speaks of entering service in 1970.',
        'summary',
      ),
      s(
        'https://www.mairie-fontromeu.fr/vivre-a-font-romeu/amenagement-et-urbanisme/formalites-copy/patrimoine-culturel/',
        'Mairie de Font-Romeu, « Patrimoine culturel »',
        'Le four solaire est inscrit depuis 2009.',
        'The solar furnace has been listed since 2009.',
        'search',
      ),
      s(
        'https://re.jrc.ec.europa.eu/pvg_tools/en/',
        'PVGIS 5.3, Commission européenne, Centre commun de recherche',
        'Le soleil sur un plan vertical plein sud et sur l’horizontale, l’air, l’horizon du terrain, 2005 à 2023. Gratuit avec crédit : nous l’avons interrogé nous-mêmes.',
        'The sun on a vertical south plane and on the horizontal, the air, the terrain’s horizon, 2005 to 2023. Free with credit: we queried it ourselves.',
        'queried',
      ),
      s(
        'https://data.geopf.fr/wfs/ows',
        'IGN, BD TOPO (Géoplateforme), Licence Ouverte',
        'Les empreintes, les hauteurs et les dates d’apparition de deux bâtiments jumeaux et du bâtiment de 1974 : le gabarit de la maison, sans la situer. Rien de plus n’en est repris.',
        'The footprints, heights and dates of appearance of two twin buildings and of the 1974 building: the house’s outline, without placing it. Nothing more is taken from it.',
        'queried',
      ),
      s(
        'https://patents.google.com/patent/US3832992A/en',
        'F. Trombe et J. Michel, brevet US 3,832,992, « Naturally air-conditioned dwellings », priorité du 29 juin 1971',
        'Un mode d’hiver et un mode d’été pour une habitation, avec un effet de cheminée.',
        'A winter mode and a summer mode for a dwelling, with a chimney effect.',
        'summary',
      ),
      s(
        'https://patents.google.com/patent/US246626',
        'E. S. Morse, brevet US 246,626, « Warming and ventilating apartments by the sun’s rays », 1881',
        'L’ancêtre : une plaque noircie, du verre, deux ouvertures. Pas de réserve de chaleur.',
        'The ancestor: a blackened plate, glass, two openings. No store of heat.',
        'summary',
      ),
      s(
        'https://en.wikipedia.org/wiki/Edward_S._Morse',
        'Wikipédia, « Edward S. Morse »',
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
        'D. Kelbaugh, « Kelbaugh House », et B. Anderson, « Heat transfer mechanisms: the 1967 Odeillo house… », dans le même volume',
        'Le premier hiver d’une maison à mur Trombe à Princeton, 1975-76 : 72 % économisés sur un calcul au gaz, un courant inverse la nuit, les évents d’au moins la moitié de la lame. Et l’estimation d’un collègue, 75 à 90 %.',
        'The first winter of a Trombe-wall house at Princeton, 1975–76: 72 % saved against a calculation for gas, a reverse flow at night, vents at least half the gap. And a colleague’s estimate, 75 to 90 %.',
        'read',
      ),
      s(
        'https://www.osti.gov/servlets/purl/7287449',
        'J. D. Balcomb, J. C. Hedstrom, R. D. McFarland, « Simulation as a design tool », même volume',
        'Un modèle de mur de maçonnerie de 0,5, 1 et 2 pieds : une maison où le mur donne 68 % à un pied.',
        'A model of a masonry wall of 0.5, 1 and 2 feet: a house where the wall gives 68 % at one foot.',
        'read',
      ),
      s(
        'https://www.osti.gov/servlets/purl/6748432',
        'J. D. Balcomb, « State of the art in passive solar heating and cooling », LA-UR-78-774, 1978',
        'Les pièces d’essai de Los Alamos en février : gain direct, mur ventilé ou sans évents, avec leur amplitude et l’heure du maximum.',
        'The Los Alamos test rooms in February: direct gain, vented or unvented wall, with their swing and the hour of the peak.',
        'read',
      ),
      s(
        undefined,
        'P. Ohanessian et W. W. S. Charters, « Thermal simulation of a passive solar house using a Trombe-Michel wall structure », Solar Energy 20, 275-281, 1978 (doi 10.1016/0038-092X(78)90106-8)',
        'Une contribution solaire d’hiver « de l’ordre de 40 % », selon un résumé : nous n’avons pas pu lire l’article.',
        'A winter solar contribution “of the order of 40 per cent”, according to a summary: we could not read the paper.',
        'search',
      ),
      s(
        'https://passivehouse.com/former_conferences/Kran/First_Passive_House_Kranichstein_en.html',
        'Passive House Institute, « 15 years Passive House in Darmstadt-Kranichstein », 2006, et W. Feist, « The Passive House through the seasons »',
        'La maison passive de 1991 : l’isolation, l’étanchéité à l’air, la récupération de chaleur, le chauffage mesuré année par année, la puissance qui ne dépasse jamais 7,4 W/m².',
        'The passive house of 1991: insulation, airtightness, heat recovery, the heating measured year by year, the power that never exceeds 7.4 W/m².',
        'summary',
      ),
      s(
        'https://doi.org/10.1007/s12053-019-09781-3',
        'W. Feist, R. Pfluger, W. Hasper, « Durability of building fabric components and ventilation systems in passive houses », Energy Efficiency, 2019',
        'Vingt-cinq ans de maison passive : un chiffre de chauffage stable, vu dans un résumé de recherche.',
        'Twenty-five years of a passive house: a stable heating figure, seen in a search summary.',
        'search',
      ),
      s(
        'https://www.fiabitat.com/doctypes/science_e2a_pfafferott.pdf',
        'J. Pfafferott, « Evaluation of earth-to-air heat exchangers with a standardised method to calculate energy efficiency », Energy and Buildings 35, 2003',
        'Trois puits canadiens de bureaux mesurés en Allemagne : dimensions, débit, sol, énergie d’une année, efficacité de 0,77 à 0,94. Copie tierce de l’article.',
        'Three office earth tubes measured in Germany: dimensions, flow, soil, a year’s energy, effectiveness of 0.77 to 0.94. A third-party copy of the paper.',
        'read',
      ),
      s(
        'https://en.wikipedia.org/wiki/Trombe_wall',
        'Wikipédia, « Trombe wall » et « Mur Trombe »',
        'Ce qui circule : « deux pieds » et « 70 % », par un livre de 2013. Utilisés seulement pour dire ce qui se répète.',
        'What circulates: “two feet” and “70 %”, through a book of 2013. Used only to say what is repeated.',
        'summary',
      ),
      s(
        'https://pop.culture.gouv.fr/notice/merimee/ACR0001186',
        'Ministère de la Culture, base Mérimée, « Villa solaire de Mme Pécout », Sète, 1986',
        'Une maison à murs Trombe, des évents qui se manœuvrent selon la saison, une transformation pour ouvrir ses fenêtres hautes et les laver.',
        'A house with Trombe walls, vents operated by season, an alteration so that its high windows open for cleaning.',
        'summary',
      ),
      s(
        'https://www.nrel.gov/docs/fy04osti/36277.pdf',
        'P. Torcellini et S. Pless, « Trombe walls in low-energy buildings: practical experiences », NREL/TP-550-36277, 2004',
        'La critique moderne mesurée, sur un centre de visiteurs. Le site n’a pas répondu : nous ne l’avons pas lu.',
        'The modern measured critique, on a visitor centre. The site did not answer: we have not read it.',
        'none',
      ),
    ],
  },
  {
    fr: 'Les vidéos',
    en: 'The videos',
    items: [
      s(
        'https://www.youtube.com/watch?v=66W5NvNotc4',
        'Penn Ar Web, « La maison bioclimatique de Benoît », 2021 (licence CC BY)',
        'Un film d’accompagnement : une maison bioclimatique en bois, bâtie par son propriétaire. Nous n’en reprenons aucune image ni aucun fait : nous le conseillons.',
        'A companion film: a bioclimatic wooden house, built by its owner. We reuse no image and no fact from it: we recommend it.',
        'metadata',
      ),
      s(
        'https://www.youtube.com/watch?v=mBtSYFQ21A0',
        'Stéphen Mure Architecte, « Le puits canadien : mon avis d’architecte », 2020',
        'Un architecte qui n’en a jamais posé, et pourquoi. Ses chiffres sont des illustrations, pas des mesures.',
        'An architect who has never fitted one, and why. His figures are illustrations, not measurements.',
        'transcript',
      ),
    ],
  },
  {
    fr: 'Les règles et leur lecture',
    en: 'The rules and how they were read',
    items: [
      s(
        'https://www.occitanie.developpement-durable.gouv.fr/IMG/pdf/plaquette_etude_comparative_re2020.pdf',
        'Direction régionale de l’environnement d’Occitanie, plaquette sur l’indicateur de confort d’été de la RE2020',
        'Un indicateur en degrés-heures, avec des seuils de 350 et de 1 250 °C·h dans un cas d’étude. Le décret et l’arrêté ne sont pas lus.',
        'An indicator in degree-hours, with thresholds of 350 and 1,250 °C·h in a case study. The decree and the order are not read.',
        'search',
      ),
      s(
        'https://www.occitanie.developpement-durable.gouv.fr/IMG/pdf/66_gaz_radon.pdf',
        'Zones à potentiel radon, arrêté du 27 juin 2018, fiche des Pyrénées-Orientales ; Géorisques',
        'La commune est rangée en zone 3 par une page secondaire. La ligne de l’arrêté n’est pas lue : à vérifier sur Légifrance.',
        'The commune is placed in zone 3 by a secondary page. The decree’s line is not read: to check on Légifrance.',
        'search',
      ),
      s(
        'https://www.bretagne.developpement-durable.gouv.fr/IMG/pdf/Fiche_22_-_Pages_de_carnet_de_sante_2015_web.pdf',
        'DREAL Bretagne, fiche sur le puits canadien ; xpair, « Puits canadien et ventilation double flux »',
        'L’entretien d’un filtre, la condensation et les moisissures, l’étanchéité à l’air contre le radon, la pente et la purge. La fiche de la DREAL n’a pas répondu.',
        'Filter upkeep, condensation and mould, airtightness against radon, slope and drain. The DREAL sheet did not answer.',
        'search',
      ),
    ],
  },
];

/** The law and the rules, place by place, and how each line was reached. [place fr, place en], then the line. */
export const LAW: [place: readonly [string, string], fr: string, en: string][] = [
  [
    ['France, le patrimoine', 'France, heritage'],
    'Le bâtiment de 1974 est inscrit depuis le 25 mai 2011 (façades, toits, système du mur), le four depuis 2009 : source lue en résumé. Les travaux sur un bâtiment inscrit et dans ses abords relèvent du Code du patrimoine, cité de mémoire, non lu.',
    'The building of 1974 has been listed since 25 May 2011 (façades, roofs, the wall system), the furnace since 2009: a source read in summary. Works on a listed building and in its surroundings fall under the Heritage Code, quoted from memory, not read.',
  ],
  [
    ['France, la construction', 'France, building'],
    'Une maison neuve relève de la RE2020, qui a un indicateur de confort d’été en degrés-heures : lue dans une plaquette régionale, le texte du décret n’est pas lu. Des travaux de façade demandent une déclaration ou un permis, de mémoire. La ventilation d’un logement relève de l’arrêté du 24 mars 1982, de mémoire.',
    'A new house falls under the RE2020, which has a summer-comfort indicator in degree-hours: read in a regional leaflet, the decree’s text is not read. Façade works ask for a declaration or a permit, from memory. A dwelling’s ventilation falls under the order of 24 March 1982, from memory.',
  ],
  [
    ['France, le radon', 'France, radon'],
    'La commune est en zone 3 d’après une page secondaire ; les obligations d’information à la vente et à la location s’y attachent. La ligne de l’arrêté du 27 juin 2018 n’est pas lue.',
    'The commune is in zone 3 according to a secondary page; duties to inform on sale and rental go with it. The line of the order of 27 June 2018 is not read.',
  ],
  [
    ['L’architecture et l’image', 'Architecture and images'],
    'L’œuvre d’un architecte peut être protégée. L’exception de panorama du droit français ne couvre que les personnes physiques, hors usage commercial ; celle de l’Allemagne est plus large pour les extérieurs. Une reconstitution publique à partir de données publiées, sans but lucratif, est de faible risque à notre lecture : ce n’est pas un avis juridique, et un film monétisé est une autre question.',
    'An architect’s work may be protected. The French panorama exception covers natural persons only, outside commercial use; Germany’s is wider for exteriors. A public reconstruction from published data, not for profit, is low risk on our reading: it is not a legal opinion, and a monetised film is another question.',
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
