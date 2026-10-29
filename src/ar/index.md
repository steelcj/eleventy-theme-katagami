---
title: كاتاغامي
description: قالب هادئ لموقع Eleventy مستوحى من Plone.
blocks:
  - type: text
    body: |
      يأخذ كاتاغامي اسمه من قوالب الورق التي كانت تُستخدم لطباعة النقوش على أقمشة الكيمونو. القالب يحمل التصميم والقماش يحمل المضمون، ولذلك يفصل هذا القالب بين العرض والمحتوى.

      هذه الصفحة مبنية من كتل: هذا النص، وشبكة من البطاقات، وقائمة، ودعوة إلى اتخاذ إجراء.
  - type: image
    src: /media/shippo.jpg
    alt: "نقش شيبّو من دوائر متداخلة بيضاء على خلفية برتقالية."
    caption: "شيبّو، الكنوز السبعة: دوائر تتداخل بلا نهاية."
  - type: grid
    heading: الخدمات
    columns: 3
    blocks:
      - type: teaser
        link: /ar/services/design/
      - type: teaser
        link: /ar/services/software/
      - type: teaser
        link: /ar/services/workshops/
        description: ورشتان كل عام، في كيوتو ونارا.
  - type: listing
    heading: ورش العمل
    folder: /ar/services/workshops/
    view: summary
    sort: date-asc
  - type: call-to-action
    heading: أنشئ موقعًا باستخدام Katagami
    body: اكتب بلغة Markdown، واترك العرض للقالب، وانشر بعدة لغات منذ اليوم الأول.
    label: تواصل معنا
    link: mailto:hello@example.org
---
