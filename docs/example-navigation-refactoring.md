# Exemplo de Refatoração - Navigation Component

## Cenário: Refatorar Navigation para usar `getLogos()`

Este exemplo mostra como migrar do uso de imagens hardcoded para o uso dinâmico da função `getLogos()`.

---

## **Antes** - Logo Hardcoded

```tsx
// src/components/layout/Navigation.tsx (ANTES)
'use client';

import Image from 'next/image';
import Link from 'next/link';

export function Navigation() {
  return (
    <nav>
      <Link href="/" className="flex items-baseline gap-1">
        <Image
          src="/logo/logo-white-2.png" // ❌ Hardcoded
          alt="Equilibrium Tecnologia Logo" // ❌ Manual
          width={120} // ❌ Pode estar desatualizado
          height={120} // ❌ Proporção incorreta
        />
      </Link>
    </nav>
  );
}
```

### Problemas:

- ❌ Path hardcoded e frágil
- ❌ Não reflete mudanças na API Cosmic
- ❌ Sem type safety
- ❌ Alt text manual (pode ficar desatualizado)
- ❌ Sem otimização Imgix

---

## **Depois** - Logo Dinâmico com `getLogos()`

### Passo 1: Ajustar o Layout (Server Component)

```tsx
// src/app/layout.tsx
import { Navigation } from '@/components/layout';
import { getLogos } from '@/lib/util';
import { getSiteConfig } from '@/lib/cosmic/repositories';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Buscar config uma única vez no layout
  const siteConfig = await getSiteConfig();
  const logos = getLogos(siteConfig);

  return (
    <html lang="pt-BR">
      <body>
        <Navigation logos={logos} />
        <main>{children}</main>
      </body>
    </html>
  );
}
```

### Passo 2: Atualizar o Navigation (Client Component)

```tsx
// src/components/layout/Navigation.tsx (DEPOIS)
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OrganizedLogos } from '@/lib/util';

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: 'Sobre Nós', href: '/sobre-nos' },
  { label: 'Sobre a Equilibrium', href: '/sobre-a-empresa' },
  { label: 'Serviços', href: '/servicos' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contato', href: '/contato' },
];

interface NavigationProps {
  logos: OrganizedLogos; // ✅ Props tipadas
}

export function Navigation({ logos }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          'fixed top-0 right-0 left-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-background/90 border-border/50 border-b shadow-lg backdrop-blur-2xl'
            : 'bg-background border-transparent shadow-none'
        )}
      >
        <div className="section-container">
          <div className="flex h-16 items-center justify-between md:h-20">
            {/* Logo - Desktop usa horizontal, Mobile usa compact */}
            <Link href="/" className="flex items-baseline gap-1">
              {/* Desktop: Logo horizontal */}
              <Image
                src={logos.whiteLogo.horizontal.imgixUrl} // ✅ Imgix URL
                alt={logos.whiteLogo.horizontal.alt} // ✅ Alt automático
                width={120}
                height={60} // ✅ Proporção correta (2:1)
                className="hidden md:block"
                priority
              />

              {/* Mobile: Logo compact */}
              <Image
                src={logos.whiteLogo.compact.imgixUrl} // ✅ Otimizado mobile
                alt={logos.whiteLogo.compact.alt}
                width={80}
                height={20} // ✅ Proporção correta (~4:1)
                className="md:hidden"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-8 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-muted-foreground hover:text-foreground link-underline font-geologica transition-colors duration-200',
                    pathname === link.href && 'text-foreground font-medium'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Button variant="hero" size="sm" asChild>
                <Link className="text-white" href="/cotacao">
                  Fale Conosco
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              variant={'outline'}
              className="text-foreground p-2 md:hidden"
              aria-label="Alternar menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3 }}
            className="bg-background fixed inset-0 top-16 z-40 md:hidden"
          >
            <div className="section-container py-8">
              <nav className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'text-muted-foreground font-geologica text-lg transition-colors duration-200',
                      pathname === link.href && 'text-foreground font-medium'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <Button variant="hero" size="sm" asChild className="mt-4 w-full">
                  <Link className="text-white" href="/cotacao">
                    Fale Conosco
                  </Link>
                </Button>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

### Benefícios da Refatoração:

1. ✅ **Type-safe**: Props tipadas com `OrganizedLogos`
2. ✅ **Dinâmico**: Mudanças na API refletem automaticamente
3. ✅ **Otimizado**: Imgix URLs para performance
4. ✅ **Responsivo**: Logo horizontal (desktop) e compact (mobile)
5. ✅ **Acessível**: Alt texts automáticos em português
6. ✅ **Manutenível**: Uma única fonte de verdade (Cosmic)
7. ✅ **Performance**: `priority` no logo principal (LCP)

---

## Variação: Logo que Muda com Scroll

```tsx
// Logo branca quando não scrolled (fundo escuro no hero)
// Logo preta quando scrolled (fundo claro com backdrop-blur)

export function Navigation({ logos }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  return (
    <nav>
      <Link href="/">
        {/* Logo condicional baseada em scroll */}
        <Image
          src={
            isScrolled
              ? logos.blackLogo.horizontal.imgixUrl // ✅ Scroll = logo preta
              : logos.whiteLogo.horizontal.imgixUrl // ✅ Topo = logo branca
          }
          alt={logos.whiteLogo.horizontal.alt}
          width={120}
          height={60}
          className="transition-opacity duration-300"
          priority
        />
      </Link>
    </nav>
  );
}
```

---

## Variação: Logo com Dark Mode

```tsx
'use client';

import { useTheme } from 'next-themes';
import type { OrganizedLogos } from '@/lib/util';

export function Navigation({ logos }: NavigationProps) {
  const { theme } = useTheme();

  return (
    <nav>
      <Link href="/">
        <Image
          src={
            theme === 'dark'
              ? logos.whiteLogo.horizontal.imgixUrl
              : logos.blackLogo.horizontal.imgixUrl
          }
          alt={logos.whiteLogo.horizontal.alt}
          width={120}
          height={60}
          priority
        />
      </Link>
    </nav>
  );
}
```

---

## Checklist de Refatoração

- [ ] Buscar `siteConfig` no layout ou página pai (Server Component)
- [ ] Processar com `getLogos(siteConfig)`
- [ ] Passar `logos` como prop para componente filho (Client Component)
- [ ] Adicionar type `OrganizedLogos` nas props
- [ ] Escolher variante adequada (square, horizontal, compact)
- [ ] Usar `.imgixUrl` (não `.url`)
- [ ] Adicionar `priority` para logos acima da dobra (LCP)
- [ ] Considerar responsividade (logo diferente mobile/desktop)
- [ ] Testar alt texts automáticos
- [ ] Remover arquivos estáticos antigos de `/public/logo/` se não usados

---

## Performance Pro Tip

Para logos no hero (acima da dobra), sempre use `priority`:

```tsx
<Image
  src={logos.whiteLogo.horizontal.imgixUrl}
  alt={logos.whiteLogo.horizontal.alt}
  width={120}
  height={60}
  priority // ✅ Evita lazy loading, melhora LCP
/>
```

Para logos no footer (abaixo da dobra), deixe lazy loading padrão:

```tsx
<Image
  src={logos.whiteLogo.compact.imgixUrl}
  alt={logos.whiteLogo.compact.alt}
  width={100}
  height={25}
  // ✅ Sem priority = lazy loading automático
/>
```
