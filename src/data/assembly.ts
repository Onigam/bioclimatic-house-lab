// Assembly guide (20 steps), docs/research.md §0.5 and §4.5: how the house goes together, told as a reading of what is known of its materials and of the usual order of a building site, not as a procedure. No source gives the 1967 sequence. Each step
// plays in the world where its parts stand (`site`, `house`, `wall`, `room`), so that it frames parts the visitor can see; each of the 15 parts of `house`, the 14 of `wall` (but the air gap, which appears) and the 13 of `room` that are made
// by someone is put in exactly one step; the what-if parts, the living and the scenery are not installed, they appear. Every step ends on its origin. No cut line, no torque, no tool list, no duration: nothing here is offered to follow, and
// the first step says so once. The risky gestures carry their one warning where they happen (the weight, the glass at height, the mains).
import type { GuideStep } from '@onigam/lab-kit/content';
import { l, type L } from '@onigam/lab-kit/i18n';
import { lf } from './part-helpers';

/** The closing words of a step: where it comes from. */
export const ORIGIN = {
  reported: l('**Origine** : rapporté.', '**Origin**: reported.'),
  practice: l('**Origine** : pratique courante.', '**Origin**: usual practice.'),
  reading: l('**Origine** : notre reconstitution.', '**Origin**: our reconstruction.'),
  reportedReading: l(
    '**Origine** : rapporté pour ce que dit l’article, notre reconstitution pour le reste.',
    '**Origin**: reported for what the paper says, our reconstruction for the rest.',
  ),
  practiceReported: l(
    '**Origine** : pratique courante, avec un fait rapporté.',
    '**Origin**: usual practice, with a reported fact.',
  ),
  reportedModel: l(
    '**Origine** : rapporté pour ce que dit l’article, résultat du modèle (†) pour les chiffres calculés.',
    '**Origin**: reported for what the paper says, the model’s result (†) for the computed figures.',
  ),
  practiceReportedModel: l(
    '**Origine** : pratique courante, avec un fait rapporté ; le chiffre calculé est un résultat du modèle.',
    '**Origin**: usual practice, with a reported fact; the computed figure is a result of the model.',
  ),
} as const;

export const withOrigin = (t: L, o: L): L => l(`${t.fr} ${o.fr}`, `${t.en} ${o.en}`);

export const ASSEMBLY: GuideStep[] = [
  {
    id: 'ground',
    scene: 'site',
    title: l('Le terrain', 'The ground'),
    text: withOrigin(
      l(
        'Ceci est une lecture pour apprendre : ce n’est pas un plan à suivre, et aucune cote de coffrage, aucun ferraillage, aucun dosage n’y est donné. Personne ne sait dans le détail comment la maison de 1967 a été bâtie. Ce qui suit réunit ce que l’on sait de ses matériaux et les usages d’un chantier, dans l’ordre où l’on monte une telle maison. On commence par le **terrain** : une pente qui descend au sud, avec un soleil d’hiver dégagé à midi. Un architecte américain a essayé son terrain au solstice d’hiver avant de bâtir.',
        'This is a reading for learning: it is not a plan to follow, and no formwork size, reinforcement or mix is given. Nobody knows in detail how the 1967 house was built. What follows brings together what is known of its materials and the habits of a building site, in the order such a house goes up. It begins with the **ground**: a slope that falls to the south, with a clear winter sun at noon. An American architect tried out his plot at the winter solstice before building.',
      ),
      ORIGIN.practiceReported,
    ),
    parts: ['granite-slope'],
  },
  {
    id: 'foundation',
    scene: 'house',
    title: l('La fondation', 'The foundation'),
    text: withOrigin(
      lf(
        'Sous la façade sud, la **fondation** porte le mur le plus lourd de la maison : {massT}, soit {tPerM2} de mur. Notre dessin lui donne sa semelle propre sous le mur et des gradins sous les pignons, qui suivent la pente de {groundFall}. L’article ne dit rien de la fondation, et le bâtiment de 1974 a des fondations en gradins dans le rocher d’après la base nationale du patrimoine : celle-ci est notre dessin.',
        'Under the south front, the **foundation** carries the heaviest wall of the house: {massT}, or {tPerM2} of wall. Our drawing gives it a footing of its own under the wall and steps under the gables, which follow the slope’s fall of {groundFall}. The paper says nothing of the foundation, and the building of 1974 has stepped foundations in the rock according to the national heritage database: this one is our drawing.',
      ),
      ORIGIN.reading,
    ),
    parts: ['foundation'],
  },
  {
    id: 'slab',
    scene: 'house',
    title: l('La dalle', 'The slab'),
    text: withOrigin(
      lf(
        'Sur le lit de pierres, la **dalle** est de niveau, de {slab} d’épaisseur dans le dessin. C’est de son dessus que se comptent toutes les hauteurs du reste. Le terrain tombe sous elle vers le sud : c’est ce qui fera, plus tard, le balcon et son escalier.',
        'On the bed of stones, the **slab** is level, {slab} thick in the drawing. All the other heights are counted from its top. The ground falls away beneath it to the south: that is what will later make the balcony and its stair.',
      ),
      ORIGIN.reading,
    ),
    parts: ['floor-slab'],
  },
  {
    id: 'sill-and-low-duct',
    scene: 'wall',
    title: l('Le pied et le conduit bas', 'The foot and the lower duct'),
    text: withOrigin(
      lf(
        'On travaille maintenant sur un seul élément, celui du monde du mur. Le pied d’abord : la **poutre d’appui** repose sur la fondation, et le **conduit bas** y est ménagé, une réservation de 0,565 × 0,110 m qui reste dans le béton, près du sol. L’article hachure deux bandes de maçonnerie dans sa figure 1 sans en dire le sens : nous les lisons comme un pied et une tête. Il dit « près du sol » pour le conduit : nous prenons {ductAbove}.',
        'We now work on a single element, the one in the wall world. The foot first: the **sill beam** rests on the foundation, and the **lower duct** is left in it, an opening of 0.565 × 0.110 m that stays in the concrete, near the floor. The paper hatches two bands of masonry in its figure 1 without saying what they mean: we read them as a foot and a head. It says “near the floor” for the duct: we take {ductAbove}.',
      ),
      ORIGIN.reading,
    ),
    parts: ['sill-beam', 'lower-duct'],
  },
  {
    id: 'high-duct',
    scene: 'wall',
    title: l('Le conduit haut', 'The upper duct'),
    text: withOrigin(
      lf(
        'À 3,50 m au-dessus, de même : le **conduit haut**, de la même section de 621,5 cm², reste dans le béton près du plafond. Les deux conduits sont des réservations, le béton se fait autour d’elles. Un architecte américain citait une règle d’usage en Europe : des évents d’au moins la moitié de la section de la lame d’air. Ceux-ci en font {ductsOverGap}.',
        '3.50 m higher up, the same: the **upper duct**, of the same section of 621.5 cm², stays in the concrete near the ceiling. The two ducts are openings, the concrete is made round them. An American architect quoted a rule of thumb in Europe: vents of at least half the section of the air gap. These are {ductsOverGap}.',
      ),
      ORIGIN.reportedReading,
    ),
    parts: ['upper-duct'],
  },
  {
    id: 'storage-wall',
    scene: 'wall',
    title: l('Le mur de stockage', 'The storage wall'),
    text: withOrigin(
      l(
        'Le **mur de stockage** : 60 cm d’un béton de gravier lourd, 2 200 kg/m³, 1,75 W/m·K, sur 48 m² de façade. Le mur de 1974 a rendu 8 à 10 points de moins que celui de 1967, en partie à cause de l’eau restée dans son béton, disent les auteurs, qui proposent des blocs préfabriqués secs. Une fois le mur fait, il n’y a plus rien à y régler.',
        'The **storage wall**: 60 cm of a heavy gravel concrete, 2,200 kg/m³, 1.75 W/m·K, over 48 m² of front. The 1974 wall gave back 8 to 10 points less than the 1967 one, partly because of the water left in its concrete, say the authors, who propose dry prefabricated blocks. Once the wall is made, there is nothing left to adjust in it.',
      ),
      ORIGIN.reported,
    ),
    warning: lf(
      'Soixante tonnes sur une face de maison, sur une pente : {massT}, soit {tPerM2} de mur. Les fondations et la structure sont l’affaire d’un ingénieur, jamais d’un dessin, ni de ce lab.',
      'Sixty tonnes on one side of a house, on a slope: {massT}, or {tPerM2} of wall. The foundations and the structure are an engineer’s business, never a drawing’s, nor this lab’s.',
    ),
    parts: ['storage-wall'],
  },
  {
    id: 'head-beam',
    scene: 'wall',
    title: l('La poutre de tête', 'The head beam'),
    text: withOrigin(
      l(
        'La **poutre de tête** ferme le haut du mur, au-dessus du conduit haut. Elle tient les équerres du haut du cadre, ferme le haut de la lame d’air et portera le pied des chevrons. Sans elle, le toit n’aurait rien où s’appuyer sur cette façade.',
        'The **head beam** closes the top of the wall, above the upper duct. It holds the brackets at the top of the frame, closes the top of the air gap and will carry the rafters’ feet. Without it, the roof would have nothing to rest on at this front.',
      ),
      ORIGIN.reading,
    ),
    parts: ['head-beam'],
  },
  {
    id: 'other-walls',
    scene: 'house',
    title: l('Les autres murs', 'The other walls'),
    text: withOrigin(
      lf(
        'Les autres murs, que l’article ne décrit pas : le **mur nord**, sans soleil, les deux **pignons** en triangle jusqu’au faîtage sur leurs gradins de fondation, et une petite **fenêtre nord**. Nous les dessinons de {wallT} d’épaisseur ; leurs pertes sont comprises dans le chiffre de toute l’enveloppe, 1,63 W/m³·K. Un architecte américain a réduit ses fenêtres au minimum, surtout au nord, où elles perdent plus de chaleur qu’elles n’en captent.',
        'The other walls, which the paper does not describe: the **north wall**, with no sun, the two **gables** rising in a triangle to the ridge on their foundation steps, and a small **north window**. We draw them {wallT} thick; their losses are included in the figure for the whole envelope, 1.63 W/m³·K. An American architect kept his window area to a minimum, above all on the north, where windows lose more heat than they collect.',
      ),
      ORIGIN.reading,
    ),
    parts: ['north-wall', 'north-window', 'east-gable', 'west-gable'],
  },
  {
    id: 'partitions',
    scene: 'house',
    title: l('Les cloisons', 'The partitions'),
    text: withOrigin(
      lf(
        'Les **cloisons** : quatre pièces principales, dit l’article, chacune avec son thermostat. Le plan est le nôtre : deux cloisons en travers de chaque côté du salon, une dans chaque bloc de côté, des portes entrouvertes. Le salon, large de quatre travées, soit {livingW}, est celui qu’on visite dans le monde de la pièce.',
        'The **partitions**: four principal rooms, says the paper, each with its own thermostat. The plan is ours: two cross partitions either side of the living room, one in each side block, with doors ajar. The living room, four bays wide, or {livingW}, is the one visited in the room world.',
      ),
      ORIGIN.reportedReading,
    ),
    parts: ['interior-partitions'],
  },
  {
    id: 'floor-and-ceiling',
    scene: 'room',
    title: l('Le sol et le plafond', 'The floor and the ceiling'),
    text: withOrigin(
      lf(
        'Dans le salon, le **sol** : une dalle carrelée, qui prend la chaleur du soleil des fenêtres et du mur. Au-dessus, le **plafond** : des planches et du plâtre sous un comble, à une hauteur moyenne de {meanHeight} pour toute la maison, ce qui est étrange. L’article ne dit pas de quoi sont faits l’un et l’autre, et nous ne savons pas si le plafond montait vers le capteur.',
        'In the living room, the **floor**: a tiled slab, which takes the heat of the windows’ sun and of the wall. Above it, the **ceiling**: boards and plaster under a roof void, at a mean height of {meanHeight} for the whole house, which is odd. The paper does not say what either is made of, and we do not know whether the ceiling rose towards the collector.',
      ),
      ORIGIN.reading,
    ),
    parts: ['room-floor', 'room-ceiling'],
  },
  {
    id: 'roof',
    scene: 'house',
    title: l('Le toit', 'The roof'),
    text: withOrigin(
      lf(
        'Le **toit** : deux pans d’environ {pitch}, d’après les données ouvertes, sur des chevrons qui s’appuient sur la poutre de tête. Au-dessus du plafond, une couche d’**isolant**, puis la **cheminée**, dont l’usage n’est dit nulle part. L’isolant décidera de la part du soleil dans la chaleur de la maison : 1,63 W/m³·K en 1967, 1,00 en 1974.',
        'The **roof**: two slopes of about {pitch}, according to open data, on rafters resting on the head beam. Over the ceiling, a layer of **insulation**, then the **chimney**, whose use is said nowhere. The insulation will decide the share of the sun in the house’s heat: 1.63 W/m³·K in 1967, 1.00 in 1974.',
      ),
      ORIGIN.reading,
    ),
    parts: ['pitched-roof', 'roof-insulation', 'chimney'],
  },
  {
    id: 'paint',
    scene: 'wall',
    title: l('La peinture noire', 'The black paint'),
    text: withOrigin(
      lf(
        'On peint la face du mur en noir : de l’acrylique, c’est tout ce que dit l’article. À ce stade le mur est encore à l’air, et c’est le dernier moment où on peut le refaire sans ouvrir un cadre. L’article ne donne pas la part du soleil que la **peinture** garde : nous prenons {absorptance}.',
        'The face of the wall is painted black: acrylic, which is all the paper says. At this stage the wall is still in the open air, and it is the last moment it can be redone without opening a frame. The paper does not give the share of the sun the **paint** keeps: we take {absorptance}.',
      ),
      ORIGIN.reported,
    ),
    parts: ['black-paint'],
  },
  {
    id: 'frame',
    scene: 'wall',
    title: l('Le cadre d’acier', 'The steel frame'),
    text: withOrigin(
      lf(
        'Le **cadre d’acier** se pose sur des équerres vissées dans le béton, en haut et en bas : c’est le béton qui le porte, pas l’air. Notre dessin y met {framePanes} carreaux par élément et des profils de {frameFace} de face, parce qu’une vitre de 3 mm de plus de 4 m de haut ne tiendrait pas seule. L’article dit seulement « un cadre d’acier ».',
        'The **steel frame** is set on angle brackets bolted into the concrete, top and bottom: the concrete carries it, not the air. Our drawing gives it {framePanes} panes to an element and sections {frameFace} wide on their face, because a 3 mm sheet over 4 m high would not stand alone. The paper only says “a steel frame”.',
      ),
      ORIGIN.reportedReading,
    ),
    parts: ['steel-frame'],
  },
  {
    id: 'glazing',
    scene: 'wall',
    title: l('Les deux vitres', 'The two sheets'),
    text: withOrigin(
      lf(
        'Deux vitres de 3 mm : la **vitre intérieure** d’abord, à 12 cm du mur noir, puis la **vitre extérieure**, à {glassSpacing} devant elle. Entre le verre et le mur, la lame d’air reste ouverte en bas et en haut sur les deux conduits.',
        'Two sheets of 3 mm: the **inner sheet** first, 12 cm from the black wall, then the **outer sheet**, {glassSpacing} in front of it. Between the glass and the wall, the air gap stays open at the bottom and the top onto the two ducts.',
      ),
      ORIGIN.reported,
    ),
    warning: l(
      'Des vitres hautes de plus de 4 m : un verre qui tombe ou qui casse blesse. La pose et le nettoyage d’un vitrage à cette hauteur se font avec des moyens de levage, du verre de sécurité et les règles du lieu, que ce lab ne donne pas.',
      'Panes over 4 m high: a glass that falls or breaks injures. Fitting and cleaning glazing at that height is done with lifting gear, safety glass and the rules of the place, which this lab does not give.',
    ),
    parts: ['inner-glazing', 'outer-glazing'],
  },
  {
    id: 'front',
    scene: 'house',
    title: l('Les neuf travées', 'The nine bays'),
    text: withOrigin(
      lf(
        'On répète neuf fois l’élément, et la **façade** prend forme : le **capteur** fait neuf travées, soit {glassNet} de verre net, contre 48 m² annoncés, avec le bandeau, le linteau et la gouttière. Pour retrouver les 48 m² de l’article, il faudrait {elemCount} éléments : huit ou neuf d’après une petite photographie, et nous en dessinons neuf.',
        'The element is repeated nine times, and the **front** takes shape: the **collector** is nine bays, or {glassNet} of net glass, against 48 m² announced, with the band, the lintel and the gutter. To make the paper’s 48 m², {elemCount} elements would be needed: eight or nine according to one small photograph, and we draw nine.',
      ),
      ORIGIN.reportedReading,
    ),
    parts: ['collector-element', 'south-facade'],
  },
  {
    id: 'flap',
    scene: 'wall',
    title: l('Le clapet d’été', 'The summer flap'),
    text: withOrigin(
      l(
        'Le **clapet d’été** : une plaque sur charnière en haut du mur, à plat l’hiver, pendante l’été. L’article en dessine un, le mécanisme (une manivelle, un cordon vers un bouton sous le toit) est notre estimation. L’article ne dit pas à quelle date les maisons changeaient de position.',
        'The **summer flap**: a plate on a hinge at the top of the wall, flat in winter, hanging in summer. The paper draws one; the mechanism (a crank, a cord to a knob under the roof) is our estimate. The paper does not say on what date the houses changed position.',
      ),
      ORIGIN.reportedReading,
    ),
    parts: ['summer-flap'],
  },
  {
    id: 'entrance',
    scene: 'house',
    title: l('L’entrée et la fenêtre', 'The entrance and the window'),
    text: withOrigin(
      l(
        'Le milieu de la façade : l’**entrée en retrait** avec sa porte vitrée, la **fenêtre sud** haute à côté, et devant elles le **balcon** et son escalier, qui descendent jusqu’au terrain. Tout cela vient d’une seule petite photographie : c’est pourquoi aucune cote n’en est donnée comme certaine.',
        'The middle of the front: the **entrance recess** with its glazed door, the tall **south window** beside it, and in front of them the **balcony** and its stair, going down to the ground. All of this comes from a single small photograph: that is why no dimension of it is given as certain.',
      ),
      ORIGIN.reading,
    ),
    parts: ['entrance-recess', 'south-window', 'entrance-balcony'],
  },
  {
    id: 'heating',
    scene: 'room',
    title: l('Le chauffage d’appoint', 'The backup heating'),
    text: withOrigin(
      l(
        'Le chauffage d’appoint : le **tableau** d’où part le courant, le **radiateur**, et le **thermostat** à 1,50 m du sol, réglé à 20 °C : ces chiffres sont ceux de l’article, mais pas le type du chauffage. Reste l’**entrée d’air frais**, que nous dessinons sans rien derrière, sauf dans le « et si » du puits canadien, dont le dernier tronçon finit ici : on ne sait pas comment l’air neuf entrait.',
        'The backup heating: the **panel** from which the current leaves, the **heater**, and the **thermostat** 1.50 m above the floor, set to 20 °C: these figures are the paper’s, but not the type of heating. What remains is the **fresh-air vent**, which we draw with nothing behind it, except in the “what if” earth tube, whose last run ends here: we do not know how the new air came in.',
      ),
      ORIGIN.reportedReading,
    ),
    warning: l(
      'Un tableau et ses circuits sont l’affaire d’un électricien, qui les calcule, les pose et les contrôle selon les règles du lieu.',
      'A panel and its circuits are an electrician’s business, who sizes, fits and checks them according to the rules of the place.',
    ),
    parts: ['electric-panel', 'electric-heater', 'thermostat', 'fresh-air-vent'],
  },
  {
    id: 'wall-instruments',
    scene: 'wall',
    title: l('Les instruments du mur', 'The wall’s instruments'),
    text: withOrigin(
      l(
        'Sept ans après la maison, les instruments de l’article : des **thermocouples** de 0,1 mm dans le béton, à plusieurs profondeurs, avec leurs fils vers la face de la pièce ; des **sondes d’air** sous un écran d’aluminium, que l’article place dans les conduits et que notre dessin, avec trois sondes, pend dans la lame ; un **anémomètre à fil chaud**, au centre du conduit bas, comme dans l’article. Les profondeurs, le nombre et les hauteurs des sondes sont les nôtres.',
        'Seven years after the house, the paper’s instruments: **thermocouples** of 0.1 mm in the concrete, at several depths, with their leads to the room face; **air probes** under an aluminium screen, which the paper places in the ducts and which our drawing, with three probes, hangs in the gap; a **hot-wire anemometer**, at the centre of the lower duct, as in the paper. The depths, the number and the heights of the probes are ours.',
      ),
      ORIGIN.reportedReading,
    ),
    parts: ['wall-thermocouples', 'air-thermocouples', 'hot-wire-anemometer'],
  },
  {
    id: 'room-instruments',
    scene: 'room',
    title: l('Les instruments de la pièce', 'The room’s instruments'),
    text: withOrigin(
      l(
        'Du côté de la pièce : la **sonde d’air**, les **sondes de surface**, et l’**enregistreur** sur son bureau, qui trace jour et nuit. Les mesures de l’article vont de novembre 1974 à octobre 1975, dans une maison habitée. L’appareil, lui, est notre dessin.',
        'On the room side: the **air probe**, the **surface probes**, and the **chart recorder** on its desk, which traces day and night. The paper’s measurements run from November 1974 to October 1975, in a house lived in. The instrument itself is our drawing.',
      ),
      ORIGIN.reportedReading,
    ),
    parts: ['room-air-probe', 'room-surface-probes', 'chart-recorder'],
  },
];
