// Parts of the `site` world, « Le plateau » (11): the setting. The ground, the road and the trees are composed, not mapped: nothing in this lab says where the houses stand beyond « Odeillo », and nothing here points at them. What is reported is
// said as reported (the furnace's size and mirrors, the monument's footprint, PVGIS's monthly sun and the terrain's horizon); what the 3D composes (the field's terraces, the heliostats' shape, the species of the trees, the road, the 1974 plan)
// is marked. The sun's two arcs, the heliostats and the snow follow the model: said once, in the overview of this world.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const SITE_PARTS: PartInfo[] = [
  {
    id: 'prototype-house',
    scene: 'site',
    category: 'structure',
    name: l('La maison de 1967', 'The 1967 house'),
    short: l(
      'Le prototype de 1967 : de plain-pied, quatre pièces, 76 m², et au sud un mur de béton noir derrière deux vitres.',
      'The 1967 prototype: one storey, four rooms, 76 m², and on the south side a black concrete wall behind two sheets of glass.',
    ),
    description: lf(
      'C’est la maison que le laboratoire solaire de Félix Trombe a bâtie avec l’architecte Jacques Michel, à Odeillo, à 1 550 m d’altitude. Elle est de plain-pied : 4 pièces, 76 m², 300 m³. Sa façade sud est un capteur de 48 m² : un mur de béton de 60 cm, peint en noir, derrière deux vitres, soit 0,16 m² de capteur par mètre cube. Elle perd 1,63 W par mètre cube et par degré. Un thermostat règle chaque pièce à 20 °C, avec un chauffage électrique derrière. De novembre 1974 à octobre 1975, ses constructeurs l’ont mesurée, habitée : c’est la source de presque tous les chiffres de ce labo. Le contour dessiné, {facadeLen} sur {depth}, vient de données ouvertes (estimation).',
      'This is the house that Félix Trombe’s solar laboratory built with the architect Jacques Michel, at Odeillo, at 1,550 m. It is one storey: 4 rooms, 76 m², 300 m³. Its south front is a 48 m² collector: a wall of concrete 60 cm thick, painted black, behind two sheets of glass, that is 0.16 m² of collector per cubic metre. It loses 1.63 W per cubic metre and per degree. A thermostat sets each room at 20 °C, with electric heating behind. From November 1974 to October 1975 its builders measured it, lived in: it is the source of nearly all this lab’s figures. The drawn outline, {facadeLen} by {depth}, comes from open data (estimate).',
    ),
    material: l('Béton, acier, verre, toit à deux pans', 'Concrete, steel, glass, pitched roof'),
    specs: [
      sp('Étages, pièces', 'Storeys, rooms', l('1, 4', '1, 4')),
      sp('Surface, volume', 'Area, volume', '76 m², 300 m³'),
      sp('Capteur', 'Collector', l('48 m², 0,16 m² par m³', '48 m², 0.16 m² per m³')),
      sp('Pertes, G', 'Losses, G', '1,63 W/m³·K'),
      sp('Thermostat', 'Thermostat', l('20 °C, à 1,50 m', '20 °C, at 1.50 m')),
      sp('Chauffage d’appoint', 'Backup heating', l('électrique', 'electric')),
    ],
    maintenance: maint(
      {
        failure:
          'Le premier ennui d’un gros mur de béton est l’eau : la fiche du mur de stockage le raconte. Puis viennent les petits : une position de clapet oubliée, du verre qui s’encrasse. Un autre constructeur a vécu, à son premier hiver, de l’air de la pièce qui sortait chaud la nuit par les ouvertures du haut et revenait plus frais par celles du bas.',
        check: 'Comparer l’hiver à l’électricité : la facture est la mesure la plus honnête d’une maison.',
        care: 'Deux changements de saison, un lavage du verre, les conduits propres : le mur demande peu, et rarement.',
      },
      {
        failure:
          'The first trouble of a heavy concrete wall is water: the storage wall’s sheet tells it. Then come the small ones: a flap left in the wrong position, glass that fouls. Another builder lived, in his first winter, with room air leaving warm by the upper vents at night and coming back cooler by the lower ones.',
        check: 'Compare the winter with the electricity: the bill is the most honest measure of a house.',
        care: 'Two changes of season, a wash of the glass, the ducts kept clean: the wall asks for little, and rarely.',
      },
    ),
    tip: l(
      'Cliquez le bouton de cette fiche : la maison s’ouvre dans son monde, en coupe, et le mur se montre.',
      'Click the button on this sheet: the house opens in its own world, in section, and the wall shows.',
    ),
    design: l(
      'Pourquoi cette maison, et pas une autre ? C’est la seule où nous avons trouvé, dans un seul document public, le tableau des cotes par ses inventeurs, un bilan jour par jour, quatre enregistrements de quatre jours, et une courbe d’un an. Ce n’est pas le bâtiment inscrit de 1974 : c’en est la sœur aînée.',
      'Why this house, and not another? It is the only one for which we found one public document giving the inventors’ own table of dimensions, a day-by-day balance, four recordings of four days, and a curve for a year. It is not the listed building of 1974: it is its elder sister.',
    ),
  },
  {
    id: 'twin-house',
    scene: 'site',
    category: 'site',
    name: l('Sa jumelle', 'Its twin'),
    short: l(
      'La même maison, un peu plus loin : le dessin la fait par la même fonction. Rien ne dit que les deux furent semblables.',
      'The same house, a little further: the drawing makes it with the same function. Nothing says the two were alike.',
    ),
    description: lf(
      'L’article parle des « prototypes » au pluriel, sans dire si ce sont deux maisons ou plus. Les données ouvertes que nous avons lues listent deux bâtiments jumeaux de plain-pied, de 15,0 sur 6,6 m, qui y figurent pour la première fois en 1968, près du laboratoire d’Odeillo. Aucun document ne dit que ce sont eux : c’est notre lecture, et le contour de la maison en vient. Notre dessin pose donc une seconde maison, par la même fonction, décalée de {twinAt} le long de la façade (estimation). Elle ne fait pas d’ombre à la première dans le modèle : l’horizon de calcul est celui du terrain, sans arbres ni maisons voisines.',
      'The paper speaks of the “prototypes” in the plural, without saying whether they are two houses or more. The open data we read lists two twin one-storey buildings, 15.0 by 6.6 m, which first appear in it in 1968, near the laboratory at Odeillo. No document says they are these: it is our reading, and the house’s outline comes from it. Our drawing therefore sets a second house, made by the same function, moved {twinAt} along the front (estimate). It casts no shadow on the first in the model: the calculation’s horizon is the terrain’s, with no trees nor neighbouring houses.',
    ),
    material: l('Béton, acier, verre : la même maison', 'Concrete, steel, glass: the same house'),
    specs: [
      sp('Décalage dessiné', 'Offset drawn', v('{twinAt}')),
      sp(
        'Contour de données ouvertes',
        'Open-data outline',
        l('15,0 × 6,6 m, apparu en 1968', '15.0 × 6.6 m, first seen in 1968'),
      ),
      sp('Ombre sur le prototype, modèle', 'Shadow on the prototype, model', l('aucune', 'none')),
    ],
    maintenance: maint(
      {
        failure:
          'Deux maisons côte à côte ne vieillissent pas pareil : celle qui est la plus exposée au vent a ses joints fatigués la première. Le jumeau n’est pas un témoin, puisque rien ne dit qu’on ait mesuré l’un contre l’autre.',
        check:
          'Après une tempête, comparer deux voisines : les mêmes défauts, aux mêmes endroits, sont un défaut de conception.',
        care: 'Rien de ce lab ne s’applique à une vraie maison voisine : ce jumeau est un dessin.',
      },
      {
        failure:
          'Two houses side by side do not age alike: the one more exposed to the wind has its gaskets tired first. The twin is not a control, since nothing says one was measured against the other.',
        check: 'After a storm, compare two neighbours: the same faults, in the same places, are a design fault.',
        care: 'Nothing in this lab applies to a real neighbouring house: this twin is a drawing.',
      },
    ),
    tip: l(
      'Isolez la jumelle : c’est la même maison, un peu plus loin sur le pré. Ce sont deux copies d’un seul dessin.',
      'Isolate the twin: it is the same house, a little further along the meadow. They are two copies of a single drawing.',
    ),
    design: l(
      'Une seconde maison n’aide pas le calcul : c’est du décor. Elle aide l’œil à lire l’échelle, et rappelle que l’article ne parle pas d’une maison, mais de prototypes.',
      'A second house does not help the calculation: it is scenery. It helps the eye to read the scale, and recalls that the paper does not speak of one house, but of prototypes.',
    ),
  },
  {
    id: 'granite-slope',
    scene: 'site',
    category: 'site',
    name: l('Pente de granit', 'Granite slope'),
    short: l(
      'Un sol rocheux qui tombe vers le sud : c’est lui qui donne à la maison ses gradins et son escalier.',
      'A rocky ground that falls to the south: what gives the house its steps and its stair.',
    ),
    description: lf(
      'Le terrain tombe vers le sud : de {groundFall} sur l’emprise de la maison, le bas de la fourchette que donnent les données ouvertes, qui parlent de 2 à 3,5 m (estimation). La photographie de l’article montre des rochers affleurants. Nous les dessinons en granit : c’est notre choix, la photographie montre des blocs, pas leur nature. Le bâtiment de 1974, plus haut sur la pente, a des fondations en gradins dans le rocher, d’après la base nationale du patrimoine ; celles de nos deux maisons sont en gradins aussi, mais c’est un dessin.',
      'The ground falls to the south: by {groundFall} over the house’s footprint, the low end of the range open data gives, which speaks of 2 to 3.5 m (estimate). The paper’s photograph shows outcropping rocks. We draw them as granite: that is our choice, the photograph shows blocks, not their nature. The building of 1974, higher up the slope, has stepped foundations in the rock, according to the national heritage database; those of our two houses are stepped too, but that is a drawing.',
    ),
    material: l('Roche affleurante et terre, dessin composé', 'Outcropping rock and earth, a composed drawing'),
    specs: [
      sp('Chute sur l’emprise de la maison', 'Fall over the house’s footprint', v('{groundFall}')),
      sp('Chute, d’après les données ouvertes', 'Fall, according to open data', l('2 à 3,5 m', '2 to 3.5 m')),
      sp('Matière dessinée', 'Material drawn', l('granit, notre choix', 'granite, our choice')),
    ],
    maintenance: maint(
      {
        failure:
          'Un sol de pente est un sol qui bouge : le ruissellement lave le pied d’un mur, la neige fondue s’infiltre, le gel soulève. Le danger est sous la maison, et ne se voit pas.',
        check:
          'Après les grosses pluies et le dégel, regardez le pied des murs : une rigole qui se creuse, un coin d’enduit qui cloque.',
        care: 'Détourner l’eau avant la maison, jamais contre elle, et garder les gradins de fondation propres de terre.',
      },
      {
        failure:
          'A sloping ground is a ground that moves: run-off washes the foot of a wall, melted snow seeps in, frost heaves. The danger is under the house, and cannot be seen.',
        check:
          'After heavy rain and the thaw, look at the foot of the walls: a gully that deepens, a patch of render that blisters.',
        care: 'Divert the water before the house, never against it, and keep the foundation steps clear of earth.',
      },
    ),
    tip: l(
      'Isolez la pente : le terrain se montre seul, avec ses rochers, et l’on voit qu’il est plus bas au sud, devant la maison.',
      'Isolate the slope: the ground shows alone, with its rocks, and you see that it is lower to the south, in front of the house.',
    ),
    design: l(
      'Cette pente décide de la forme de la maison : une dalle de niveau, des gradins sous les pignons, un balcon qu’il faut descendre. Sa forme est composée.',
      'This slope decides the shape of the house: a level slab, steps under the gables, a balcony one must go down from. Its shape is composed.',
    ),
  },
  {
    id: 'meadow-clearing',
    scene: 'site',
    category: 'site',
    name: l('Clairière', 'Clearing'),
    short: l(
      'Une clairière fauchée devant la maison : le soleil d’hiver y passe sans ombre, et la neige y suit le mois du modèle.',
      'A mown clearing in front of the house: the winter sun passes over it with no shadow, and the snow follows the model’s month.',
    ),
    description: lf(
      'Ce pré est la raison d’être de la maison : le soleil d’hiver y arrive sans rien devant. D’après un modèle de terrain, l’horizon plein sud est à 2,7° au-dessus du sol, et aucune crête ne fait d’ombre à midi en hiver ; les arbres du coin, eux, ne sont pas comptés. Un service de données satellite donne, pour ce lieu, 1 334 kWh/m² par an sur un plan vertical plein sud, et 1 550 sur un plan horizontal. L’air y fait 6,6 °C en moyenne, de −1,2 °C en janvier à 15,7 °C en juillet. Dans la 3D, la neige du pré suit l’air du mois du modèle. Le modèle, lui, n’a pas de neige : le sol y réfléchit 0,2 du soleil, même sous la neige.',
      'This meadow is the house’s reason for being: the winter sun arrives there with nothing in front. According to a terrain model, the horizon due south is 2.7° above the ground, and no ridge casts a shadow at noon in winter; the trees of the corner are not counted. A satellite data service gives, for this place, 1,334 kWh/m² a year on a vertical plane facing due south, and 1,550 on a horizontal one. The air averages 6.6 °C there, from −1.2 °C in January to 15.7 °C in July. In the 3D, the meadow’s snow follows the air of the model’s month. The model itself has no snow: the ground reflects 0.2 of the sun, even under snow.',
    ),
    material: l('Prairie fauchée, dessin composé', 'Mown grass, a composed drawing'),
    specs: [
      sp('Horizon plein sud', 'Horizon due south', l('2,7°', '2.7°')),
      sp('Soleil sur un plan vertical sud, par an', 'Sun on a vertical south plane, a year', '1 334 kWh/m²'),
      sp('Soleil sur un plan horizontal, par an', 'Sun on a horizontal plane, a year', '1 550 kWh/m²'),
      sp('Air, moyenne de l’année', 'Air, mean of the year', '6,6 °C'),
      sp('Réflexion du sol dans le modèle', 'Ground’s reflection in the model', v('{albedo}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un arbre qui grandit : c’est le plus lent des défauts d’une maison solaire. Le soleil d’hiver, bas, se perd dans un arbre que l’été n’a jamais gêné. Il ne se voit pas dans un modèle dont l’horizon est celui du terrain.',
        check:
          'Au solstice d’hiver, à midi, regardez la façade du bas vers le haut : de l’ombre sur le verre dit qu’un arbre est déjà trop haut.',
        care: 'Tenir le pré fauché, et la ligne du sud bas.',
      },
      {
        failure:
          'A growing tree: it is the slowest of a solar house’s faults. The low winter sun is lost in a tree that summer never troubled. It does not show in a model whose horizon is the terrain’s.',
        check:
          'At the winter solstice, at noon, look at the front from bottom to top: shadow on the glass says a tree is already too tall.',
        care: 'Keep the meadow mown, and the line to the south low.',
      },
    ),
    tip: l(
      'Dans la Simulation, faites glisser le jour de l’année : la neige du pré suit l’air du mois, et le soleil descend sur la façade.',
      'In the Simulation, slide the day of the year: the meadow’s snow follows the month’s air, and the sun drops along the front.',
    ),
    design: l(
      'Ce pré dit en une image ce que les chiffres de l’article disent tard : une maison solaire a besoin d’un sud dégagé avant d’avoir un mur noir. C’est la première condition de l’installation, avant le verre, le béton ou le thermostat.',
      'This meadow says in one picture what the paper’s figures say late: a solar house needs a clear south before it has a black wall. It is the first condition of the installation, before the glass, the concrete or the thermostat.',
    ),
  },
  {
    id: 'tree-clumps',
    scene: 'site',
    category: 'site',
    name: l('Bosquets', 'Tree clumps'),
    short: l(
      'Des pins et des chênes, groupés sur la pente : un décor, qui montre l’hiver par ses feuilles, et que le modèle ne compte pas.',
      'Pines and oaks, grouped on the slope: scenery, which shows the winter by its leaves, and which the model does not count.',
    ),
    description: lf(
      'Les espèces, pin et chêne, sont notre choix : aucune source ne dit ce qui poussait là. Les pins gardent leurs aiguilles ; les chênes perdent leurs feuilles avec le jour de l’année du modèle, et le dessin le montre. Le modèle ne compte aucun arbre : l’horizon de calcul est celui du terrain, et il donne au soleil d’hiver un chemin dégagé. C’est une limite, que le visiteur voit : un pin trop près de la façade ferait de l’ombre à des heures où le modèle n’en voit pas.',
      'The species, pine and oak, are our choice: no source says what grew there. The pines keep their needles; the oaks lose their leaves with the model’s day of the year, and the drawing shows it. The model counts no tree: the calculation’s horizon is the terrain’s, and gives the winter sun a clear path. It is a limit, which the visitor can see: a pine too close to the front would cast shadow at hours when the model sees none.',
    ),
    material: l('Pins et chênes, espèces choisies', 'Pines and oaks, species chosen'),
    specs: [
      sp('Espèces', 'Species', l('pin, chêne : notre choix', 'pine, oak: our choice')),
      sp('Feuilles des chênes', 'Oaks’ leaves', l('suivent le jour de l’année', 'follow the day of the year')),
      sp('Ombre dans le modèle', 'Shadow in the model', l('aucune', 'none')),
    ],
    maintenance: maint(
      {
        failure:
          'Un arbre trop près d’une façade sud : ses branches font de l’ombre en hiver, ses feuilles bouchent les gouttières à l’automne, ses racines cherchent l’eau sous la fondation.',
        check:
          'Une fois par an, regardez la distance entre la branche la plus proche et le verre, et sa hauteur au solstice.',
        care: 'Tailler tôt, et ne rien laisser grandir devant le sud.',
      },
      {
        failure:
          'A tree too close to a south front: its branches cast shadow in winter, its leaves clog the gutters in autumn, its roots seek water under the foundation.',
        check:
          'Once a year, look at the distance between the nearest branch and the glass, and its height at the solstice.',
        care: 'Prune early, and let nothing grow in front of the south.',
      },
    ),
    tip: l(
      'Dans la Simulation, faites glisser le jour de l’année d’un hiver à un été : les chênes se couvrent de feuilles, et le soleil monte.',
      'In the Simulation, slide the day of the year from a winter to a summer: the oaks fill with leaves, and the sun climbs.',
    ),
    design: l(
      'Un chêne feuillu devant une façade sud donne de l’ombre l’été et laisse passer une bonne part du soleil l’hiver : une vieille ruse, que ce lab ne peut pas montrer, puisque ses arbres ne comptent pas. Ils sont là pour qu’un plateau ne soit pas nu.',
      'A leafy oak in front of a south front gives shade in summer and lets a good part of the sun through in winter: an old trick, which this lab cannot show, since its trees do not count. They are there so that a plateau is not bare.',
    ),
  },
  {
    id: 'access-road',
    scene: 'site',
    category: 'site',
    name: l('Route', 'Road'),
    short: l(
      'Une route de terre au bas du pré : elle donne l’échelle, et rappelle que des dizaines de tonnes de béton sont arrivées par là.',
      'A dirt road below the meadow: it gives the scale, and recalls that tens of tonnes of concrete came by it.',
    ),
    description: lf(
      'Aucune source ne parle d’une route. Celle-ci est composée : elle court au bas du pré, et sert à lire les distances, comme le font la jumelle et les arbres. Un mur de {massT} ne vient pourtant pas de nulle part : ses matériaux ont dû arriver par une route, sans doute par camion (hypothèse). Elle sert aussi d’étalon : la maison, sa jumelle et le four se lisent à son échelle. Ce chemin ne dit pas où se trouvent les maisons : nous composons le plateau, nous ne le cartographions pas.',
      'No source speaks of a road. This one is composed: it runs along the bottom of the meadow, and serves to read distances, as the twin and the trees do. A wall of {massT} does not come from nowhere, though: its materials must have come by a road, most likely by lorry (our assumption). It also serves as a yardstick: the house, its twin and the furnace read to its scale. This track does not say where the houses are: we compose the plateau, we do not map it.',
    ),
    material: l('Terre damée, dessin composé', 'Rammed earth, a composed drawing'),
    specs: [
      sp('Source', 'Source', l('aucune : composée', 'none: composed')),
      sp('Rôle dans le modèle', 'Role in the model', l('aucun : un repère', 'none: a landmark')),
      sp('Masse du mur arrivée par là', 'Mass of the wall that came by it', v('{massT}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une route de terre sur une pente : les ornières au dégel, le ravinement après l’orage, la neige qu’on ne dégage plus. Ce sont des défauts de chantier autant que d’entretien.',
        check: 'Au printemps, parcourez-la : ornières, fossés pleins, bords qui s’effondrent.',
        care: 'Garder le fossé libre et dégager la neige, pour que ni un camion ni un secours ne soit bloqué.',
      },
      {
        failure:
          'A dirt road on a slope: ruts at the thaw, gullies after a storm, snow no longer cleared. They are site faults as much as maintenance ones.',
        check: 'In spring, walk it: ruts, full ditches, edges that collapse.',
        care: 'Keep the ditch clear and clear the snow, so that neither a lorry nor a rescue is blocked.',
      },
    ),
    tip: l(
      'Isolez la route : on lit contre elle l’échelle de la maison et de sa jumelle.',
      'Isolate the road: you read the scale of the house and its twin against it.',
    ),
    design: l(
      'C’est la seule pièce du plateau qui ne vienne d’aucune source, et elle ne cherche pas à avoir l’air d’en venir : un décor honnête vaut mieux qu’un décor précis.',
      'It is the only part of the plateau that comes from no source, and it does not try to look as if it did: an honest scenery is worth more than a precise one.',
    ),
  },
  {
    id: 'solar-furnace',
    scene: 'site',
    category: 'site',
    name: l('Four solaire', 'Solar furnace'),
    short: l(
      'Le grand miroir du même laboratoire : 54 m de large, 48 m de haut, 1 000 kW. La maison fait le contraire : elle garde, sans concentrer.',
      'The same laboratory’s great mirror: 54 m wide, 48 m high, 1,000 kW. The house does the opposite: it keeps, without concentrating.',
    ),
    description: lf(
      'Le même laboratoire a bâti un four de 1 000 kW : un bâtiment de 48 m de haut sur 54 m de large, inauguré en 1969 d’après un communiqué de presse de la Poste avec le CNRS, une légende du CNRS parlant d’une mise en service en 1970. Son miroir courbe fait 1 830 m² et une distance focale de 18 m. Il reçoit la lumière de 63 miroirs plans mobiles, les héliostats, et la concentre sur un point. La maison fait l’inverse : elle ne concentre rien, elle garde, et sa chaleur vient d’un mur qui stocke {capKwh}. Dans la 3D, la silhouette est composée d’après le gabarit publié : la forme du miroir est une estimation, et l’empreinte au sol, d’environ 61 sur 34 m, vient de données ouvertes.',
      'The same laboratory built a 1,000 kW furnace: a building 48 m high by 54 m wide, inaugurated in 1969 according to a press release of the Post Office with the CNRS, a CNRS caption speaking of its entering service in 1970. Its curved mirror is 1,830 m² with a focal length of 18 m. It receives the light of 63 movable flat mirrors, the heliostats, and concentrates it on a point. The house does the opposite: it concentrates nothing, it keeps, and its heat comes from a wall that stores {capKwh}. In the 3D, the silhouette is composed from the published size: the shape of the mirror is an estimate, and the footprint on the ground, about 61 by 34 m, comes from open data.',
    ),
    material: l('Béton, miroir courbe composé de facettes', 'Concrete, a curved mirror made of facets'),
    specs: [
      sp('Bâtiment', 'Building', l('48 m de haut, 54 m de large', '48 m high, 54 m wide')),
      sp('Puissance', 'Power', '1 000 kW'),
      sp('Miroir', 'Mirror', l('1 830 m², focale 18 m', '1,830 m², focal length 18 m')),
      sp('Inauguration', 'Inauguration', l('1969 (CNRS : 1970)', '1969 (CNRS: 1970)')),
      sp('Empreinte, données ouvertes', 'Footprint, open data', l('environ 61 × 34 m', 'about 61 × 34 m')),
    ],
    maintenance: maint(
      {
        failure:
          'Aucune source lue ne dit comment le four est entretenu. Ce qu’on sait des miroirs en général : la poussière et les rayures les ternissent, le vent les charge, et un héliostat décalé ne vise plus son point.',
        check:
          'Pour un four, on mesure la tache au foyer : si elle s’élargit ou se déplace, un miroir est sale ou décalé.',
        care: 'On nettoie les miroirs et on règle les héliostats ; le lab n’a ni l’un ni l’autre, et le dessin ne bouge qu’avec le soleil du modèle.',
      },
      {
        failure:
          'No source we read says how the furnace is kept. What is known of mirrors in general: dust and scratches dull them, wind loads them, and a heliostat that is out of true no longer aims at its point.',
        check:
          'For a furnace, one measures the spot at the focus: if it widens or moves, a mirror is dirty or out of true.',
        care: 'Mirrors are cleaned and heliostats set; the lab has neither, and the drawing moves only with the model’s sun.',
      },
    ),
    tip: l(
      'Cliquez le four, puis faites glisser l’heure dans la Simulation : les héliostats devant lui suivent le soleil.',
      'Click the furnace, then slide the hour in the Simulation: the heliostats in front of it follow the sun.',
    ),
    design: l(
      'Une même équipe, une même décennie, deux réponses au soleil : concentrer pour monter très haut en température, ou garder pour tenir une maison à 20 °C. Le four est dans ce lab pour que l’on voie les deux.',
      'The same team, the same decade, two answers to the sun: concentrate it to climb very high in temperature, or keep it to hold a house at 20 °C. The furnace is in this lab so that both can be seen.',
    ),
  },
  {
    id: 'heliostat-terraces',
    scene: 'site',
    category: 'site',
    name: l('Héliostats', 'Heliostats'),
    short: l(
      '63 miroirs plans sur des terrasses, devant le four : chacun tourne pour renvoyer le soleil vers le grand miroir.',
      '63 flat mirrors on terraces, in front of the furnace: each turns to send the sun to the great mirror.',
    ),
    description: lf(
      'Les héliostats sont 63, pour 2 835 m² en tout, d’après le CNRS et une encyclopédie en ligne. Chacun fait donc {helioArea} (dérivé) ; nous les dessinons de {helioBox}, sur {terraces} terrasses (estimations : la forme et le nombre de terrasses sont composés). Un héliostat se règle par la règle du miroir : sa normale est la bissectrice entre la direction du soleil et celle du four, et sa largeur reste horizontale. C’est ce que fait le dessin, avec le soleil du modèle. Dans notre dessin, la nuit, ils se rangent face au sol. Aucun panneau ne pénètre le terrain, à aucune heure.',
      'The heliostats number 63, for 2,835 m² in all, according to the CNRS and an online encyclopaedia. Each is therefore {helioArea} (derived); we draw them {helioBox}, on {terraces} terraces (estimates: the shape and the number of terraces are composed). A heliostat is set by the mirror rule: its normal is the bisector between the direction of the sun and that of the furnace, and its width stays horizontal. That is what the drawing does, with the model’s sun. In our drawing, at night they park face down. No panel enters the ground, at any hour.',
    ),
    material: l('Miroirs plans sur mâts, dessin composé', 'Flat mirrors on masts, a composed drawing'),
    specs: [
      sp('Héliostats', 'Heliostats', '63'),
      sp('Surface totale', 'Total area', '2 835 m²'),
      sp('Surface de chacun', 'Area of each', v('{helioArea}')),
      sp('Dessin de chacun', 'Drawing of each', v('{helioBox}')),
      sp('Terrasses dessinées', 'Terraces drawn', v('{terraces}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un héliostat se salit, se dérègle, ou reste figé : il ne vise plus. Le vent le charge, comme n’importe quel panneau de 45 m² tourné vers le ciel. Le dessin n’a aucune de ces pannes.',
        check: 'Un miroir qui ne suit pas renvoie la lumière ailleurs : cela se voit de loin.',
        care: 'Aucune source lue ne dit comment ils sont entretenus.',
      },
      {
        failure:
          'A heliostat gets dirty, goes out of true, or stays frozen: it no longer aims. Wind loads it, like any 45 m² panel turned to the sky. The drawing has none of these faults.',
        check: 'A mirror that does not follow sends the light elsewhere: it shows from afar.',
        care: 'No source we read says how they are kept.',
      },
    ),
    tip: l(
      'Isolez les héliostats, puis faites glisser l’heure dans la Simulation : tous tournent ensemble, selon la règle du miroir.',
      'Isolate the heliostats, then slide the hour in the Simulation: they all turn together, by the mirror rule.',
    ),
    design: l(
      'Un miroir plan qui suit le soleil, pour que la lumière tombe toujours au même endroit, est le contraire d’un mur qui ne bouge pas : le mur reçoit le soleil comme il vient, et le garde.',
      'A flat mirror that follows the sun, so that the light always falls in the same place, is the opposite of a wall that does not move: the wall receives the sun as it comes, and keeps it.',
    ),
  },
  {
    id: 'solar-houses-1974',
    scene: 'site',
    category: 'site',
    name: l('Maisons de 1974', 'Houses of 1974'),
    short: l(
      'Le bâtiment inscrit de trois logements, plus haut sur la pente : on le voit, on n’y entre pas, et ce n’est pas la maison de 1967.',
      'The listed building of three dwellings, higher up the slope: it is seen, not entered, and it is not the 1967 house.',
    ),
    description: lf(
      'C’est le bâtiment que le ministère de la Culture a inscrit au titre des monuments historiques le 25 mai 2011 : trois logements, des façades et des toits, et le système du mur. Il est en béton armé, avec des fondations en gradins dans le rocher ; les données ouvertes lui donnent 333 m² d’emprise, dans un rectangle d’environ 37 sur 14 m (l’emprise n’en remplit pas tout), et 12,9 m de haut. Les trois maisons de 1974 de l’article, que nous lisons comme celles de ce bâtiment, ont de deux à trois étages, six ou sept pièces, de 450 à 650 m³, un mur de 37 cm et un coefficient G de 1,00 W/m³·K : c’est le mur « trop court » de l’article. Son plan n’est dans aucune source : la 3D le compose, en boîte à façade sud vitrée, sur le rectangle entier et non sur l’emprise ; la cote « Encombrement » de cette fiche est mesurée sur cette boîte, avec les saillies de son toit et de son capteur : ce n’est donc pas le rectangle des données ouvertes, et les deux nombres ne se comparent pas. C’est une propriété privée, et le lab ne vous y invite pas.',
      'This is the building the Ministry of Culture listed as a historic monument on 25 May 2011: three dwellings, the façades and roofs, and the wall system. It is of reinforced concrete, with stepped foundations in the rock; open data give it a footprint of 333 m², inside a rectangle of about 37 by 14 m (the footprint does not fill all of it), and 12.9 m high. The paper’s three houses of 1974, which we read as those of this building, have two to three storeys, six or seven rooms, 450 to 650 m³, a wall of 37 cm and a G coefficient of 1.00 W/m³·K: it is the paper’s “too short” wall. Its plan is in no source: the 3D composes it, as a box with a glazed south front, on the whole rectangle and not on the footprint; the “Envelope” line of this sheet is measured on that box, with the overhangs of its roof and its collector: it is therefore not the open-data rectangle, and the two numbers are not to be compared. It is private property, and the lab does not invite you there.',
    ),
    material: l('Béton armé, dessin composé', 'Reinforced concrete, a composed drawing'),
    specs: [
      sp('Logements, étages', 'Dwellings, storeys', l('3, de 2 à 3', '3, 2 to 3')),
      sp('Emprise, données ouvertes', 'Footprint, open data', l('333 m²', '333 m²')),
      sp(
        'Rectangle qui la contient, données ouvertes (la base de notre boîte)',
        'Rectangle that holds it, open data (the base of our box)',
        l('environ 37 × 14 m', 'about 37 × 14 m'),
      ),
      sp('Hauteur, données ouvertes', 'Height, open data', '12,9 m'),
      sp('Mur', 'Wall', l('37 cm, G 1,00 W/m³·K', '37 cm, G 1.00 W/m³·K')),
      sp('Inscription', 'Listing', l('25 mai 2011', '25 May 2011')),
    ],
    maintenance: maint(
      {
        failure:
          'L’eau restée dans le béton : le mur de 1974 en a souffert, disent ses auteurs, et la fiche du mur de stockage le raconte. Pour le reste, nous n’avons aucune source sur l’entretien de ce bâtiment.',
        check:
          'Les règles pour des travaux sur un bâtiment protégé varient selon le pays et le site : voyez votre autorité locale.',
        care: 'Le lab n’a rien à y entretenir : on le regarde de loin.',
      },
      {
        failure:
          'The water still in the concrete: the 1974 wall suffered from it, say its authors, and the storage wall’s sheet tells it. For the rest, we have no source on the upkeep of this building.',
        check: 'The rules for works on a protected building differ by country and site: ask your local authority.',
        care: 'The lab has nothing to maintain there: it is looked at from afar.',
      },
    ),
    tip: l(
      'Cliquez le bâtiment : la caméra s’en approche, mais il n’y a pas d’intérieur. Les chiffres de 1974 sont dans la Simulation, par le réglage « Maison de 1974 (37 cm) ».',
      'Click the building: the camera approaches, but there is no interior. The 1974 figures are in the Simulation, through the setting “1974 house (37 cm)”.',
    ),
    design: l(
      'Ne les confondons pas : la maison de 1967 est celle que les inventeurs mesurent, le bâtiment de 1974 est celui que l’État protège. Les auteurs disent eux-mêmes de leurs résultats de 1974 qu’ils sont à peine représentatifs : ce lab les garde comme un réglage, pas comme une maison.',
      'Let us not confuse them: the 1967 house is the one the inventors measure, the 1974 building is the one the State protects. The authors themselves say of their 1974 results that they are hardly representative: this lab keeps them as a setting, not as a house.',
    ),
  },
  {
    id: 'pyranometer',
    scene: 'site',
    category: 'electrical',
    name: l('Pyranomètre', 'Pyranometer'),
    short: l(
      'Un instrument sur un pied : il mesure la puissance du soleil, la seule chose que les inventeurs ont comptée avant tout le reste.',
      'An instrument on a stand: it measures the power of the sun, the one thing the inventors counted before all the rest.',
    ),
    description: lf(
      'Un pyranomètre mesure la puissance du soleil sur une surface, en watts par mètre carré. L’article cite un appareil de marque Kipp, « au laboratoire ». Nous le dessinons sur un pied dans le pré (estimation). Voici ce que l’article compte : 20,30, 21,63, 1,14 et 20,04 MJ/m² du 22 au 25 décembre 1974, et une pointe d’environ 950 W/m², lue sur la courbe. La formule de ciel clair du modèle donne {peakModel} sur un jour clair de la mi-janvier : un peu moins. Le modèle ne lit aucun pyranomètre : il calcule le soleil. Là où l’article a mesuré, il l’impose ; ailleurs, il prend la moyenne mensuelle d’un service de données.',
      'A pyranometer measures the power of the sun on a surface, in watts per square metre. The paper cites an instrument of the Kipp make, “at the laboratory”. We draw it on a stand in the meadow (estimate). Here is what the paper counts: 20.30, 21.63, 1.14 and 20.04 MJ/m² from 22 to 25 December 1974, and a peak of about 950 W/m², read off the curve. The model’s clear-sky formula gives {peakModel} on a clear mid-January day: a little less. The model reads no pyranometer: it calculates the sun. Where the paper measured, it imposes it; elsewhere it takes the monthly average of a data service.',
    ),
    material: l('Pyranomètre sur pied (dessin)', 'Pyranometer on a stand (a drawing)'),
    specs: [
      sp('Mesure', 'Measures', l('le soleil, en W/m²', 'the sun, in W/m²')),
      sp('Pointe enregistrée', 'Peak recorded', l('environ 950 W/m²', 'about 950 W/m²')),
      sp('Pointe du modèle, jour clair', 'Model’s peak, clear day', v('{peakModel}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un dôme sali, du givre, de la neige ou une fiente dessus : l’appareil lit trop bas, et le lit toute la journée. Sa calibration dérive aussi, lentement.',
        check:
          'Un jour clair, à midi, comparer sa lecture à ce qu’un ciel clair donne : un écart durable dit qu’il est sale ou déréglé.',
        care: 'Essuyer le dôme, le remettre à niveau, le faire étalonner contre une référence de temps en temps.',
      },
      {
        failure:
          'A dirty dome, frost, snow or a bird’s dropping on it: the instrument reads too low, and does so all day. Its calibration also drifts, slowly.',
        check:
          'On a clear day, at noon, compare its reading with what a clear sky gives: a lasting gap says it is dirty or out of true.',
        care: 'Wipe the dome, level it again, have it calibrated against a reference from time to time.',
      },
    ),
    tip: l(
      'Isolez le pyranomètre : un petit pied et un dôme, loin de tout. Le soleil qu’il lirait suit le jour de la Simulation.',
      'Isolate the pyranometer: a small stand and a dome, far from everything. The sun it would read follows the Simulation’s day.',
    ),
    design: l(
      'Les chiffres de ce lab se comptent en soleil reçu avant de se compter en chaleur rendue. Sur un mur qui garde, le bilan d’un jour ne veut rien dire : il faut des jours de suite, et un pyranomètre qui compte sans se lasser.',
      'This lab’s figures are counted in sun received before being counted in heat given back. On a wall that keeps, the balance of one day means nothing: it takes days in a row, and a pyranometer that counts without tiring.',
    ),
  },
  {
    id: 'far-ridge',
    scene: 'site',
    category: 'site',
    name: l('Crêtes', 'Ridges'),
    short: l(
      'Les montagnes du fond : celles du modèle de terrain, à quelques degrés sur l’horizon, qui laissent passer le soleil d’hiver à midi.',
      'The mountains at the back: those of the terrain model, a few degrees above the horizon, which let the winter sun through at noon.',
    ),
    description: lf(
      'Ces crêtes ne sont pas un décor libre : elles sont tirées de l’horizon que donne un modèle de terrain pour ce lieu. Plein sud, elles montent à 2,7° ; au sud-est à 5,7° ; au sud-ouest à 1,1° ; au nord à environ 8°. Aucune ne fait d’ombre à midi en hiver. Elles coupent le soleil du matin et du soir quand il est très bas : le modèle arrête le rayon direct sous cet horizon, ce qui retire moins de {horizonLoss} d’un jour clair. Les arbres locaux et la maison voisine ne sont pas dans cet horizon. Dans la 3D, les crêtes suivent cet horizon.',
      'These ridges are not free scenery: they are drawn from the horizon a terrain model gives for this place. Due south they rise to 2.7°; to the south-east 5.7°; to the south-west 1.1°; to the north about 8°. None casts shadow at noon in winter. They cut the morning and evening sun when it is very low: the model stops the direct beam under this horizon, which removes less than {horizonLoss} of a clear day. Local trees and the neighbouring house are not in this horizon. In the 3D, the ridges follow this horizon.',
    ),
    material: l('Roche et neige, tirées de l’horizon du modèle', 'Rock and snow, drawn from the model’s horizon'),
    specs: [
      sp('Horizon plein sud', 'Horizon due south', l('2,7°', '2.7°')),
      sp('Horizon sud-est / sud-ouest', 'Horizon south-east / south-west', l('5,7° / 1,1°', '5.7° / 1.1°')),
      sp('Horizon au nord', 'Horizon to the north', l('environ 8°', 'about 8°')),
      sp('Soleil retiré, jour clair', 'Sun removed, clear day', v('{horizonLoss}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un horizon change moins vite qu’une saison, mais il change : un arbre grandit, une maison neuve se dresse au sud. Le modèle ne le sait pas, parce que son horizon est celui du terrain.',
        check:
          'Le jour le plus court, à midi, regardez le sud depuis le pied du mur : tout ce qui touche le haut du ciel est à noter. Un architecte américain a essayé son terrain ce jour-là.',
        care: 'Refaire ce relevé quand quelque chose a changé au sud, et avant de bâtir.',
      },
      {
        failure:
          'A horizon changes more slowly than a season, but it changes: a tree grows, a new house goes up to the south. The model does not know, because its horizon is the terrain’s.',
        check:
          'On the shortest day, at noon, look at the south from the foot of the wall: everything that touches the top of the sky is to be noted. An American architect tried out his plot on that day.',
        care: 'Redo this survey when something has changed to the south, and before building.',
      },
    ),
    tip: l(
      'Dans la Simulation, passez à l’heure du lever du soleil : le rayon direct n’arrive qu’une fois le soleil au-dessus de cette ligne de crêtes.',
      'In the Simulation, go to sunrise: the direct beam only arrives once the sun is above this line of ridges.',
    ),
    design: l(
      'Ces crêtes ont une justification : elles sont le seul décor dont les chiffres comptent dans le calcul. Le reste du plateau est composé, mais l’horizon, lui, vient d’un modèle de terrain, et il influence les heures où l’article a du soleil.',
      'These ridges have a justification: they are the only scenery whose figures count in the calculation. The rest of the plateau is composed, but the horizon comes from a terrain model, and it influences the hours at which the paper has sun.',
    ),
  },
];
