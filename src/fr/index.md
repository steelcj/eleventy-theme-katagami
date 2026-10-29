---
title: Katagami
description: Un thème sobre pour Eleventy, inspiré de Plone.
blocks:
  - type: text
    body: |
      Katagami doit son nom aux pochoirs de papier qui servaient à imprimer les motifs sur les tissus des kimonos. Le pochoir porte le dessin et l'étoffe porte la matière ; ce thème garde de même la présentation dans les gabarits et laisse le contenu au texte brut.

      Cette page est faite de blocs : ce texte, une grille d'accroches, une liste et un appel à l'action.
  - type: image
    src: /media/shippo.jpg
    alt: "Un motif shippo de cercles blancs cassés entrelacés sur fond kaki."
    caption: "Shippo, les sept trésors : des cercles qui se chevauchent sans fin."
  - type: grid
    heading: Services
    columns: 3
    blocks:
      - type: teaser
        link: /fr/services/conception/
      - type: teaser
        link: /fr/services/redaction/
      - type: teaser
        link: /fr/services/workshops/
        description: Deux ateliers par an, à Kyoto et à Nara.
  - type: listing
    heading: Ateliers
    folder: /fr/services/workshops/
    view: summary
    sort: date-asc
  - type: call-to-action
    heading: Créer un site avec Katagami
    body: Écrivez en Markdown, laissez la présentation au thème et publiez en plusieurs langues dès le premier jour.
    label: Nous écrire
    link: mailto:hello@example.org
---
