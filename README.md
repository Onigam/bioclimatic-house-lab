# Bioclimatic House Lab

An interactive 3D lab of **the bioclimatic house of 1967 at Odeillo**: a house cut open through the middle of a bay of its south wall, a black concrete wall 60 cm thick behind two sheets of glass, the slow wave of heat that crosses it at about 4 cm an hour, the current of air in its gap, and the question this lab asks: **can a house heat itself?** It reconstructs the house from the 1976 paper of the team that built it, open satellite and terrain data and a simple model of ours. **It explains; it gives no plan to build from.**

**▶ https://bioclimatic-house-lab.vercel.app** · French and English · desktop, tablet and phone

It belongs to a series that started with [Pelton Lab](https://github.com/Onigam/pelton-lab), built on the same frame, [lab-kit](https://github.com/Onigam/lab-kit). The lab is being built: `public/lab.json` says `building` until the bar of the series is met and the owner has said yes. The title proposed for it (« Maison bioclimatique : le mur qui garde le soleil ») is a default the owner has not yet confirmed.

## What is in it

- **Four 3D worlds**: **the plateau** (the setting: the clearing, the house and its twin, the solar furnace and its heliostats that turn with the model's sun, the sun's two arcs of December and June, the snow that follows the model's month), **the house** (opens cut through the middle of a collector bay, the concrete coloured by the model's temperatures, winter and summer on one flap), **the wall** (one collector element at full scale, always cut, with the instruments of 1974–75) and **the room** (the living room: the heater, the thermostat, the recorder, the jet and the return).
- **A catalogue of 56 parts**, each with a sheet: what it does, what is known of it and what is our drawing, how it fails and is looked after, why it is designed that way. **Two guides**, tagged step by step as reported, usual practice or our reconstruction: how the house goes together (20 steps) and how a wall finds its place in a site and a year (10 steps).
- **Seven lessons with fourteen questions**, going through the simulation's twelve scenarios: the black wall, the slow wave, Christmas 1974 and its 478 %, the low sun and the high sun, the question of the house that heats itself, the night, fresh air and the ground.
- **A simulation** (a pure, unit-tested model: one wall, one air gap, one room): the sun and the glass, the current of the gap in both directions, the wave in the concrete, the room and its thermostat, a season of heating in one go, five starting points and twelve scenarios.
- **Eight A3 explanatory sheets** generated from the same dimensions as the 3D model and from the model's results, each marked as not a plan to follow.
- **A spoken guide** in both languages (61 segments, a synthetic local voice), written from the same figures as the sheets.

## What is real and what is not

- **The wave is retrieved**: with the inventors' own concrete, the textbook gives 4.03 cm an hour and 14.9 hours through 60 cm, against 14 to 16 hours measured on the wall, and the 3.7 to 4 cm an hour the authors quote for ordinary masonry.
- **The model disagrees with the paper in three places, and says so**: the air flow is 34 to 41 L/s per element on a clear day against about 20 recorded; the air carries 51 % of the heat the wall gives back where the paper says 30 to 35 %; and on Christmas Eve 1974 it gives back 367 % of the sun received where the paper reports 478 %. None of it is tuned.
- **« Can a house heat itself? » has no single answer.** Over the heating season the model finds 32 % for the wall alone, 42.5 % with the south windows, 47 % with the people, against the 60 to 70 % that the inventors say the sun can save. It reaches the bottom of their range only if the site's air is 5 K warmer than the data it uses, and the 47 % rests on reading the house's loss figure as the whole envelope (read the other way: 24 %).
- **A reconstruction with an estimate where the sources are silent**: the plan of the rooms, the roof, the chimney, the foundation, the window and the balcony, the heater, the instruments. Every figure is tagged reported, derived, model result or estimate. The plateau is composed, not mapped. No footage, photo or drawing of any source is reused.
- **An independent educational reconstruction**, with no affiliation to the laboratory or to the houses' owners. The risks of a real house of this kind are in the app's Sources panel, with the reminder that rules differ by country and site: ask your local authority. The lab cites no national text of law or regulation.

## Run it

```bash
npm install
npm run dev
```

`npm run typecheck && npm run format:check && npm test && npm run build` is what CI runs; every push to `main` deploys to Vercel. `npm run kit:bump` moves to a newer lab-kit. `tools/stills/` takes screenshots of the running lab (`docs/3d.md`).

## Project layout

- `src/three/` the four worlds and `dims.ts`, the single source of dimensions; `src/sim/` the pure physics; `src/data/` the parts, guides, lessons, sources and figures; `src/drawings/` the A3 sheets; `src/panels/` the simulation panel and the bottom strip; `src/cues.ts` the lab's cues for the spoken guide; `src/lab.ts` describes the lab to the kit.
- `docs/` research notes and sources, physics notes (what the model finds, figure by figure), 3D, data, drawings and lessons notes, requests to the kit; `BRIEF.md` is the brief the agent team works from.

---

## Français

Un lab 3D interactif de **la maison bioclimatique de 1967 à Odeillo** : une maison coupée par le milieu d'une travée de son mur sud, un mur de béton noir de 60 cm derrière deux vitres, la vague de chaleur lente qui le traverse à environ 4 cm par heure, le courant d'air dans sa lame, et la question que pose ce lab : **une maison peut-elle se chauffer seule ?** Il reconstruit la maison d'après l'article de 1976 de l'équipe qui l'a bâtie, des données ouvertes de satellite et de terrain, et un modèle simple de notre cru. **Il explique ; il ne donne aucun plan à suivre.**

**▶ https://bioclimatic-house-lab.vercel.app** · français et anglais · ordinateur, tablette et téléphone

Il fait partie d'une série commencée avec [Pelton Lab](https://github.com/Onigam/pelton-lab), bâtie sur le même socle, [lab-kit](https://github.com/Onigam/lab-kit). Le lab est en construction : `public/lab.json` dit `building` tant que le niveau de la série n'est pas atteint et que le propriétaire n'a pas dit oui. Le titre proposé (« Maison bioclimatique : le mur qui garde le soleil ») est un choix par défaut que le propriétaire n'a pas encore confirmé.

### Ce qu'il contient

- **Quatre mondes 3D** : **le plateau** (le décor : la clairière, la maison et sa jumelle, le four solaire et ses héliostats qui tournent avec le soleil du modèle, les deux arcs du soleil de décembre et de juin, la neige qui suit le mois du modèle), **la maison** (elle s'ouvre coupée par le milieu d'une travée de capteur, le béton coloré par les températures du modèle, l'hiver et l'été sur un seul clapet), **le mur** (un élément de captage à l'échelle un, toujours coupé, avec les instruments de 1974-75) et **la pièce** (le salon : le radiateur, le thermostat, l'enregistreur, le jet et le retour).
- **Un catalogue de 56 pièces**, chacune avec sa fiche : ce qu'elle fait, ce qu'on en sait et ce qui est notre dessin, comment elle tombe en panne et s'entretient, pourquoi elle est conçue ainsi. **Deux guides**, étiquetés pas à pas (rapporté, usage courant ou notre reconstitution) : comment la maison se monte (20 étapes) et comment un mur trouve sa place dans un lieu et une année (10 étapes).
- **Sept leçons et quatorze questions**, qui parcourent les douze scénarios de la simulation : le mur noir, la vague lente, Noël 1974 et ses 478 %, le soleil bas et le soleil haut, la question de la maison qui se chauffe seule, la nuit, l'air neuf et le sol.
- **Une simulation** (un modèle pur, testé : un mur, une lame d'air, une pièce) : le soleil et la vitre, le courant de la lame dans les deux sens, la vague dans le béton, la pièce et son thermostat, une saison de chauffe d'un coup, cinq points de départ et douze scénarios.
- **Huit planches A3 explicatives** générées à partir des mêmes cotes que la 3D et des résultats du modèle, chacune marquée comme n'étant pas un plan à suivre.
- **Un guide parlé** dans les deux langues (61 segments, voix de synthèse locale), écrit d'après les mêmes chiffres que les planches.

### Ce qui est réel et ce qui ne l'est pas

- **La vague est retrouvée** : avec le béton même des inventeurs, le calcul classique donne 4,03 cm par heure et 14,9 heures à travers 60 cm, contre 14 à 16 heures mesurées sur le mur, et les 3,7 à 4 cm par heure que les auteurs citent pour la maçonnerie ordinaire.
- **Le modèle diffère de l'article en trois endroits, et le dit** : le courant d'air est de 34 à 41 L/s par élément un jour clair contre environ 20 enregistrés ; l'air porte 51 % de la chaleur que le mur rend là où l'article dit 30 à 35 % ; et la veille de Noël 1974 il rend 367 % du soleil reçu là où l'article rapporte 478 %. Rien n'est réglé pour s'en approcher.
- **« Une maison peut-elle se chauffer seule ? » n'a pas de réponse unique.** Sur la saison de chauffe le modèle trouve 32 % avec le mur seul, 42,5 % avec les fenêtres au sud, 47 % avec les gens, contre 60 à 70 % que, selon les inventeurs, le soleil peut économiser. Il n'atteint le bas de leur fourchette que si l'air du site est 5 K plus chaud que les données qu'il utilise, et les 47 % reposent sur une lecture du chiffre de pertes de la maison comme toute l'enveloppe (lu autrement : 24 %).
- **Une reconstitution, avec une estimation là où les sources se taisent** : le plan des pièces, le toit, la cheminée, la fondation, la fenêtre et le balcon, le radiateur, les instruments. Chaque chiffre est étiqueté rapporté, calculé, résultat du modèle ou estimé. Le plateau est composé, pas cartographié. Aucune image, aucun film, aucun dessin d'une source n'est repris.
- **Une reconstitution pédagogique indépendante**, sans affiliation avec le laboratoire ni avec les propriétaires des maisons. Les risques d'une vraie maison de ce genre sont dans le panneau Sources de l'application, avec le rappel que les règles varient selon le pays et le site : voyez votre autorité locale. Le lab ne cite aucun texte national de loi ou de règlement.

### Lancer en local

`npm install` puis `npm run dev`. `npm run typecheck && npm run format:check && npm test && npm run build` est ce que lance la CI ; chaque push sur `main` déploie sur Vercel.
