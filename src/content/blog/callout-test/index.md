---
title: Markdown Features Guide
description: Explore all the Markdown features supported in this theme - code highlighting, math formulas, callouts, and more
date: 2026-03-16
tags:
  - markdown
  - tutorial
  - documentation
draft: false
---

This guide showcases the rich Markdown features available in Astro Theme Shyne, including code syntax highlighting, math formulas, callouts, and more.

## Code Highlighting

The theme uses Expressive Code and Shiki for beautiful code highlighting. Here's a TypeScript example:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function greetUser(user: User): string {
  return `Hello, ${user.name}!`;
}

const user: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com"
};

console.log(greetUser(user));
```

And here's some Python:

```python
def fibonacci(n: int) -> int:
    """Calculate the nth Fibonacci number."""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Calculate first 10 Fibonacci numbers
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
```

## Math Formulas

The theme supports LaTeX math rendering via KaTeX.

### Inline Math

The equation $E = mc^2$ is famous.

### Block Math

$$
\frac{d}{dx}\left( \int_{a}^{x} f(t)\,dt\right) = f(x)
$$

## Callouts / Admonitions

Use GitHub-style callouts to highlight important information:

> [!NOTE]
> Useful information that users should know, even when skimming.

> [!TIP]
> A helpful suggestion to improve your workflow.

> [!WARNING]
> Potential problems that users should avoid.

> [!CAUTION]
> Advises about situations that could cause loss of data or hardware damage.

## Tables

| Feature | Status | Description |
|---------|--------|-------------|
| Blog | ✅ | Full-featured blog system |
| Projects | ✅ | Portfolio showcase |
| Photos | ✅ | Polaroid gallery |
| Search | ✅ | Instant search |
| RSS | ✅ | RSS feed generation |

## Lists

### Unordered

- First item
- Second item
  - Nested item
  - Another nested
- Third item

### Ordered

1. First step
2. Second step
3. Third step

## Links

- Internal link: [About Page](/about)
- External link: [Astro Documentation](https://docs.astro.build)

## Images

You can include images in your posts:

`![Sample Image](/images/sample.jpg)`

## Conclusion

These features make Astro Theme Shyne perfect for technical writing and documentation.
