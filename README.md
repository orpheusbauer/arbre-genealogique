# Arbre genealogique

Application web statique pour creer, organiser et exporter un arbre genealogique depuis le navigateur.

Le projet fonctionne sans serveur, sans base de donnees et sans etape de build : tout est en HTML, CSS et JavaScript natif.

## Demo

Page GitHub : https://github.com/orpheusbauer/arbre-genealogique
Page Démo : https://orpheusbauer.fr/arbregenealogique/

## Fonctionnalites

- Creation et edition de fiches membres : prenom, nom, sexe, dates de naissance/deces, lieux, activite, notes et photo.
- Recherche dans les membres par nom, lieu, metier ou contenu de fiche.
- Relations familiales : parent biologique, parent adoptif, couple, ex-conjoint, frere / soeur, demi-fratrie et lien personnalise.
- Schema interactif avec zoom, recentrage, deplacement dans la vue et masquage de branches.
- Agencement automatique par generations, avec mode manuel pour repositionner les cartes.
- Sauvegarde automatique dans le navigateur.
- Export de sauvegarde en JSON et import d'un arbre existant.
- Export du schema en SVG pour l'imprimer, le partager ou le retravailler dans un outil vectoriel.

## Utilisation rapide

1. Ouvrir la page de demo ou le fichier `index.html` dans un navigateur moderne.
2. Cliquer sur `Ajouter` pour creer une premiere fiche.
3. Remplir les informations de la personne, puis enregistrer la fiche.
4. Ajouter d'autres membres depuis le panneau de gauche.
5. Utiliser l'onglet `Liens` pour declarer les relations entre deux personnes.
6. Exporter regulierement le fichier JSON avec `Enregistrer` pour garder une copie portable de l'arbre.

## Gerer les relations

Les liens peuvent etre ajoutes de deux manieres :

- Depuis l'onglet `Liens`, en choisissant une personne A, une personne B, puis le type de relation.
- Depuis le schema, en activant `Agencement manuel`, puis en choisissant le type de trait a poser.

Les relations symetriques, comme les couples ou la fratrie, sont automatiquement ajoutees des deux cotes. Les relations parentales evitent les boucles simples afin de ne pas rendre une personne ancetre d'elle-meme.

## Agencement du schema

Par defaut, les cartes sont placees automatiquement par generation et regroupees par familles.

Le mode `Agencement manuel` permet de deplacer les cartes directement dans le schema. Les positions manuelles sont sauvegardees avec les fiches et conservees dans les exports JSON. Le bouton `Reinitialiser` supprime les positions manuelles et revient a l'agencement automatique.

## Donnees et confidentialite

Les donnees sont sauvegardees dans le `localStorage` du navigateur, sous la cle `genealogy-builder-tree-v1`.

Cela signifie que :

- aucune donnee n'est envoyee a un serveur par cette application ;
- les donnees restent liees au navigateur et a l'appareil utilises ;
- vider les donnees du navigateur peut supprimer l'arbre local ;
- l'export JSON est la meilleure maniere de conserver une sauvegarde fiable.

Le fichier JSON exporte contient les fiches, les relations, les photos integrees sous forme de donnees image et les positions manuelles.

## Importer un arbre

Cliquer sur `Importer`, puis choisir un fichier `.json` exporte par l'application.

L'import normalise les donnees : les identifiants inconnus sont ignores, les relations invalides sont nettoyees et les liens symetriques manquants sont reconstruits quand c'est possible.

## Exporter

- `Enregistrer` telecharge une sauvegarde JSON reutilisable dans l'application.
- `Exporter SVG` telecharge une image vectorielle du schema courant.

L'export SVG est adapte au partage visuel. Pour continuer a modifier l'arbre, il faut conserver le JSON.

## Lancer le projet localement

Aucune installation n'est necessaire.

```bash
git clone git@github.com:orpheusbauer/arbre-genealogique.git
cd arbre-genealogique
```

Ouvrir ensuite `index.html` dans un navigateur.

Si le navigateur bloque certains comportements locaux, servir simplement le dossier avec n'importe quel serveur statique.

## Structure

```text
.
+-- index.html
`-- assets
    +-- css
    |   `-- style.css
    `-- js
        +-- app.js
        +-- storage.js
        `-- tree-view.js
```

- `assets/js/app.js` gere l'interface, les formulaires, les relations, le zoom, l'import et les exports.
- `assets/js/storage.js` gere la sauvegarde locale, la normalisation des donnees et la lecture des imports JSON.
- `assets/js/tree-view.js` calcule l'agencement de l'arbre et dessine les cartes et connecteurs.
- `assets/css/style.css` contient toute la mise en page et le style visuel.

## Technologies

- HTML5
- CSS3
- JavaScript natif
- `localStorage`
- SVG pour les connecteurs et l'export du schema

## Compatibilite

L'application vise les navigateurs modernes de bureau et mobile. Elle utilise des APIs web standards comme `localStorage`, `FileReader`, `Blob`, `URL.createObjectURL` et, si disponible, `crypto.randomUUID`.
