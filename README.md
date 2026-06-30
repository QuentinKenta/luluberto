# Lulubertos

Jeu narratif 2D en HTML/CSS/JavaScript avec Phaser 3.

## Objectif

Deux collegues musiciens essaient sans cesse de s'impressionner alors qu'ils forment deja une equipe.

## Structure

- `index.html` charge Phaser 3 depuis un CDN et lance le jeu.
- `styles/main.css` contient le cadre visuel de la page.
- `src/main.js` configure Phaser et enregistre les scenes.
- `src/scenes/` contient l'ecran titre, la selection de niveaux et les scenes jouables.
- `src/core/` contient le deplacement, les interactions et les controles.
- `src/systems/` contient le systeme de dialogue.
- `src/data/` contient les dialogues et les donnees de niveau.

## Demarrage local

Depuis ce dossier :

```powershell
node scripts/dev-server.mjs
```

Puis ouvrir `http://localhost:8080`.

## Controles

- Alberto : fleches directionnelles + `P` pour interagir.
- Lucie : `ZQSD` + `E` pour interagir.
- Manettes : Alberto utilise la manette 1, Lucie la manette 2.
- Stick gauche ou croix directionnelle : deplacement.
- `Start` : valider les choix de menu.
- Bouton `A` : interagir en jeu.
- `Select` / `Back` : retour au menu.
- `Esc` : retour a l'ecran titre.

Les personnages se deplacent case par case sur une grille de 32 px. Un changement de direction tourne d'abord le personnage avant de le faire avancer si la touche reste maintenue. Les bulles de dialogue restent visibles jusqu'a ce que le meme joueur rappuie sur sa touche d'interaction.

Pour tester une manette dans le navigateur, branche-la avant ou apres le lancement du jeu, clique dans la page, puis appuie sur un bouton de la manette. Certains navigateurs n'exposent la manette a `navigator.getGamepads()` qu'apres cette premiere pression. Sur l'ecran titre, la croix/stick navigue dans le menu et `Start` valide.

## Scenes jouables

- `Bureau` : scene jouable dans un bureau d'architecture, lancee avec `START`.
- `Concert` : scene jouable accessible depuis `NIVEAUX`.
- `Public` : phase collective avec calibrage micro de 20 secondes, cinq paliers et temporisation de 4 secondes.
- `Fukai` : scene jouable accessible depuis `NIVEAUX`.

Dans `Bureau`, les deux joueurs commencent dans un open-space d'agence d'architecture. Alberto doit retrouver l'emplacement des archives sur son ordinateur, tandis que Lucie demande la cle de l'ancienne salle a une collegue. Quand les deux informations sont obtenues, la porte de l'ancienne salle se deverrouille et l'objectif devient commun.
Le texte d'objectif clignote avant de passer a l'objectif suivant. Les jauges narratives se remplissent sur certaines interactions positives, pas selon la progression brute des objectifs.
