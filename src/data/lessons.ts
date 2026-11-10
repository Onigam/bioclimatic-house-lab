// The seven lessons (docs/research.md §0.6), each opening on a scenario of the simulation and naming others, so that together they go through all twelve; two quiz questions each. The heart is lesson 5, the film's question, and lesson 2, the slow
// wave. What the model finds is used in place of the research's hand figures (docs/physics.md), and where it does not retrieve a source the lesson says so: the flow twice the recorded one, the split between air and conduction, the winter months'
// efficiency, the reverse flow at night. A model result carries †, an estimate *, a reported figure nothing; « this is a model » is said once, in the simulation panel's note, not here.
import type { Lesson } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, sp, v } from './part-helpers';

export const LESSONS: Lesson[] = [
  {
    id: 'the-black-wall',
    title: l('Le mur noir derrière la vitre', 'The black wall behind the glass'),
    summary: l(
      'Ce que fait le soleil derrière du verre : il chauffe une plaque noire, qui n’a que deux chemins pour se vider, par l’air ou par le béton.',
      'What the sun does behind glass: it heats a black plate, which has only two ways to empty itself, by the air or by the concrete.',
    ),
    body: [
      lf(
        'Le soleil traverse la vitre et tombe sur une peinture noire. Là, il devient chaleur : à midi en hiver, la plaque monte vers 63 à 66 °C, d’après les courbes de décembre 1974 lues à l’œil. Le verre laisse mal repartir cette chaleur, faite de rayons qu’il retient : c’est la moitié du secret. Le modèle calcule les vitres une à une. Avec une seule, le mur ne rend plus que {oneGlass} d’un jour clair de janvier ; avec deux, {twoGlass} ; avec trois, {threeGlass}. C’est le scénario « Une vitre, trois vitres » : la troisième rapporte moins que la deuxième, car elle renvoie aussi plus de soleil.',
        'The sun goes through the glass and falls on black paint. There it becomes heat: at noon in winter the plate climbs to about 63 to 66 °C, according to the December 1974 curves read by eye. Glass lets this heat out poorly, made of rays it holds back: that is half the secret. The model works the sheets out one by one. With a single one, the wall gives back only {oneGlass} of a clear January day; with two, {twoGlass}; with three, {threeGlass}. It is the “One glass, three glasses” scenario: the third brings less than the second, for it also sends back more sun.',
      ),
      lf(
        'Une fois chaude, la plaque n’a que deux chemins. Le premier est l’air : celui de la lame, pris au sol à 17 °C, monte et sort par le conduit du haut vers 40 à 43 °C, à environ 20 L/s par élément. Le second est le béton : la chaleur y entre, et y reste. L’article compte trois courants, celui de l’air, le rayonnement de la face intérieure et sa convection, et donne l’air pour 30 à 35 % du total d’un jour clair. Le modèle en trouve {thermoShare}, et ne ferme pas cet écart : son débit est presque le double de l’enregistrement, et même ramené à 20 L/s il garde {thermoShareK30}.',
        'Once hot, the plate has only two ways. The first is the air: the gap’s, taken at the floor at 17 °C, rises and leaves by the upper duct at about 40 to 43 °C, at about 20 L/s per element. The second is the concrete: the heat goes into it, and stays. The paper counts three streams, the air’s, the radiation of the inner face and its convection, and gives the air as 30 to 35 % of a clear day’s total. The model finds {thermoShare}, and does not close this gap: its flow is almost twice the recording’s, and even brought down to 20 L/s it keeps {thermoShareK30}.',
      ),
      l(
        'Le brevet d’Edward Morse, en 1881, a déjà une plaque noire, du verre et deux ouvertures, en haut et en bas : un chauffage d’air, sans réserve. L’auteur du brevet était zoologiste. Ce que la maison de 1967 ajoute, c’est le mur lourd : 60 cm de béton qui gardent la chaleur dont la pièce n’a pas besoin tout de suite, et la rendent la nuit. Un mur de ce genre porte le nom de Trombe, et le nom de Michel pour l’architecte, mais l’idée de la plaque noire est plus ancienne.',
        'Edward Morse’s patent of 1881 already has a black plate, glass and two openings, at the top and the bottom: an air heater, with no store. The patent’s author was a zoologist. What the 1967 house adds is the heavy wall: 60 cm of concrete that keep the heat the room does not need at once, and give it back at night. A wall of this kind carries Trombe’s name, and Michel’s as the architect, but the idea of the black plate is older.',
      ),
    ],
    figures: [
      sp('Plaque à midi, hiver', 'Plate at noon, winter', l('63 à 66 °C, à l’œil', '63 to 66 °C, by eye')),
      sp('Une, deux, trois vitres', 'One, two, three sheets', v('{oneGlass}, {twoGlass}, {threeGlass}')),
      sp('Part de l’air, enregistrée', 'Air’s share, recorded', l('30 à 35 %', '30 to 35 %')),
      sp('Part de l’air, modèle', 'Air’s share, model', v('{thermoShare}')),
    ],
    formula: 'Q = ṁ · cₚ · (T_sortie − T_entrée)',
    focus: { scene: 'wall', part: 'black-paint', scenario: 'one-glass' },
    quiz: [
      {
        q: l(
          'Dans le modèle, que rapporte une troisième vitre, par rapport à la deuxième ?',
          'In the model, what does a third sheet of glass bring, compared with the second?',
        ),
        choices: [
          l('Presque autant que la deuxième', 'Almost as much as the second'),
          l(
            'Moins : elle garde mieux la chaleur, mais renvoie aussi plus de soleil',
            'Less: it holds the heat better, but also sends back more sun',
          ),
          l('Rien, ni dans un sens ni dans l’autre', 'Nothing, one way or the other'),
        ],
        answer: 1,
        explain: lf(
          'Une vitre rend {oneGlass}, deux {twoGlass}, trois {threeGlass} d’un jour clair de janvier : la troisième ajoute moins, car chaque vitre de plus renvoie un peu plus de soleil.',
          'One sheet gives back {oneGlass}, two {twoGlass}, three {threeGlass} of a clear January day: the third adds less, for each extra sheet sends back a little more sun.',
        ),
      },
      {
        q: l(
          'Qu’ajoute le mur de 1967 à la plaque noire du brevet de Morse ?',
          'What does the 1967 wall add to the black plate of Morse’s patent?',
        ),
        choices: [
          l('Une seconde vitre', 'A second sheet of glass'),
          l('Un clapet pour l’été', 'A flap for summer'),
          l('Une masse de béton qui garde la chaleur', 'A mass of concrete that keeps the heat'),
        ],
        answer: 2,
        explain: l(
          'Morse a la plaque noire, le verre et les ouvertures, mais aucune réserve. La maison de 1967 y met 60 cm de béton, qui gardent la chaleur dont la pièce n’a pas besoin tout de suite.',
          'Morse has the black plate, the glass and the openings, but no store. The 1967 house adds 60 cm of concrete, which keep the heat the room does not need at once.',
        ),
      },
    ],
  },
  {
    id: 'the-slow-wave',
    title: l('La vague lente', 'The slow wave'),
    summary: l(
      'Une vague de chaleur marche dans le béton à 4 cm par heure : à 60 cm, le soleil de midi arrive dans la nuit.',
      'A wave of heat walks through concrete at 4 cm an hour: at 60 cm, the noon sun arrives in the night.',
    ),
    body: [
      lf(
        'Dans un solide, la chaleur ne saute pas : elle diffuse. Avec les chiffres des inventeurs, 2 200 kg/m³, 1,75 W/m·K et 0,22 kcal/kg·K, le calcul classique donne à la vague d’un jour une vitesse de {waveSpeed} et une profondeur d’environ {waveDepth} où elle n’est plus qu’à un tiers de sa taille. À 60 cm, elle met {lag60} et n’arrive plus qu’à {damp60} de sa taille. Les auteurs mesurent 14 à 16 heures, et citent 3,7 à 4 cm/h pour la maçonnerie ordinaire : le calcul à la main retrouve leurs mesures.',
        'In a solid, heat does not leap: it diffuses. With the inventors’ own figures, 2,200 kg/m³, 1.75 W/m·K and 0.22 kcal/kg·K, the classical calculation gives the wave of a day a speed of {waveSpeed} and a depth of about {waveDepth} at which it is down to a third of its size. At 60 cm it takes {lag60} and arrives at only {damp60} of its size. The authors measure 14 to 16 hours, and quote 3.7 to 4 cm/h for ordinary masonry: the calculation by hand finds their measurements again.',
      ),
      lf(
        'Les inventeurs jugent ce délai trop long : le soleil de midi arrive quand la maison dort. À 37 cm, 9 à 10 heures, c’est trop court. Ils voulaient de 40 à 45 cm, et un délai d’environ 12 h. Dans le modèle, la crête arrive côté pièce vers {arrival60} à 60 cm, vers {arrival37} à 37 et vers {arrival45} à 45 : regardez-la dans « Trop épais, trop fin ». Ce que l’épaisseur ne change pas, c’est la quantité : de 15 à 80 cm, la part de la saison reste {thickRange}. Elle décide de l’heure, pas de ce qu’on reçoit.',
        'The inventors judge this lag too long: the noon sun arrives when the house sleeps. At 37 cm, 9 to 10 hours is too short. They wanted 40 to 45 cm, and a lag of about 12 h. In the model the crest arrives on the room side at about {arrival60} at 60 cm, at about {arrival37} at 37 and at about {arrival45} at 45: watch it in “Too thick, too thin”. What thickness does not change is the amount: from 15 to 80 cm the season’s share stays {thickRange}. It decides the hour, not what is received.',
      ),
      lf(
        'Plus le mur est épais, moins la face intérieure bouge : de ± {swing60} à 60 cm, de ± {swing37} à 37 et de ± {swing15} à 15, quand la face noire fait ± {swingOuter} (résultat du modèle). Un mur épais fait une pièce stable ; un mur mince, une pièce qui suit le soleil. Reste l’eau. Dans « Le béton qui sèche », le mur de 1974 a rendu 8 à 10 points de moins que celui de 1967, d’après l’article, parce que son béton coulé sur place était mouillé. Le modèle ne connaît que du béton sec : il donne à ce mur {dry74}, un point de plus que celui de 1967, {eff20}. L’écart mesuré, il ne l’explique pas.',
        'The thicker the wall, the less the inner face moves: by ± {swing60} at 60 cm, ± {swing37} at 37 and ± {swing15} at 15, when the black face moves ± {swingOuter} (model result). A thick wall makes a steady room; a thin wall, a room that follows the sun. That leaves water. In “The concrete that dries”, the 1974 wall gave back 8 to 10 points less than the 1967 one, according to the paper, because its concrete cast in place was wet. The model only knows dry concrete: it gives this wall {dry74}, a point above the 1967 one’s, {eff20}. The measured gap, it does not explain.',
      ),
    ],
    figures: [
      sp('Vitesse de la vague', 'Speed of the wave', v('{waveSpeed}')),
      sp(
        'Délai à 60 cm, mesuré / calculé',
        'Lag at 60 cm, measured / worked out',
        lf('14 à 16 h / {lag60}', '14 to 16 h / {lag60}'),
      ),
      sp(
        'Délai à 37 cm, mesuré / calculé',
        'Lag at 37 cm, measured / worked out',
        lf('9 à 10 h / {lag37}', '9 to 10 h / {lag37}'),
      ),
      sp('Délai à 45 cm, calculé', 'Lag at 45 cm, worked out', v('{lag45}')),
    ],
    formula: 'v = √(2 · α · ω)   avec   α = λ / (ρ · c)',
    focus: { scene: 'wall', part: 'storage-wall', scenario: 'too-thick-too-thin' },
    quiz: [
      {
        q: l(
          'Avec les chiffres des inventeurs, à quelle vitesse la chaleur d’un jour avance-t-elle dans le béton ?',
          'With the inventors’ own figures, how fast does a day’s heat advance in the concrete?',
        ),
        choices: [
          l('Environ 4 cm par heure', 'About 4 cm an hour'),
          l('Environ 4 cm par minute', 'About 4 cm a minute'),
          l('Environ 4 m par heure', 'About 4 m an hour'),
        ],
        answer: 0,
        explain: lf(
          'Le calcul classique donne {waveSpeed} ; l’article cite 3,7 à 4 cm/h pour la maçonnerie ordinaire. Soixante centimètres demandent donc près de quinze heures.',
          'The classical calculation gives {waveSpeed}; the paper quotes 3.7 to 4 cm/h for ordinary masonry. Sixty centimetres therefore take nearly fifteen hours.',
        ),
      },
      {
        q: l('Pourquoi les inventeurs ont-ils jugé 60 cm trop épais ?', 'Why did the inventors judge 60 cm too thick?'),
        choices: [
          l('Il coûtait trop cher', 'It cost too much'),
          l('Le béton ne gardait pas assez de chaleur', 'The concrete did not keep enough heat'),
          l(
            'Le soleil de midi arrivait dans la pièce en pleine nuit, trop tard',
            'The noon sun reached the room in the dead of night, too late',
          ),
        ],
        answer: 2,
        explain: l(
          'Un délai de 14 à 16 heures fait arriver la chaleur après minuit. Ils visaient environ 12 heures, avec 40 à 45 cm. À 37 cm, 9 à 10 heures, c’était trop court.',
          'A lag of 14 to 16 hours brings the heat after midnight. They aimed at about 12 hours, with 40 to 45 cm. At 37 cm, 9 to 10 hours was too short.',
        ),
      },
    ],
  },
  {
    id: 'christmas-eve',
    title: l('Noël 1974 : 478 %', 'Christmas 1974: 478 %'),
    summary: l(
      'Un jour sans soleil, un mur qui rend presque cinq fois ce que le jour lui a donné : ce que veut dire un rendement pour un mur qui a une mémoire.',
      'A day with no sun, a wall that gives back almost five times what the day gave it: what an efficiency means for a wall with a memory.',
    ),
    body: [
      l(
        'Le 24 décembre 1974, le ciel est presque noir : 1 134 kJ de soleil par mètre carré de mur. Le mur en rend 5 424 à la pièce : 478,30 %. Les auteurs écrivent « aberrant ». Ce n’est pas une erreur, c’est un rendement qui n’a pas de sens : le mur rend le soleil de la veille, encore dans le béton. L’article le dit : un bilan demande 24 heures au moins, et mieux vaut des jours de suite. C’est le scénario « Noël 1974 ».',
        'On 24 December 1974 the sky is almost black: 1,134 kJ of sun per square metre of wall. The wall gives 5,424 back to the room: 478.30 %. The authors write “aberrant”. It is not a mistake, it is an efficiency that makes no sense: the wall gives back yesterday’s sun, still in the concrete. The paper says so: a balance takes 24 hours at least, and runs of days are better. It is the “Christmas 1974” scenario.',
      ),
      lf(
        'Le modèle, sur le même soleil, rend {christmasKj}, soit {christmasModel} : le phénomène est retrouvé, le chiffre non, parce que son mur part environ 2 K plus froid que celui de l’enregistrement. Ailleurs, il tient. Le 29 décembre, un jour clair après les nuages, l’article donne 18,88 % et le modèle {dec29Model}. Sur les 20 jours du tableau, 36,7 % pour l’article, {eff20} pour le modèle : le total est retrouvé, pas la façon dont il se partage entre l’air et le béton.',
        'The model, on the same sun, gives back {christmasKj}, or {christmasModel}: the phenomenon is retrieved, the figure is not, because its wall starts about 2 K cooler than the recording’s. Elsewhere, it holds. On 29 December, a clear day after cloud, the paper gives 18.88 % and the model {dec29Model}. Over the 20 days of the table, 36.7 % for the paper, {eff20} for the model: the total is retrieved, not how it divides between the air and the concrete.',
      ),
      lf(
        'Février 1975 raconte la même chose à l’envers. Trois jours de soleil et un jour terne au milieu : ce jour-là, le mur rend environ {febDull} du soleil reçu ; le lendemain, grand soleil, à peine plus de {febNext} : il se recharge d’abord. C’est « Février 1975, un jour terne ». Un rendement d’un seul jour ne dit presque rien d’un mur qui a une mémoire. Il faut le dire à qui annonce « tant pour cent » d’un jour ou d’une mesure.',
        'February 1975 tells the same thing the other way round. Three days of sun and a dull one in the middle: that day the wall gives back about {febDull} of the sun received; the next day, full sun, barely over {febNext}: it recharges first. It is “February 1975, a dull day”. An efficiency for one day alone says next to nothing about a wall with a memory. That is worth telling to anyone who announces “so many per cent” from a single day or measurement.',
      ),
    ],
    figures: [
      sp('Soleil reçu, 24 décembre', 'Sun received, 24 December', '1 134 kJ/m²'),
      sp('Rendu à la pièce', 'Given back to the room', '5 424 kJ/m²'),
      sp('Rendement, article', 'Efficiency, paper', '478,30 %'),
      sp('Rendement, modèle', 'Efficiency, model', v('{christmasModel}')),
    ],
    formula: 'rendement = énergie rendue ÷ énergie reçue (jour entier)',
    focus: { scene: 'room', part: 'inner-wall-face', scenario: 'christmas-1974' },
    quiz: [
      {
        q: l(
          'Le 24 décembre 1974, le mur rend 478 % de ce que le soleil lui a donné ce jour-là. Pourquoi ?',
          'On 24 December 1974, the wall gives back 478 % of what the sun gave it that day. Why?',
        ),
        choices: [
          l('Le pyranomètre était en panne', 'The pyranometer was broken'),
          l('Le mur rend aussi la chaleur des jours d’avant', 'The wall also gives back the heat of the days before'),
          l('La pièce était plus chaude que d’habitude', 'The room was warmer than usual'),
        ],
        answer: 1,
        explain: l(
          'Les auteurs appellent le chiffre « aberrant » : c’est le soleil de la veille, encore dans le béton. Un mur qui a une mémoire n’a pas de rendement d’un seul jour.',
          'The authors call the figure “aberrant”: it is yesterday’s sun, still in the concrete. A wall with a memory has no efficiency for a single day.',
        ),
      },
      {
        q: l('Que faut-il pour juger un mur à mémoire ?', 'What does it take to judge a wall with a memory?'),
        choices: [
          l('Des suites de jours, d’au moins 24 heures chacun', 'Runs of days, at least 24 hours each'),
          l('Une mesure à midi par jour clair', 'One measurement at noon on a clear day'),
          l('Un jour de grand soleil seulement', 'A single day of full sun'),
        ],
        answer: 0,
        explain: l(
          'Les auteurs écrivent qu’un bilan demande 24 heures au moins. Pour un mur qui garde, il faut des jours de suite : celui d’aujourd’hui contient un peu d’hier.',
          'The authors write that a balance takes 24 hours at least. For a wall that keeps, it takes days in a row: today’s holds a little of yesterday’s.',
        ),
      },
    ],
  },
  {
    id: 'low-sun-high-sun',
    title: l('Soleil bas, soleil haut', 'Low sun, high sun'),
    summary: l(
      'Le mur reçoit plus de soleil en janvier qu’en juin : la géométrie fait ce qu’on attendrait d’un auvent, sans rien bouger.',
      'The wall receives more sun in January than in June: geometry does what one would expect of an overhang, with nothing moving.',
    ),
    body: [
      lf(
        'À midi, le soleil frappe un mur vertical plein sud à {sunDec} de sa perpendiculaire en décembre, à {sunJun} en juin. À l’un, la double vitre laisse passer {glassDec} du soleil, à l’autre {glassJun} (résultat du modèle) : le verre en refuse plus quand il est rasant. Un service de données satellite donne, pour ce mur, 129,6 kWh/m² en janvier et 78,7 en juin : {janJun} plus au cœur de l’hiver. En décembre, un toit plat reçoit 58,5 quand le mur en reçoit 126,9, soit {decRoof} de plus. Ce chiffre vient de satellites, pas d’un capteur posé sur ce mur.',
        'At noon the sun strikes a vertical, due-south wall at {sunDec} from its perpendicular in December, at {sunJun} in June. At the one, the double glazing lets {glassDec} of the sun through, at the other {glassJun} (model result): glass refuses more when the light is grazing. A satellite data service gives, for this wall, 129.6 kWh/m² in January and 78.7 in June: {janJun} more in the depth of winter. In December, a flat roof receives 58.5 when the wall receives 126.9, or {decRoof} more. This figure comes from satellites, not from a sensor on this wall.',
      ),
      lf(
        'Pas de volet, pas de mécanisme : le soleil change seulement de hauteur. L’article le dit à sa façon : le rendement du collecteur est d’environ 36 % l’hiver et de 15 % en juin, lu à l’œil sur sa courbe de l’année. Le modèle retrouve la baisse de l’hiver à mai-juin, mais plus petite : {monthFall} contre 18 lus. Ses mois d’hiver sont {winterLowPts} trop bas, ses mois d’été {summerHighPts} trop hauts, sans que nous sachions pourquoi. Le modèle ne calque pas l’article, et il le dit.',
        'There is no shutter and no mechanism: the sun only changes height. The paper says it in its way: the collector’s efficiency is about 36 % in winter and 15 % in June, read by eye on its curve for the year. The model finds the fall from winter to May–June, but smaller: {monthFall} against 18 read. Its winter months are {winterLowPts} too low, its summer months {summerHighPts} too high, and we do not know why. The model does not trace the paper, and says so.',
      ),
      lf(
        'Avril 1975 : le soleil monte, le mur reçoit environ 16 MJ/m², moins qu’en hiver, et la face extérieure n’atteint plus que {april44} environ ; les rendements tombent vers {april27}, juste quand la maison a moins besoin de chauffage (« Avril 1975 »). Puis juin, avec le clapet en position d’été : le même mur tire l’air de la maison dehors, {summerRange}, quand l’enregistrement donne environ 2. À cette altitude la maison a peu de chaleur à combattre, et le modèle la refroidit même trop : la pièce descend à {juneRoomRange} (« Juin 1975, position d’été »).',
        'April 1975: the sun climbs, the wall receives about 16 MJ/m², less than in winter, and the outer face only reaches about {april44}; efficiency falls to about {april27}, just when the house needs less heating (“April 1975”). Then June, with the flap in the summer position: the same wall draws the house’s air outside, {summerRange}, when the recording gives about 2. At this altitude the house has little heat to fight, and the model even cools it too far: the room falls to {juneRoomRange} (“June 1975, the summer position”).',
      ),
    ],
    figures: [
      sp('Soleil de midi, décembre / juin', 'Noon sun, December / June', v('{sunDec} / {sunJun}')),
      sp('Verre à midi, décembre / juin', 'Glass at noon, December / June', v('{glassDec} / {glassJun}')),
      sp('Soleil sur le mur, janvier / juin', 'Sun on the wall, January / June', '129,6 / 78,7 kWh/m²'),
      sp('Janvier sur juin', 'January over June', v('{janJun}')),
    ],
    formula: 'incidence à midi = 90° − (latitude − déclinaison)',
    focus: { scene: 'house', part: 'south-facade', scenario: 'june-1975' },
    quiz: [
      {
        q: l(
          'Pourquoi le mur reçoit-il plus de soleil en janvier qu’en juin ?',
          'Why does the wall receive more sun in January than in June?',
        ),
        choices: [
          l('Un auvent l’ombrage l’été', 'An overhang shades it in summer'),
          l('Le ciel est plus clair en janvier', 'The sky is clearer in January'),
          l(
            'Le soleil d’hiver, plus bas, le frappe presque de face, celui d’été arrive de biais',
            'The winter sun, lower, strikes it almost head on, the summer sun arrives at a slant',
          ),
        ],
        answer: 2,
        explain: lf(
          'À midi, 24° de la perpendiculaire en décembre, 71° en juin : le mur reçoit {janJun} plus en janvier qu’en juin. C’est la géométrie, pas un auvent.',
          'At noon, 24° from the perpendicular in December, 71° in June: the wall receives {janJun} more in January than in June. It is geometry, not an overhang.',
        ),
      },
      {
        q: l(
          'À midi en juin, que laisse passer la double vitre du modèle, par rapport à décembre ?',
          'At noon in June, what does the model’s double glazing let through, compared with December?',
        ),
        choices: [
          lf('Moins : {glassJun} contre {glassDec}', 'Less: {glassJun} against {glassDec}'),
          l('Autant', 'The same'),
          l('Plus, parce que le soleil est plus haut', 'More, because the sun is higher'),
        ],
        answer: 0,
        explain: l(
          'Un soleil rasant se reflète davantage sur une vitre : elle en refuse plus. Voilà la moitié du secret de l’été : le mur n’en est pas ombragé, il en reçoit moins.',
          'A grazing sun reflects more off a pane: it refuses more. That is half of summer’s secret: the wall is not shaded, it simply receives less.',
        ),
      },
    ],
  },
  {
    id: 'can-a-house-heat-itself',
    title: l('Une maison peut-elle se chauffer seule ?', 'Can a house heat itself?'),
    summary: l(
      'Qui dit 60 à 70 %, qui dit 40, et ce que le modèle trouve, ligne par ligne : le mur, les fenêtres, les gens, l’électricité.',
      'Who says 60 to 70 %, who says 40, and what the model finds, line by line: the wall, the windows, the people, the electricity.',
    ),
    body: [
      l(
        'Les inventeurs écrivent que le soleil couvre de 60 à 70 % du chauffage à Odeillo, selon les années, et de 35 à 45 % à Chauvency, dans la Meuse : ils l’annoncent comme connu, sans le montrer dans leur article. Un collègue, au même colloque, estime 75 à 90 %, sans méthode. Une simulation de 1978 donne autour de 40 % pour l’hiver. Une encyclopédie, d’après un livre de 2013, dit 70 %. Un architecte américain annonce 72 % d’économie sur un calcul au gaz, dans sa propre maison, tenue plus fraîche que 20 °C. Personne ne dit si les fenêtres comptent, ni le réglage.',
        'The inventors write that the sun covers 60 to 70 % of the heating at Odeillo, depending on the year, and 35 to 45 % at Chauvency, in the Meuse: they announce it as known, without showing it in their paper. A colleague at the same conference estimates 75 to 90 %, with no method. A simulation of 1978 gives around 40 % for the winter. An encyclopaedia, from a book of 2013, says 70 %. An American architect reports 72 % saved against a calculation for gas, in his own house, kept cooler than 20 °C. Nobody says whether the windows count, nor the setting.',
      ),
      lf(
        'Le modèle compte autrement : la part de la saison de chauffe que l’électricité ne paie pas. Le mur seul, {shareWall} ; avec les fenêtres, {shareWindows} ; avec les gens, {shareAll} (soleil et air de 2005 à 2023, {windowsM2} de fenêtres et {gains} de gens, deux estimations). Les lignes de la charge : mur par l’air {shareWallAir}, par conduction {shareWallConduction}, fenêtres {shareWindowLine}, gens {sharePeople}, électricité {shareElectricity}. Le modèle atteint le bas de la fourchette des inventeurs, {share5K}, si l’air du site est plus chaud de 5 K que celui du calcul : leurs jours clairs font en moyenne 5 °C, et la grille du calcul lit peut-être froid dans une vallée.',
        'The model counts differently: the share of the heating season that electricity does not pay for. The wall alone, {shareWall}; with the windows, {shareWindows}; with the people, {shareAll} (sun and air of 2005 to 2023, {windowsM2} of windows and {gains} of people, two estimates). The lines of the load: wall by air {shareWallAir}, by conduction {shareWallConduction}, windows {shareWindowLine}, people {sharePeople}, electricity {shareElectricity}. The model reaches the bottom of the inventors’ range, {share5K}, if the site’s air is 5 K warmer than the calculation’s: their clear days average 5 °C, and the calculation’s grid may read cold in a valley.',
      ),
      lf(
        'Ce qui bouge le plus la part : l’isolation, le climat, l’air, les gens et les fenêtres. Ce qui la bouge à peine : l’épaisseur du mur, le débit, la peinture. Avec l’isolation de 1974, le mur est le même et la maison perd moins : {share1974} (« Isoler d’abord »). À Chauvency (« Sous les nuages de la Meuse »), le même modèle donne {chauvency}, là où les inventeurs annoncent 35 à 45 % pour leur maison de là-bas, dont il ignore l’isolation. Ni le mur seul, ni le seul modèle ne tranchent : la réponse honnête est « une bonne part, selon qui compte, et quoi ».',
        'What moves the share most: insulation, climate, the air, the people and the windows. What hardly moves it: the wall’s thickness, the flow, the paint. With the insulation of 1974, the wall is the same and the house loses less: {share1974} (“Insulate first”). At Chauvency (“Under the clouds of the Meuse”), the same model gives {chauvency}, where the inventors report 35 to 45 % for their house there, whose insulation it does not know. Neither the wall alone nor the model alone settles it: the honest answer is “a good part, depending on who counts, and what”.',
      ),
      lf(
        'L’autre route : la maison passive de Darmstadt, de 1991, suivie 25 ans. Elle a de l’isolation, de l’étanchéité à l’air et une ventilation avec récupération d’environ 80 % de la chaleur. Son chauffage mesuré tombe sous 10 kWh par m² et par an après deux ans, contre environ 170 pour une maison allemande moyenne, et sa puissance ne dépasse jamais 7,4 W/m², soit {hairDryer} pour 156 m² : moins qu’un sèche-cheveux. Pas de mur noir : l’autre école, qui compte autrement.',
        'The other road: the passive house at Darmstadt, of 1991, followed for 25 years. It has insulation, airtightness and a ventilation with recovery of about 80 % of the heat. Its measured heating falls under 10 kWh per m² a year after two years, against about 170 for an average German house, and its power never exceeds 7.4 W/m², or {hairDryer} for 156 m²: less than a hair dryer. No black wall: the other school, which counts differently.',
      ),
    ],
    figures: [
      sp('Les inventeurs, Odeillo', 'The inventors, Odeillo', l('60 à 70 %', '60 to 70 %')),
      sp(
        'Le modèle : mur, fenêtres, gens',
        'The model: wall, windows, people',
        v('{shareWall}, {shareWindows}, {shareAll}'),
      ),
      sp('Même saison, air 5 K plus chaud', 'Same season, air 5 K warmer', v('{share5K}')),
      sp('Même maison, isolation de 1974', 'Same house, 1974 insulation', v('{share1974}')),
    ],
    formula: 'part = 1 − électricité ÷ (G · V · ΣΔT)',
    focus: { scene: 'room', part: 'electric-heater', scenario: 'insulate-first' },
    quiz: [
      {
        q: l(
          'Que compte au juste le « 60 à 70 % » des inventeurs ?',
          'What exactly does the inventors’ “60 to 70 %” count?',
        ),
        choices: [
          l('Seulement le mur, sans les fenêtres', 'Only the wall, without the windows'),
          l(
            'On ne sait pas : ni la période, ni le réglage, ni les fenêtres ne sont dits',
            'We do not know: neither the period, nor the setting, nor the windows are given',
          ),
          l('Toute l’année, électricité comprise', 'The whole year, electricity included'),
        ],
        answer: 1,
        explain: l(
          'Le chiffre est annoncé comme connu, sans être montré. Le modèle sépare donc quatre lignes, le mur, les fenêtres, les gens, l’électricité, plutôt que de le deviner.',
          'The figure is announced as known, without being shown. The model therefore separates four lines, the wall, the windows, the people, the electricity, rather than guess it.',
        ),
      },
      {
        q: l(
          'Quand le modèle isole la maison comme en 1974, sans toucher au mur, la part de la saison…',
          'When the model insulates the house as in 1974, without touching the wall, the season’s share…',
        ),
        choices: [
          l('ne bouge presque pas', 'hardly moves'),
          l('baisse, car la maison garde plus de chaleur', 'falls, since the house keeps more heat'),
          lf('monte de {shareAll} à {share1974}', 'rises from {shareAll} to {share1974}'),
        ],
        answer: 2,
        explain: l(
          'Le mur est le même, avec le même soleil : c’est la maison qui perd moins. Isoler d’abord fait monter la part, sans un rayon de plus.',
          'The wall is the same, with the same sun: it is the house that loses less. Insulating first lifts the share, without one more ray.',
        ),
      },
    ],
  },
  {
    id: 'the-night',
    title: l('La nuit : un courant qui descend', 'The night: a flow that falls'),
    summary: l(
      'Quand le soleil s’éteint, l’air de la lame peut redescendre vers la pièce : le modèle le trouve, les courbes de 1967 ne le montrent pas.',
      'When the sun goes out, the gap’s air can fall back towards the room: the model finds it, the 1967 curves do not show it.',
    ),
    body: [
      lf(
        'Après le coucher du soleil, la lame se refroidit contre la vitre. Au petit matin, l’air qui y reste est plus lourd que celui de la pièce, et le modèle le laisse tomber : c’est « La nuit ». Il trouve un courant inverse d’environ {reverseFlow} par élément, pendant {reverseHours}, sur une nuit claire de décembre, et davantage après un temps nuageux. Il coûte peu : {reverseKwh} par nuit. Un clapet à sens unique le coupe et rapporte {flapPoint} de part.',
        'After sunset the gap cools against the glass. Before dawn the air left in it is heavier than the room’s, and the model lets it fall: it is “The night”. It finds a reverse flow of about {reverseFlow} per element, for {reverseHours}, on a clear December night, and more after cloudy weather. It costs little: {reverseKwh} a night. A one-way flap cuts it and brings {flapPoint} of share.',
      ),
      l(
        'Qui l’a vu ? Un autre constructeur, à Princeton, l’a vécu dès son premier hiver : de l’air de la pièce sortait chaud par les évents du haut et revenait plus frais par le bas. Un clapet doit le guérir, écrit-il. Dans les enregistrements de 1967, l’anémomètre lit de −60 à +60 cm/s et ne montre aucun courant négatif ; un collègue écrit, d’un panneau des bureaux du CNRS, qu’il n’y en a pas la nuit. Le modèle est en désaccord avec les courbes. Il est à une dimension, sans échange dans un conduit à faible débit, ce qui peut expliquer pourquoi on n’en voit pas. Il garde son résultat, et le dit.',
        'Who saw it? Another builder, at Princeton, lived with it from his first winter: the room’s air left warm by the upper vents and came back cooler by the bottom. A damper is to cure it, he writes. In the 1967 recordings the anemometer reads from −60 to +60 cm/s and shows no negative flow; a colleague writes, of a panel on the CNRS offices, that there is none at night. The model disagrees with the curves. It is one-dimensional, with no two-way exchange in a duct at low flow, which may explain why none is seen. It keeps its result, and says so.',
      ),
      lf(
        'Des pièces d’essai de Los Alamos, en février, ciel clair, sans chauffage, montrent ce que valent les ouvertures. Un mur ventilé fait bouger l’air de la pièce de 26 °F, soit {ventsK}, avec un maximum à 16 h ; le même mur sans évents, de 9 °F, soit {noVentsK}, avec un maximum à 22 h. C’est le scénario « Sans ouvertures » : le modèle trouve {ventsOpen} avec les ouvertures ouvertes, et {ventsShut} fermées. Moins de chaleur en tout, mais plus tard : à vous de choisir. L’auteur de la mesure prévient que ces pièces d’essai sont plus extrêmes qu’une vraie maison.',
        'Test rooms at Los Alamos, in February, clear sky, no heating, show what the openings are worth. A vented wall makes the room’s air move by 26 °F, or {ventsK}, with a peak at 4 in the afternoon; the same wall with no vents, by 9 °F, or {noVentsK}, with a peak at 10 at night. It is the “No vents” scenario: the model finds {ventsOpen} with the vents open, and {ventsShut} shut. Less heat overall, but later: your choice. The author of the measurement warns that these test rooms are more extreme than a real house.',
      ),
    ],
    figures: [
      sp('Courant inverse, modèle', 'Reverse flow, model', v('{reverseFlow}')),
      sp('Durée', 'Duration', v('{reverseHours}')),
      sp('Coût par nuit', 'Cost per night', v('{reverseKwh}')),
      sp('Gain d’un clapet à sens unique', 'Gain of a one-way flap', v('{flapPoint}')),
    ],
    formula: 'Δp = g · H · (ρ_froid − ρ_chaud)',
    focus: { scene: 'wall', part: 'summer-flap', scenario: 'the-night' },
    quiz: [
      {
        q: l('Qu’est-ce qu’un courant inverse, ici ?', 'What is a reverse flow, here?'),
        choices: [
          l('La pièce qui chauffe la lame', 'The room heating the gap'),
          l('Le vent qui entre par le clapet', 'The wind entering by the flap'),
          l(
            'L’air de la lame qui redescend vers la pièce, la nuit',
            'The gap’s air falling back towards the room, at night',
          ),
        ],
        answer: 2,
        explain: l(
          'La lame se refroidit contre la vitre, son air devient plus lourd que celui de la pièce, et il tombe : la boucle tourne à l’envers.',
          'The gap cools against the glass, its air grows heavier than the room’s, and it falls: the loop turns backwards.',
        ),
      },
      {
        q: l(
          'Les courbes de 1967 n’en montrent aucun, le modèle en trouve un. Que fait ce lab ?',
          'The 1967 curves show none, the model finds one. What does this lab do?',
        ),
        choices: [
          l('Il règle le modèle pour qu’il disparaisse', 'It adjusts the model so that it vanishes'),
          l(
            'Il garde le résultat, et dit qu’il ne s’accorde pas aux courbes',
            'It keeps the result, and says it does not agree with the curves',
          ),
          l('Il cache le désaccord', 'It hides the disagreement'),
        ],
        answer: 1,
        explain: l(
          'Un modèle réglé sur ce qu’on en attend ne vaut rien. Ici, le courant inverse reste, avec la raison possible du désaccord : un modèle à une dimension, sans échange dans le conduit.',
          'A model tuned to what is expected of it is worth nothing. Here the reverse flow stays, with the possible reason for the disagreement: a one-dimensional model, with no exchange in the duct.',
        ),
      },
    ],
  },
  {
    id: 'fresh-air-and-the-ground',
    title: l('L’air neuf et le sol', 'Fresh air and the ground'),
    summary: l(
      'La boucle du mur ne renouvelle pas l’air. Un puits canadien, ici un « et si… » : ce qu’il ferait à 1 550 m, et ce qu’il demande.',
      'The wall’s loop does not renew the air. An earth tube, here a “what if…”: what it would do at 1,550 m, and what it asks.',
    ),
    body: [
      l(
        'Une boucle qui reprend l’air de la pièce ne renouvelle rien : dans l’article, « air frais » veut dire l’air frais de la pièce. Une maison a pourtant besoin d’air neuf, et nos sources ne disent pas comment il arrivait ici. Un architecte américain a vu sa cheminée brûler l’air chaud de sa pièce et tirer l’air froid du dehors. La position d’été, elle, renouvelle l’air, mais c’est le mur qui le tire dehors. Reste à décider d’où il entre.',
        'A loop that takes the room’s air back renews nothing: in the paper, “fresh air” means the room’s cool air. A house nonetheless needs new air, and our sources do not say how it arrived here. An American architect saw his fireplace burn the warm air of his room and draw in cold air from outside. The summer position does renew the air, but it is the wall that draws it outside. What remains is to decide where it comes in.',
      ),
      lf(
        'Le puits canadien est un tuyau enterré où l’on fait passer l’air neuf. Celui de notre « et si » mesure {tubeLength}, {tubeDia} de diamètre, à {tubeDepth}, pour {tubeFlow} : des estimations d’après l’illustration d’un architecte. À Odeillo, en janvier, l’air sort à {tubeJanOut} quand il fait {tubeJanIn} ; en juillet, à {tubeJulOut} quand il fait {tubeJulIn}. Sur une année, {tubeKwh} de chaleur pour une charge de {tubeLoad} : environ {tubePoint} de part (« Et si : un puits canadien »). Au niveau de la mer, à Perpignan, il compte davantage : {tubePerpHeat} de chaleur et {tubePerpCool} de fraîcheur d’été sur {tubePerpLoad}. Il ne remplace ni l’aération ni l’isolation.',
        'The earth tube is a buried pipe where the new air is made to pass. The one in our “what if” is {tubeLength}, {tubeDia} in diameter, at {tubeDepth}, for {tubeFlow}: estimates from an architect’s illustration. At Odeillo, in January, the air leaves at {tubeJanOut} when it is {tubeJanIn}; in July, at {tubeJulOut} when it is {tubeJulIn}. Over a year, {tubeKwh} of heat against a load of {tubeLoad}: about {tubePoint} of share (“What if: an earth tube”). At sea level, at Perpignan, it counts for more: {tubePerpHeat} of heat and {tubePerpCool} of summer coolness against {tubePerpLoad}. It replaces neither ventilation nor insulation.',
      ),
      l(
        'Aucun puits canadien mesuré sur une maison, en altitude ou en France, ne nous est parvenu. Trois systèmes de bureaux, mesurés en Allemagne, donnent une efficacité de 0,77 à 0,94 ; notre modèle, avec un sol constant, trouve moins, et le dit. Un architecte, dans une vidéo, n’en a jamais posé : avec une ventilation à récupération de chaleur, dit-il, l’argent va mieux dans l’isolation et le confort d’été. Ses chiffres sont des illustrations, pas des mesures. La maison passive de Darmstadt a, elle, des gaines d’entrée enterrées et une récupération : ce n’est pas l’un ou l’autre.',
        'No measured earth tube on a house, at altitude or in France, has reached us. Three office systems, measured in Germany, give an effectiveness of 0.77 to 0.94; our model, with a steady soil, finds less, and says so. An architect, in a video, has never fitted one: with a heat-recovery ventilation, he says, the money goes better into insulation and summer comfort. His figures are illustrations, not measurements. The passive house at Darmstadt has both, buried intake ducts and a recovery: it is not one or the other.',
      ),
      l(
        'Un tuyau d’air enterré demande de l’hygiène : l’eau qui se condense doit couler vers une purge, sinon moisissures ; un filtre se change ; et un tuyau étanche et une mesure s’imposent là où le radon est un sujet. La commune de Font-Romeu-Odeillo-Via est rangée en zone 3 de la carte française du radon, d’après une page secondaire que nous n’avons pas pu recouper avec l’arrêté. Avant de rêver d’un tuyau ici, on mesure.',
        'A buried air pipe asks for hygiene: the water that condenses must run to a drain, or there is mould; a filter is changed; and an airtight pipe and a measurement are needed where radon is a subject. The commune of Font-Romeu-Odeillo-Via is placed in zone 3 of the French radon map, according to a secondary page that we could not check against the decree. Before dreaming of a pipe here, one measures.',
      ),
    ],
    figures: [
      sp('Le tuyau du « et si »', 'The “what if” pipe', v('{tubeLength}, {tubeDia}, {tubeDepth}')),
      sp('Janvier, Odeillo', 'January, Odeillo', v('{tubeJanIn} → {tubeJanOut}')),
      sp('Juillet, Odeillo', 'July, Odeillo', v('{tubeJulIn} → {tubeJulOut}')),
      sp('Gain d’une année, Odeillo', 'A year’s gain, Odeillo', v('{tubeKwh}')),
    ],
    formula: 'Θ = (T_entrée − T_sortie) ÷ (T_entrée − T_sol)',
    focus: { scene: 'house', part: 'earth-tube-pipe', scenario: 'earth-tube' },
    quiz: [
      {
        q: l('Que fait la boucle du mur de l’air de la pièce ?', 'What does the wall’s loop do with the room’s air?'),
        choices: [
          l('Elle le renouvelle avec de l’air du dehors', 'It renews it with outside air'),
          l(
            'Elle le reprend, le chauffe et le rend, sans air du dehors',
            'It takes it back, heats it and gives it back, with no outside air',
          ),
          l('Elle le filtre', 'It filters it'),
        ],
        answer: 1,
        explain: l(
          'L’air « frais » de l’article est l’air frais de la pièce, pris au sol. La boucle ne fait entrer aucun air du dehors : l’air neuf d’une maison vient d’ailleurs.',
          'The paper’s “fresh” air is the room’s cool air, taken at the floor. The loop lets no outside air in: a house’s new air comes from elsewhere.',
        ),
      },
      {
        q: l(
          'À Odeillo, que rapporte le puits canadien du « et si… » sur la part de la saison ?',
          'At Odeillo, what does the “what if…” earth tube bring to the season’s share?',
        ),
        choices: [
          lf('Environ {tubePoint} de plus', 'About {tubePoint} more'),
          l('Dix points, comme un deuxième mur', 'Ten points, like a second wall'),
          l('Rien, et il réchauffe l’été', 'Nothing, and it warms the summer'),
        ],
        answer: 0,
        explain: lf(
          'À 1 550 m, il tempère l’air d’hiver et n’a presque pas de chaleur d’été à combattre : {tubeKwh} de chaleur sur une année, aucune fraîcheur d’été. Il ne remplace ni l’aération ni l’isolation.',
          'At 1,550 m it tempers the winter air and has almost no summer heat to fight: {tubeKwh} of heat over a year, no summer coolness. It replaces neither ventilation nor insulation.',
        ),
      },
    ],
  },
];
