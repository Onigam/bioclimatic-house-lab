// Parts of the `room` world (13): the house's own living room, from one bay line to the other, with the back of one collector element at the end of it. Here the heat arrives and the current goes. The paper tells what its builders
// measured and with what; the plan of the rooms, the furniture, the heater's make, the panel and the recorder are our drawing, and the sheets say so. The honest answer to « can a house heat itself? » lives in the last paragraph of
// `electric-heater`. Safety is not repeated on a sheet: mains in the guide step where the gesture is risky, fresh air in the installation step, both in the Sources.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const ROOM_PARTS: PartInfo[] = [
  {
    id: 'inner-wall-face',
    scene: 'room',
    category: 'structure',
    name: l('Face intérieure du mur', 'Inner face of the wall'),
    short: l(
      'Le dos du mur, côté pièce : à peine tiède, il garde sa chaleur toute la nuit, entre 25 et 28 °C.',
      'The back of the wall, room side: barely warm, it keeps its heat all night, between 25 and 28 °C.',
    ),
    description: lf(
      'C’est la face que la pièce voit : le béton, 60 cm après la peinture noire. Sur l’enregistrement de décembre 1974, elle reste presque plate quatre jours de suite, vers 25 à 28 °C d’après la courbe lue à l’œil, quand la face noire fait une quarantaine de kelvins d’écart dans la journée. Elle chauffe la pièce de deux façons : par des rayons, comme un poêle de pierre, et par l’air qui la frôle. L’article donne l’écart avec l’air de la pièce, de −3 à +9 K ; le modèle trouve {innerGap} sur la même période. Il place cette face un peu plus bas que la courbe, vers {innerModel} : environ 2 K de moins, et c’est dit. L’article ne dit pas ce qui la couvre.',
      'It is the face the room sees: the concrete, 60 cm after the black paint. On the recording of December 1974 it stays almost flat for four days in a row, at about 25 to 28 °C according to the curve read by eye, when the black face swings by some forty kelvins in the day. It heats the room two ways: by rays, like a stone stove, and by the air that brushes it. The paper gives the gap with the room’s air, −3 to +9 K; the model finds {innerGap} over the same period. It places this face a little below the curve, at {innerModel}: some 2 K less, and that is said. The paper does not say what covers it.',
    ),
    material: l('Béton, face lisse', 'Concrete, smooth face'),
    specs: [
      sp('Température, enregistrée', 'Temperature, recorded', l('25 à 28 °C, à l’œil', '25 to 28 °C, by eye')),
      sp('Température, modèle', 'Temperature, model', v('{innerModel}')),
      sp('Écart avec l’air de la pièce', 'Gap with the room’s air', l('−3 à +9 K', '−3 to +9 K')),
      sp('Mouvement dans la journée, modèle', 'Movement over the day, model', v('± {swing60}')),
      sp('Émissivité', 'Emissivity', '0,94'),
    ],
    maintenance: maint(
      {
        failure:
          'Rien ne s’use ici, mais tout se pose devant : un meuble, une bibliothèque, un rideau collés au mur le cachent à la pièce et l’empêchent de donner sa chaleur. Une face humide, comme celle du mur de 1974 au début, reste plus froide que la théorie.',
        check:
          'La main à plat sur le mur le soir, puis le matin : il doit rester tiède, presque pareil. Un mur froid dit qu’il n’a pas reçu de soleil, ou qu’il est mouillé.',
        care: 'Laisser le mur voir la pièce : ne rien coller contre lui.',
      },
      {
        failure:
          'Nothing wears here, but everything is set in front of it: a piece of furniture, a bookcase, a curtain against the wall hide it from the room and stop it giving its heat. A damp face, like the 1974 wall’s at the start, stays colder than theory.',
        check:
          'A flat hand on the wall in the evening, then in the morning: it should stay warm, almost alike. A cold wall says it has had no sun, or that it is wet.',
        care: 'Let the wall see the room: set nothing against it.',
      },
    ),
    tip: l(
      'Mettez en transparence : le sol, le plafond et cette face s’effacent, et l’on voit les conduits derrière. Dans la Simulation, regardez ensuite l’heure : la face ne bouge presque pas de la journée.',
      'Switch on X-ray: the floor, the ceiling and this face fade, and you see the ducts behind. In the Simulation, then watch the clock: the face hardly moves all day.',
    ),
    design: lf(
      'C’est ici que le modèle a trouvé sa question la plus intéressante. Le courant qui sort de cette face, d’après les chiffres de l’article, est d’environ {streamSource} un jour de décembre. Le calcul des mêmes auteurs, entre leurs deux courbes et avec leur conductivité de 1,75, ne donne que {handConduction}. Les deux ne se rejoignent pas, alors que le modèle ferme son propre compte par construction. Une cause possible est la chaleur du conduit haut qui traverse le mur. Elle est possible, pas prouvée. Nous ne touchons pas à ce chiffre.',
      'This is where the model found its most interesting question. The current leaving this face, by the paper’s figures, is about {streamSource} on a December day. The same authors’ calculation, between their two curves and with their conductivity of 1.75, gives only {handConduction}. The two do not meet, while the model closes its own account by construction. One possible cause is the heat of the upper duct crossing the wall. It is possible, not proved. We leave the figure as it is.',
    ),
  },
  {
    id: 'warm-air-jet',
    scene: 'room',
    category: 'mechanical',
    name: l('Jet d’air chaud', 'Warm-air jet'),
    short: l(
      'L’air qui sort du conduit haut vers 40 °C et file sous le plafond : la part de la chaleur qui arrive par l’air.',
      'The air that leaves the upper duct at about 40 °C and glides under the ceiling: the part of the heat that arrives by the air.',
    ),
    description: lf(
      'La chaleur du mur arrive dans la pièce par trois chemins. Le premier est ce jet : l’air de la lame, sorti par le conduit du haut vers 40 à 43 °C d’après l’article, se glisse sous le plafond. Les auteurs le comptent pour 30 à 35 % de l’énergie rendue un jour clair de 1967. Le modèle trouve {thermoShare}, et encore {thermoShareK30} quand on lui impose leur débit : l’écart ne vient pas que du débit. Le courant dure : il continue 2 à 3 heures après la dernière lueur. À 20 L/s, il porte {elemWatts} par élément, soit {frontKw} pour toute la façade. Les deux autres chemins sont la chaleur rayonnée par la face intérieure et celle de l’air qui la frôle : l’article les compte à part.',
      'The wall’s heat reaches the room by three paths. The first is this jet: the gap’s air, out of the upper duct at about 40 to 43 °C according to the paper, slips under the ceiling. The authors count it for 30 to 35 % of the energy given back on a clear day of 1967. The model finds {thermoShare}, and still {thermoShareK30} when it is made to use their flow: the gap does not come from the flow alone. The flow lasts: it goes on for 2 to 3 hours after the last light. At 20 L/s it carries {elemWatts} per element, or {frontKw} for the whole front. The other two paths are the heat radiated by the inner face and that of the air that brushes it: the paper counts them separately.',
    ),
    material: l('Air chaud, en mouvement', 'Warm air, moving'),
    specs: [
      sp('Température, enregistrée', 'Temperature, recorded', l('40 à 43 °C, à l’œil', '40 to 43 °C, by eye')),
      sp(
        'Part de l’énergie rendue, enregistrée',
        'Share of the energy given back, recorded',
        l('30 à 35 %', '30 to 35 %'),
      ),
      sp('Part de l’énergie rendue, modèle', 'Share of the energy given back, model', v('{thermoShare}')),
      sp('Chaleur portée, un élément', 'Heat carried, one element', v('{elemWatts}')),
      sp('Continue après le soleil', 'Goes on after the sun', l('2 à 3 h', '2 to 3 h')),
    ],
    maintenance: maint(
      {
        failure:
          'Un jet qui n’en est plus un : la grille bouchée de poussière, un meuble haut devant elle. Une chaleur qui s’amasse sous un plafond de près de 4 m en moyenne repart plus vite par le toit.',
        check: 'Un ruban de papier tenu sous la grille, un jour clair : l’air chaud doit le soulever.',
        care: 'Dépoussiérer la grille en fin d’été. Ne rien accrocher devant elle.',
      },
      {
        failure:
          'A jet that no longer is one: the grille clogged with dust, a tall piece of furniture in front of it. Heat that gathers under a ceiling nearly 4 m high on average leaves faster through the roof.',
        check: 'A strip of paper held under the grille on a clear day: the warm air should lift it.',
        care: 'Dust the grille at the end of summer. Hang nothing in front of it.',
      },
    ),
    tip: l(
      'Activez Flux : le jet sort de la grille haute, plus net et plus chaud quand le débit monte, et ne se voit que sur une boucle qui tourne vers l’avant.',
      'Switch on Flows: the jet leaves the upper grille, sharper and hotter as the flow climbs, and only shows on a loop that turns forwards.',
    ),
    design: l(
      'Un architecte américain, dans sa propre maison à mur Trombe, notait que l’air chaud finissait en haut, à l’étage : de 4 à 5 °F de plus. Ici le jet vit sous un plafond de près de 4 m de moyenne, et le thermostat est au niveau de la tête, à 1,50 m : il ne sent pas ce que le jet fait tout en haut.',
      'An American architect, in his own Trombe-wall house, noted that the warm air ended up at the top, upstairs: 4 to 5 °F warmer. Here the jet lives under a ceiling nearly 4 m high on average, and the thermostat is at head height, 1.50 m: it does not feel what the jet does at the top.',
    ),
  },
  {
    id: 'floor-return',
    scene: 'room',
    category: 'mechanical',
    name: l('Retour au sol', 'Floor return'),
    short: l(
      'L’air le plus frais de la pièce, près du sol, repris à 17 °C par le conduit bas : la boucle se referme sur elle-même.',
      'The coolest air in the room, near the floor, taken back at 17 °C by the lower duct: the loop closes on itself.',
    ),
    description: lf(
      'Le mur ne donne pas d’air neuf à la pièce : il reprend le sien. L’air frais qui tombe vers le sol va à la grille basse et repart, à 17 °C quand la pièce est à 20 °C. Il monte alors derrière la vitre, revient en haut, et la boucle recommence. Avec 8,63 éléments à 20 L/s, la façade fait passer environ {frontFlow} par heure, soit un peu plus de deux fois les 300 m³ de la maison : l’air de la pièce fait le tour du mur à peu près deux fois par heure. Dans la 3D, le retour est un filet qui descend vers la grille et finit sur elle, colorié par sa température.',
      'The wall does not give the room new air: it takes its own back. The cool air that falls towards the floor goes to the low grille and leaves again, at 17 °C when the room is at 20 °C. It then rises behind the glass, comes back at the top, and the loop begins again. With 8.63 elements at 20 L/s, the front passes about {frontFlow} an hour, a little more than twice the 300 m³ of the house: the room’s air goes round the wall about twice an hour. In the 3D, the return is a thread that falls towards the grille and ends on it, coloured by its temperature.',
    ),
    material: l('Air frais, en mouvement', 'Cool air, moving'),
    specs: [
      sp('Air repris', 'Air taken back', '17 °C'),
      sp('Pièce', 'Room', '20 °C'),
      sp('Débit de la façade, à 20 L/s par élément', 'Flow of the front, at 20 L/s an element', v('{frontFlow}')),
    ],
    maintenance: maint(
      {
        failure:
          'Le tapis qui glisse devant, le meuble posé contre la grille, la poussière du sol : la prise s’étouffe, et le débit tombe sans bruit.',
        check:
          'Regardez, à genoux, ce qui reste devant la grille basse. Un léger courant frais sur la main dit que la boucle tourne.',
        care: 'Aspirer la grille avec le sol, et laisser le devant libre.',
      },
      {
        failure:
          'The rug that slides in front, the piece of furniture set against the grille, floor dust: the intake chokes, and the flow drops without a sound.',
        check:
          'Kneel and look at what stays in front of the low grille. A slight cool draught on the hand says the loop is turning.',
        care: 'Vacuum the grille with the floor, and keep the front clear.',
      },
    ),
    tip: l(
      'Activez Flux, puis cherchez le filet qui descend le long du mur vers la grille basse : l’air de la pièce rentre dans le mur.',
      'Switch on Flows, then look for the thread falling along the wall to the low grille: the room’s air goes back into the wall.',
    ),
    design: l(
      'Prendre l’air le plus frais pour le réchauffer est ce qui fait marcher la boucle : le contraste est plus grand en bas qu’en haut. Quand l’article parle d’« air frais », c’est de cet air-là, celui de la pièce : on ne le confond pas avec l’air du dehors.',
      'Taking the coolest air to warm it is what makes the loop work: the contrast is larger at the bottom than at the top. When the paper speaks of “fresh air”, it is this air, the room’s: it is not to be mistaken for outside air.',
    ),
  },
  {
    id: 'thermostat',
    scene: 'room',
    category: 'electrical',
    name: l('Thermostat', 'Thermostat'),
    short: l(
      'Il est à 1,50 m du sol, réglé à 20 °C : quand le mur donne assez, il ne laisse pas l’électricité chauffer.',
      'It stands 1.50 m above the floor, set to 20 °C: when the wall gives enough, it does not let the electricity heat.',
    ),
    description: lf(
      'Les pièces des maisons de 1967 sont réglées à 20 °C, avec un thermostat à 1,50 m du sol et un chauffage électrique derrière : ce sont des chiffres de l’article. Le thermostat est le juge de la maison. Tant que la pièce est à 20 °C ou plus, rien ne chauffe, et tout le travail est celui du soleil, du mur et des gens. Dans le modèle il est idéal, il lit l’air de la pièce, et il peut donner jusqu’à {heaterMax} (estimation). Dans la 3D, le cadran suit le réglage de la Simulation, de 16 à 22 °C, et sa lampe s’allume avec l’électricité. Un architecte américain, dans sa maison à mur Trombe, tenait le rez-de-chaussée de 58 à 68 °F, et annonçait 72 % d’économie par rapport à un calcul au gaz.',
      'The rooms of the 1967 houses are set to 20 °C, with a thermostat 1.50 m above the floor and electric heating behind it: these are the paper’s figures. The thermostat is the house’s judge. As long as the room is at 20 °C or more, nothing heats, and all the work is done by the sun, the wall and the people. In the model it is ideal, it reads the room’s air, and it can give up to {heaterMax} (estimate). In the 3D, the dial follows the Simulation’s setting, from 16 to 22 °C, and its lamp lights with the electricity. An American architect, in his own Trombe-wall house, kept the ground floor at 58 to 68 °F, and reported 72 % saved against a calculation for gas.',
    ),
    material: l('Thermostat mural', 'Wall thermostat'),
    specs: [
      sp('Hauteur', 'Height', '1,50 m'),
      sp('Réglage', 'Setting', '20 °C'),
      sp('Réglage de la Simulation', 'Simulation’s setting', l('16 à 22 °C', '16 to 22 °C')),
      sp('Puissance maximale du modèle', 'Model’s maximum power', v('{heaterMax}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un thermostat dans le soleil ou dans le jet lit trop chaud et coupe le chauffage pendant que la pièce est froide. Derrière un rideau ou près d’une porte, il lit trop froid et chauffe pour rien.',
        check:
          'Poser un thermomètre à côté, à la même hauteur, et comparer après une demi-heure sans soleil direct ni courant d’air.',
        care: 'Le garder au niveau de la tête, loin du jet, du soleil et des portes. Le dépoussiérer.',
      },
      {
        failure:
          'A thermostat in the sun or in the jet reads too hot and cuts the heating while the room is cold. Behind a curtain or near a door it reads too cold and heats for nothing.',
        check:
          'Set a thermometer beside it, at the same height, and compare after half an hour with no direct sun or draught.',
        care: 'Keep it at head height, away from the jet, the sun and the doors. Dust it.',
      },
    ),
    tip: lf(
      'Dans la Simulation, passez le thermostat de 20 à 18 °C : la part de la saison que l’électricité ne paie pas monte de {shareAll} à {share18}.',
      'In the Simulation, move the thermostat from 20 to 18 °C: the share of the season that electricity does not pay for climbs from {shareAll} to {share18}.',
    ),
    design: lf(
      'Le thermostat ne fait pas de chaleur : il décide de ce qu’on lui demande. À 18 °C, le modèle trouve {share18} contre {shareAll} à 20 °C pour la même saison. L’architecte américain tenait sa maison plus fraîche encore : ses 72 % ne se comparent pas à ceux d’une pièce à 20 °C.',
      'The thermostat makes no heat: it decides what is asked of it. At 18 °C the model finds {share18} against {shareAll} at 20 °C for the same season. The American architect kept his house cooler still: his 72 % cannot be compared with a room at 20 °C.',
    ),
  },
  {
    id: 'electric-heater',
    scene: 'room',
    category: 'electrical',
    name: l('Radiateur électrique', 'Electric heater'),
    short: l(
      'Le chauffage d’appoint : il paie ce que le soleil, le mur et les gens n’ont pas donné, sur la saison de chauffe.',
      'The backup heating: it pays for what the sun, the wall and the people did not give, over the heating season.',
    ),
    description: lf(
      'L’article dit seulement que les maisons étaient chauffées en partie par le soleil, et pour le reste à l’électricité. Le type du chauffage n’est pas dit : nous dessinons un convecteur sous la fenêtre nord, de {heaterBox} (estimation). Dans le modèle, il est idéal : il monte l’air à la consigne, jusqu’à {heaterMax}. Sa fente s’éclaire quand il consomme, comme la lampe du tableau et celle du thermostat. Du 1er octobre au 20 mai, le modèle lui fait payer {shareElectricity} de la charge de chauffage, soit environ {seasonElecKwh} sur {seasonLoadKwh} (résultat du modèle, avec le soleil et l’air de 2005 à 2023). Ce que la maison ne paie pas : le mur seul couvre {shareWall} de cette charge, avec les fenêtres {shareWindows}, avec les gens {shareAll}.',
      'The paper only says the houses were heated partly by the sun, and for the rest by electricity. The type of heater is not said: we draw a convector under the north window, {heaterBox} (estimate). In the model it is ideal: it brings the air up to the set point, up to {heaterMax}. Its slot lights when it draws current, like the panel’s lamp and the thermostat’s. From 1 October to 20 May the model has it pay for {shareElectricity} of the heating load, about {seasonElecKwh} of {seasonLoadKwh} (model result, with the sun and air of 2005 to 2023). What the house does not pay: the wall alone covers {shareWall} of that load, with the windows {shareWindows}, with the people {shareAll}.',
    ),
    material: l('Convecteur électrique, dessin générique', 'Electric convector, a generic drawing'),
    specs: [
      sp('Dessin', 'Drawing', v('{heaterBox}')),
      sp('Puissance maximale du modèle', 'Model’s maximum power', v('{heaterMax}')),
      sp('Électricité, sur la saison', 'Electricity, over the season', v('{shareElectricity}')),
      sp('Mur par l’air, par la conduction', 'Wall by air, by conduction', v('{shareWallAir}, {shareWallConduction}')),
      sp('Fenêtres, occupants', 'Windows, occupants', v('{shareWindowLine}, {sharePeople}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un appareil qui ne coupe pas, ou qui reste froid quand le thermostat l’appelle : le fil, le thermostat ou l’appareil lui-même. La poussière sur la grille donne une odeur de chaud à la première montée en puissance.',
        check:
          'Le soir d’une journée sans soleil, la pièce doit rester près de la consigne, et l’appareil chauffer. S’il reste froid alors que la pièce descend, on cherche la panne.',
        care: 'Dépoussiérer la grille sans eau. Rien dessus, rien devant.',
      },
      {
        failure:
          'An appliance that will not cut out, or stays cold when the thermostat calls it: the wire, the thermostat or the appliance itself. Dust on the grille gives a smell of warmth at the first rise in power.',
        check:
          'On the evening of a day with no sun, the room should stay near the set point and the appliance should heat. If it stays cold while the room falls, look for the fault.',
        care: 'Dust the grille without water. Nothing on it, nothing in front.',
      },
    ),
    tip: l(
      'Dans la Simulation, lancez « Isoler d’abord » : rien ne change sur le mur, et l’électricité paie beaucoup moins, parce que la maison perd moins.',
      'In the Simulation, run “Insulate first”: nothing changes on the wall, and electricity pays far less, because the house loses less.',
    ),
    design: lf(
      'Les lignes du bilan, en part de la charge : mur par l’air {shareWallAir}, mur par conduction {shareWallConduction}, fenêtres {shareWindowLine}, gens {sharePeople}, électricité {shareElectricity}. Elles font {linesSum} : un peu de ce qui entre est perdu par une maison plus chaude. Les inventeurs annoncent 60 à 70 % pour Odeillo, un modèle de 1978 autour de 40 %. Le modèle atteint le bas de la fourchette des inventeurs si l’air du site est plus chaud de 5 K que celui du calcul de référence ({share5K}). Il dit lequel, il ne tranche pas.',
      'The lines of the balance, as a share of the load: wall by air {shareWallAir}, wall by conduction {shareWallConduction}, windows {shareWindowLine}, people {sharePeople}, electricity {shareElectricity}. They add to {linesSum}: a little of what comes in is lost by a warmer house. The inventors report 60 to 70 % for Odeillo, a model of 1978 around 40 %. The model reaches the bottom of the inventors’ range only if the site’s air is 5 K warmer than the reference calculation’s ({share5K}). It says which, and does not settle it.',
    ),
  },
  {
    id: 'electric-panel',
    scene: 'room',
    category: 'electrical',
    name: l('Tableau électrique', 'Electric panel'),
    short: l(
      'Le coffret où arrive le courant : sa petite lampe est allumée quand le chauffage d’appoint consomme.',
      'The cabinet where the current arrives: its small lamp is on when the backup heating draws power.',
    ),
    description: lf(
      'L’article ne parle pas du tableau : c’est notre dessin, un coffret de {panelBox}, accroché à une cloison (estimation). Le courant y arrive du plafond par une gaine souple, et part vers le radiateur par un conduit. Sa lampe suit le modèle : elle brille quand le thermostat appelle le chauffage. Pour le visiteur, elle dit si l’électricité travaille ou si le soleil et le mur suffisent. Sur une saison, le modèle en tire {seasonElecKwh}, soit {shareElectricity} de la charge.',
      'The paper does not speak of the panel: it is our drawing, a cabinet of {panelBox}, hung on a partition (estimate). The current arrives from the ceiling through a flexible sheath, and leaves for the heater through a conduit. Its lamp follows the model: it shines when the thermostat calls for heating. For the visitor it says whether the electricity is working or whether the sun and the wall are enough. Over a season the model draws {seasonElecKwh} from it, or {shareElectricity} of the load.',
    ),
    material: l('Coffret métallique, dessin générique', 'Metal cabinet, a generic drawing'),
    specs: [
      sp('Dessin', 'Drawing', v('{panelBox}')),
      sp('Lampe', 'Lamp', l('allumée quand l’électricité chauffe', 'on when electricity heats')),
      sp('Électricité, sur la saison', 'Electricity, over the season', v('{seasonElecKwh}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un coffret qui chauffe, un disjoncteur qui saute à chaque grand froid, un fil qui noircit : ce sont les signes d’une installation trop juste pour la saison la plus froide.',
        check:
          'La lampe doit s’allumer et s’éteindre avec le thermostat. Une lampe qui reste allumée dans une pièce chaude dit une panne.',
        care: 'Fermé et étiqueté ; son contrôle est le travail d’un électricien.',
      },
      {
        failure:
          'A cabinet that heats, a breaker that trips at every hard frost, a wire that blackens: these are the signs of an installation too tight for the coldest season.',
        check:
          'The lamp should light and go out with the thermostat. A lamp that stays on in a warm room says a fault.',
        care: 'Closed and labelled; checking it is an electrician’s work.',
      },
    ),
    tip: l(
      'Dans la Simulation, regardez la lampe du tableau pendant qu’un jour passe : elle suit l’appel du thermostat.',
      'In the Simulation, watch the panel’s lamp while a day goes by: it follows the thermostat’s call.',
    ),
    design: l(
      'Ce n’est pas la partie la plus intéressante de la maison, et c’est exprès : le tableau dit seulement combien il a fallu payer. Le mur, lui, ne s’y compte pas.',
      'It is not the most interesting part of the house, and that is on purpose: the panel only says how much had to be paid. The wall does not count itself there.',
    ),
  },
  {
    id: 'room-air-probe',
    scene: 'room',
    category: 'electrical',
    name: l('Sonde d’air', 'Air probe'),
    short: l(
      'Un thermocouple suspendu au plafond par son câble : il lit l’air de la pièce, que le mur et le thermostat jugent.',
      'A thermocouple hung from the ceiling by its cable: it reads the room’s air, which the wall and the thermostat are judged by.',
    ),
    description: l(
      'Pour savoir ce que le mur donne, il faut connaître l’air de la pièce près de lui : c’est l’écart entre cette face et cet air qui fait les courants. Nous n’avons pas lu où, ni avec quoi, les auteurs de l’article lisaient cet air. Notre dessin suspend une sonde au plafond par son câble, et le fil descend le long du mur jusqu’à la boîte de jonction (estimation). C’est ce que le modèle appelle l’air de la pièce, tenu à 20 °C par le thermostat, qui le voit à sa propre hauteur de 1,50 m. Dans la 3D, la sonde pend dans l’air, à l’écart du jet.',
      'To know what the wall gives, you need the room’s air near it: it is the gap between this face and this air that makes the currents. We have not read where, nor with what, the paper’s authors read this air. Our drawing hangs a probe from the ceiling by its cable, and the wire runs down the wall to the junction box (estimate). It is what the model calls the room’s air, held at 20 °C by the thermostat, which sees it at its own height of 1.50 m. In the 3D the probe hangs in the air, clear of the jet.',
    ),
    material: l('Thermocouple et câble', 'Thermocouple and cable'),
    specs: [
      sp('Lit', 'Reads', l('l’air de la pièce', 'the room’s air')),
      sp('Consigne de la pièce', 'Room’s set point', '20 °C'),
      sp('Place', 'Place', l('suspendue, estimée', 'hung, estimated')),
    ],
    maintenance: maint(
      {
        failure:
          'Une sonde dans le jet, au soleil ou près du mur lit autre chose que l’air de la pièce : elle lit sa propre chaleur. Un câble qui bouge fait bouger la lecture.',
        check: 'La comparer à un thermomètre posé à côté, à la même hauteur, après une demi-heure sans soleil direct.',
        care: 'La garder à l’ombre et loin du jet. Fixer son câble, pour qu’elle ne balance pas.',
      },
      {
        failure:
          'A probe in the jet, in the sun or near the wall reads something other than the room’s air: it reads its own warmth. A cable that moves makes the reading move.',
        check: 'Compare it with a thermometer set beside it at the same height, after half an hour with no direct sun.',
        care: 'Keep it in shade and away from the jet. Fix its cable, so it does not swing.',
      },
    ),
    tip: l(
      'Isolez la sonde : elle pend à l’écart de tout, et son câble court le long du plafond puis du mur.',
      'Isolate the probe: it hangs clear of everything, and its cable runs along the ceiling and then the wall.',
    ),
    design: l(
      'La pièce du modèle a un seul air, une seule température : les quatre pièces de l’article n’en font qu’une. Cette sonde est donc la seule de la maison, là où la réalité en aurait quatre, une par thermostat.',
      'The model’s room has a single air, a single temperature: the paper’s four rooms make only one. This probe is therefore the house’s only one, where reality would have four, one for each thermostat.',
    ),
  },
  {
    id: 'room-surface-probes',
    scene: 'room',
    category: 'electrical',
    name: l('Sondes de surface', 'Surface probes'),
    short: l(
      'Des sondes collées au mur et au sol : elles donnent la température des autres surfaces, celles que le mur chaud voit.',
      'Probes stuck on the wall and the floor: they give the temperature of the other surfaces, those the warm wall sees.',
    ),
    description: lf(
      'Un mur chaud rayonne vers tout ce qu’il voit : le sol, le plafond, les murs voisins. Ce qu’il donne dépend de leur température, que l’article appelle T_ref, et qu’il écrit avec une émissivité de 0,94 partout. Pour le modèle, les autres surfaces de la pièce sont à {surfacesT} en moyenne sur les jours enregistrés, et les propres chiffres de l’article en impliquent environ {surfacesSource}. Les deux s’accordent à un demi-degré près. Les deux sondes de notre dessin, une sur la face intérieure et une au sol, sont les nôtres : nous n’avons pas lu où l’article lisait.',
      'A warm wall radiates towards everything it sees: the floor, the ceiling, the neighbouring walls. What it gives depends on their temperature, which the paper calls T_ref, and which it writes with an emissivity of 0.94 everywhere. For the model, the room’s other surfaces are at {surfacesT} on average over the recorded days, and the paper’s own figures imply about {surfacesSource}. The two agree to within half a degree. The two probes in our drawing, one on the inner face and one on the floor, are ours: we have not read where the paper read.',
    ),
    material: l('Thermocouples de surface', 'Surface thermocouples'),
    specs: [
      sp('Autres surfaces, modèle', 'Other surfaces, model', v('{surfacesT}')),
      sp('Température impliquée par l’article', 'Temperature implied by the paper', v('{surfacesSource}')),
      sp('Émissivité', 'Emissivity', '0,94'),
    ],
    maintenance: maint(
      {
        failure:
          'Une sonde mal collée lit l’air derrière elle, pas la surface ; un ruban qui se décolle, et la lecture saute. Au soleil, elle lit surtout la lumière qu’elle reçoit.',
        check:
          'La main à plat à côté de la sonde : la surface doit être de la tiédeur que la sonde lit. Une grosse différence dit qu’elle ne touche pas.',
        care: 'La coller à plat, la couvrir d’un petit isolant, la tenir à l’ombre.',
      },
      {
        failure:
          'A badly stuck probe reads the air behind it, not the surface; a tape that lifts, and the reading jumps. In the sun it mostly reads the light it receives.',
        check:
          'A flat hand beside the probe: the surface should be as warm as what the probe reads. A big difference says it is not touching.',
        care: 'Stick it flat, cover it with a small insulator, keep it in shade.',
      },
    ),
    tip: l(
      'Isolez les sondes de surface : l’une est sur la face intérieure, l’autre au sol, et leurs fils rejoignent la boîte de jonction.',
      'Isolate the surface probes: one is on the inner face, the other on the floor, and their leads reach the junction box.',
    ),
    design: l(
      'Le modèle garde toutes les autres surfaces à une seule température, à peu près 18 °C : une pièce réelle a un plafond plus chaud que son sol. Le calcul s’en tire, mais il ne voit pas les écarts de la pièce.',
      'The model keeps all the other surfaces at a single temperature, about 18 °C: a real room has a ceiling warmer than its floor. The calculation gets by, but it does not see the room’s differences.',
    ),
  },
  {
    id: 'chart-recorder',
    scene: 'room',
    category: 'electrical',
    name: l('Enregistreur', 'Chart recorder'),
    short: l(
      'Un tracé sur papier : la plume suit la face intérieure, et le papier avance avec le jour. C’est ainsi qu’on lit la vague.',
      'A trace on paper: the pen follows the inner face, and the paper creeps with the day. That is how the wave is read.',
    ),
    description: lf(
      'L’article parle d’enregistrements, pas d’un appareil : celui-ci, avec son bureau, son tiroir, sa fenêtre et son rouleau, est notre dessin (estimation). Les enregistrements, eux, sont quatre suites de quatre jours : les 22 à 25 décembre 1974 pour le collecteur de 1967, les mêmes jours pour celui de 1974, les 27 à 30 avril 1975 et les 22 à 25 juin 1975. Sur la première, le soleil a donné 20,30, 21,63, 1,14 et 20,04 MJ par mètre carré de mur. La plaque monte vers 63 à 66 °C, l’air sort vers 40 à 43 °C, le débit reste plat vers 20 L/s, et la face intérieure ne bouge presque pas, lu à l’œil sur les courbes. À l’heure de pointe, le soleil fait 3,3 à 3,5 MJ par mètre carré, soit environ 950 W/m². Dans la 3D, la plume suit la face intérieure du modèle, et le papier avance avec le jour.',
      'The paper speaks of recordings, not of an instrument: this one, with its desk, drawer, window and roll, is our drawing (estimate). The recordings themselves are four runs of four days: 22 to 25 December 1974 for the 1967 collector, the same days for the 1974 one, 27 to 30 April 1975 and 22 to 25 June 1975. On the first, the sun gave 20.30, 21.63, 1.14 and 20.04 MJ per square metre of wall. The plate climbs to about 63 to 66 °C, the air leaves at about 40 to 43 °C, the flow stays flat at about 20 L/s, and the inner face hardly moves, read by eye on the curves. At the peak hour the sun gives 3.3 to 3.5 MJ per square metre, or about 950 W/m². In the 3D the pen follows the model’s inner face, and the paper creeps with the day.',
    ),
    material: l(
      'Enregistreur à papier sur un bureau (dessin générique)',
      'Paper chart recorder on a desk (a generic drawing)',
    ),
    specs: [
      sp('Suites enregistrées', 'Runs recorded', l('4 de 4 jours', '4 of 4 days')),
      sp(
        'Soleil, 22 à 25 décembre 1974',
        'Sun, 22 to 25 December 1974',
        l('20,30 ; 21,63 ; 1,14 ; 20,04 MJ/m²', '20.30; 21.63; 1.14; 20.04 MJ/m²'),
      ),
      sp(
        'Pointe du soleil',
        'Peak of the sun',
        l('3,3 à 3,5 MJ/m² par heure, à l’œil', '3.3 to 3.5 MJ/m² an hour, by eye'),
      ),
      sp('Bureau dessiné', 'Desk drawn', v('{recorderBox}')),
    ],
    maintenance: maint(
      {
        failure:
          'La plume qui sèche ou qui bave, le papier qui s’enroule de travers, une horloge qui dérive : on lit un tracé juste sur une heure fausse. Une dérive d’une heure se voit à peine sur le papier, et fausse le délai d’une vague de plusieurs heures.',
        check:
          'Marquer la date et l’heure sur le papier à chaque changement de rouleau, et comparer l’horloge à l’heure légale.',
        care: 'Changer le papier et la plume aux mêmes heures, et noter chaque intervention sur le tracé.',
      },
      {
        failure:
          'The pen that dries or smears, the paper that winds crooked, a clock that drifts: you read a true trace on a wrong hour. A drift of one hour hardly shows on the paper, and falsifies the lag of a wave of several hours.',
        check: 'Mark the date and hour on the paper at each roll change, and compare the clock with legal time.',
        care: 'Change the paper and the pen at the same hours, and note each intervention on the trace.',
      },
    ),
    tip: l(
      'Dans la Simulation, laissez passer un jour en grande vitesse : la plume suit la face intérieure, et le papier avance sous elle.',
      'In the Simulation, let a day pass at speed: the pen follows the inner face, and the paper creeps under it.',
    ),
    design: l(
      'Les auteurs donnent leurs marges d’erreur : 28 % sur la part de l’air, 4 % sur le rayonnement, 20 % sur la convection, 13 % sur le bilan du jour. Sur un mur qui a une mémoire, le bilan d’un seul jour ne veut rien dire : c’est pourquoi ils enregistrent des suites de jours.',
      'The authors give their margins of error: 28 % on the air’s share, 4 % on radiation, 20 % on convection, 13 % on the day’s balance. On a wall with a memory, the balance of a single day means nothing: that is why they record runs of days.',
    ),
  },
  {
    id: 'fresh-air-vent',
    scene: 'room',
    category: 'mechanical',
    name: l('Entrée d’air frais', 'Fresh-air vent'),
    short: l(
      'Une petite grille basse sur le mur nord : derrière elle, nous ne dessinons rien. D’où vient l’air neuf, c’est inconnu.',
      'A small low grille on the north wall: behind it, we draw nothing. Where the fresh air comes from is unknown.',
    ),
    description: lf(
      'La boucle du mur ne renouvelle pas l’air : elle reprend celui de la pièce, à 17 °C près du sol, et le rend plus chaud. Quand l’article dit « air frais », il parle de cet air-là. Une maison a pourtant besoin d’air neuf, et les sources ne disent pas comment il arrivait. Nous dessinons une grille de {freshBox} à {freshHeight} du sol, sur le mur nord (estimation), et rien derrière : ni conduit, ni prise. Le modèle n’a pas de chemin d’air neuf non plus : il fait passer {airChange} dans la maison, une valeur qui sert seulement à partager ses pertes (estimation). Le seul vrai renouvellement qu’on lui voit est celui de la position d’été, où le mur tire l’air de la pièce : de {summerRange}.',
      'The wall’s loop does not renew the air: it takes the room’s own, at 17 °C near the floor, and gives it back warmer. When the paper says “fresh air”, it means that air. A house nonetheless needs new air, and the sources do not say how it arrived. We draw a grille of {freshBox} at {freshHeight} from the floor, on the north wall (estimate), and nothing behind it: no duct, no intake. The model has no fresh-air path either: it passes {airChange} through the house, a value that only serves to split its losses (estimate). The only real renewal it shows is the summer position’s, where the wall draws the room’s air: {summerRange}.',
    ),
    material: l('Grille, derrière laquelle rien n’est dessiné', 'A grille, with nothing drawn behind it'),
    specs: [
      sp('Grille dessinée', 'Grille drawn', v('{freshBox}')),
      sp('Hauteur au sol dessinée', 'Height above the floor drawn', v('{freshHeight}')),
      sp('Air neuf dans le modèle', 'New air in the model', v('{airChange}')),
      sp('Air tiré par la position d’été', 'Air drawn in the summer position', v('{summerRange}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une entrée d’air qu’on bouche pour avoir moins froid : l’air qui n’entre plus reste dehors, et l’air de la pièce vieillit. Ce lab ne sait rien d’une telle entrée dans cette maison.',
        check:
          'Une grille d’entrée laisse sentir un léger courant quand il fait du vent. Si rien n’y passe, elle est bouchée.',
        care: 'Nettoyer la grille et son conduit une fois par saison, et ne jamais la boucher.',
      },
      {
        failure:
          'An air inlet stopped up to feel less cold: the air that no longer comes in stays outside, and the room’s air grows stale. This lab knows nothing of such an inlet in this house.',
        check:
          'An inlet grille lets a slight draught be felt when it is windy. If nothing goes through, it is blocked.',
        care: 'Clean the grille and its duct once a season, and never stop it up.',
      },
    ),
    tip: l(
      'Isolez la grille : elle est seule contre le mur, et il n’y a rien derrière. Dans la Simulation, passez en position d’été pour voir l’air se renouveler.',
      'Isolate the grille: it is alone on the wall, with nothing behind it. In the Simulation, switch to the summer position to see the air renewed.',
    ),
    design: lf(
      'Un architecte américain a noté que sa cheminée brûlait l’air chaud de la pièce et aspirait de l’air froid du dehors : il lui aurait donné une arrivée d’air directe. Le puits canadien du « et si… », un tuyau de {tubeLength} enterré à {tubeDepth}, ferait passer {tubeFlow}. Une vraie entrée ne se devine pas : elle se dessine et se mesure.',
      'An American architect noted that his fireplace burned the room’s warm air and drew in cold air from outside: he would have given it a direct air supply. The “what if…” earth tube, a pipe of {tubeLength} buried at {tubeDepth}, would pass {tubeFlow}. A real inlet cannot be guessed: it is drawn and measured.',
    ),
  },
  {
    id: 'room-floor',
    scene: 'room',
    category: 'structure',
    name: l('Sol', 'Floor'),
    short: l(
      'Une dalle carrelée : le sol, les cloisons et les meubles tiennent ensemble le tiers de ce que tient le mur.',
      'A tiled slab: the floor, the partitions and the furniture together hold a third of what the wall holds.',
    ),
    description: lf(
      'C’est la dalle de la maison, de {slab} d’épaisseur, avec un carrelage (estimation : l’article ne parle ni de l’un ni de l’autre). Le modèle ne lui donne pas de température à elle : le sol, les cloisons, les meubles et la peau intérieure des murs font ensemble une masse de {roomMass} (estimation, de 10 à 40), contre {capMj} pour le mur. C’est un tiers de ce que tient le mur de {massT} : {ringRatio}. Cette masse prend la chaleur du soleil des fenêtres et le rayonnement de la face intérieure, et la rend à l’air. Le sol fait aussi partie de l’enveloppe, et la terre dessous n’a pas de nœud dans le modèle : on ne sait rien de ce qu’elle prend.',
      'It is the house’s slab, {slab} thick, with a tiling (estimate: the paper speaks of neither). The model gives it no temperature of its own: the floor, the partitions, the furniture and the inner skin of the walls together make a mass of {roomMass} (estimate, from 10 to 40), against {capMj} for the wall. That is a third of what the {massT} wall holds: {ringRatio}. This mass takes the heat of the windows’ sun and the radiation of the inner face, and gives it back to the air. The floor is also part of the envelope, and the earth below has no node in the model: nothing is known of what it takes.',
    ),
    material: l('Dalle de béton carrelée, dessin générique', 'Tiled concrete slab, a generic drawing'),
    specs: [
      sp('Épaisseur dessinée', 'Thickness drawn', v('{slab}')),
      sp('Masse de la pièce, modèle', 'Room’s mass, model', v('{roomMass}')),
      sp('Masse du mur', 'Wall’s mass', v('{capMj}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un carrelage qui se fend, de l’humidité qui remonte du sol. Et un tapis épais fait écran : il garde la chaleur pour lui et en rend moins à la pièce.',
        check:
          'Pieds nus : un sol qui reste froid alors que l’air est chaud dit qu’il ne reçoit rien du soleil ni du mur.',
        care: 'Garder le sol dégagé devant le mur et devant la grille basse.',
      },
      {
        failure:
          'A tiling that cracks, damp rising from the ground. And a thick rug screens it: it keeps the warmth to itself and gives less back to the room.',
        check:
          'Barefoot: a floor that stays cold while the air is warm says it receives nothing from the sun nor the wall.',
        care: 'Keep the floor clear in front of the wall and the low grille.',
      },
    ),
    tip: l(
      'Mettez en transparence : le sol s’efface, et l’on voit la dalle et la fondation sous la pièce.',
      'Switch on X-ray: the floor fades, and you see the slab and the foundation beneath the room.',
    ),
    design: lf(
      'Un sol lourd au soleil fait ce que fait le mur, plus vite : c’est le « gain direct ». Dans les pièces d’essai de Los Alamos, en février, ciel clair et sans chauffage, l’air d’une pièce à gain direct a bougé de 38 °F, soit {directGainK}, celui d’une pièce à mur Trombe ventilé de 26 °F, soit {ventsK}, et celui d’une pièce au mur sans évents de 9 °F, soit {noVentsK}. Le mur plus lent bouge moins, et plus tard.',
      'A heavy floor in the sun does what the wall does, faster: it is called direct gain. In the Los Alamos test rooms, in February, clear sky and no heating, the air of a direct-gain room moved by 38 °F, or {directGainK}, that of a room with a vented Trombe wall by 26 °F, or {ventsK}, and that of a room with a wall without vents by 9 °F, or {noVentsK}. The slower wall moves less, and later.',
    ),
  },
  {
    id: 'room-ceiling',
    scene: 'room',
    category: 'structure',
    name: l('Plafond', 'Ceiling'),
    short: l(
      'Le dessous du toit, à près de 4 m en moyenne : c’est là que se masse l’air chaud du jet.',
      'The underside of the roof, nearly 4 m up on average: where the warm air of the jet gathers.',
    ),
    description: lf(
      'Pour 300 m³ sur 76 m², la hauteur moyenne est de {meanHeight} : étrange pour une maison. Une lecture possible est un plafond incliné qui monte vers le capteur de 4,38 m, à vérifier sur la photographie. Notre dessin le fait plat, sous un comble, à {ceilingT} d’épaisseur : des planches et du plâtre sur des solives (estimation). De l’isolant est posé par-dessus. Le conduit du haut a son axe à {ductHigh} du sol, et son jet file juste dessous : l’air chaud s’y amasse. Le thermostat est à 1,50 m, loin de lui. Dans la 3D, le plafond s’efface quand la caméra passe au-dessus, pour laisser voir la pièce.',
      'For 300 m³ over 76 m², the mean height is {meanHeight}: odd for a house. One possible reading is a sloping ceiling rising towards the 4.38 m collector, to be checked on the photograph. Our drawing makes it flat, under a roof void, {ceilingT} thick: boards and plaster on joists (estimate). Insulation is laid over it. The upper duct’s axis is {ductHigh} above the floor, and its jet glides just beneath: the warm air gathers there. The thermostat is at 1.50 m, far from it. In the 3D, the ceiling fades when the camera goes above it, to let the room be seen.',
    ),
    material: l('Planches et plâtre sur solives, dessin générique', 'Boards and plaster on joists, a generic drawing'),
    specs: [
      sp('Hauteur moyenne', 'Mean height', v('{meanHeight}')),
      sp('Épaisseur dessinée', 'Thickness drawn', v('{ceilingT}')),
      sp('Axe du conduit haut, au-dessus du sol', 'Upper duct’s axis, above the floor', v('{ductHigh}')),
    ],
    maintenance: maint(
      {
        failure:
          'Des taches brunes, une isolation tassée ou mouillée au-dessus : c’est là qu’une maison perd sa chaleur, et un plafond haut rend tout contrôle pénible.',
        check:
          'Une échelle et une lampe, en automne : regarder le dessus du plafond et l’isolant. Une vieille tache se voit mieux qu’une fuite fraîche.',
        care: 'Garder l’isolant sec et d’épaisseur égale.',
      },
      {
        failure:
          'Brown stains, insulation slumped or wet above: this is where a house loses its heat, and a high ceiling makes every check a chore.',
        check:
          'A ladder and a lamp, in autumn: look at the top of the ceiling and the insulation. An old stain shows better than a fresh leak.',
        care: 'Keep the insulation dry and of even thickness.',
      },
    ),
    tip: l(
      'Mettez en transparence : le plafond s’efface, et l’on voit l’isolant posé dessus.',
      'Switch on X-ray: the ceiling fades, and you see the insulation laid on top.',
    ),
    design: l(
      'L’article donne un volume et une surface, et c’est tout ce qu’on sait de la hauteur : la forme du plafond est une lecture, pas une donnée.',
      'The paper gives a volume and an area, and that is all we know of the height: the ceiling’s shape is a reading, not a datum.',
    ),
  },
  {
    id: 'armchair',
    scene: 'room',
    category: 'site',
    name: l('Fauteuil', 'Armchair'),
    short: l(
      'Un meuble pour l’échelle : les maisons étaient habitées, et l’article compte les gens dans le chauffage.',
      'A piece of furniture for scale: the houses were lived in, and the paper counts the people in the heating.',
    ),
    description: lf(
      'Les maisons ont été mesurées habitées : c’est la force de l’article, et la difficulté de le lire. Notre salon a donc des meubles, un fauteuil, une table, une bibliothèque, une lampe, un tapis : rien ne dit lesquels. Ce qui compte dans le modèle, ce sont les gens et les appareils, pour {gains} (estimation : personne ne le donne), dont la moitié va dans l’air et la moitié dans les surfaces. Ils font passer la part de la saison de {shareWindows} à {shareAll}. Un fauteuil face au mur du sud reçoit sa chaleur par rayonnement, quelle que soit la température de l’air.',
      'The houses were measured lived in: that is the paper’s strength, and the difficulty of reading it. Our living room therefore has furniture, an armchair, a table, a bookcase, a lamp, a rug: nothing says which. What counts in the model is the people and the appliances, at {gains} (estimate: nobody gives it), half of which goes into the air and half into the surfaces. They take the season’s share from {shareWindows} to {shareAll}. An armchair facing the south wall receives its warmth by radiation, whatever the temperature of the air.',
    ),
    material: l('Bois et tissu, dessin générique', 'Wood and fabric, a generic drawing'),
    specs: [
      sp('Gens et appareils, modèle', 'People and appliances, model', v('{gains}')),
      sp('Part de la charge de la saison', 'Share of the season’s load', v('{sharePeople}')),
      sp(
        'Répartition dans le modèle',
        'Split in the model',
        l('moitié dans l’air, moitié dans les surfaces', 'half into the air, half into the surfaces'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un fauteuil devant la grille basse la bouche ; un canapé contre le mur lui coupe son rayonnement. Les meubles sont les ennemis ordinaires du mur : il n’a aucun moyen de les écarter.',
        check: 'Regardez la pièce du côté du mur : que voit-il ? Si ce sont des dos de meubles, il chauffe leurs dos.',
        care: 'Laisser un passage entre les meubles et le mur, et la grille basse libre.',
      },
      {
        failure:
          'An armchair in front of the low grille stops it up; a sofa against the wall cuts its radiation. Furniture is the wall’s ordinary enemy: it has no way to push it aside.',
        check:
          'Look at the room from the wall’s side: what does it see? If it is the backs of furniture, it heats their backs.',
        care: 'Leave a gap between the furniture and the wall, and keep the low grille clear.',
      },
    ),
    tip: lf(
      'Faites glisser « Occupants et appareils » dans la Simulation, de 0 à 1 000 W : la part de la saison va de {peopleLow} à {peopleHigh}.',
      'Slide “People and appliances” in the Simulation, from 0 to 1,000 W: the season’s share goes from {peopleLow} to {peopleHigh}.',
    ),
    design: lf(
      'Les gens et les fenêtres, dont l’aire n’est publiée par personne, tiennent ensemble environ {windowCarry} de la part de {shareAll} : ce sont deux estimations, et la fiche de la fenêtre au sud le redit en chiffres.',
      'The people and the windows, whose area nobody publishes, together hold about {windowCarry} of the {shareAll} share: they are two estimates, and the south window’s sheet says it again in figures.',
    ),
  },
];
