---
title: Region inheritance
description: A folder, a subfolder and a page all add parts to the same region.
regionOverrides:
  belowcontent: [logo, footer-text]
---

Below the content, the folder adds the footer text, the subfolder adds the colophon, and this page adds the logo and the footer text again. The region shows the footer text, the colophon and the logo, in that order: folder parts come first, and a part listed twice appears once.
