// Parts of the `wall` world (14): one collector element at one to one, cut open down its middle. This is the heart of the lab, and the part of the house its inventors measured. The element is the printed one (4.38 × 1.27 m, 0.60 m of
// concrete, two sheets of 3 mm, 12 cm of air, ducts of 56.5 × 11 cm); what is not printed (the frame's section, the glazing bars, the gap between the sheets, the instruments' depths, the flap's mechanism) is marked as an estimate.
// No warning is repeated on a sheet: weight, heat behind glass, glass at height are said once, in the guide step where the gesture is risky, and in the Sources.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const WALL_PARTS: PartInfo[] = [
  {
    id: 'outer-glazing',
    scene: 'wall',
    category: 'structure',
    name: l('Vitrage extérieur', 'Outer glazing'),
    short: l(
      'La première vitre que le soleil rencontre : 3 mm de verre qui laissent entrer la lumière et gardent la chaleur dedans.',
      'The first sheet of glass the sun meets: 3 mm that let the light in and keep the heat inside.',
    ),
    description: lf(
      'C’est une vitre de 3 mm dans un cadre d’acier, tournée vers le sud. Le soleil la traverse presque en entier quand il tombe de face. Son travail le plus fin est l’inverse : le mur noir, une fois chaud, rend sa chaleur en rayons que le verre laisse mal repartir. Le modèle calcule les deux vitres l’une après l’autre, avec les reflets de chaque surface. À midi en décembre, elles laissent passer {glassDec} du soleil, en juin {glassJun} (résultat du modèle, avec un verre ordinaire d’indice {glassIndex}, estimation). C’est la moitié du secret de la maison : le verre refuse plus de soleil en été, quand il arrive de biais. Dehors, le vent la refroidit, à {wind} dans le modèle.',
      'It is a sheet of 3 mm glass in a steel frame, facing south. The sun goes through almost whole when it falls head on. Its subtler job is the opposite: once the black wall is hot, it gives its heat back as rays that glass lets out poorly. The model works the two sheets out one after the other, with the reflections of each surface. At the December noon they pass {glassDec} of the sun, in June {glassJun} (model result, with an ordinary glass of index {glassIndex}, estimate). That is half the secret of the house: the glass refuses more sun in summer, when it arrives at a slant. Outside, the wind cools it, at {wind} in the model.',
    ),
    material: l('Verre de 3 mm, deux vitres sur cadre d’acier', '3 mm glass, two sheets on a steel frame'),
    specs: [
      sp('Vitres', 'Sheets', '2'),
      sp('Épaisseur de chaque vitre', 'Thickness of each sheet', '3 mm'),
      sp('Entre les deux vitres', 'Between the two sheets', v('{glassSpacing}')),
      sp('Passe le soleil de midi, décembre', 'Passes the noon sun, December', v('{glassDec}')),
      sp('Passe le soleil de midi, juin', 'Passes the noon sun, June', v('{glassJun}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une vitre fêlée, un joint qui vieillit et laisse l’humidité entrer entre les deux vitres, de la buée qui ne part plus. Et la saleté, plus discrète : elle coupe du soleil, et le modèle n’a pas de poussière.',
        check:
          'Un jour de soleil bas, regardez le verre en biais : les traînées et les taches se voient. De la buée entre deux vitres dit que le joint a lâché.',
        care: 'Se lave de l’extérieur, depuis le sol ou un échafaudage. Les maisons de 1974 ont aussi deux vitres, de 4 mm : le même soin.',
      },
      {
        failure:
          'A cracked sheet, a seal that ages and lets damp in between the two sheets, mist that does not go. And dirt, quieter: it cuts the sun, and the model has no dust.',
        check:
          'On a day of low sun, look along the glass: streaks and stains show. Mist between two sheets says the seal has let go.',
        care: 'Washed from outside, from the ground or a scaffold. The houses of 1974 also have two sheets, of 4 mm: the same care.',
      },
    ),
    tip: l(
      'Dans la Simulation, passez de une à trois vitres (« Une vitre, trois vitres ») : la troisième rapporte moins que la deuxième.',
      'In the Simulation, go from one sheet to three (“One glass, three glasses”): the third brings less than the second.',
    ),
    design: lf(
      'Pourquoi deux vitres ? Avec une seule, le mur ne rend plus que {oneGlass} d’un jour clair de janvier ; avec deux, {twoGlass} ; avec trois, {threeGlass} (résultat du modèle). La troisième renvoie aussi plus de soleil.',
      'Why two sheets? With one, the wall gives back only {oneGlass} of a clear January day; with two, {twoGlass}; with three, {threeGlass} (model result). The third also sends back more sun.',
    ),
  },
  {
    id: 'inner-glazing',
    scene: 'wall',
    category: 'structure',
    name: l('Vitrage intérieur', 'Inner glazing'),
    short: l(
      'La deuxième vitre, la plus proche du mur : elle double la première et garde entre elles une couche d’air immobile.',
      'The second sheet, the nearest to the wall: it doubles the first and keeps a still layer of air between them.',
    ),
    description: lf(
      'C’est la même vitre de 3 mm, posée {glassSpacing} derrière la première (estimation : l’article dit seulement deux vitres). Entre elles, une couche d’air fermée qui isole, comme dans un double vitrage de l’époque. Côté mur, c’est cette vitre que la lame d’air chaude touche : elle se réchauffe par les rayons du mur noir et par l’air qui monte contre elle. Le modèle suit sa température à part, et la fait échanger avec la plaque avec l’émissivité d’un verre ordinaire, {glassEmissivity} (estimation). Dans notre dessin, ses deux faces sont enfermées entre le cadre, l’autre vitre et le mur : on ne peut pas les essuyer.',
      'It is the same 3 mm glass, set {glassSpacing} behind the first (estimate: the paper only says two sheets). Between them, a closed layer of air that insulates, as in the double glazing of the time. On the wall side, this is the sheet the hot air gap touches: it warms from the black wall’s rays and from the air rising against it. The model follows its temperature on its own, and makes it exchange with the plate with the emissivity of an ordinary glass, {glassEmissivity} (estimate). In our drawing both its faces are shut in between the frame, the other sheet and the wall: they cannot be wiped.',
    ),
    material: l('Verre de 3 mm', '3 mm glass'),
    specs: [
      sp('Épaisseur', 'Thickness', '3 mm'),
      sp('Distance à la vitre extérieure', 'Distance to the outer sheet', v('{glassSpacing}')),
      sp('Distance au mur noir', 'Distance to the black wall', '0,12 m'),
      sp('Émissivité du verre', 'Glass emissivity', v('{glassEmissivity}')),
    ],
    maintenance: maint(
      {
        failure:
          'Ses faces ne se nettoient pas : la poussière s’y dépose avec les années, et un joint qui lâche remplit de buée la couche entre les deux vitres. C’est un souci de conception avant d’être un souci de lavage.',
        check:
          'Regardez le vitrage en biais, à contre-jour : la poussière du côté de la lame d’air et la buée entre les vitres se voient.',
        care: 'Une maison de Sète a été transformée pour que ses fenêtres hautes s’ouvrent, afin d’en atteindre l’intérieur. Sinon, on nettoie seulement l’extérieur.',
      },
      {
        failure:
          'Its faces cannot be cleaned: dust settles on them over the years, and a seal that lets go fills the layer between the two sheets with mist. It is a design worry before a washing worry.',
        check:
          'Look along the glazing against the light: dust on the air-gap side and mist between the sheets both show.',
        care: 'A house at Sète was altered so that its high windows would open, to reach the inside. Otherwise only the outside is cleaned.',
      },
    ),
    tip: l(
      'Isolez la vitre intérieure pour voir sa place : à 25 mm derrière la première, et à 12 cm devant le mur noir.',
      'Isolate the inner sheet to see its place: 25 mm behind the first, and 12 cm in front of the black wall.',
    ),
    design: l(
      'Quand on change la lame d’air dans la Simulation, de 5 à 20 cm, le verre reste où il est : c’est la face noire du mur qui recule, et la face intérieure qui entre dans la pièce.',
      'When the air gap is changed in the Simulation, from 5 to 20 cm, the glass stays where it is: it is the black face of the wall that moves back, and the inner face that comes into the room.',
    ),
  },
  {
    id: 'steel-frame',
    scene: 'wall',
    category: 'structure',
    name: l('Cadre acier', 'Steel frame'),
    short: l(
      'Le squelette qui porte les deux vitres : quatre carreaux par colonne, retenus par des équerres sur le béton.',
      'The skeleton that carries the two sheets: four panes to a column, held by angle brackets on the concrete.',
    ),
    description: lf(
      'L’article dit « deux vitres sur un cadre d’acier », rien de plus ; celui de 1974 est en inox, ou en aluminium anodisé. Tout le reste est notre dessin : un profil mince de {frameFace} de face, qui dépasse le verre de {frameProud}, et {framePanes} carreaux par élément, parce qu’une vitre de 3 mm haute de plus de 4 m ne tiendrait pas seule (estimations). Le cadre est tenu par des équerres vissées sur les poutres de béton, en haut et en bas : c’est le béton qui le porte, pas l’air. Ses barreaux prennent un peu de verre : les neuf travées donnent {glassNet} de verre net, contre les 48 m² annoncés. Sa tête fait aussi de l’ombre sur le haut de la plaque : {shadeJune} à midi en juin, {shadeDec} en décembre (résultat du modèle).',
      'The paper says “two sheets on a steel frame”, nothing more; the 1974 one is stainless steel, or anodised aluminium. All the rest is our drawing: a slim section {frameFace} wide on its face, standing {frameProud} proud of the glass, and {framePanes} panes to an element, because a 3 mm sheet over 4 m high would not stand alone (estimates). The frame is held by angle brackets bolted to the concrete beams, top and bottom: the concrete carries it, not the air. Its bars take a little glass: the nine bays give {glassNet} of net glass, against the announced 48 m². Its head also shades the top of the plate: {shadeJune} at noon in June, {shadeDec} in December (model result).',
    ),
    material: l('Acier, avec un joint de caoutchouc', 'Steel, with a rubber gasket'),
    specs: [
      sp('Section de face', 'Section on its face', v('{frameFace}')),
      sp('Saillie sur le verre', 'Proud of the glass', v('{frameProud}')),
      sp('Carreaux par élément', 'Panes to an element', v('{framePanes}')),
      sp('Joint autour de chaque carreau', 'Gasket round each pane', v('{frameGasket}')),
    ],
    maintenance: maint(
      {
        failure:
          'La rouille, d’abord au pied et aux jonctions avec le béton, là où l’eau reste. Les joints durcissent devant un mur noir qui passe les 60 °C. Le verre et l’acier ne se dilatent pas pareil, et c’est le joint qui doit absorber la différence.',
        check:
          'Des traînées brunes sous les barreaux, un joint qui se fend ou se décolle, un carreau qui joue dans son logement.',
        care: 'Repeindre l’acier avant que la rouille ne passe, changer les joints quand ils durcissent. L’inox des maisons de 1974 en demande moins.',
      },
      {
        failure:
          'Rust, first at the foot and at the joints with the concrete, where water stays. Gaskets harden in front of a black wall that passes 60 °C. Glass and steel do not expand alike, and the gasket has to absorb the difference.',
        check: 'Brown streaks under the bars, a gasket that splits or lifts, a pane that rattles in its seat.',
        care: 'Repaint the steel before the rust goes through, replace gaskets when they harden. The stainless steel of the 1974 houses asks for less.',
      },
    ),
    tip: l(
      'Mettez en transparence : les coques de ce monde s’effacent, le cadre reste comme un dessin au trait, et ses équerres s’appuient bien sur le béton.',
      'Switch on X-ray: the shells of this world fade, the frame stays like a line drawing, and its brackets plainly rest on the concrete.',
    ),
    design: l(
      'Une vitre de 3 mm ne se tient pas debout sur plus de 4 m : les barreaux sont une nécessité, pas un style. Notre dessin, barreaux retirés, donne 47,1 m² de verre au lieu de 48 : à 2 % près, l’estimation du cadre tient.',
      'A 3 mm sheet does not stand up over 4 m: the bars are a necessity, not a style. Our drawing, bars taken out, gives 47.1 m² of glass in place of 48: within 2 %, the frame’s estimate holds.',
    ),
  },
  {
    id: 'air-gap',
    scene: 'wall',
    category: 'mechanical',
    name: l('Lame d’air', 'Air gap'),
    short: l(
      'Douze centimètres d’air entre la dernière vitre et le mur noir : c’est là que l’air chaud monte et fait tourner la boucle.',
      'Twelve centimetres of air between the last sheet and the black wall: here the warm air rises and drives the loop.',
    ),
    description: lf(
      'L’air du bas, pris dans la pièce à 17 °C près du sol, se glisse derrière la vitre, touche le mur noir, chauffe et monte. Il ressort par le conduit du haut vers 40 à 43 °C, d’après les enregistrements lus à l’œil. Pas de ventilateur : c’est le tirage thermique, une colonne d’air chaud plus légère que l’air froid à côté d’elle. Le débit enregistré est d’environ 20 L/s par élément, à ± 28 % près selon les auteurs. À cette allure, l’air monte à {gapSpeed} dans la lame et à {ductSpeed} dans le conduit. La plaque est de 30 à 35 K plus chaude que l’air à mi-hauteur, de 40 à 45 K en bas : le modèle trouve {plateAbove} et {plateAboveLow}. Sur les jours clairs, il trouve en revanche {flowRange} à la pointe, presque le double. Il le dit, et ne s’est pas laissé régler.',
      'The air at the bottom, taken from the room at 17 °C near the floor, slips behind the glass, touches the black wall, warms and rises. It leaves by the upper duct at about 40 to 43 °C, according to the recordings read by eye. No fan: it is the thermal draught, a column of warm air lighter than the cold air beside it. The recorded flow is about 20 L/s per element, within ± 28 % according to the authors. At that pace the air rises at {gapSpeed} in the gap and {ductSpeed} in the duct. The plate is 30 to 35 K warmer than the air at mid-height, 40 to 45 K at the bottom: the model finds {plateAbove} and {plateAboveLow}. On clear days, though, it finds {flowRange} at the peak, nearly twice as much. It says so, and was not tuned.',
    ),
    material: l('De l’air, dans une fente de 12 cm', 'Air, in a slot 12 cm deep'),
    specs: [
      sp('Profondeur', 'Depth', '0,12 m'),
      sp('Largeur', 'Width', '1,27 m'),
      sp('Section', 'Section', v('{gapSection}')),
      sp('Conduit, en part de la lame', 'Duct, as a share of the gap', v('{ductsOverGap}')),
      sp('Débit enregistré', 'Recorded flow', l('environ 20 L/s, ± 28 %', 'about 20 L/s, ± 28 %')),
      sp('Débit du modèle, jours clairs', 'Model flow, clear days', v('{flowRange}')),
    ],
    maintenance: maint(
      {
        failure:
          'Elle s’encrasse : poussière, toiles d’insectes, un peu de buée si la maison est humide, et rien n’y entre pour la nettoyer. Elle peut aussi se bloquer par un conduit bouché, en haut ou en bas.',
        check:
          'Une main devant la grille du haut, un jour de soleil : l’air doit en sortir chaud. Sans courant, on cherche ce qui bouche.',
        care: 'On nettoie les conduits et leurs grilles. La lame, elle, reste sous verre.',
      },
      {
        failure:
          'It clogs: dust, insect webs, a little mist if the house is damp, and nothing gets in to clean it. It can also be blocked by a stopped duct, at the top or the bottom.',
        check:
          'A hand in front of the upper grille on a sunny day: the air should come out warm. With no draught, look for what blocks it.',
        care: 'The ducts and their grilles are cleaned. The gap itself stays under glass.',
      },
    ),
    tip: l(
      'Activez Flux : les points d’air montent à leur vraie vitesse, et leur couleur suit la température le long de la boucle. En position d’été, leur chemin change.',
      'Switch on Flows: the dots of air rise at their true speed, and their colour follows the temperature round the loop. In the summer position, their path changes.',
    ),
    design: lf(
      'Le conduit fait {ductsOverGap} de la section de la lame. Un architecte américain, pour l’Europe, citait la règle d’au moins la moitié. Aucune source ne chiffre les pertes du circuit : le modèle prend {lossK}, au milieu de {lossKRange}. De {flowHigh50} à {flowLow19}, la part de la saison ne bouge que de {shareMoves} (résultat du modèle) : ce que l’air n’emporte pas, le mur le garde.',
      'The duct is {ductsOverGap} of the gap’s section. An American architect, for Europe, quoted a rule of at least half. No source gives the loop’s losses: the model takes {lossK}, in the middle of {lossKRange}. From {flowHigh50} to {flowLow19} the season’s share moves only {shareMoves} (model result): what the air does not carry, the wall keeps.',
    ),
  },
  {
    id: 'black-paint',
    scene: 'wall',
    category: 'structure',
    name: l('Peinture noire', 'Black paint'),
    short: l(
      'Une couche d’acrylique noir sur le béton : c’est elle qui transforme la lumière du soleil en chaleur.',
      'A coat of black acrylic on the concrete: it is what turns the light of the sun into heat.',
    ),
    description: lf(
      'Le mur est peint en noir à l’acrylique : c’est tout ce que dit l’article. Il ne donne pas la part du soleil que la peinture garde, et le modèle prend {absorptance} ({absorptanceRange}). À midi en hiver, la plaque monte vers 63 à 66 °C d’après la courbe de décembre 1974, lue à l’œil. L’émissivité de toutes les surfaces est de 0,94 selon l’article : la peinture rend aussi très bien sa chaleur en rayons, et c’est ce qu’elle échange avec la vitre. Le réglage compte peu : de 0,90 à 0,95, la part de la saison bouge de moins de {absorbMove} (résultat du modèle). Le noir n’est pas une idée neuve : dès 1881, le brevet de Morse a une plaque noire derrière du verre.',
      'The wall is painted black with acrylic: that is all the paper says. It does not give the share of the sun the paint keeps, and the model takes {absorptance} ({absorptanceRange}). At noon in winter the plate climbs to about 63 to 66 °C, according to the December 1974 curve read by eye. The emissivity of every surface is 0.94 according to the paper: the paint also gives its heat back as rays very well, and that is what it exchanges with the glass. The setting matters little: from 0.90 to 0.95 the season’s share moves by less than {absorbMove} (model result). Black is not a new idea: as early as 1881, Morse’s patent has a black plate behind glass.',
    ),
    material: l('Peinture acrylique noire', 'Black acrylic paint'),
    specs: [
      sp('Matière', 'Material', l('Acrylique noir', 'Black acrylic')),
      sp('Absorption du soleil', 'Sun absorbed', v('{absorptance}')),
      sp('Émissivité', 'Emissivity', '0,94'),
      sp('Plaque à midi, hiver', 'Plate at noon, winter', l('63 à 66 °C, à l’œil', '63 to 66 °C, by eye')),
      sp('Alarme du modèle', 'Model alarm', v('{paintAlarm}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une peinture qui vit des années à plus de 60 °C derrière du verre vieillit : elle farine, cloque, s’écaille. Elle ne se refait pas sans ouvrir les cadres, et c’est une raison de la choisir avec soin avant de poser le verre.',
        check: 'Cherchez de loin, derrière la vitre, les cloques et les taches claires. La 3D n’en montre aucune.',
        care: 'Rien tant que le verre est fermé. Le jour où l’on ouvre, on refait la peinture avant de refermer.',
      },
      {
        failure:
          'A paint that lives for years above 60 °C behind glass ages: it chalks, blisters, flakes. It cannot be redone without opening the frames, and that is a reason to choose it with care before the glass goes on.',
        check: 'Look from afar, behind the glass, for blisters and pale patches. The 3D shows none.',
        care: 'Nothing while the glass stays shut. The day it is opened, the paint is redone before closing.',
      },
    ),
    tip: lf(
      'Dans la Simulation, fermez les évents un jour clair : le modèle monte la plaque vers {paintHotRange}, au bord de l’alarme de peinture.',
      'In the Simulation, shut the vents on a clear day: the model takes the plate to about {paintHotRange}, on the edge of the paint alarm.',
    ),
    design: l(
      'L’article ne donne que « noir » et « acrylique » : l’absorption du soleil est une estimation, et c’est un des curseurs de la Simulation, avec les autres réglages marqués d’une étoile.',
      'The paper gives only “black” and “acrylic”: the absorption of the sun is an estimate, and one of the Simulation’s sliders, with the other starred settings.',
    ),
  },
  {
    id: 'storage-wall',
    scene: 'wall',
    category: 'structure',
    name: l('Mur de stockage', 'Storage wall'),
    short: l(
      'Soixante centimètres de béton noir : une vague de chaleur y marche à 4 cm par heure, et arrive dans la nuit.',
      'Sixty centimetres of black concrete: a wave of heat walks through it at 4 cm an hour, and arrives in the night.',
    ),
    description: lf(
      'C’est un béton de gravier lourd : 2 200 kg/m³, une conductivité de 1,75 W/m·K, une chaleur massique de 0,22 kcal/kg·K, sur 0,60 m. Avec ces chiffres, le calcul classique donne à la chaleur une vague qui avance de {waveSpeed} ; les auteurs citent 3,7 à 4 cm/h pour la maçonnerie ordinaire. Le soleil de midi traverse donc le mur en {lag60}, et arrive côté pièce vers trois heures du matin, atténué à {damp60} (dérivé). Les auteurs ont mesuré 14 à 16 heures et l’ont jugé trop long. À 0,37 m, 9 à 10 heures, ils l’ont jugé trop court. La pièce n’en sent presque rien : la face intérieure ne bouge que de ± {swing60} dans le modèle, quand l’extérieure en fait ± {swingOuter}. Ce que ce mur garde, c’est de la chaleur : {massT} de béton, {capKwh}.',
      'It is a heavy gravel concrete: 2,200 kg/m³, a conductivity of 1.75 W/m·K, a specific heat of 0.22 kcal/kg·K, 0.60 m thick. With these figures, the classical calculation gives the heat a wave that advances at {waveSpeed}; the authors quote 3.7 to 4 cm/h for ordinary masonry. So the noon sun crosses the wall in {lag60}, and reaches the room side around three in the morning, damped to {damp60} (derived). The authors measured 14 to 16 hours and called it too long. At 0.37 m, 9 to 10 hours, they called it too short. The room hardly feels it: the inner face moves by only ± {swing60} in the model, when the outer one moves ± {swingOuter}. What this wall keeps is heat: {massT} of concrete, {capKwh}.',
    ),
    material: l(
      'Béton de gravier lourd, ρ 2 200 kg/m³, λ 1,75 W/m·K, c 0,22 kcal/kg·K',
      'Heavy gravel concrete, ρ 2,200 kg/m³, λ 1.75 W/m·K, c 0.22 kcal/kg·K',
    ),
    specs: [
      sp('Épaisseur', 'Thickness', '0,60 m'),
      sp('Surface de mur', 'Wall area', '48 m²'),
      sp('Masse', 'Mass', v('{massT}')),
      sp('Chaleur gardée par degré', 'Heat held per degree', v('{capKwh}')),
      sp('Vitesse de la vague', 'Speed of the wave', v('{waveSpeed}')),
      sp('Délai à 60 cm / à 37 cm', 'Lag at 60 cm / at 37 cm', v('{lag60} / {lag37}')),
      sp('Atténuation à 60 cm', 'Damping at 60 cm', v('{damp60}')),
    ],
    maintenance: maint(
      {
        failure:
          'De l’eau. Le béton coulé sur place reste humide des années. Le mur de 1974 a rendu 8 à 10 points de moins que celui de 1967 et son intérieur était plus froid que la théorie : les auteurs y voient l’eau restée dans le béton, qui doit disparaître en un ou deux ans. Le modèle, lui, ne connaît que du béton sec.',
        check:
          'Comparer la face intérieure à ce que donne la théorie, comme l’ont fait les inventeurs : un mur plus froid que prévu dit qu’il n’est pas sec.',
        care: 'Des blocs secs évitent le problème, dit l’article. Ensuite, rien : ce mur ne bouge pas et ne se règle pas.',
      },
      {
        failure:
          'Water. Concrete cast in place stays damp for years. The 1974 wall gave back 8 to 10 points less than the 1967 one and was colder inside than theory: the authors see in it the water left in the concrete, which should go in a year or two. The model only knows dry concrete.',
        check:
          'Compare the inner face with what theory gives, as the inventors did: a wall colder than expected says it is not dry.',
        care: 'Dry blocks avoid the problem, says the paper. After that, nothing: this wall does not move and is not adjusted.',
      },
    ),
    tip: l(
      'Faites glisser l’épaisseur de 15 à 80 cm dans la Simulation : la coupe change avec elle, et l’heure où la vague arrive aussi.',
      'Slide the thickness from 15 to 80 cm in the Simulation: the section changes with it, and so does the hour the wave arrives.',
    ),
    design: lf(
      'Les inventeurs voulaient de 40 à 45 cm : {lag45} à 45 cm, la vague atténuée à {damp45}. Leur autre souhait, un délai d’environ 12 h, demande {thick12} par le calcul classique. Dans le modèle, l’épaisseur décide de l’heure, pas de la quantité : de 15 à 80 cm, la part de la saison reste {thickRange} (résultat du modèle). Après des jours clairs, le soleil éteint, le mur donne {dark1} le premier jour et {dark2} le deuxième, pour une charge de {darkLoad} par jour : dès le troisième, il prend de la chaleur à la pièce (résultat du modèle).',
      'The inventors wanted 40 to 45 cm: {lag45} at 45 cm, the wave damped to {damp45}. Their other wish, a lag of about 12 h, asks for {thick12} by the classical calculation. In the model, thickness decides the hour, not the amount: from 15 to 80 cm the season’s share stays {thickRange} (model result). After clear days, with the sun put out, the wall gives {dark1} the first day and {dark2} the second, against a load of {darkLoad} a day: from the third it takes heat from the room (model result).',
    ),
  },
  {
    id: 'upper-duct',
    scene: 'wall',
    category: 'mechanical',
    name: l('Conduit haut', 'Upper duct'),
    short: l(
      'Un tunnel de 56,5 × 11 cm dans le béton, près du plafond : l’air chaud de la lame passe par là, vers la pièce.',
      'A tunnel 56.5 × 11 cm through the concrete near the ceiling: the warm air from the gap goes through it, into the room.',
    ),
    description: lf(
      'Le conduit traverse les 60 cm de béton tout près du plafond, et mesure 0,565 × 0,110 m, soit 621,5 cm². L’air de la lame y entre par le haut et sort dans la pièce en un jet chaud, vers 40 à 43 °C d’après l’article. À 20 L/s, il y va à {ductSpeed}. Il porte beaucoup : environ {elemWatts} par élément, soit {frontKw} pour toute la façade, en supposant chaque élément pareil. Il se peut qu’en le traversant, l’air chauffe aussi le béton autour de lui, une chaleur qu’un modèle à une seule colonne de mur ne compte pas : c’est l’une des explications possibles de ce que ce modèle ne retrouve pas. Un grillage ou un angle vif ajouteraient des pertes : avec des conduits moitié moins larges, le modèle trouve {flowHalfDuct} et 45 °C, au bord des marges de l’article.',
      'The duct goes through the 60 cm of concrete close to the ceiling, and measures 0.565 × 0.110 m, or 621.5 cm². The air from the gap goes in at the top and comes out into the room in a warm jet, at about 40 to 43 °C according to the paper. At 20 L/s it goes through at {ductSpeed}. It carries a lot: about {elemWatts} per element, or {frontKw} for the whole front, assuming every element alike. It may be that, going through, the air also warms the concrete around it, a heat that a model with a single column of wall does not count: it is one of the possible explanations of what this model does not retrieve. A grille or a sharp edge would add losses: with ducts half as wide, the model finds {flowHalfDuct} and 45 °C, at the edge of the paper’s margins.',
    ),
    material: l(
      'Réservation dans le béton, avec fourreau et grille',
      'Opening cast in the concrete, with a sleeve and a grille',
    ),
    specs: [
      sp('Section', 'Section', '0,565 × 0,110 m (621,5 cm²)'),
      sp('Entre les deux conduits', 'Between the two ducts', '3,50 m'),
      sp('Vitesse à 20 L/s', 'Speed at 20 L/s', v('{ductSpeed}')),
      sp('Chaleur portée, un élément', 'Heat carried, one element', v('{elemWatts}')),
    ],
    maintenance: maint(
      {
        failure:
          'La poussière et les toiles d’araignée, une grille qui se bouche, un nid. Un conduit encrassé tire moins, et l’air n’en sort plus chaud : on prend d’abord cela pour un manque de soleil.',
        check: 'Une main devant la grille un jour clair : de l’air chaud doit en sortir.',
        care: 'Aspirer et brosser la grille et le fourreau à la fin de l’été. Le passage dans les 60 cm de béton ne se nettoie qu’à la longue brosse.',
      },
      {
        failure:
          'Dust and cobwebs, a grille that clogs, a nest. A fouled duct draws less, and the air no longer comes out warm: it is first taken for a lack of sun.',
        check: 'A hand in front of the grille on a clear day: warm air should come out.',
        care: 'Vacuum and brush the grille and the sleeve at the end of summer. The run through the 60 cm of concrete can only be cleaned with a long brush.',
      },
    ),
    tip: l(
      'Activez Flux, puis passez du matin au soir : le jet du haut s’allume avec le soleil, et reste chaud plus de deux heures après lui.',
      'Switch on Flows, then run from morning to evening: the jet at the top lights up with the sun, and stays warm for over two hours after it.',
    ),
    design: lf(
      'Pourquoi deux conduits, et pas un ? Un seul laisserait l’air chaud monter et l’air froid descendre dans le même trou, qui se gêneraient. Avec un bas et un haut, la colonne tourne dans un seul sens, sans ventilateur. Ce conduit fait {ductsOverGap} de la section de la lame.',
      'Why two ducts, and not one? A single hole would let the warm air rise and the cold air fall through the same opening, getting in each other’s way. With a low one and a high one, the column turns one way only, with no fan. This duct is {ductsOverGap} of the gap’s section.',
    ),
  },
  {
    id: 'lower-duct',
    scene: 'wall',
    category: 'mechanical',
    name: l('Conduit bas', 'Lower duct'),
    short: l(
      'Le même tunnel, au ras du sol : il prend l’air frais de la pièce, à 17 °C, et l’envoie derrière la vitre.',
      'The same tunnel, at floor level: it takes the cool air of the room, at 17 °C, and sends it behind the glass.',
    ),
    description: lf(
      'Il a la même section, 0,565 × 0,110 m, à 3,50 m du conduit haut. Sa face inférieure est près du sol : l’article le dit, et le chiffre de {ductAbove} est notre estimation. L’air qu’il prend est celui du plancher, le plus frais de la pièce : 17 °C quand la pièce est à 20 °C, trois degrés de moins. C’est ce contraste qui entretient la boucle. Cet air prend la place de celui qui vient de monter, et la pièce, de son côté, ne sent aucun courant violent : à 20 L/s il passe à {ductSpeed}.',
      'It has the same section, 0.565 × 0.110 m, 3.50 m from the upper duct. Its underside is near the floor: the paper says so, and the figure of {ductAbove} is our estimate. The air it takes is the floor’s, the coolest of the room: 17 °C when the room is at 20 °C, three degrees less. That contrast keeps the loop going. This air takes the place of what has just risen, and the room itself feels no violent draught: at 20 L/s it goes by at {ductSpeed}.',
    ),
    material: l(
      'Réservation dans le béton, avec fourreau et grille',
      'Opening cast in the concrete, with a sleeve and a grille',
    ),
    specs: [
      sp('Section', 'Section', '0,565 × 0,110 m (621,5 cm²)'),
      sp('Air pris au sol', 'Air taken at the floor', '17 °C'),
      sp('Au-dessus du sol', 'Above the floor', v('{ductAbove}')),
    ],
    maintenance: maint(
      {
        failure:
          'C’est le point le plus bas de la pièce : la poussière du sol, les miettes et les poils d’animaux y entrent. Un meuble ou un rideau devant la grille coupe la prise.',
        check:
          'Regardez, du sol, ce qui se trouve devant la grille. Un canapé collé au mur la prive d’air, et la boucle tourne moins bien.',
        care: 'Aspirer la grille et le fourreau avec le sol, et ne rien poser devant.',
      },
      {
        failure:
          'It is the lowest point of the room: floor dust, crumbs and pet hair enter it. A piece of furniture or a curtain in front of the grille cuts the intake.',
        check:
          'Look, from the floor, at what stands in front of the grille. A sofa pushed to the wall starves it of air, and the loop turns less well.',
        care: 'Vacuum the grille and sleeve with the floor, and stand nothing in front.',
      },
    ),
    tip: l(
      'Activez Flux dans ce monde : les points d’air entrent par ce conduit, puis se réchauffent derrière la vitre en montant.',
      'Switch on Flows in this world: the dots of air enter through this duct, then warm up behind the glass as they rise.',
    ),
    design: l(
      'Prendre l’air tout en bas et le rendre tout en haut fait un tour complet de la pièce : l’air le plus frais est repris, l’air le plus chaud arrive sous le plafond. C’est de l’air de la pièce, qui repart dans la pièce.',
      'Taking the air at the very bottom and returning it at the very top makes a full circuit of the room: the coolest air is taken back, the warmest arrives under the ceiling. It is the room’s air, going back into the room.',
    ),
  },
  {
    id: 'summer-flap',
    scene: 'wall',
    category: 'mechanical',
    name: l('Clapet d’été', 'Summer flap'),
    short: l(
      'Une plaque articulée en haut du mur : à plat, l’air rentre dans la pièce ; pendante, il part dehors.',
      'A hinged plate at the top of the wall: flat, the air goes into the room; hanging, it goes outside.',
    ),
    description: lf(
      'L’article dessine, pour l’été, un clapet en haut du capteur. Le brevet de Trombe et Michel, de priorité 1971, décrit lui aussi un mode d’hiver et un mode d’été. En hiver, la plaque est à plat : elle ferme la poche au-dessus du conduit, et l’air chaud entre dans la pièce. En été, elle pend devant le conduit : elle le ferme, et l’air s’échappe par la tête du mur en tirant celui de la pièce. Le modèle trouve alors {summerRange}, contre environ {summerRecorded} sur le débit enregistré en juin, si c’était bien le mode d’été, ce que l’article ne dit pas. Le mécanisme est notre estimation : une plaque sur charnière, une manivelle et un cordon vers un bouton sous le toit. L’article ne dit pas quand les maisons changeaient de position.',
      'The paper draws, for summer, a flap at the top of the collector. Trombe and Michel’s patent, with a priority of 1971, also describes a winter mode and a summer mode. In winter the plate is flat: it closes the pocket above the duct, and the warm air goes into the room. In summer it hangs in front of the duct: it shuts it, and the air escapes at the head of the wall, drawing the room’s with it. The model then finds {summerRange}, against about {summerRecorded} on the flow recorded in June, if that was the summer mode, which the paper does not say. The mechanism is our estimate: a plate on a hinge, a crank and a cord to a knob under the roof. The paper does not say when the houses changed position.',
    ),
    material: l('Plaque d’acier sur charnière, manivelle et cordon', 'A steel plate on a hinge, a crank and a cord'),
    specs: [
      sp('Hiver', 'Winter', l('à plat : l’air rentre dans la pièce', 'flat: the air comes into the room')),
      sp('Été', 'Summer', l('pendant : l’air part dehors', 'hanging: the air goes outside')),
      sp('Air renouvelé en été', 'Air changed in summer', v('{summerRange}')),
      sp('Mécanisme', 'Mechanism', l('estimé', 'estimated')),
    ],
    maintenance: maint(
      {
        failure:
          'Une charnière rouillée, un cordon qui casse ou se coince : le clapet reste dans la mauvaise position. C’est le plus gênant en hiver, avec un mur qui chauffe le dehors, et en été, avec un mur qui chauffe une maison déjà chaude.',
        check:
          'À chaque changement de saison, le cordon doit mener le clapet de bout en bout sans forcer. Essayez-le avant d’en avoir besoin.',
        care: 'Graisser la charnière, regarder le cordon. Deux manœuvres par an, au changement de saison : c’est l’habitude que ce mur demande.',
      },
      {
        failure:
          'A rusted hinge, a cord that breaks or jams: the flap stays in the wrong position. It matters most in winter, with a wall heating the outdoors, and in summer, with a wall heating a house already hot.',
        check:
          'At each change of season the cord should take the flap end to end without force. Try it before you need it.',
        care: 'Grease the hinge, look at the cord. Two moves a year, at the change of season: that is the habit this wall asks for.',
      },
    ),
    tip: l(
      'Lancez « La nuit » dans la Simulation : le courant inverse apparaît, puis passez à un clapet à sens unique, et il s’arrête.',
      'Run “The night” in the Simulation: the reverse flow appears, then switch to a one-way flap, and it stops.',
    ),
    design: lf(
      'Le modèle trouve que l’air de la lame retombe vers la pièce par les nuits claires d’hiver, à {reverseFlow} pendant {reverseHours}, pour un coût de {reverseKwh} par nuit : un clapet à sens unique rapporte {flapPoint} de part. Les enregistrements de 1967 n’en montrent aucun. Un collègue écrit, d’un panneau des bureaux du CNRS, qu’il n’y en a pas la nuit. Un autre constructeur, à Princeton, l’a vécu, et attend d’un clapet qu’il le guérisse. Le modèle garde son résultat et le dit.',
      'The model finds that the gap’s air falls back towards the room on clear winter nights, at {reverseFlow} for {reverseHours}, at a cost of {reverseKwh} a night: a one-way flap brings {flapPoint} of share. The 1967 recordings show none. A colleague writes, of a panel on the CNRS offices, that there is none at night. Another builder, at Princeton, lived with it, and expects a damper to cure it. The model keeps its result and says so.',
    ),
  },
  {
    id: 'head-beam',
    scene: 'wall',
    category: 'structure',
    name: l('Poutre de tête', 'Head beam'),
    short: l(
      'La bande de béton qui ferme le haut du mur : elle tient le haut du cadre et reçoit le pied des chevrons.',
      'The band of concrete that closes the top of the wall: it holds the top of the frame and receives the rafters’ feet.',
    ),
    description: lf(
      'La figure 1 de l’article hachure de la maçonnerie au-dessus et au-dessous des conduits, et la marque de deux lettres dont nous ne connaissons pas le sens : nous lisons une tête et un pied. La tête est la bande qui ferme le haut du mur, au-dessus du conduit haut. Elle tient les équerres du cadre, ferme le haut de la lame d’air et porte le pied du toit. Son sommet est à environ {yEave} au-dessus de la dalle (estimation). Un bandeau court le long de toute la façade, dessiné à {headBand}, en poutre de chaînage et en rive (estimation). Dans le modèle, elle n’a pas de rôle thermique propre : c’est du béton à l’abri, sans nœud à elle.',
      'Figure 1 of the paper hatches masonry above and below the ducts and marks it with two letters whose meaning we do not know: we read them as a head and a foot. The head is the band that closes the top of the wall, above the upper duct. It holds the frame’s brackets, closes the top of the air gap and carries the foot of the roof. Its top is about {yEave} above the slab (estimate). A band runs the whole length of the front, drawn at {headBand}, as a ring beam and a fascia (estimate). In the model it has no thermal role of its own: it is concrete under cover, with no node.',
    ),
    material: l('Béton armé, comme le mur', 'Reinforced concrete, like the wall'),
    specs: [
      sp('Sommet, au-dessus de la dalle', 'Top, above the slab', v('{yEave}')),
      sp('Bandeau le long de la façade', 'Band along the front', v('{headBand}')),
      sp('Dans le modèle', 'In the model', l('aucun nœud thermique à elle', 'no thermal node of its own')),
    ],
    maintenance: maint(
      {
        failure:
          'L’eau : à la jonction du toit, sous le bord de la couverture, c’est le premier endroit mouillé. Une fissure fine, une coulée sale sous le bandeau, du gel dans un joint.',
        check:
          'Après la pluie, regardez sous l’égout et au bord du bandeau : une trace sombre qui ne sèche pas dit un défaut d’étanchéité.',
        care: 'Reprendre le solin et la gouttière avant l’hiver.',
      },
      {
        failure:
          'Water: at the roof’s junction, under the covering’s edge, it is the first place to get wet. A fine crack, a dirty run under the band, frost in a joint.',
        check:
          'After rain, look under the eaves and along the band’s edge: a dark mark that does not dry says a failure of the seal.',
        care: 'Redo the flashing and the gutter before winter.',
      },
    ),
    tip: l(
      'Isolez la poutre de tête : vous voyez la bande de béton seule, et dessous le trou du conduit haut.',
      'Isolate the head beam: you see the concrete band alone, and below it the opening of the upper duct.',
    ),
    design: l(
      'L’article ne dit pas ce que sont ces deux lettres : nous avons lu « tête » et « pied » parce que la maçonnerie hachurée est à ces deux endroits. C’est une lecture, pas une donnée, et la fiche de la poutre d’appui le dit aussi.',
      'The paper does not say what the two letters are: we read “head” and “foot” because the hatched masonry sits in those two places. It is a reading, not a datum, and the sill beam’s sheet says so too.',
    ),
  },
  {
    id: 'sill-beam',
    scene: 'wall',
    category: 'structure',
    name: l('Poutre d’appui', 'Sill beam'),
    short: l(
      'La bande de béton sous le conduit bas : le pied du mur, qui repose sur la fondation et tient le pied du cadre.',
      'The band of concrete under the lower duct: the foot of the wall, resting on the foundation and holding the frame’s foot.',
    ),
    description: lf(
      'C’est l’autre bande hachurée de la figure 1 de l’article, celle du bas, que nous lisons comme un pied. Elle repose sur la fondation : le dessus de la fondation est le pied du cadre. Elle est sous le conduit bas, qui est à {ductAbove} du sol (estimation : l’article dit seulement « près du sol »). Un pied de mur lourd posé sur la terre est un pont possible entre le mur chaud et le sol. L’article n’en dit rien, et le modèle ne le compte pas : le sol n’y a pas de nœud, et le plancher fait partie de l’enveloppe. Dans la 3D, la coupe la colore comme le mur, avec les températures du modèle.',
      'It is the other hatched band of the paper’s figure 1, the one at the bottom, that we read as a foot. It rests on the foundation: the top of the foundation is the frame’s foot. It is under the lower duct, which is {ductAbove} from the floor (estimate: the paper only says “near the floor”). The foot of a heavy wall resting on the earth is a possible bridge between the warm wall and the ground. The paper says nothing of it, and the model does not count it: the ground has no node there, and the floor is part of the envelope. In the 3D, the section colours it like the wall, with the model’s temperatures.',
    ),
    material: l('Béton armé, comme le mur', 'Reinforced concrete, like the wall'),
    specs: [
      sp('Sous le conduit bas', 'Under the lower duct', v('{ductAbove}')),
      sp('Repose sur', 'Rests on', l('la fondation', 'the foundation')),
      sp('Dans le modèle', 'In the model', l('le sol n’a pas de nœud', 'the ground has no node')),
    ],
    maintenance: maint(
      {
        failure:
          'L’humidité du sol et de la neige fondue : c’est le point du mur le plus exposé. Salpêtre, peinture qui cloque, trace sombre au ras du sol.',
        check:
          'Après une fonte de neige, regardez le bas du mur : une ligne sombre sous la grille basse dit que l’eau remonte.',
        care: 'Garder le terrain en pente loin du mur, dégager la rigole, ne rien empiler contre ce pied.',
      },
      {
        failure:
          'Damp from the ground and from melting snow: it is the most exposed point of the wall. Saltpetre, paint that blisters, a dark mark at ground level.',
        check:
          'After snow melts, look at the bottom of the wall: a dark line under the low grille says water is rising.',
        care: 'Keep the sloping ground away from the wall, clear the drain, pile nothing against this foot.',
      },
    ),
    tip: l(
      'Isolez la poutre d’appui : vous voyez le bas du mur seul, avec le trou du conduit bas au-dessus.',
      'Isolate the sill beam: you see the bottom of the wall alone, with the opening of the lower duct above it.',
    ),
    design: l(
      'Le pied d’un mur lourd est une affaire de fondation, et l’article n’en dit rien : on ne sait pas comment il repose sur le sol. Notre dessin le pose sur une fondation qui suit la pente.',
      'The foot of a heavy wall is a foundation matter, and the paper says nothing of it: we do not know how it rests on the ground. Our drawing sets it on a foundation that follows the slope.',
    ),
  },
  {
    id: 'wall-thermocouples',
    scene: 'wall',
    category: 'electrical',
    name: l('Thermocouples du mur', 'Wall thermocouples'),
    short: l(
      'Des fils de cuivre et de constantan de 0,1 mm, noyés dans le béton à plusieurs profondeurs : ils lisent la température du mur.',
      'Wires of copper and constantan 0.1 mm thick, set in the concrete at several depths: they read the wall’s temperature.',
    ),
    description: lf(
      'Un thermocouple, ce sont deux métaux soudés au bout : le contact donne une petite tension qui dépend de la température. Ceux de l’article sont en cuivre-constantan, de 0,1 mm, si fins qu’ils changent à peine ce qu’ils mesurent. La liste de leurs profondeurs n’est pas donnée : notre dessin en pose {thermoCount}, de {thermoFirst} à {thermoLast} depuis la face extérieure (estimation). C’est ainsi qu’on suit la vague de chaleur de la peinture jusqu’à la pièce. Dans la 3D, les perles sont dans le plan de la coupe, et leurs fils courent jusqu’à la face de la pièce, dans la boîte de jonction.',
      'A thermocouple is two metals welded at the tip: the contact gives a small voltage that depends on the temperature. The paper’s are copper-constantan, 0.1 mm thick, so fine they hardly change what they measure. The list of their depths is not given: our drawing sets {thermoCount}, from {thermoFirst} to {thermoLast} from the outer face (estimate). That is how the wave of heat is followed from the paint to the room. In the 3D the beads lie in the plane of the section, and their leads run to the room face, into the junction box.',
    ),
    material: l('Fil cuivre-constantan de 0,1 mm', 'Copper-constantan wire, 0.1 mm'),
    specs: [
      sp('Fil', 'Wire', l('cuivre-constantan, 0,1 mm', 'copper-constantan, 0.1 mm')),
      sp('Perles dessinées', 'Beads drawn', v('{thermoCount}')),
      sp('Profondeurs dessinées', 'Depths drawn', v('{thermoDepths}')),
    ],
    maintenance: maint(
      {
        failure:
          'Coulée dans le béton, une perle qui casse y reste pour toujours : on ne peut ni la remplacer ni la réparer. Un fil qui touche un béton humide peut aussi donner une lecture fausse.',
        check:
          'Comparer les perles entre elles : la température doit descendre régulièrement de la peinture à la face de la pièce. Une perle qui sort du rang a un défaut.',
        care: 'Aucun : on en coule plusieurs et on s’en sert tant qu’elles marchent. L’étalonnage se fait avant de couler.',
      },
      {
        failure:
          'Cast in the concrete, a bead that breaks stays there forever: it can neither be replaced nor repaired. A wire that touches damp concrete can also give a false reading.',
        check:
          'Compare the beads with each other: the temperature should fall steadily from the paint to the room face. A bead that stands out has a fault.',
        care: 'None: several are cast, and used as long as they work. Calibration is done before casting.',
      },
    ),
    tip: l(
      'Ce monde est toujours coupé : les perles se voient au cœur du béton, et leurs fils courent vers la boîte de jonction.',
      'This world is always cut: the beads show in the heart of the concrete, and their leads run to the junction box.',
    ),
    design: lf(
      'Six perles sur 60 cm ne disent pas la vague : elles la suivent. À 45 cm, elle arrive en {lag45} dans le calcul classique, et on la voit passer de perle en perle.',
      'Six beads over 60 cm do not tell the wave: they follow it. At 45 cm it arrives in {lag45} in the classical calculation, and you can see it pass from bead to bead.',
    ),
  },
  {
    id: 'air-thermocouples',
    scene: 'wall',
    category: 'electrical',
    name: l('Thermocouples d’air', 'Air thermocouples'),
    short: l(
      'Trois sondes qui pendent dans la lame d’air, sous un écran d’aluminium : elles lisent l’air, pas le mur.',
      'Three probes that hang in the air gap, under an aluminium screen: they read the air, not the wall.',
    ),
    description: lf(
      'Mesurer l’air devant un mur à 60 °C est délicat : le fil reçoit les rayons du mur et du soleil, et finit par lire sa propre chaleur. Les chercheurs ont donc mis leurs thermocouples sous des écrans d’aluminium, qui renvoient les rayons. Dans notre dessin, trois sondes pendent de la poutre de tête, au milieu de la lame, aux {airFractions} de la portée entre les conduits (estimation). Elles répondent aux trois lectures de l’air dans le modèle : l’entrée, le milieu, la sortie. L’air entre à 17 °C et sort, selon les enregistrements, vers 40 à 43 °C. Le modèle trouve environ {airOutModel} à la sortie sur les mêmes jours, avec plus de débit.',
      'Measuring the air in front of a wall at 60 °C is delicate: the wire catches rays from the wall and the sun, and ends up reading its own heat. The researchers therefore put their thermocouples under aluminium screens, which send the rays back. In our drawing, three probes hang from the head beam, in the middle of the gap, at {airFractions} of the span between the ducts (estimate). They answer the model’s three readings of the air: the inlet, the middle, the outlet. The air enters at 17 °C and leaves, according to the recordings, at about 40 to 43 °C. The model finds about {airOutModel} at the outlet on the same days, with more flow.',
    ),
    material: l('Thermocouples sous écran d’aluminium', 'Thermocouples under an aluminium screen'),
    specs: [
      sp('Sondes dessinées', 'Probes drawn', '3'),
      sp('Hauteurs, en part de la portée', 'Heights, as a share of the span', v('{airFractions}')),
      sp('Air à l’entrée', 'Air at the inlet', '17 °C'),
      sp('Air à la sortie, enregistré', 'Air at the outlet, recorded', l('40 à 43 °C, à l’œil', '40 to 43 °C, by eye')),
    ],
    maintenance: maint(
      {
        failure:
          'L’écran se salit ou se bosse et ne renvoie plus les rayons : la sonde lit trop chaud. Une sonde qui touche la vitre ou le mur lit la surface, pas l’air.',
        check:
          'Comparer les trois sondes : de bas en haut, l’air doit chauffer régulièrement. Une lecture qui saute, ou qui colle à la plaque, dit un fil touché.',
        care: 'Les garder au milieu de la lame, loin des deux parois, et nettoyer l’écran en même temps que la vitre, quand elle s’ouvre.',
      },
      {
        failure:
          'The screen gets dirty or dented and no longer sends the rays back: the probe reads too hot. A probe that touches the glass or the wall reads the surface, not the air.',
        check:
          'Compare the three probes: from bottom to top the air should warm steadily. A reading that jumps, or clings to the plate, says a wire has been touched.',
        care: 'Keep them in the middle of the gap, far from both faces, and clean the screen along with the glass, when it opens.',
      },
    ),
    tip: l(
      'Isolez les sondes d’air : vous les voyez pendre dans le vide de la lame, loin des parois.',
      'Isolate the air probes: you see them hang in the empty gap, well away from both faces.',
    ),
    design: l(
      'Un écran d’aluminium est le geste classique pour lire un air chauffé par des rayons. L’article le dit, mais ne donne ni les hauteurs ni le nombre des sondes : ces trois-là sont les nôtres.',
      'An aluminium screen is the classic way to read air warmed by rays. The paper says so, but gives neither the heights nor the number of probes: these three are ours.',
    ),
  },
  {
    id: 'hot-wire-anemometer',
    scene: 'wall',
    category: 'electrical',
    name: l('Anémomètre à fil chaud', 'Hot-wire anemometer'),
    short: l(
      'Un fil chauffé dans le conduit : plus l’air va vite, plus il refroidit le fil. Il a mesuré les 20 L/s de l’article.',
      'A heated wire in the duct: the faster the air, the more it cools the wire. It measured the paper’s 20 L/s.',
    ),
    description: lf(
      'Un fil fin est chauffé par un courant. L’air qui passe le refroidit, et ce qu’il faut de courant pour le garder chaud donne la vitesse. L’appareil de l’article lit de −60 à +60 cm/s : il pourrait donc voir un courant inversé, et ses enregistrements n’en montrent aucun. Dans notre dessin, sa pointe est au centre du conduit haut, où l’air va plus vite que la moyenne. Pour 20 L/s dans 621,5 cm², la moyenne est de {ductSpeed} ; au centre, avec un profil pointu, de {centreRange} (estimation). C’est tout près de la limite de l’appareil. Les courbes des deux collecteurs restent plates au même débit : c’est un soupçon, rien de plus, mais ces 20 L/s pourraient être le plafond de l’instrument.',
      'A fine wire is heated by a current. The air that passes cools it, and the current it takes to keep it warm gives the speed. The paper’s instrument reads from −60 to +60 cm/s: it could therefore see a reversed flow, and its recordings show none. In our drawing its tip is at the centre of the upper duct, where the air goes faster than the average. For 20 L/s in 621.5 cm² the average is {ductSpeed}; at the centre, with a peaked profile, {centreRange} (estimate). That is very near the instrument’s limit. The curves of the two collectors stay flat at the same flow: it is a suspicion, nothing more, but these 20 L/s could be the instrument’s ceiling.',
    ),
    material: l('Fil chaud, avec son boîtier', 'Hot wire, with its housing'),
    specs: [
      sp('Plage', 'Range', l('−60 à +60 cm/s', '−60 to +60 cm/s')),
      sp('Vitesse moyenne à 20 L/s', 'Mean speed at 20 L/s', v('{ductSpeed}')),
      sp('Vitesse au centre, estimée', 'Speed at the centre, estimated', v('{centreRange}')),
      sp('Incertitude du débit', 'Flow uncertainty', '± 28 %'),
    ],
    maintenance: maint(
      {
        failure:
          'Un fil chaud est fragile et se salit : la poussière change son échange avec l’air, et la lecture dérive sans que rien ne se voie. Les fils cassent. Et la lecture n’est vraie qu’au point où il pend.',
        check:
          'L’étalonner contre un débit connu, avant et après les mesures. Une dérive entre les deux dit que le fil s’est encrassé.',
        care: 'Le garder propre, au milieu du conduit, loin des autres fils.',
      },
      {
        failure:
          'A hot wire is fragile and gets dirty: dust changes its exchange with the air, and the reading drifts with nothing to see. Wires break. And the reading is only true at the point where it hangs.',
        check:
          'Calibrate it against a known flow, before and after the measurements. A drift between the two says the wire got fouled.',
        care: 'Keep it clean, in the middle of the duct, clear of other wires.',
      },
    ),
    tip: l(
      'Isolez l’anémomètre : sa sonde entre par la grille du conduit haut, et son câble rejoint la boîte de jonction.',
      'Isolate the anemometer: its probe enters through the upper duct’s grille, and its cable runs to the junction box.',
    ),
    design: l(
      'Les auteurs donnent ± 28 % et blâment la turbulence. Le modèle trouve environ deux fois leur débit et ne s’aligne pas. Un plafond de l’appareil pourrait expliquer l’écart, mais le conduit de 1974, plus grand, plafonne au même débit, ce qui joue contre.',
      'The authors give ± 28 % and blame turbulence. The model finds about twice their flow and does not line up. A ceiling of the instrument could explain the gap, but the larger duct of 1974 tops out at the same flow, which argues against it.',
    ),
  },
];
