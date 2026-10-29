---
title: Katagami
description: A quiet, Plone-inspired theme for Eleventy.
blocks:
  - type: text
    body: |
      Katagami takes its name from the paper stencils used to print patterns onto kimono fabric. The stencil carries the design and the cloth carries the substance, so this theme keeps presentation in templates and leaves content to plain text.

      This page is built from blocks: this text, a grid of teasers, a listing and a call to action. Every region around it is filled from data.
  - type: image
    src: /media/shippo.jpg
    alt: "A shippo pattern of overlapping off-white circles on persimmon."
    caption: "Shippo, the seven treasures: circles that overlap without end."
  - type: grid
    heading: Services
    columns: 3
    blocks:
      - type: teaser
        link: /en/services/design/
      - type: teaser
        link: /en/services/editing/
      - type: teaser
        link: /en/services/workshops/
        description: Two workshops a year, in Kyoto and Nara.
  - type: listing
    heading: Workshops
    folder: /en/services/workshops/
    view: summary
    sort: date-asc
  - type: call-to-action
    heading: Start a site with Katagami
    body: Write in Markdown, keep presentation in the theme, and publish in several languages from the first day.
    label: Get in touch
    link: mailto:hello@example.org
---
