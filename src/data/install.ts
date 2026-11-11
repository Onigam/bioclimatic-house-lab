// Installation guide (10 steps), docs/research.md §0.5 and §4.5: how a wall finds its place in a site and a year, as the inventors and the architect who followed them report it, and as the model finds it. A step plays in the world where its
// parts stand. Every step ends on its origin; the first says this is not a procedure. The two risky gestures carry their one warning where they happen: the summer position with the vents shut, and the air a house needs. No duration, no tool, no
// figure to build to.
import type { GuideStep } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { ORIGIN, withOrigin } from './assembly';
import { lf } from './part-helpers';

export const INSTALL: GuideStep[] = [
  {
    id: 'face-south',
    scene: 'house',
    title: l('Face au sud', 'Facing south'),
    text: withOrigin(
      lf(
        'Ce qui suit raconte comment un mur de ce genre trouve sa place dans un lieu et dans une année : ce n’est pas une marche à suivre. Il commence par une orientation : la **façade** de capteur regarde le sud. À Odeillo, le soleil de midi frappe un mur vertical à {sunDec} de sa perpendiculaire en décembre, à {sunJun} en juin ; l’article dit « plus de 70° » autour du solstice d’été. C’est la géométrie qui fait le travail, pas un auvent : le mur reçoit {janJun} plus de soleil en janvier qu’en juin.',
        'What follows tells how a wall of this kind finds its place in a site and a year: it is not a procedure to follow. It begins with an orientation: the collector **front** faces south. At Odeillo the noon sun strikes a vertical wall at {sunDec} from its perpendicular in December, at {sunJun} in June; the paper says “more than 70°” around the summer solstice. It is geometry that does the work, not an overhang: the wall receives {janJun} more sun in January than in June.',
      ),
      ORIGIN.reportedModel,
    ),
    parts: ['south-facade'],
  },
  {
    id: 'winter-horizon',
    scene: 'site',
    title: l('L’horizon d’hiver', 'The winter horizon'),
    text: withOrigin(
      l(
        'Vient ensuite le sud, le jour le plus court, à midi, quand le soleil est bas. À Odeillo, un modèle de terrain donne 2,7° plein sud et aucune ombre de crête à midi en hiver ; il ne compte pas les arbres. Un architecte américain a essayé son terrain ce jour-là, avant de bâtir, pour y chercher des ombres. Les **crêtes** du plateau sont celles du modèle.',
        'Next comes the south on the shortest day, at noon, when the sun is low. At Odeillo a terrain model gives 2.7° due south and no ridge shadow at noon in winter; it does not count trees. An American architect tried out his plot on that day, before building, to look for shadows. The plateau’s **ridges** are the model’s.',
      ),
      ORIGIN.reported,
    ),
    parts: ['far-ridge'],
  },
  {
    id: 'how-much-wall',
    scene: 'house',
    title: l('Combien de mur', 'How much wall'),
    text: withOrigin(
      l(
        'Les inventeurs comptent 0,16 m² de capteur par mètre cube pour la maison de 1967, 48 m² pour 300 m³, et environ 0,1 pour celles de 1974. La Simulation en fait un réglage, de 10 à 55 m² : le **capteur** est un compromis entre le soleil qu’on prend et la chaleur que la maison perd, pas une valeur à retenir.',
        'The inventors count 0.16 m² of collector per cubic metre for the 1967 house, 48 m² for 300 m³, and about 0.1 for those of 1974. The Simulation makes it a setting, from 10 to 55 m²: the **collector** is a compromise between the sun taken and the heat the house loses, not a value to keep.',
      ),
      ORIGIN.reported,
    ),
    parts: ['collector-element'],
  },
  {
    id: 'insulate-first',
    scene: 'house',
    title: l('L’isolation de 1974', 'The insulation of 1974'),
    text: withOrigin(
      lf(
        'Les inventeurs rapportent des pertes de 1,63 W par mètre cube et par degré pour la maison de 1967, et de 1,00 pour celles de 1974, grâce, écrivent-ils, à une bonne **isolation** thermique de la construction de 1974. Sur le même mur, avec le même soleil, le modèle fait passer la part de la saison de {shareAll} à {share1974} avec ce G de 1974 : la maison perd moins, rien d’autre.',
        'The inventors report losses of 1.63 W per cubic metre and per degree for the 1967 house, and 1.00 for those of 1974, thanks, they write, to a good thermal **insulation** of the 1974 construction. On the same wall, with the same sun, the model takes the season’s share from {shareAll} to {share1974} with that 1974 G: the house loses less, nothing else.',
      ),
      ORIGIN.reportedModel,
    ),
    parts: ['roof-insulation'],
  },
  {
    id: 'winter-position',
    scene: 'wall',
    title: l('La position d’hiver', 'The winter position'),
    text: withOrigin(
      l(
        'Tout l’hiver, l’air de la pièce descend au **conduit bas**, monte derrière la vitre et revient par le **conduit haut**. La boucle ne marche que si les deux sont libres : un jour de soleil, la grille haute souffle chaud, et une grille basse masquée étouffe le courant. Ce sont des habitudes d’usage, pas des chiffres : l’article n’en donne aucune.',
        'All winter the room’s air goes down to the **lower duct**, rises behind the glass and comes back by the **upper duct**. The loop only works if both are clear: on a sunny day the upper grille blows warm, and a low grille that is blocked chokes the flow. These are habits of use, not figures: the paper gives none.',
      ),
      ORIGIN.practice,
    ),
    parts: ['upper-duct', 'lower-duct'],
  },
  {
    id: 'summer-position',
    scene: 'wall',
    title: l('La position d’été', 'The summer position'),
    text: withOrigin(
      lf(
        'Le **clapet d’été** est à plat l’hiver et pend l’été. Dans une maison à murs Trombe de 1986, signalée par la base nationale du patrimoine, les évents se manœuvrent à chaque changement de saison, et des fenêtres hautes ont été rendues ouvrantes pour laver la lame, derrière le **vitrage extérieur**. L’article ne dit pas quand les maisons de 1967 changeaient de position. En été, le même mur tire l’air de la maison vers le dehors : {summerRange} dans le modèle.',
        'The **summer flap** is flat in winter and hangs in summer. In a Trombe-wall house of 1986, noted in the national heritage database, the vents are worked at each change of season, and high windows were made to open so as to wash the gap behind the **outer glazing**. The paper does not say when the 1967 houses changed position. In summer the same wall draws the house’s air outside: {summerRange} in the model.',
      ),
      ORIGIN.practiceReportedModel,
    ),
    warning: lf(
      'Un mur noir derrière du verre, avec les évents fermés et sans issue pour l’air, monte vers {paintHotRange} dans le modèle et chauffe une maison déjà chaude. On ne le vérifie pas sur une vraie maison.',
      'A black wall behind glass, with the vents shut and no way out for the air, climbs to about {paintHotRange} in the model and heats a house already hot. It is not to be checked on a real house.',
    ),
    parts: ['summer-flap', 'outer-glazing'],
  },
  {
    id: 'first-winters',
    scene: 'wall',
    title: l('Les premiers hivers', 'The first winters'),
    text: withOrigin(
      lf(
        'Le **mur** de 1974, plus mince, a rendu 8 à 10 points de moins que celui de 1967. Les auteurs en donnent deux raisons : moins de circulation d’air (une surface d’échange plus petite, 3,25 contre 4,50 m²) et moins de chaleur restituée par le béton, qu’ils rattachent à l’eau qui y reste et qu’ils attendent de voir partir en un ou deux ans ; ils proposent des blocs préfabriqués secs. Le modèle ne simule pas l’eau : il donne à ce mur {dry74}, un point de plus que celui de 1967 ({eff20}), et ne retrouve donc pas l’écart.',
        'The 1974 **wall**, thinner, gave back 8 to 10 points less than the 1967 one. The authors give two reasons: less air circulation (a smaller exchange surface, 3.25 against 4.50 m²) and less heat coming through the concrete, which they trace to the water still in it and expect to go in a year or two; they propose dry prefabricated blocks. The model does not simulate water: it gives this wall {dry74}, a point above the 1967 one ({eff20}), and so does not retrieve the gap.',
      ),
      ORIGIN.reportedModel,
    ),
    parts: ['storage-wall'],
  },
  {
    id: 'backup',
    scene: 'room',
    title: l('Le chauffage d’appoint', 'The backup heating'),
    text: withOrigin(
      lf(
        'Quand le mur ne suffit pas, un chauffage électrique tient la pièce à 20 °C, jugé par un **thermostat** à 1,50 m. Dans le modèle, il paie {shareElectricity} de la charge de la saison. À 18 °C, la part que l’électricité ne paie pas passerait de {shareAll} à {share18} : le réglage compte autant que le mur.',
        'When the wall is not enough, electric heating holds the room at 20 °C, judged by a **thermostat** at 1.50 m. In the model it pays for {shareElectricity} of the season’s load. At 18 °C, the share electricity does not pay for would go from {shareAll} to {share18}: the setting counts as much as the wall.',
      ),
      ORIGIN.reportedModel,
    ),
    parts: ['thermostat'],
  },
  {
    id: 'fresh-air',
    scene: 'room',
    title: l('L’air neuf, à part', 'Fresh air, apart'),
    text: withOrigin(
      lf(
        'La boucle du mur reprend l’air de la pièce : elle n’apporte aucun air du dehors. L’air neuf d’une maison vient d’ailleurs, et les sources ne disent pas d’où il venait ici : l’**entrée d’air frais** de notre dessin s’ouvre sur rien. Le modèle compte {airChange} dans les pertes de la maison, et la position d’été en tire {summerRange}.',
        'The wall’s loop takes the room’s air: it brings no outside air. A house’s new air comes from elsewhere, and the sources do not say where it came from here: the **fresh-air vent** in our drawing opens onto nothing. The model counts {airChange} in the house’s losses, and the summer position draws {summerRange}.',
      ),
      ORIGIN.reportedReading,
    ),
    warning: l(
      'Une maison a besoin d’air neuf, et tout appareil qui brûle quelque chose a besoin du sien : le monoxyde de carbone ne se voit ni ne se sent. Un appareil à combustible se règle avec un professionnel, avec un détecteur, selon les règles du lieu.',
      'A house needs new air, and anything that burns something needs its own: carbon monoxide can be neither seen nor smelt. A fuel appliance is set up with a professional, with an alarm, according to the rules of the place.',
    ),
    parts: ['fresh-air-vent'],
  },
  {
    id: 'measure-over-days',
    scene: 'room',
    title: l('Mesurer sur des jours', 'Measuring over days'),
    text: withOrigin(
      l(
        'Les inventeurs ne comptent un bilan que sur 24 heures au moins. Un mur qui a une mémoire rend, un jour de peu de soleil, plus que ce jour n’apporte : le 24 décembre 1974, 5 424 kJ par mètre carré rendus pour 1 134 reçus, soit 478 %. Les auteurs écrivent « aberrant » : c’est le soleil de la veille, encore dans le mur. Il leur a fallu des suites de jours, un **enregistreur**, et un délai de 14 à 16 heures dans le mur.',
        'The inventors count a balance only over 24 hours at least. A wall with a memory gives back, on a day of little sun, more than that day brings: on 24 December 1974, 5,424 kJ per square metre given back for 1,134 received, or 478 %. The authors write “aberrant”: it is yesterday’s sun, still in the wall. They needed runs of days, a **chart recorder**, and a lag of 14 to 16 hours in the wall.',
      ),
      ORIGIN.reported,
    ),
    parts: ['chart-recorder'],
  },
];
