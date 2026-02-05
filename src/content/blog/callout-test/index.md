---
title: Markdown Callout Examples
description: Testing all callout/admonition types
date: '2026-02-03'
tags:
  - test
  - markdown
image: 
order: 
draft: false
---

## GitHub Style Callouts

### Note
> [!NOTE]
> This is a note callout. Use it to highlight information users should take into account.

### Tip
> [!TIP]
> This is a tip callout. Provides helpful suggestions to users.

### Important
> [!IMPORTANT]
> This is an important callout. Crucial information users need to know.

### Warning
> [!WARNING]
> This is a warning callout. Critical content requiring user attention.

### Caution
> [!CAUTION]
> This is a caution callout. Indicates potential risks or negative consequences.

## Directive Style Callouts

### Note with Custom Title
:::note[Custom Note Title]
This is a note with a custom title.
:::

### Tip with Custom Title
:::tip[Pro Tip]
This tip has a custom title to make it more specific.
:::

### Important with Custom Title
:::important[Must Read]
This important callout has a custom title.
:::

### Warning
:::warning
This is a standard warning without custom title.
:::

### Caution
:::caution
This is a caution callout using directive syntax.
:::

## Mixed Content Test

> [!NOTE]
> This callout contains **bold text**, *italic text*, and [a link](https://example.com).
>
> It also has multiple paragraphs.
>
> - Bullet point 1
> - Bullet point 2
> - Bullet point 3

:::tip[Advanced Usage]
You can also use code in callouts:

```javascript
console.log('Hello from a callout!');
```

And even more text after the code block.
:::
