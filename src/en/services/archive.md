---
title: Archive
description: A page hidden from navigation and without a sidebar.
excludeFromNav: true
regionOverrides:
  sidebar: none
blocks:
  - type: listing
    heading: Past and future workshops
    folder: /en/services/workshops/
    view: listing
    sort: title
---

This page sets `excludeFromNav: true`, so it appears in the section listing but not in the menus, and `regionOverrides` removes its sidebar. It has no translation, so the language switcher links to each language's home page.
