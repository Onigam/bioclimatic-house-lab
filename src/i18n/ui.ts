import { registerStrings, tx, type CommonKey } from '@onigam/lab-kit/i18n';

// The lab's own interface strings, `key: [fr, en]`. The ones every lab shares (modes, toolbar, panels, guides) live in the kit; the simulation panel's words live in src/sim/texts.ts and src/panels/strings.ts. This file holds the frame's words for this lab: its title,
// the worlds and the shortcuts between them, the intros of the Plans and Lessons modes, and the notices of the Sources panel, each said once: the safety line, the hazards together, the reconstruction and the credits, how to read the figures.

export const LAB_STRINGS = {
  // The title and the tagline say what the lab is and what the page holds. The top bar shows about 60 capitals at 1280 px: both are shorter. The owner has not yet answered research §8, question 9, which proposes them.
  labTitle: ['MAISON BIOCLIMATIQUE : LE MUR QUI GARDE LE SOLEIL', 'BIOCLIMATIC HOUSE: THE WALL THAT KEEPS THE SUN'],
  tagline: ['Une maison peut-elle se chauffer seule ?', 'Can a house heat itself?'],

  // ---- the worlds and the shortcuts between them
  sceneSite: ['Le plateau', 'The plateau'],
  sceneHouse: ['La maison', 'The house'],
  sceneWall: ['Le mur', 'The wall'],
  sceneRoom: ['La pièce', 'The room'],
  goSite: ['Voir le plateau', 'See the plateau'],
  goHouse: ['Ouvrir la maison', 'Open the house'],
  goWall: ['Ouvrir le mur', 'Open the wall'],
  goRoom: ['Entrer dans la pièce', 'Step into the room'],

  // ---- the kit's pill when no alarm is on says « Tout fonctionne » / « All good »: a model that raises no alert has not said the house is well. `registerStrings` overwrites a common key.
  allGood: ['Aucune alerte', 'No alert'],

  // ---- the groups of the Plans mode (src/drawings/index.ts)
  groupHouse: ['La maison et son soleil', 'The house and its sun'],
  groupWall: ['Le mur', 'The wall'],
  groupBalance: ['Le bilan', 'The balance'],

  // ---- the intros
  plansIntro: [
    'Huit planches A3 générées à partir des cotes du modèle 3D et des résultats de la simulation : la maison en plan et en élévation, la coupe d’hiver et d’été, le soleil et les saisons, l’élément de captage, l’air dans les conduits, la vague dans le mur, Noël 1974 et le bilan d’une saison. Ce sont des dessins pour comprendre : les cotes estimées portent une étoile.',
    'Eight A3 sheets generated from the 3D model’s dimensions and the simulation’s results: the house in plan and elevation, the section in winter and summer, the sun and the seasons, the collector element, the air in the ducts, the wave in the wall, Christmas 1974 and the balance of a season. They are drawings for understanding: estimated dimensions carry a star.',
  ],
  lessonsIntro: [
    'Sept leçons, chacune ouverte sur un scénario de la simulation, qui en parcourent les douze : le mur noir, la vague lente, Noël 1974 et ses 478 %, le soleil bas et le soleil haut, la question de la maison qui se chauffe seule, la nuit, l’air neuf et le sol. Le cœur est dans la deuxième et la cinquième.',
    'Seven lessons, each opening on a scenario of the simulation, going through all twelve: the black wall, the slow wave, Christmas 1974 and its 478 %, the low sun and the high sun, the question of the house that heats itself, the night, fresh air and the ground. The heart is in the second and the fifth.',
  ],

  // ---- the notices of the Sources panel, each said once
  safety: [
    'Reconstitution pédagogique indépendante, pas un plan. Rien ici ne dit qu’un mur comme celui-ci est sûr à construire ni à habiter. Avant tout projet : un ingénieur de structure pour le poids et les fondations, un électricien, quelqu’un qui sait ventiler une maison, et les règles de votre pays.',
    'An independent educational reconstruction, not a plan. Nothing here says that a wall like this is safe to build or to live behind. Before any project: a structural engineer for the weight and the foundations, an electrician, someone who knows how to ventilate a house, and the rules of your country.',
  ],
  hazards: [
    'Les risques d’une vraie maison de ce genre, réunis une fois : des dizaines de tonnes de béton sur une face, sur une pente ; du verre de plus de 4 m de haut ; la chaleur derrière la vitre, où un mur noir passe les 60 °C et chauffe, évents fermés, une maison déjà chaude ; l’air neuf, et le monoxyde de carbone de tout appareil qui brûle quelque chose ; l’électricité du chauffage d’appoint ; l’eau d’un béton coulé sur place ; un tuyau d’air enterré, avec sa condensation, ses moisissures, son filtre et le radon ; et les évents entre deux niveaux, la fumée, les insectes, la poussière, dont nous n’avons pas lu les règles.',
    'The risks of a real house of this kind, gathered once: tens of tonnes of concrete on one side, on a slope; glass over 4 m high; the heat behind the glass, where a black wall passes 60 °C and, vents shut, heats a house already hot; new air, and the carbon monoxide of anything that burns something; the electricity of the backup heating; the water in concrete cast in place; a buried air pipe, with its condensation, its mould, its filter and radon; and vents between two levels, smoke, insects, dust, whose rules we have not read.',
  ],
  disclaimer: [
    'Reconstitution indépendante d’une maison de 1967 d’après l’article de ses inventeurs : pas un dessin officiel, et aucune affiliation avec le CNRS, le laboratoire PROMES, ni les propriétaires des maisons. Aucune image, aucun extrait vidéo et aucun dessin d’une source n’est repris. Ce qu’une source ne donne pas est dessiné et marqué comme estimation.',
    'An independent reconstruction of a house of 1967 from its inventors’ paper: not an official drawing, and with no affiliation to the CNRS, the PROMES laboratory, nor the houses’ owners. No image, video clip or drawing from any source is reused. What a source does not give is drawn, and marked as an estimate.',
  ],
  noticeReading: [
    'Comment lire les chiffres. Sans marque, un chiffre est rapporté par une source, nommée en toutes lettres. † : calculé, à partir de chiffres publiés ou par le modèle, jamais réglé pour retrouver une source. * : estimé, les sources se taisent et le choix est le nôtre. « À l’œil » : lu sur une courbe publiée, à quelques pour cent près. Le modèle est simple, un mur, une lame d’air, une pièce : là où il ne retrouve pas une source, il le dit.',
    'How to read the figures. With no mark, a figure is reported by a source, named in words. †: computed, from published figures or by the model, never set to match a source. *: estimated, the sources are silent and the choice is ours. “By eye”: read off a published curve, to within a few per cent. The model is simple, one wall, one air gap, one room: where it does not retrieve a source, it says so.',
  ],
  lawTitle: ['Le droit et les normes : ce que nous en avons lu', 'The law and the standards: what we read of them'],
  legal: [
    'Rien de ce qui suit n’a été vérifié par un juriste, et ce n’est pas un avis juridique : chaque ligne dit comment nous l’avons atteinte. Les règles de votre pays s’appliquent, et ce sont celles des autorités qui protègent un bâtiment, de l’assureur et du professionnel qui signe.',
    'None of what follows has been checked by a lawyer, and this is not legal advice: each line says how we reached it. The rules of your country apply, and they are those of the authorities that protect a building, of the insurer and of the professional who signs.',
  ],
  mainSource: ['Source principale :', 'Main source:'],
  mainSourceNote: [
    'l’article de 1976 de ses inventeurs, sur OSTI. Aucune vidéo ne montre cette maison : le labo n’a donc pas de film principal. Ses chiffres viennent de cet article, de données ouvertes de satellite et de terrain, de quelques autres mesures, et de notre modèle.',
    'the 1976 paper by its inventors, on OSTI. No video shows this house: the lab therefore has no main film. Its figures come from that paper, from open satellite and terrain data, from a few other measurements, and from our model.',
  ],
  sourcesNotLinked: [
    'Ne sont pas liées ici, volontairement : les pages qui vendent des plans ou des documents. Nous ne reprenons aucune image ni aucun film d’aucune source, et nous ne désignons aucune maison au-delà d’Odeillo.',
    'Left unlinked on purpose: pages that sell plans or documents. We reuse no image and no film from any source, and we point at no house beyond Odeillo.',
  ],
  sourcesCredits: [
    'Merci à F. Trombe, J.-F. Robert, M. Cabanat et B. Sesolis, à J. Michel, l’architecte ; à D. Kelbaugh, B. Anderson, J. D. Balcomb et ses collègues de Los Alamos ; à W. Feist et au Passive House Institute ; à J. Pfafferott ; à E. S. Morse ; à PVGIS et à l’IGN ; à Stéphen Mure ; à Penn Ar Web. Les conceptions citées restent celles de leurs auteurs. Les planches sont refaites d’après nos dimensions.',
    'Thanks to F. Trombe, J.-F. Robert, M. Cabanat and B. Sesolis, to J. Michel, the architect; to D. Kelbaugh, B. Anderson, J. D. Balcomb and his colleagues at Los Alamos; to W. Feist and the Passive House Institute; to J. Pfafferott; to E. S. Morse; to PVGIS and the IGN; to Stéphen Mure; to Penn Ar Web. The designs cited remain their authors’. The sheets are redrawn from our own dimensions.',
  ],
} as const satisfies Record<string, readonly [string, string]>;

registerStrings(LAB_STRINGS);

export type UiKey = keyof typeof LAB_STRINGS | CommonKey;

export { colon } from '@onigam/lab-kit/i18n';

export function t(key: UiKey): string {
  return tx(key);
}
