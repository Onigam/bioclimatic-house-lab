// Parts of the `house` world (18, three of them the earth tube's what-if): the house on a block of its land, cut through the middle of the sample collector bay. The sources give the element, the thermostat, the volume and the area, and one
// small photograph; the rest of the house (the frame of the south front, the rooms, the roof's build-up, the chimney, the foundation's steps, the entrance and the balcony) is our drawing, and each sheet says what it is. The weight, the
// glass and the mains are said once, in the guide step where the gesture is risky; that the earth tube is a what-if is said once, in the overview of this world, and on the pipe's sheet.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const HOUSE_PARTS: PartInfo[] = [
  {
    id: 'south-facade',
    scene: 'house',
    category: 'structure',
    name: l('Façade sud', 'South front'),
    short: l(
      'Douze travées de 1,27 m face au midi : neuf de capteur, une de fenêtre, deux d’entrée en retrait.',
      'Twelve bays of 1.27 m facing the midday: nine of collector, one of window, two of recessed entrance.',
    ),
    description: lf(
      'La façade sud fait douze travées de 1,27 m, soit {facadeLen} : neuf de capteur, une de fenêtre, deux d’entrée en retrait. Cette répartition est lue sur une petite photographie de l’article : c’est une estimation. Les neuf travées donnent {glassNet} de verre net, barreaux retirés, contre les 48 m² annoncés. Tout se joue sur cette façade. À midi, le soleil la frappe à {sunDec} de sa perpendiculaire en décembre, à {sunJun} en juin ; l’article dit « plus de 70° » au solstice d’été. D’où un résultat qui surprend : d’après un service de données satellite, le mur reçoit {janJun} plus de soleil en janvier qu’en juin (129,6 kWh/m² contre 78,7), quand un toit plat en reçoit presque {roofRatio} plus en juin qu’en janvier.',
      'The south front is twelve bays of 1.27 m, or {facadeLen}: nine of collector, one of window, two of recessed entrance. This layout is read from one small photograph in the paper: it is an estimate. The nine bays give {glassNet} of net glass, bars taken out, against the announced 48 m². Everything is decided on this front. At noon the sun strikes it at {sunDec} from its perpendicular in December, at {sunJun} in June; the paper says “over 70°” at the summer solstice. Hence a surprising result: according to a satellite data service, the wall receives {janJun} more sun in January than in June (129.6 kWh/m² against 78.7), when a flat roof receives almost {roofRatio} more in June than in January.',
    ),
    material: l('Béton, acier et verre', 'Concrete, steel and glass'),
    specs: [
      sp('Travées', 'Bays', v('{bays}')),
      sp('Longueur dessinée', 'Length drawn', v('{facadeLen}')),
      sp('Travées de capteur', 'Collector bays', v('{collectorBays}')),
      sp('Verre net', 'Net glass', v('{glassNet}')),
      sp('Capteur annoncé', 'Collector announced', '48 m²'),
      sp('Soleil de midi, décembre / juin', 'Noon sun, December / June', v('{sunDec} / {sunJun}')),
    ],
    maintenance: maint(
      {
        failure:
          'Les joints et les cadres vieillissent d’abord là où le soleil et le gel frappent le plus, sous le bord du toit. De la neige qui glisse du toit peut aussi frapper le verre, sur une façade sud sous un toit incliné.',
        check: 'Une marche au pied de la façade chaque printemps : joints, cadres, grilles, gouttière.',
        care: 'On lave d’en bas, avec une perche, ou depuis un échafaudage ; la gouttière et les descentes se dégagent avant l’hiver.',
      },
      {
        failure:
          'Gaskets and frames age first where the sun and the frost strike hardest, under the roof’s edge. Snow sliding off the roof can also hit the glass, on a south front under a sloping roof.',
        check: 'A walk along the foot of the front each spring: gaskets, frames, grilles, gutter.',
        care: 'It is washed from below, with a pole, or from a scaffold; the gutter and downpipes are cleared before winter.',
      },
    ),
    tip: l(
      'Activez la Coupe : la moitié est de la maison s’en va, et la façade se montre en coupe, le mur coloré par les températures du modèle.',
      'Switch on Section: the east half of the house goes away, and the front shows in section, the wall coloured by the model’s temperatures.',
    ),
    design: l(
      'Lire une répartition sur une photographie est un exercice d’humilité : l’article chiffre 48 m² de capteur, la photographie montre huit ou neuf travées de capteur et trois pour la porte et la fenêtre, et le dessin choisit neuf.',
      'Reading a layout off a photograph is an exercise in humility: the paper gives 48 m² of collector, the photograph shows eight or nine collector bays and three for the door and the window, and the drawing chooses nine.',
    ),
  },
  {
    id: 'collector-element',
    scene: 'house',
    category: 'structure',
    name: l('Élément de captage', 'Collector element'),
    short: l(
      'Une travée du mur : 4,38 × 1,27 m, deux vitres, 12 cm d’air, 60 cm de béton noir, deux conduits. Le modèle n’en calcule qu’un.',
      'One bay of the wall: 4.38 × 1.27 m, two sheets, 12 cm of air, 60 cm of black concrete, two ducts. The model works out only one.',
    ),
    description: lf(
      'Un élément fait 4,38 m de haut sur 1,27 m de large, soit {elemArea}. Il contient, dans l’ordre où le soleil le rencontre : le cadre d’acier, deux vitres, 12 cm d’air, le mur noir de 60 cm, un conduit au sol et un conduit sous le plafond. Pour retrouver les 48 m² de l’article, il en faut {elemCount} : huit ou neuf, et nous en dessinons neuf. Le modèle calcule un seul élément et le multiplie, sans effet de bord. Sur les 20 jours du tableau de l’article, il rend {eff20} de l’énergie reçue, quand l’article donne 36,7 %. La surface d’échange entre le mur et l’air est de 4,50 m² dans l’article ; le calcul, largeur par portée entre conduits, en trouve {exchangeCalc}.',
      'An element is 4.38 m high by 1.27 m wide, or {elemArea}. It holds, in the order the sun meets them: the steel frame, two sheets of glass, 12 cm of air, the black wall of 60 cm, a duct at the floor and a duct under the ceiling. To make the paper’s 48 m², {elemCount} are needed: eight or nine, and we draw nine. The model works out a single element and multiplies it, with no edge effect. Over the 20 days of the paper’s table, it gives back {eff20} of the energy received, when the paper gives 36.7 %. The exchange area between wall and air is 4.50 m² in the paper; the calculation, width times span between ducts, finds {exchangeCalc}.',
    ),
    material: l('Béton noir, verre et acier', 'Black concrete, glass and steel'),
    specs: [
      sp('Hauteur × largeur', 'Height × width', '4,38 × 1,27 m'),
      sp('Surface', 'Area', v('{elemArea}')),
      sp('Éléments pour 48 m²', 'Elements for 48 m²', v('{elemCount}')),
      sp('Épaisseur du mur', 'Wall thickness', '0,60 m'),
      sp('Lame d’air', 'Air gap', '0,12 m'),
      sp('Vitres', 'Sheets', l('2 de 3 mm', '2 of 3 mm')),
      sp('Conduits', 'Ducts', '0,565 × 0,110 m'),
    ],
    maintenance: maint(
      {
        failure:
          'Ce qui lâche d’abord est le plus petit : un joint, le cordon du clapet, une grille bouchée. Le mur, lui, ne casse pas.',
        check: 'Un jour de soleil bas, la grille haute souffle chaud : c’est le test le plus court de tout le mur.',
        care: 'Deux manœuvres de clapet par an, un lavage du verre, un coup d’aspirateur aux grilles. Le détail est sur la fiche de chaque pièce du mur.',
      },
      {
        failure:
          'What gives way first is the smallest: a gasket, the flap’s cord, a clogged grille. The wall itself does not break.',
        check: 'On a day of low sun, the upper grille blows warm: it is the shortest test of the whole wall.',
        care: 'Two flap moves a year, one wash of the glass, a pass of the vacuum on the grilles. The detail is on the sheet of each part of the wall.',
      },
    ),
    tip: l(
      'Ouvrez le monde du mur avec le bouton de cette fiche : le même élément, à l’échelle un, coupé en deux dans sa hauteur.',
      'Open the wall world with the button on this sheet: the same element, at full scale, cut open down its middle.',
    ),
    design: l(
      'Un élément est l’unité de tout : du dessin, du calcul, et de l’article. Le monde du mur, la pièce, le plateau et la maison le bâtissent par la même fonction, aux mêmes dimensions : ce qu’on voit ici est exactement ce qu’on voit là-bas.',
      'An element is the unit of everything: of the drawing, the calculation and the paper. The wall world, the room, the plateau and the house build it with the same function, at the same dimensions: what you see here is exactly what you see there.',
    ),
  },
  {
    id: 'entrance-recess',
    scene: 'house',
    category: 'structure',
    name: l('Entrée en retrait', 'Entrance recess'),
    short: l(
      'Deux travées creusées au milieu de la façade : une porte vitrée, au fond d’un retrait, là où le capteur s’arrête.',
      'Two bays hollowed out of the middle of the front: a glazed door, at the back of a recess, where the collector stops.',
    ),
    description: lf(
      'À la place de deux travées de capteur, la façade est creusée d’un retrait : on y entre par une porte vitrée de {doorBox}, sous une imposte (estimation, d’après une petite photographie). Le fond du retrait est dans le plan de la face intérieure du mur. Avec la fenêtre voisine, ce sont trois travées de verre non noir : le modèle les prend ensemble comme {windowsM2} de baies au sud (estimation), et leur fait laisser entrer le soleil directement dans la pièce. Un double vitrage de l’époque perd environ {windowU} (estimation), un vitrage simple près de {singleU}.',
      'In place of two collector bays, the front is hollowed out into a recess: you enter by a glazed door of {doorBox}, under a transom (estimate, from one small photograph). The back of the recess lies in the plane of the wall’s inner face. With the neighbouring window, these are three bays of glass that is not black: the model takes them together as {windowsM2} of south openings (estimate), and has them let the sun straight into the room. A double glazing of the time loses about {windowU} (estimate), a single glazing close to {singleU}.',
    ),
    material: l('Porte vitrée sur cadre d’acier, dessin générique', 'Glazed door on a steel frame, a generic drawing'),
    specs: [
      sp('Porte, dessinée', 'Door, drawn', v('{doorBox}')),
      sp('Baies au sud, avec la fenêtre', 'South openings, with the window', v('{windowsM2}')),
      sp('Double vitrage, perte', 'Double glazing, loss', v('{windowU}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une porte vitrée au sud et au gel : le joint du bas, la serrure qui gèle, la neige qui s’entasse devant. C’est l’entrée de la maison, et le point le plus usé.',
        check:
          'À la fin de l’hiver, regardez le bas de la porte et le seuil : un filet de lumière sous la porte est une fuite.',
        care: 'Remplacer les joints, graisser la serrure, dégager la neige du seuil.',
      },
      {
        failure:
          'A glazed door on the south and in frost: the bottom seal, the lock that freezes, snow that packs in front. It is the house’s entrance, and its most worn point.',
        check:
          'At the end of winter, look at the bottom of the door and the threshold: a strip of daylight under the door is a leak.',
        care: 'Replace the seals, grease the lock, clear the snow from the threshold.',
      },
    ),
    tip: l(
      'Mettez en transparence : la façade s’efface, et l’on voit la porte et ses vitres dans le plan de la face intérieure du mur.',
      'Switch on X-ray: the front fades, and you see the door and its glass in the plane of the wall’s inner face.',
    ),
    design: l(
      'Le retrait n’est pas dans le texte de l’article : il vient d’une seule photographie, où l’on devine deux travées creusées et un balcon. C’est pourquoi nous ne donnons aucune cote exacte, et pourquoi le dessin est marqué d’une étoile.',
      'The recess is not in the paper’s text: it comes from a single photograph, where one can make out two hollowed bays and a balcony. That is why we give no exact dimension, and why the drawing is starred.',
    ),
  },
  {
    id: 'entrance-balcony',
    scene: 'house',
    category: 'structure',
    name: l('Balcon d’entrée', 'Entrance balcony'),
    short: l(
      'Le plancher prolongé devant la porte, avec sa rampe et son escalier jusqu’au terrain, qui tombe plus bas au sud.',
      'The floor carried out in front of the door, with its rail and its stair down to the ground, which falls away to the south.',
    ),
    description: lf(
      'Le terrain tombe vers le sud, de {groundFall} sur l’emprise de la maison (estimation), et la dalle est de niveau : devant la façade, le plancher est donc à plus de 2 m au-dessus du sol. Le balcon est la dalle prolongée de {balconyDepth} sur {balconyWidth}, avec une rampe de {balconyRail} (estimation, d’après la rampe de la photographie). Un escalier de {stairWidth} de large en descend : des marches de {riser} de haut et de {tread} de giron, une quinzaine, jusqu’au sol. Dans le dessin, la dernière marche est à une hauteur de marche du terrain, et deux limons la portent. Le modèle ne lui compte pas d’ombre : il n’a pour ombre que la tête du cadre.',
      'The ground falls to the south, by {groundFall} over the house’s footprint (estimate), and the slab is level: in front of the front, the floor is therefore more than 2 m above the ground. The balcony is the slab carried out {balconyDepth} over {balconyWidth}, with a rail {balconyRail} high (estimate, from the photograph’s rail). A stair {stairWidth} wide goes down from it: steps {riser} high and {tread} deep, about fifteen of them, to the ground. In the drawing the last step is within a riser’s height of the ground, and two stringers carry it. The model counts no shade for it: its only shade is the head of the frame.',
    ),
    material: l('Dalle de béton, rampe d’acier, dessin générique', 'Concrete slab, steel rail, a generic drawing'),
    specs: [
      sp('Profondeur, largeur', 'Depth, width', v('{balconyDepth} × {balconyWidth}')),
      sp('Rampe', 'Rail', v('{balconyRail}')),
      sp('Escalier, largeur', 'Stair, width', v('{stairWidth}')),
      sp('Marche, hauteur et giron', 'Step, riser and tread', v('{riser}, {tread}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une dalle à l’air libre se fissure au gel, la rampe rouille à ses scellements, et un escalier de béton verglace. Une dalle qui sort de la maison est aussi un pont froid classique : le modèle n’en compte pas.',
        check:
          'Après l’hiver, regardez les scellements de la rampe et le dessous de la dalle : de la rouille, ou une fissure qui s’ouvre.',
        care: 'Dégager la neige et le verglas, repeindre la rampe avant que la rouille ne passe.',
      },
      {
        failure:
          'A slab in the open cracks in frost, the rail rusts at its fixings, and a concrete stair ices over. A slab that goes out of the house is also a classic cold bridge: the model counts none.',
        check:
          'After the winter, look at the rail’s fixings and the underside of the slab: rust, or a crack that is opening.',
        care: 'Clear the snow and the ice, repaint the rail before the rust goes through.',
      },
    ),
    tip: l(
      'Gardez la Coupe active : le balcon reste, juste à l’ouest du plan de coupe, et l’on voit comment la dalle de la maison continue dehors.',
      'Keep Section on: the balcony stays, just west of the cutting plane, and you see how the house’s slab carries on outside.',
    ),
    design: l(
      'Le balcon ne vient que d’une rampe qu’on devine sur la photographie. Tout le reste, la largeur, l’escalier, le nombre de marches, est notre dessin, fait pour que rien ne reste en l’air : la dernière marche touche presque le sol.',
      'The balcony comes only from a rail glimpsed on the photograph. All the rest, the width, the stair, the number of steps, is our drawing, made so that nothing hangs in the air: the last step all but touches the ground.',
    ),
  },
  {
    id: 'south-window',
    scene: 'house',
    category: 'structure',
    name: l('Fenêtre sud', 'South window'),
    short: l(
      'Une travée de verre clair, haute, à côté du capteur : elle laisse entrer le soleil droit dans la pièce, et laisse sortir la chaleur.',
      'A tall bay of clear glass beside the collector: it lets the sun straight into the room, and lets the heat out.',
    ),
    description: lf(
      'Une fenêtre haute, de {windowBox} avec son appui à {windowSill}, ouvre le mur près de l’entrée (estimation, d’après la photographie). Le modèle compte {windowsM2} de baies au sud avec l’entrée voisine, soit trois travées de 5,56 m² (estimation : personne ne publie l’aire). Le soleil qui y entre chauffe le sol et les cloisons ; la nuit, le verre perd {windowU}. Le résultat est un équilibre : sans aucune baie, la part de la saison est {win0} ; avec {windowsM2}, {shareAll} ; avec 30 m², {win30}. Une fenêtre gagne le jour et perd la nuit. L’article nomme des écrans isolants de nuit, sans rien dire de plus : avec un écran de {nightScreen} devant tout le verre, celui du mur compris, le modèle donne {nightScreenShare}.',
      'A tall window, {windowBox} with its sill at {windowSill}, opens the wall near the entrance (estimate, from the photograph). The model counts {windowsM2} of south openings with the neighbouring entrance, that is three bays of 5.56 m² (estimate: nobody publishes the area). The sun that comes in warms the floor and the partitions; at night the glass loses {windowU}. The result is a balance: with no opening at all the season’s share is {win0}; with {windowsM2}, {shareAll}; with 30 m², {win30}. A window gains by day and loses by night. The paper names insulating night screens, and says nothing more: with a screen of {nightScreen} in front of all the glass, the wall’s included, the model gives {nightScreenShare}.',
    ),
    material: l('Double vitrage sur cadre d’acier', 'Double glazing on a steel frame'),
    specs: [
      sp('Fenêtre dessinée', 'Window drawn', v('{windowBox}')),
      sp('Appui, au-dessus du sol', 'Sill, above the floor', v('{windowSill}')),
      sp('Baies au sud, modèle', 'South openings, model', v('{windowsM2}')),
      sp('Perte du double vitrage', 'Double glazing’s loss', v('{windowU}')),
      sp(
        'Part sans baie / telle que dessinée / 30 m²',
        'Share with none / as drawn / 30 m²',
        v('{win0} / {shareAll} / {win30}'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'De la buée entre les vitres d’un double vitrage qui a perdu son joint, une ferrure qui force, une vitre haute que personne n’ose nettoyer. Sans volet ni rideau, une fenêtre perd beaucoup la nuit.',
        check: 'Une main contre la vitre un soir de gel : un verre très froid dit qu’on perd là sa chaleur.',
        care: 'Fermer les volets ou les rideaux au coucher du soleil, et les ouvrir au premier rayon.',
      },
      {
        failure:
          'Mist between the sheets of a double glazing that has lost its seal, a fitting that binds, a high pane no one dares clean. Without shutter or curtain, a window loses a great deal at night.',
        check: 'A hand against the glass on a frosty evening: a very cold glass says heat is being lost there.',
        care: 'Close the shutters or curtains at sunset, and open them at the first ray.',
      },
    ),
    tip: lf(
      'Dans la Simulation, faites glisser « Fenêtres au sud » de 0 à 30 m² : la part de la saison monte puis redescend, {win0}, {shareAll}, {win30}.',
      'In the Simulation, slide “South windows” from 0 to 30 m²: the season’s share rises and then falls, {win0}, {shareAll}, {win30}.',
    ),
    design: lf(
      'Les fenêtres et les gens tiennent ensemble {windowCarry} de la part de {shareAll}. L’article donne un capteur de 48 m², et pas un mètre carré de fenêtre : c’est la plus grosse inconnue de la question du chauffage, et elle porte l’écart entre {shareWall} et {shareAll}.',
      'The windows and the people together hold {windowCarry} of the {shareAll} share. The paper gives a 48 m² collector, and not one square metre of window: it is the biggest unknown of the heating question, and it carries the gap between {shareWall} and {shareAll}.',
    ),
  },
  {
    id: 'east-gable',
    scene: 'house',
    category: 'structure',
    name: l('Pignon est', 'East gable'),
    short: l(
      'Le mur du bout, à l’est : un triangle jusqu’au faîtage, sur une fondation en gradins. La Coupe l’emporte avec la moitié est.',
      'The end wall, to the east: a triangle up to the ridge, on a stepped foundation. Section takes it away with the east half.',
    ),
    description: lf(
      'Les murs autres que le sud ne sont décrits nulle part. Nous dessinons un mur de {wallT} d’épaisseur, enduit, qui monte en triangle jusqu’au faîtage, à {ridge} au-dessus de la dalle (estimations). Il repose sur une fondation en gradins qui suit le terrain à 5 cm près. Pour la maison, ce mur est une perte parmi d’autres, comprise dans le chiffre de toute l’enveloppe, {gv}. De ce côté, le soleil du matin se lève derrière une crête plus haute que celle du soir : d’après un modèle de terrain, 5,7° au sud-est, contre 1,1° au sud-ouest.',
      'The walls other than the south one are described nowhere. We draw a wall {wallT} thick, rendered, rising in a triangle to the ridge, {ridge} above the slab (estimates). It stands on a stepped foundation that follows the ground to within 5 cm. For the house, this wall is one loss among others, included in the figure for the whole envelope, {gv}. On this side the morning sun rises behind a higher ridge than the evening’s: according to a terrain model, 5.7° to the south-east, against 1.1° to the south-west.',
    ),
    material: l('Maçonnerie enduite, dessin générique', 'Rendered masonry, a generic drawing'),
    specs: [
      sp('Épaisseur dessinée', 'Thickness drawn', v('{wallT}')),
      sp('Faîtage, au-dessus de la dalle', 'Ridge, above the slab', v('{ridge}')),
      sp('Gradins de la fondation', 'Foundation steps', v('{gableSteps}')),
      sp('Horizon au sud-est', 'Horizon to the south-east', l('5,7°', '5.7°')),
    ],
    maintenance: maint(
      {
        failure:
          'Un enduit qui fissure au gel, des coulées sous la gouttière, de l’humidité qui monte au pied : les pignons prennent le vent et la pluie.',
        check:
          'Après la pluie, regardez le pignon sous le toit et à son pied : une trace sombre qui ne sèche pas est un défaut.',
        care: 'Reprendre l’enduit avant l’hiver, tenir le pied dégagé.',
      },
      {
        failure:
          'A render that cracks in frost, runs under the gutter, damp rising at the foot: the gables take the wind and the rain.',
        check:
          'After rain, look at the gable under the roof and at its foot: a dark mark that does not dry is a fault.',
        care: 'Repair the render before winter, keep the foot clear.',
      },
    ),
    tip: l(
      'Activez la Coupe : ce pignon part avec la moitié est, et l’on voit la pièce de l’autre côté, ouverte.',
      'Switch on Section: this gable goes with the east half, and you see the room from the other side, open.',
    ),
    design: l(
      'Les deux pignons se ressemblent, et c’est tout ce que l’on sait d’eux. Le modèle n’a pas d’effet de bord : la maison est un seul bloc, et la perte de ses murs est un chiffre pour tous.',
      'The two gables look alike, and that is all we know of them. The model has no edge effect: the house is a single block, and the loss through its walls is one figure for all.',
    ),
  },
  {
    id: 'west-gable',
    scene: 'house',
    category: 'structure',
    name: l('Pignon ouest', 'West gable'),
    short: l(
      'Le mur du bout, à l’ouest : un triangle sur une fondation en gradins, qui voit le soleil se coucher derrière la crête la plus basse.',
      'The end wall, to the west: a triangle on a stepped foundation, which sees the sun set behind the lowest ridge.',
    ),
    description: lf(
      'Comme son jumeau, ce mur est de {wallT} d’épaisseur, enduit, et monte en triangle jusqu’au faîtage, {ridge} au-dessus de la dalle (estimations). Le terrain tombe de {groundFall} vers le sud : la fondation descend en {gableSteps} gradins sous lui, pour ne pas flotter au-dessus du sol. Côté ouest, le soleil du soir se couche derrière la crête la plus basse de l’horizon du midi : d’après un modèle de terrain, 1,1° au sud-ouest, contre 2,7° au sud et 5,7° au sud-est. Sa perte, comme celle de l’autre pignon, est comprise dans le chiffre de toute l’enveloppe.',
      'Like its twin, this wall is {wallT} thick, rendered, and rises in a triangle to the ridge, {ridge} above the slab (estimates). The ground falls {groundFall} to the south: the foundation goes down in {gableSteps} steps beneath it, so as not to float above the ground. On the west side the evening sun sets behind the lowest ridge of the midday horizon: according to a terrain model, 1.1° to the south-west, against 2.7° to the south and 5.7° to the south-east. Its loss, like the other gable’s, is included in the figure for the whole envelope.',
    ),
    material: l('Maçonnerie enduite, dessin générique', 'Rendered masonry, a generic drawing'),
    specs: [
      sp('Épaisseur dessinée', 'Thickness drawn', v('{wallT}')),
      sp('Gradins de la fondation', 'Foundation steps', v('{gableSteps}')),
      sp('Chute du terrain', 'Fall of the ground', v('{groundFall}')),
      sp('Horizon au sud-ouest', 'Horizon to the south-west', l('1,1°', '1.1°')),
    ],
    maintenance: maint(
      {
        failure:
          'Les mêmes que son jumeau : un enduit qui fissure au gel, des coulées, de l’humidité qui monte au pied.',
        check: 'À l’automne, le tour du pignon : fissures, coulées, humidité au pied.',
        care: 'Reprendre l’enduit avant l’hiver, tenir le pied dégagé.',
      },
      {
        failure: 'The same as its twin: a render that cracks in frost, runs, damp rising at the foot.',
        check: 'In autumn, a walk round the gable: cracks, runs, damp at the foot.',
        care: 'Repair the render before winter, keep the foot clear.',
      },
    ),
    tip: l(
      'Gardez la Coupe active : le pignon ouest est celui qui reste, avec le toit au-dessus.',
      'Keep Section on: the west gable is the one that stays, with the roof above it.',
    ),
    design: l(
      'Une fondation en gradins est un dessin de pente : cinq marches, chacune à la hauteur du terrain en son milieu. L’article n’a pas de plan de fondation : c’est un choix de dessin, pas un choix de maçon.',
      'A stepped foundation is a drawing of a slope: five steps, each at the height of the ground at its middle. The paper has no foundation plan: it is a drawing’s choice, not a mason’s.',
    ),
  },
  {
    id: 'north-wall',
    scene: 'house',
    category: 'structure',
    name: l('Mur nord', 'North wall'),
    short: l(
      'Le mur du fond, sans soleil, sur le terrain le plus haut : c’est lui qui dit ce qu’est « G ».',
      'The back wall, with no sun, on the highest ground: it is what tells what “G” is.',
    ),
    description: lf(
      'C’est le mur qui n’a rien à gagner : la maison tourne le dos au nord. Nous le dessinons de {wallT} d’épaisseur, enduit, posé sur le terrain le plus haut (estimation). Ce que l’article donne de toute l’enveloppe tient en deux chiffres : un coefficient moyen K de 1,34 W/m²·K et des pertes G de 1,63 W/m³·K. Pour 300 m³, cela fait {gv}. Le quotient G·V sur K donne {envelope}, et la peau d’une boîte de 15 × 6,6 × 4 m en fait {boxM2} : en 1967, les deux se rejoignent. En 1974, ils ne se rejoignent plus, la définition de K nous échappe, et le modèle ne garde que G·V : il le prend pour toute la maison, façade sud comprise.',
      'This is the wall with nothing to gain: the house turns its back to the north. We draw it {wallT} thick, rendered, standing on the highest ground (estimate). What the paper gives of the whole envelope fits in two figures: a mean coefficient K of 1.34 W/m²·K and losses G of 1.63 W/m³·K. For 300 m³ that makes {gv}. The quotient G·V over K gives {envelope}, and the skin of a box of 15 × 6.6 × 4 m is {boxM2}: in 1967 the two meet. In 1974 they no longer meet, the definition of K escapes us, and the model keeps only G·V: it takes it for the whole house, south front included.',
    ),
    material: l('Maçonnerie enduite, dessin générique', 'Rendered masonry, a generic drawing'),
    specs: [
      sp('Épaisseur dessinée', 'Thickness drawn', v('{wallT}')),
      sp('K moyen', 'Mean K', '1,34 W/m²·K'),
      sp('Pertes, G', 'Losses, G', '1,63 W/m³·K'),
      sp('G·V, pour 300 m³', 'G·V, for 300 m³', v('{gv}')),
      sp('Peau de la maison, par G·V / K', 'Skin of the house, by G·V / K', v('{envelope}')),
    ],
    maintenance: maint(
      {
        failure:
          'C’est le mur le plus froid : mousse, enduit qui cloque, salpêtre au pied. Les fenêtres qu’on y perce laissent entrer le froid sans rendre de soleil.',
        check:
          'Un mur nord se vérifie en hiver, par temps sec : la main sur l’enduit, une odeur de cave, une tache qui revient.',
        care: 'Reprendre l’enduit et tenir le pied dégagé.',
      },
      {
        failure:
          'It is the coldest wall: moss, render that blisters, saltpetre at the foot. Windows cut into it let the cold in without giving sun back.',
        check:
          'A north wall is checked in winter, in dry weather: a hand on the render, a smell of cellar, a patch that comes back.',
        care: 'Repair the render and keep the foot clear.',
      },
    ),
    tip: l(
      'Dans la Simulation, faites glisser « Déperditions G » de 1,63 à 1,00 : rien ne change sur le mur, et la part de la saison monte.',
      'In the Simulation, slide “Heat loss G” from 1.63 to 1.00: nothing changes on the wall, and the season’s share climbs.',
    ),
    design: lf(
      'Si G·V désignait seulement le reste de la maison, hors capteur et fenêtres, la même saison donnerait {gvRest} de part à la place de {shareAll}. Personne ne dit ce que G contient : c’est l’hypothèse la plus lourde du modèle, et il l’annonce.',
      'If G·V meant only the rest of the house, apart from the collector and the windows, the same season would give {gvRest} of share in place of {shareAll}. Nobody says what G holds: it is the model’s heaviest assumption, and it says so.',
    ),
  },
  {
    id: 'north-window',
    scene: 'house',
    category: 'structure',
    name: l('Fenêtre nord', 'North window'),
    short: l(
      'Une petite fenêtre sur le mur du fond : de la lumière sans soleil, et un convecteur dessous.',
      'A small window in the back wall: light without sun, and a convector beneath it.',
    ),
    description: lf(
      'Une maison à capteur au sud a peu de raisons de percer le nord. Un architecte américain, dans sa maison à mur Trombe, en pose le principe : peu de fenêtres au nord, et petites. Nous dessinons une fenêtre de {northBox}, avec son appui à {northSill} et sa tête à {northHead} (estimation : aucune source ne donne les ouvertures du nord). Elle donne une lumière égale, sans soleil, et la nuit elle perd comme toutes les vitres. Dans le modèle, elle est comptée avec les autres pertes de l’enveloppe, dans le chiffre G, et jamais à part. Dans le dessin, le convecteur du salon est sous elle.',
      'A house with a collector on the south has little reason to cut into the north. An American architect, in his own Trombe-wall house, sets out the principle: few windows on the north, and small ones. We draw a window of {northBox}, with its sill at {northSill} and its head at {northHead} (estimate: no source gives the north openings). It gives an even light, without sun, and at night it loses like any glass. In the model it is counted with the other losses of the envelope, in the figure for G, and never apart. In the drawing, the living room’s convector is beneath it.',
    ),
    material: l('Double vitrage sur cadre, dessin générique', 'Double glazing on a frame, a generic drawing'),
    specs: [
      sp('Fenêtre dessinée', 'Window drawn', v('{northBox}')),
      sp('Appui, tête', 'Sill, head', v('{northSill}, {northHead}')),
      sp('Dans le modèle', 'In the model', l('comptée dans G, jamais à part', 'counted in G, never apart')),
    ],
    maintenance: maint(
      {
        failure:
          'Le joint d’une fenêtre qui ne voit jamais le soleil sèche mal : buée, moisissure sur l’appui, bois qui noircit. C’est aussi par là que le froid de l’hiver entre en premier.',
        check: 'Le matin, de la buée sur la vitre et un appui humide disent une pièce trop humide ou un joint fatigué.',
        care: 'Essuyer l’appui, aérer, remplacer le joint quand il se fend.',
      },
      {
        failure:
          'The seal of a window that never sees the sun dries poorly: mist, mould on the sill, wood that blackens. It is also by here that winter’s cold comes in first.',
        check: 'In the morning, mist on the glass and a damp sill say a room too humid or a tired seal.',
        care: 'Wipe the sill, air the room, replace the seal when it splits.',
      },
    ),
    tip: l(
      'Mettez en transparence les coques de la maison : le mur nord s’efface, et la fenêtre reste, avec le convecteur sous elle.',
      'Switch on X-ray: the house’s shells fade, the north wall goes, and the window stays, with the convector beneath it.',
    ),
    design: l(
      'Cette fenêtre ne porte aucun chiffre du modèle : tout ce qui n’est pas le capteur ou la baie du sud est dans G. Elle est là pour qu’une maison ait un nord.',
      'This window carries no figure of the model: everything that is not the collector or the south openings is in G. It is there so that a house has a north.',
    ),
  },
  {
    id: 'pitched-roof',
    scene: 'house',
    category: 'structure',
    name: l('Toit à deux pans', 'Pitched roof'),
    short: l(
      'Deux pans d’ardoise, un faîtage est-ouest : une pente d’environ 24°, qui rejette la neige vers le sud et vers le nord.',
      'Two slate slopes, an east–west ridge: a pitch of about 24°, which sheds snow to the south and the north.',
    ),
    description: lf(
      'Les données ouvertes donnent un faîtage à environ 1,3 à 1,6 m au-dessus de l’égout, sur une demi-profondeur de 3,3 m : une pente d’environ {pitch}, valeur grossière puisque la précision d’altitude est de 2,5 m. Le faîtage court d’est en ouest. Notre dessin ajoute des chevrons de {rafter}, des planches et des ardoises de {cover} (estimations : on ne sait rien du toit). Le débord est de {eave}, car la photographie n’en montre pas de profond : le modèle ne compte donc aucune ombre portée par le toit, sauf celle de la tête du cadre. Une gouttière et deux descentes courent le long de la façade sud. La 3D ne dessine pas de neige sur le toit, alors que celle du sol suit le mois.',
      'Open data gives a ridge about 1.3 to 1.6 m above the eaves, over a half-depth of 3.3 m: a pitch of about {pitch}, a rough value since the height precision is 2.5 m. The ridge runs east to west. Our drawing adds rafters of {rafter}, boards and slates of {cover} (estimates: nothing is known of the roof). The overhang is {eave}, since the photograph shows no deep one: the model therefore counts no shadow cast by the roof, except the head of the frame’s. A gutter and two downpipes run along the south front. The 3D draws no snow on the roof, while the ground’s follows the month.',
    ),
    material: l('Ardoise sur chevrons et planches, dessin générique', 'Slate on rafters and boards, a generic drawing'),
    specs: [
      sp('Pente', 'Pitch', v('{pitch}')),
      sp('Chevrons', 'Rafters', v('{rafter}')),
      sp('Ardoises', 'Slates', v('{cover}')),
      sp('Débord', 'Overhang', v('{eave}')),
    ],
    maintenance: maint(
      {
        failure:
          'Des ardoises qui glissent après un gel, un solin qui fuit autour de la cheminée, une gouttière pleine qui déborde. À 1 550 m, la neige qui fond sur le toit regèle à l’égout.',
        check:
          'Une fois par an, du sol ou aux jumelles : une ardoise qui manque, une tache sous l’égout, une gouttière pleine.',
        care: 'Dégager la gouttière avant l’hiver, reprendre le solin, faire remplacer les ardoises cassées par un couvreur.',
      },
      {
        failure:
          'Slates that slip after a frost, flashing that leaks round the chimney, a full gutter that overflows. At 1,550 m, snow that melts on the roof freezes again at the eaves.',
        check:
          'Once a year, from the ground or with binoculars: a missing slate, a stain under the eaves, a full gutter.',
        care: 'Clear the gutter before winter, repair the flashing, have broken slates replaced by a roofer.',
      },
    ),
    tip: l(
      'Mettez en transparence : le toit devient fantôme, et l’on voit où la tête des éléments reçoit le pied des chevrons.',
      'Switch on X-ray: the roof turns ghost, and you see where the heads of the elements receive the feet of the rafters.',
    ),
    design: l(
      'Un toit à deux pans est une des rares choses que l’on devine bien d’en haut. Le reste vient de nous : l’article ne parle pas du toit, et les ardoises et les planches sont une hypothèse de dessin, à lire comme telle.',
      'A pitched roof is one of the few things one can make out well from above. The rest comes from us: the paper does not speak of the roof, and the slates and boards are a drawing hypothesis, to be read as such.',
    ),
  },
  {
    id: 'roof-insulation',
    scene: 'house',
    category: 'structure',
    name: l('Isolation du toit', 'Roof insulation'),
    short: l(
      'La couche posée sur le plafond : on ne sait pas ce qu’elle était, mais l’isolation est ce qui décide de tout le reste.',
      'The layer laid over the ceiling: we do not know what it was, but insulation is what decides all the rest.',
    ),
    description: lf(
      'L’article donne les pertes de la maison entière, G de 1,63 W/m³·K en 1967 et de 1,00 en 1974, et rien de plus sur les murs, le toit ou le sol. Notre dessin pose une couche d’isolant de {roofIns} sur le plafond (estimation) : c’est une façon de la faire voir. Son rôle est le plus grand de la maison. Rien ne change sur le mur : avec le G de 1974, la part de la saison passe de {shareAll} à {share1974}. Plus loin, à 0,6 W/m³·K, elle monte à {share06}, mais il faut alors ouvrir les fenêtres : il y a plus de soleil que la maison n’en peut prendre. Pas un rayon de plus : c’est la maison qui perd moins.',
      'The paper gives the losses of the whole house, G of 1.63 W/m³·K in 1967 and 1.00 in 1974, and nothing more on the walls, the roof or the floor. Our drawing lays a layer of insulation {roofIns} thick over the ceiling (estimate): it is a way of making it visible. Its role is the greatest in the house. Nothing changes on the wall: with the 1974 G, the season’s share goes from {shareAll} to {share1974}. Further on, at 0.6 W/m³·K, it climbs to {share06}, but windows must then be opened: there is more sun than the house can take. Not one ray more: it is the house that loses less.',
    ),
    material: l('Isolant en couche, dessin générique', 'Layered insulation, a generic drawing'),
    specs: [
      sp('G, 1967 / 1974', 'G, 1967 / 1974', l('1,63 / 1,00 W/m³·K', '1.63 / 1.00 W/m³·K')),
      sp(
        'Part de la saison, G de 1967 / de 1974',
        'Season’s share, G of 1967 / of 1974',
        v('{shareAll} / {share1974}'),
      ),
      sp('Épaisseur dessinée', 'Thickness drawn', v('{roofIns}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un isolant tassé, mouillé par une fuite ou grignoté par des souris perd une part de sa valeur sans rien montrer : la facture d’électricité le dit avant l’œil.',
        check: 'Une lampe et une échelle, en automne : un isolant d’épaisseur égale, sec, sans trou, sans coulée.',
        care: 'Le tenir sec et uniforme, ne pas l’écraser en marchant dessus.',
      },
      {
        failure:
          'Insulation that has slumped, got wet from a leak or been gnawed by mice loses part of its value while showing nothing: the electricity bill says so before the eye does.',
        check: 'A lamp and a ladder, in autumn: insulation of even thickness, dry, with no holes, no stains.',
        care: 'Keep it dry and uniform, do not crush it by walking on it.',
      },
    ),
    tip: l(
      'Dans la Simulation, lancez « Isoler d’abord » : le mur ne change pas, la part de la saison monte.',
      'In the Simulation, run “Insulate first”: the wall does not change, the season’s share climbs.',
    ),
    design: l(
      'Une maison passive allemande de 1991, à Darmstadt, a 445 mm de laine soufflée au toit : de l’isolation sans mur noir, par une autre route. Les deux manières ne s’excluent pas, mais l’ordre compte : isoler d’abord.',
      'A German passive house of 1991, at Darmstadt, has 445 mm of blown wool in the roof: insulation with no black wall, by another road. The two ways do not exclude each other, but the order matters: insulate first.',
    ),
  },
  {
    id: 'floor-slab',
    scene: 'house',
    category: 'structure',
    name: l('Dalle', 'Floor slab'),
    short: l(
      'Une dalle de niveau sur un lit de pierres, d’où l’on compte toutes les hauteurs : le terrain tombe sous elle, vers le sud.',
      'A level slab on a bed of stones, from which all heights are counted: the ground falls away beneath it, to the south.',
    ),
    description: lf(
      'Toutes les hauteurs du dessin se comptent depuis le dessus de cette dalle. Elle est de niveau, de {slab} d’épaisseur (estimation), sur un lit de pierres, et le terrain tombe sous elle vers le sud. Sa surface intérieure, d’après le dessin et avant cloisons, est d’environ {interior} : l’article en annonce 76. Le modèle ne lui donne pas de température à elle, et la terre dessous n’a pas de nœud : le plancher fait partie de l’enveloppe, et ce qu’il perd est compris dans les pertes de la maison. Sa face porte un carrelage, ou des lames de chêne dans les pièces de côté : ce sont nos choix de dessin.',
      'All the heights in the drawing are counted from the top of this slab. It is level, {slab} thick (estimate), on a bed of stones, and the ground falls away beneath it to the south. Its inner area, by the drawing and before partitions, is about {interior}: the paper announces 76. The model gives it no temperature of its own, and the earth below has no node: the floor is part of the envelope, and what it loses is included in the house’s losses. Its face carries tiling, or oak boards in the side rooms: these are our drawing choices.',
    ),
    material: l(
      'Dalle de béton sur lit de pierres, dessin générique',
      'Concrete slab on a bed of stones, a generic drawing',
    ),
    specs: [
      sp('Épaisseur dessinée', 'Thickness drawn', v('{slab}')),
      sp('Surface dessinée, avant cloisons', 'Area drawn, before partitions', v('{interior}')),
      sp('Surface annoncée', 'Area announced', '76 m²'),
      sp('Volume annoncé', 'Volume announced', '300 m³'),
    ],
    maintenance: maint(
      {
        failure:
          'Une dalle sur le terrain a deux ennemis : l’humidité qui remonte et un tassement du sol sous elle. Sur une pente, le second est le plus à craindre, et se lit sur une fissure au pied du mur.',
        check: 'Une fissure qui s’ouvre le long du mur sud, ou une porte qui frotte : le sol a bougé.',
        care: 'Garder l’eau loin du pied de la maison, et surveiller les fissures plutôt que les boucher.',
      },
      {
        failure:
          'A slab on the ground has two enemies: damp rising, and the soil settling beneath it. On a slope the second is the more to be feared, and reads as a crack at the foot of the wall.',
        check: 'A crack opening along the south wall, or a door that rubs: the ground has moved.',
        care: 'Keep water away from the foot of the house, and watch cracks rather than fill them.',
      },
    ),
    tip: l(
      'Activez la Coupe : la dalle apparaît en coupe, avec ce qu’il y a dessous, et le terrain qui tombe vers le sud.',
      'Switch on Section: the slab appears in section, with what lies beneath, and the ground falling to the south.',
    ),
    design: l(
      'Nos 81 m² contre les 76 de l’article disent seulement que le dessin n’est pas faux : les cloisons prennent la différence. La dalle, elle, n’est nulle part dans les sources.',
      'Our 81 m² against the paper’s 76 say only that the drawing is not wrong: the partitions take the difference. The slab itself is nowhere in the sources.',
    ),
  },
  {
    id: 'foundation',
    scene: 'house',
    category: 'structure',
    name: l('Fondation', 'Foundation'),
    short: lf(
      'Ce qui porte {massT} de mur : une semelle, des gradins qui suivent la pente, et la fondation propre du mur sud.',
      'What carries {massT} of wall: a footing, steps that follow the slope, and the south wall’s own foundation.',
    ),
    description: lf(
      'Le mur de stockage pèse {massT}, soit {tPerM2} de mur, sur une seule face de la maison. La fondation qui le porte est notre dessin : une fondation propre au mur sud, de la semelle au pied du cadre, une semelle de {footing} sous le terrain, et des gradins ({gableSteps}) sous les pignons, qui suivent la pente de {groundFall} (estimations : l’article ne dit rien de la fondation). Le bâtiment de 1974, lui, est inscrit au titre des monuments historiques : sa notice parle de fondations en gradins dans le rocher. C’est une source pour ce bâtiment-là, pas pour la maison de 1967.',
      'The storage wall weighs {massT}, or {tPerM2} of wall, on a single side of the house. The foundation that carries it is our drawing: a foundation proper to the south wall, from the footing to the frame’s foot, a footing {footing} below the ground, and steps ({gableSteps}) under the gables, following the slope’s fall of {groundFall} (estimates: the paper says nothing of the foundation). The building of 1974 is listed as a historic monument: its entry speaks of stepped foundations in the rock. That is a source for that building, not for the house of 1967.',
    ),
    material: l('Béton, en gradins, dessin générique', 'Concrete, stepped, a generic drawing'),
    specs: [
      sp('Charge du mur sud', 'Load of the south wall', v('{massT}')),
      sp('Semelle sous le terrain', 'Footing below the ground', v('{footing}')),
      sp('Gradins sous les pignons', 'Steps under the gables', v('{gableSteps}')),
      sp('Chute du terrain', 'Fall of the ground', v('{groundFall}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un mur lourd sur une pente : le tassement d’un côté, une fissure qui monte du pied, de l’eau qui sape le pied. Rien ne se voit, jusqu’à ce que la façade bouge.',
        check:
          'Des fissures obliques, des portes qui frottent, un joint de cadre qui s’ouvre : on les note et on les mesure d’une saison à l’autre.',
        care: 'Éloigner l’eau du pied, garder le drainage, faire examiner toute fissure qui travaille.',
      },
      {
        failure:
          'A heavy wall on a slope: settling on one side, a crack that rises from the foot, water undermining the foot. Nothing shows, until the front moves.',
        check:
          'Slanting cracks, doors that rub, a frame joint that opens: note them and measure them from one season to the next.',
        care: 'Keep water away from the foot, keep the drainage, have any crack that works examined.',
      },
    ),
    tip: l(
      'Isolez la fondation : elle se montre seule, en gradins qui suivent la pente, avec sa semelle sous la façade sud.',
      'Isolate the foundation: it shows alone, in steps that follow the slope, with its footing under the south front.',
    ),
    design: lf(
      'Les {massT} reposent sur ce qu’aucune source ne donne : ni la semelle, ni la profondeur, ni la nature du sol. La fondation est ici un dessin à regarder, pas un plan.',
      'The {massT} rest on what no source gives: neither the footing, nor the depth, nor the nature of the ground. The foundation here is a drawing to look at, not a plan.',
    ),
  },
  {
    id: 'interior-partitions',
    scene: 'house',
    category: 'structure',
    name: l('Pièces', 'Rooms'),
    short: l(
      'Quatre pièces, dit l’article, chacune avec son thermostat : le plan est le nôtre, et le salon est celui du monde de la pièce.',
      'Four rooms, says the paper, each with its own thermostat: the plan is ours, and the living room is the one in the room world.',
    ),
    description: lf(
      'L’article compte quatre pièces principales, chacune réglée à 20 °C par son thermostat. Il ne donne pas le plan. Notre dessin pose deux cloisons en travers, sur les lignes de travée de chaque côté du salon, et une dans chaque bloc de côté, avec une porte de {partDoor} dans chacune, entrouverte. Le salon est large de quatre travées, soit {livingW} (estimation), et se visite dans le monde de la pièce. Les cloisons sont épaisses de {partT} : le dessin ne dit pas ce qu’elles sont. Le modèle ne connaît qu’une pièce, avec un seul air : les quatre pièces de l’article n’en font qu’une, et c’est une limite.',
      'The paper counts four principal rooms, each set to 20 °C by its thermostat. It does not give the plan. Our drawing sets two cross partitions on the bay lines either side of the living room, and one in each side block, with a door of {partDoor} in each, ajar. The living room is four bays wide, or {livingW} (estimate), and is visited in the room world. The partitions are {partT} thick: the drawing does not say what they are. The model knows only one room, with a single air: the paper’s four rooms make one, and that is a limit.',
    ),
    material: l('Cloisons légères, dessin générique', 'Light partitions, a generic drawing'),
    specs: [
      sp('Pièces principales', 'Principal rooms', '4'),
      sp('Salon dessiné, largeur', 'Living room drawn, width', v('{livingW}')),
      sp('Épaisseur des cloisons', 'Partition thickness', v('{partT}')),
      sp('Porte dessinée', 'Door drawn', v('{partDoor}')),
    ],
    maintenance: maint(
      {
        failure:
          'Des cloisons qui coupent la boucle : une porte fermée entre le salon et une chambre empêche l’air chaud d’aller plus loin, et la chambre reste dans l’air froid de la nuit.',
        check:
          'Une main à hauteur de tête dans chaque pièce, un soir après une belle journée : la différence de tiédeur dit où la chaleur n’arrive pas.',
        care: 'Laisser les portes ouvertes dans la journée, fermer le soir ce que l’on ne veut pas chauffer.',
      },
      {
        failure:
          'Partitions that cut the loop: a closed door between the living room and a bedroom stops the warm air going further, and the bedroom stays in the night’s cold air.',
        check:
          'A hand at head height in each room, on an evening after a fine day: the difference in warmth says where the heat does not arrive.',
        care: 'Leave the doors open by day, close in the evening what is not to be heated.',
      },
    ),
    tip: l(
      'Ouvrez le monde de la pièce avec le bouton de cette fiche : le salon, d’une travée de capteur à l’autre.',
      'Open the room world with the button on this sheet: the living room, from one collector bay to the other.',
    ),
    design: l(
      'Le plan de quatre pièces d’une maison de 76 m² reste une question sans réponse dans nos sources : on peut seulement dire que le dessin ne contredit rien. Le modèle y voit une grande pièce.',
      'The four-room plan of a 76 m² house remains a question with no answer in our sources: all one can say is that the drawing contradicts nothing. The model sees one large room there.',
    ),
  },
  {
    id: 'chimney',
    scene: 'house',
    category: 'structure',
    name: l('Cheminée', 'Chimney'),
    short: l(
      'Un conduit de brique sur le toit : à quoi il sert, personne ne le dit, et la maison chauffe à l’électricité.',
      'A brick stack on the roof: what it is for, nobody says, and the house heats by electricity.',
    ),
    description: lf(
      'Une cheminée se voit sur le toit de ces bâtiments. L’usage n’en est dit nulle part, et le chauffage d’appoint est électrique : c’est peut-être une ventilation, peut-être un reste. Ce sont nos hypothèses, aucune n’est lue. Nous la dessinons carrée, de {chimneyBox}, en brique, avec une collerette de zinc là où elle perce l’ardoise et un pot de grès au sommet, posée sur l’isolant du plafond et dépassant le faîtage (estimation). Dans le modèle, il n’y a aucun appareil à combustible, et la cheminée ne fait rien.',
      'A chimney can be seen on the roof of these buildings. Its use is said nowhere, and the backup heating is electric: it may be a ventilation, it may be a leftover. These are our hypotheses, none is read. We draw it square, {chimneyBox}, of brick, with a zinc collar where it pierces the slate and a stoneware pot at the top, standing on the ceiling’s insulation and clearing the ridge (estimate). In the model there is no fuel appliance, and the chimney does nothing.',
    ),
    material: l('Brique, collerette de zinc, pot de grès (dessin)', 'Brick, zinc collar, stoneware pot (a drawing)'),
    specs: [
      sp('Section dessinée', 'Section drawn', v('{chimneyBox}')),
      sp('Usage', 'Use', l('inconnu', 'unknown')),
      sp('Dans le modèle', 'In the model', l('aucun appareil : elle ne fait rien', 'no appliance: it does nothing')),
    ],
    maintenance: maint(
      {
        failure:
          'Le solin autour d’une cheminée est le point faible de tout toit : la collerette qui se décolle, l’eau qui coule dans le comble, la mousse sur la brique. Un conduit inutilisé, resté ouvert en bas, fait un trou froid dans le plafond.',
        check: 'Une tache sous le toit, autour du conduit, après la pluie, dit que le solin a lâché.',
        care: 'Reprendre le solin et les joints de brique, boucher le pied si le conduit ne sert pas.',
      },
      {
        failure:
          'The flashing round a chimney is the weak point of any roof: the collar that lifts, water running into the roof void, moss on the brick. An unused flue left open at the foot makes a cold hole in the ceiling.',
        check: 'A stain under the roof, round the stack, after rain, says the flashing has let go.',
        care: 'Repair the flashing and the brick joints, stop up the foot if the flue is not used.',
      },
    ),
    tip: l(
      'Mettez en transparence : le toit devient fantôme, la cheminée reste, posée sur le plafond, avec rien sous elle.',
      'Switch on X-ray: the roof turns ghost, the chimney stays, standing on the ceiling, with nothing beneath it.',
    ),
    design: l(
      'Nous ne savons pas à quoi elle servait, et nous ne voulons pas l’inventer : c’est un point d’interrogation dessiné en brique. Les sources se taisent aussi sur la façon dont l’air neuf entrait.',
      'We do not know what it was for, and do not wish to invent it: it is a question mark drawn in brick. The sources are also silent on how fresh air got in.',
    ),
  },
  {
    id: 'earth-tube-intake',
    scene: 'house',
    category: 'mechanical',
    name: l('Prise d’air (et si…)', 'Intake (what if…)'),
    short: l(
      'Le début du puits canadien : une colonne sur le terrain, avec un capuchon et une grille, où l’air du dehors entre.',
      'The start of the earth tube: a standpipe on the ground, with a hood and a mesh, where the outside air enters.',
    ),
    description: lf(
      'Dans le « et si… », l’air neuf entre par une colonne au-dessus du terrain, coiffée d’un capuchon qui garde la pluie et d’une grille qui garde les insectes et les feuilles. Elle repose sur un pied de béton, sur la pente au-dessus de la maison. De là, l’air entre dans un tuyau de {tubeDia} de diamètre et de {tubeLength} de long, au débit de {tubeFlow}, soit une demi-maison d’air par heure (estimations). Dans la 3D, tout est translucide : cette prise n’existe que dans son scénario.',
      'In the “what if…”, the new air enters through a standpipe above the ground, topped with a hood that keeps the rain out and a mesh that keeps insects and leaves out. It stands on a concrete foot, on the slope above the house. From there the air enters a pipe {tubeDia} in diameter and {tubeLength} long, at a flow of {tubeFlow}, half the house’s volume of air an hour (estimates). In the 3D everything is translucent: this intake exists only in its scenario.',
    ),
    material: l('Colonne, capuchon et grille (dessin)', 'Standpipe, hood and mesh (a drawing)'),
    specs: [
      sp('Débit dessiné', 'Flow drawn', v('{tubeFlow}')),
      sp('Diamètre du tuyau', 'Pipe diameter', v('{tubeDia}')),
      sp('Longueur du tuyau', 'Pipe length', v('{tubeLength}')),
    ],
    maintenance: maint(
      {
        failure:
          'La grille qui se bouche de feuilles, de neige ou de givre et qui coupe l’air, un nid d’insectes ou de petits animaux sous le capuchon. À cette altitude, la neige compte pour la hauteur de la prise.',
        check: 'Au début de l’hiver, la prise est-elle dégagée ? Au printemps, la grille est-elle propre ?',
        care: 'Nettoyer la grille à chaque saison, la tenir hors de la neige, changer le filtre selon la notice de son fabricant.',
      },
      {
        failure:
          'The mesh that clogs with leaves, snow or rime and cuts the air, a nest of insects or small animals under the hood. At this altitude, snow counts for the height of the intake.',
        check: 'At the start of winter, is the intake clear? In spring, is the mesh clean?',
        care: 'Clean the mesh each season, keep it out of the snow, change the filter according to its maker’s notice.',
      },
    ),
    tip: l(
      'Dans la Simulation, lancez « Et si : un puits canadien » : les trois pièces apparaissent en bleu pâle, la prise sur la pente.',
      'In the Simulation, run “What if: an earth tube”: the three parts appear in pale blue, the intake on the slope.',
    ),
    design: l(
      'Un puits canadien se joue aux deux bouts : ici, l’air entre à la température du jour ; au bout, il arrive proche de celle de la terre. Entre les deux, une cinquantaine de mètres de tuyau.',
      'An earth tube is decided at its two ends: here, the air enters at the day’s temperature; at the far end, it arrives close to the earth’s. Between the two, some fifty metres of pipe.',
    ),
  },
  {
    id: 'earth-tube-pipe',
    scene: 'house',
    category: 'mechanical',
    name: l('Tuyau enterré (et si…)', 'Buried pipe (what if…)'),
    short: l(
      'Cinquante mètres de tuyau à 2 m sous terre : cette maison n’en avait pas, et le modèle dit ce qu’il ferait à 1 550 m.',
      'Fifty metres of pipe 2 m underground: this house had none, and the model says what it would do at 1,550 m.',
    ),
    description: lf(
      'Cette maison n’avait pas de puits canadien : c’est une hypothèse. Le tuyau fait {tubeLength} de long et {tubeDia} de diamètre, enterré à {tubeDepth} (estimations, d’après l’illustration d’un architecte : 25 à 50 m, à 1,5 ou 2 m). Il penche d’environ {tubeFall} vers la purge. À Odeillo, en janvier, l’air sort à {tubeJanOut} quand il fait {tubeJanIn} ; en juillet, à {tubeJulOut} quand il fait {tubeJulIn}. Sur une année, il apporte {tubeKwh} de chaleur pour une charge de {tubeLoad} : environ {tubePoint} de part en plus. Au niveau de la mer, à Perpignan, il compte davantage : {tubePerpHeat} de chaleur et {tubePerpCool} de fraîcheur d’été pour une charge de {tubePerpLoad}. Ces chiffres sont ceux du modèle, jamais ceux d’un tuyau mesuré.',
      'This house had no earth tube: it is a hypothesis. The pipe is {tubeLength} long and {tubeDia} in diameter, buried at {tubeDepth} (estimates, from an architect’s illustration: 25 to 50 m, at 1.5 or 2 m). It slopes by about {tubeFall} towards the drain. At Odeillo, in January, the air leaves at {tubeJanOut} when it is {tubeJanIn}; in July, at {tubeJulOut} when it is {tubeJulIn}. Over a year it brings {tubeKwh} of heat against a load of {tubeLoad}: about {tubePoint} more of share. At sea level, at Perpignan, it counts for more: {tubePerpHeat} of heat and {tubePerpCool} of summer coolness against a load of {tubePerpLoad}. These are the model’s figures, never those of a measured pipe.',
    ),
    material: l('Tuyau enterré, matière non précisée (dessin)', 'Buried pipe, material not specified (a drawing)'),
    specs: [
      sp('Longueur, diamètre', 'Length, diameter', v('{tubeLength}, {tubeDia}')),
      sp('Profondeur', 'Depth', v('{tubeDepth}')),
      sp('Pente vers la purge', 'Fall to the drain', v('{tubeFall}')),
      sp('Gain d’une année, Odeillo', 'A year’s gain, Odeillo', v('{tubeKwh}')),
    ],
    maintenance: maint(
      {
        failure:
          'L’eau qui se condense dans un tuyau froid doit pouvoir sortir : sans pente, elle reste en bas, et le tuyau s’abîme de moisissures.',
        check:
          'La purge doit couler ou rester sèche après un temps humide, jamais garder de l’eau. L’air qui sort ne doit rien sentir.',
        care: 'Garder la pente, nettoyer la purge, changer le filtre de la prise selon la notice de son fabricant.',
      },
      {
        failure:
          'Water that condenses in a cold pipe must be able to leave: with no slope it stays at the bottom, and the pipe suffers mould.',
        check:
          'The drain should run, or stay dry after damp weather, and never hold water. The air coming out should smell of nothing.',
        care: 'Keep the slope, clean the drain, change the intake filter according to its maker’s notice.',
      },
    ),
    tip: l(
      'Il est dessiné à travers le terrain, exprès : le tuyau repose à 2 m sous la terre. Il longe la pente avant de revenir vers la maison.',
      'It is drawn through the ground, on purpose: the pipe lies 2 m under the earth. It follows the slope before turning back to the house.',
    ),
    design: lf(
      'Aucun puits canadien mesuré, sur une maison, en altitude ou en France, ne nous est parvenu : seulement des vendeurs et des forums. Trois systèmes de bureaux, mesurés en Allemagne, donnent une efficacité de 0,77 à 0,94 ; notre modèle, avec un sol constant, est trop pessimiste pour ces tuyaux-là. À 1 550 m, il tempère l’air d’hiver et n’a presque pas de chaleur d’été à combattre : à peine {tubePoint}.',
      'No measured earth tube on a house, at altitude or in France, has reached us: only sellers and forums. Three office systems, measured in Germany, give an effectiveness of 0.77 to 0.94; our model, with a steady soil, is too pessimistic for those pipes. At 1,550 m it tempers the winter air and has almost no summer heat to fight: barely {tubePoint}.',
    ),
  },
  {
    id: 'earth-tube-drain',
    scene: 'house',
    category: 'mechanical',
    name: l('Purge (et si…)', 'Drain (what if…)'),
    short: l(
      'Le point bas du puits canadien : un regard avec un couvercle, où l’eau de condensation se recueille et s’en va.',
      'The low point of the earth tube: a pit with a lid, where condensate collects and drains away.',
    ),
    description: lf(
      'Dans le « et si… », le tuyau enterré penche de {tubeFall} vers un regard au point bas, sous un couvercle à ras du terrain. Un air plus chaud qui passe dans un tuyau froid y laisse de l’eau sur ses parois : elle doit couler quelque part, et le regard la recueille par un petit raccord. Sans lui, l’eau resterait au fond du tuyau, et c’est là que peut se développer ce qu’on respire ensuite. Le modèle ne simule pas la condensation : il ne connaît que la température de l’air à la sortie. La purge est donc un rappel de ce qu’il ne calcule pas.',
      'In the “what if…”, the buried pipe slopes by {tubeFall} towards a pit at the low point, under a lid level with the ground. Warmer air passing through a cold pipe leaves water on its walls: it must run somewhere, and the pit collects it through a small stub. Without it, the water would stay at the bottom of the pipe, and that is where what one then breathes can develop. The model does not simulate condensation: it only knows the temperature of the air at the outlet. The drain is therefore a reminder of what it does not calculate.',
    ),
    material: l('Regard avec couvercle (dessin)', 'Pit with a lid (a drawing)'),
    specs: [
      sp('Pente du tuyau vers elle', 'Pipe’s fall towards it', v('{tubeFall}')),
      sp('Condensation dans le modèle', 'Condensation in the model', l('aucune', 'none')),
      sp('Profondeur du tuyau', 'Pipe depth', v('{tubeDepth}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une purge qui se bouche ou qui gèle, ou un regard qui se remplit d’eau de pluie : l’eau reste alors dans le tuyau au lieu de s’en aller.',
        check: 'Soulever le couvercle après un temps humide : le regard doit être humide ou sec, jamais plein.',
        care: 'Dégager le regard à chaque saison, le tenir hors de la neige, et vérifier qu’il s’évacue vraiment.',
      },
      {
        failure:
          'A drain that blocks or freezes, or a pit that fills with rainwater: the water then stays in the pipe instead of leaving it.',
        check: 'Lift the lid after damp weather: the pit should be damp or dry, never full.',
        care: 'Clear the pit each season, keep it out of the snow, and check that it really drains.',
      },
    ),
    tip: l(
      'Quand le « et si… » est actif, cherchez le couvercle à ras du terrain : c’est le haut du regard, au point bas du tuyau.',
      'When the “what if…” is on, look for the lid level with the ground: it is the top of the pit, at the pipe’s low point.',
    ),
    design: l(
      'Une pente est le conseil habituel : l’eau suit la gravité, pas le conseil. Le tuyau penche donc vers le regard, et le regard est le seul endroit où l’eau peut quitter le puits.',
      'A slope is the usual advice: water follows gravity, not advice. The pipe therefore slopes towards the pit, and the pit is the only place where water can leave the tube.',
    ),
  },
];
