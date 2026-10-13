# Visite 3D – Centre dentaire (4 dentistes)

Visite virtuelle interactive en première personne d'un centre dentaire de ~190 m², réalisée avec **Three.js r170** (embarqué dans `vendor/`). Aucune dépendance externe : textures et modèles sont tous générés par code.

## Lancer

Il faut un petit serveur HTTP (les modules ES ne fonctionnent pas en `file://`).

```bash
node server.mjs          # http://localhost:5173
# ou : npm start
# ou : python3 -m http.server 8000
```

Puis ouvrir l'adresse dans Chrome, Edge ou Firefox récents (WebGL2). En ligne : GitHub Pages (workflow `.github/workflows/pages.yml`).

## Commandes

| Action | Touche |
|---|---|
| Avancer / reculer / côtés | Z Q S D ou W A S D, flèches |
| Courir | Maj |
| Regarder | Souris (verrouillage du pointeur ; glisser si indisponible) |
| Ouvrir / fermer une porte | E ou clic |
| Libérer la souris | Échap |

Panneau : modes **Visite** / **Vue aérienne**, téléportation par pièce, bascule toit / cloisons / étiquettes / portes automatiques, **jour / nuit**, qualité (Élevée / Moyenne / Éco). Mini-plan cliquable pour se téléporter.

Paramètres d'URL : `?skip=1&tp=soin1&night=1&view=aerial&roof=0&walls=0&quality=low&ui=0`.

## Structure

- `src/plan.js` – géométrie du plan (pièces, murs, ouvertures, surfaces)
- `src/build.js` – murs, sols, toit, portes, extérieur
- `src/rooms.js`, `src/furniture.js` – mobilier et équipements de chaque pièce
- `src/materials.js` – textures procédurales
- `src/player.js`, `src/ui.js`, `src/main.js` – déplacement/collisions, interface, boucle de rendu
- `scripts/verify.mjs` – contrôle du plan (surfaces, meubles dans les murs, portes, accessibilité)
- `scripts/e2e.mjs` – tests fonctionnels dans un navigateur (Playwright)

## Plan et écarts avec le brief

Repère : x vers l'est (0–19 m), z vers le sud (0–12 m), entrée côté sud. `npm run verify` imprime le rapport complet.

- Enveloppe portée à **19 × 12 m** (le plan ne tenait pas à 18 m avec les surfaces demandées).
- Pièces 1 à 21 % plus petites que les surfaces indiquées (surfaces utiles, murs déduits) ; sanitaires PMR +21 % (accessibilité).
- Couloir de 28,7 m² au lieu de 12 : il fait aussi office de distribution et de zone d'accueil étendue.
- Ajouts : **salle de lecture** (4,7 m², optionnelle) et **sas de collecte** des déchets (3,4 m²).
- Total modélisé : 205,8 m² utiles (≈197,7 m² hors sas et lecture) pour ≈190–194 m² annoncés.
- Verrouillage vérifié : aucun meuble dans un mur, aucune porte bloquée, toutes les pièces accessibles (rayon 25 cm).
- Protections radiologiques (plomb, signalisation) affichées comme éléments **« à valider »** : à confirmer par un physicien médical / la réglementation en vigueur.

## Performances

Géométrie statique fusionnée par matériau (~210 meshes), 9 lumières ponctuelles réaffectées dynamiquement. Choisir « Éco » si la machine est modeste.

## Licence

Code du projet : MIT. Three.js : MIT (voir `vendor/three/LICENSE`).
