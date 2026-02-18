# Utility Functions - Logo Helper

## `getLogos()`

Função helper que processa o `siteConfig` da API Cosmic e retorna uma estrutura organizada e tipada com todos os logos e ícones disponíveis.

### Características

- ✅ **Totalmente tipado** com TypeScript
- ✅ **Estrutura semântica** (square, horizontal, compact)
- ✅ **URLs Imgix prontas** para otimização de imagem
- ✅ **Alt texts automáticos** em português
- ✅ **Dimensões incluídas** (width/height)
- ✅ **Imutável** - baseado na estrutura estável da API

### Estrutura Retornada

```typescript
{
  whiteLogo: {
    square: LogoImage,      // 2000x2000
    horizontal: LogoImage,  // 2000x1000
    compact: LogoImage      // 2000x502
  },
  blackLogo: {
    square: LogoImage,      // 2000x2000
    horizontal: LogoImage,  // 2000x1000
    compact: LogoImage      // 2000x502
  },
  whiteIcon: {
    small: LogoImage,       // 540x540
    large: LogoImage        // 1080x1080
  },
  blackIcon: {
    small: LogoImage,       // 540x540
    large: LogoImage        // 1080x1080
  }
}
```

Onde `LogoImage` contém:

```typescript
{
  url: string; // CDN URL
  imgixUrl: string; // Imgix URL (recomendado)
  width: number;
  height: number;
  alt: string; // Alt text em português
}
```

### Uso Básico - Server Component

```tsx
// src/app/page.tsx (Server Component)
import Image from 'next/image';
import { getLogos } from '@/lib/util';
import { getSiteConfig } from '@/lib/cosmic/repositories';

export default async function HomePage() {
  const siteConfig = await getSiteConfig();
  const logos = getLogos(siteConfig);

  return (
    <header>
      <Image
        src={logos.whiteLogo.horizontal.imgixUrl}
        alt={logos.whiteLogo.horizontal.alt}
        width={logos.whiteLogo.horizontal.width}
        height={logos.whiteLogo.horizontal.height}
        priority
      />
    </header>
  );
}
```

### Uso em Layout

```tsx
// src/app/layout.tsx
import { getLogos } from '@/lib/util';
import { getSiteConfig } from '@/lib/cosmic/repositories';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const siteConfig = await getSiteConfig();
  const logos = getLogos(siteConfig);

  return (
    <html lang="pt-BR">
      <body>
        <Navigation logos={logos} />
        {children}
      </body>
    </html>
  );
}
```

### Uso no Navigation (Client Component)

```tsx
// src/components/layout/Navigation.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { OrganizedLogos } from '@/lib/util';

interface NavigationProps {
  logos: OrganizedLogos;
}

export function Navigation({ logos }: NavigationProps) {
  return (
    <nav>
      <Link href="/">
        <Image
          src={logos.whiteLogo.horizontal.imgixUrl}
          alt={logos.whiteLogo.horizontal.alt}
          width={120}
          height={60}
          className="h-auto w-auto"
        />
      </Link>
    </nav>
  );
}
```

### Uso no Footer

```tsx
// src/components/layout/Footer.tsx
import Image from 'next/image';
import type { OrganizedLogos } from '@/lib/util';

interface FooterProps {
  logos: OrganizedLogos;
}

export function Footer({ logos }: FooterProps) {
  return (
    <footer className="bg-black text-white">
      <div className="section-container">
        {/* Logo branca para fundo escuro */}
        <Image
          src={logos.whiteLogo.compact.imgixUrl}
          alt={logos.whiteLogo.compact.alt}
          width={150}
          height={37}
        />
      </div>
    </footer>
  );
}
```

### Otimização com Imgix

A propriedade `imgixUrl` permite usar parâmetros de otimização:

```tsx
// Redimensionar automaticamente
<Image
  src={`${logos.blackIcon.small.imgixUrl}?w=64&h=64&fit=crop`}
  alt={logos.blackIcon.small.alt}
  width={64}
  height={64}
/>

// Com formato WebP e qualidade
<Image
  src={`${logos.whiteLogo.horizontal.imgixUrl}?auto=format&q=80`}
  alt={logos.whiteLogo.horizontal.alt}
  width={200}
  height={100}
/>
```

### Quando Usar Cada Variante

#### **Logos**

- **`square`** (2000x2000): Redes sociais, avatar, OG image
- **`horizontal`** (2000x1000): Header desktop, banners
- **`compact`** (2000x502): Header mobile, footer, espaços limitados

#### **Ícones**

- **`small`** (540x540): Favicon, tab icons, pequenos avatares
- **`large`** (1080x1080): Share images, PWA icons, splash screens

#### **Cores**

- **`white`**: Fundos escuros (hero, footer dark mode)
- **`black`**: Fundos claros (header light mode, documentos)

### Metadata SEO

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next';
import { getLogos } from '@/lib/util';
import { getSiteConfig } from '@/lib/cosmic/repositories';

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig();
  const logos = getLogos(siteConfig);

  return {
    icons: {
      icon: logos.blackIcon.small.imgixUrl,
      apple: logos.blackIcon.large.imgixUrl,
    },
    openGraph: {
      images: [logos.blackLogo.square.imgixUrl],
    },
  };
}
```

### Memoização (opcional)

Se precisar usar em múltiplos lugares no mesmo componente:

```tsx
import { useMemo } from 'react';
import { getLogos } from '@/lib/util';

export function MyComponent({ siteConfig }) {
  const logos = useMemo(() => getLogos(siteConfig), [siteConfig]);

  // Use logos múltiplas vezes sem reprocessar
  return (
    <>
      <Image src={logos.whiteLogo.horizontal.imgixUrl} {...} />
      <Image src={logos.whiteIcon.small.imgixUrl} {...} />
    </>
  );
}
```

### TypeScript IntelliSense

A função é totalmente tipada, então você terá autocomplete completo:

```typescript
logos.
  ├── whiteLogo
  │   ├── square
  │   ├── horizontal
  │   └── compact
  ├── blackLogo
  │   ├── square
  │   ├── horizontal
  │   └── compact
  ├── whiteIcon
  │   ├── small
  │   └── large
  └── blackIcon
      ├── small
      └── large

// Cada um com:
.url          // string
.imgixUrl     // string
.width        // number
.height       // number
.alt          // string
```

### Vantagens dessa Abordagem

1. ✅ **Única fonte de verdade**: API Cosmic
2. ✅ **Type-safe**: TypeScript garante uso correto
3. ✅ **Semântico**: Nomes descritivos (não índices mágicos)
4. ✅ **Performance**: Imgix URLs otimizadas
5. ✅ **Acessibilidade**: Alt texts automáticos
6. ✅ **Manutenível**: Mudanças na API refletem automaticamente
7. ✅ **DX**: Autocomplete e validação no editor

### Migração de Código Existente

**Antes (hardcoded):**

```tsx
<Image src="/logo/logo-white-2.png" alt="Equilibrium Tecnologia Logo" width={120} height={120} />
```

**Depois (dinâmico e tipado):**

```tsx
const logos = getLogos(siteConfig);

<Image
  src={logos.whiteLogo.horizontal.imgixUrl}
  alt={logos.whiteLogo.horizontal.alt}
  width={120}
  height={60}
/>;
```
