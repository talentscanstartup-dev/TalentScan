# 🎨 Guia de Customização da Landing Page

Instruções completas para personalizar a landing page do Talent Scan.

## 🎯 Cores Neon

As cores padrão estão definidas em `tailwind.config.js`:

```js
colors: {
  'neon-blue': '#0ff',      // Cyan brilhante
  'neon-purple': '#bf00ff', // Purple vibrante
  'neon-green': '#39ff14',  // Green radioativo
  'dark-bg': '#0a0e27',     // Fundo escuro
  'dark-card': '#1a1f3a',   // Cards
  'dark-border': '#2a3050'  // Bordas
}
```

### Alterar Cores

1. **Abra** `tailwind.config.js`
2. **Modifique** os valores hex das cores
3. **Exemplo**: Trocar neon-blue de `#0ff` para `#00ffff`

```js
'neon-blue': '#00ffff',  // Novo cyan
```

## 🔤 Tipografia

### Fontes Disponíveis

As fontes estão importadas em `index.html`:
- **Inter** - Tipografia principal (400-800)
- **Roboto** - Fallback
- **Plus Jakarta Sans** - Para headings (500-800)

### Mudar Fonte Principal

1. **Abra** `tailwind.config.js`
2. **Encontre** a seção `fontFamily`
3. **Modifique**:

```js
fontFamily: {
  'sans': ['Sua Nova Fonte', 'sans-serif'],
}
```

4. **Importe** a nova fonte em `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Sua+Nova+Fonte:wght@400;600;700&display=swap" rel="stylesheet" />
```

## 📝 Conteúdo da Página

### Hero Section
**Arquivo**: `src/components/HeroSection.jsx`

```jsx
// Título
<span className="gradient-text">Triagem de Currículos</span>

// Subtítulo
Envie currículos pelo Telegram. Deixe a IA do Talent Scan...

// Botões
<button>Testar no Telegram</button>
<button>Ver Demo</button>
```

### Como Funciona (3 Passos)
**Arquivo**: `src/components/HowItWorks.jsx`

Modifique o array `steps`:

```jsx
const steps = [
  {
    number: 1,
    title: "Upload via Telegram",
    description: "O usuário envia o PDF do CV...",
    icon: "📄",
    color: "from-neon-blue to-neon-purple",
  },
  // ...
]
```

### Benefícios
**Arquivo**: `src/components/Benefits.jsx`

Modifique o array `benefits`:

```jsx
const benefits = [
  {
    icon: "⚡",
    title: "90% Mais Rápido",
    description: "Processe centenas de currículos...",
    color: "neon-green",
  },
  // Adicione mais benefícios aqui
]
```

### Tech Stack
**Arquivo**: `src/components/TechStack.jsx`

Altere as ferramentas:

```jsx
const techStack = [
  { name: "n8n", icon: "🔧", description: "Automação" },
  { name: "OpenAI", icon: "🧠", description: "IA" },
  // ...
]
```

### Footer
**Arquivo**: `src/components/Footer.jsx`

Modifique os links:

```jsx
const footerLinks = {
  Produto: ["Recursos", "Preços", "Documentação", "Roadmap"],
  Empresa: ["Sobre", "Blog", "Contato", "Carreiras"],
  // ...
}
```

## 🔗 Links e URLs

### CTA Buttons

**Hero Section** - `src/components/HeroSection.jsx`:
```jsx
<a href="https://t.me/seu_bot">Testar no Telegram</a>
```

**Benefits** - `src/components/Benefits.jsx`:
```jsx
<a href="https://seu-site.com/demo">Testar Agora</a>
```

**Footer** - `src/components/Footer.jsx`:
```jsx
<a href="https://seu-site.com/suporte">Suporte</a>
```

## 🎨 Efeitos Visuais

### Animações de Hover

Modifique os efeitos em `index.css`:

```css
.btn-primary:hover {
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.8);
  transform: scale(1.05);
}
```

### Glassmorphism

Altere o efeito em `tailwind.config.js`:

```js
backdropBlur: {
  'glass': '15px',  // Aumenta o blur
}
```

## 📱 Layout Responsivo

Os breakpoints estão em `tailwind.config.js`:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

Exemplo de uso:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 coluna mobile, 2 tablets, 3 desktop */}
</div>
```

## 🎬 Animações

### Velocidade de Animações

Em `src/components/HeroSection.jsx`:

```jsx
transition: { duration: 0.8, ease: "easeOut" }
            // Mude de 0.8 para 0.5 (mais rápido) ou 1.2 (mais lento)
```

### Delay de Animações

```jsx
staggerChildren: 0.2,      // Espaçamento entre animações
delayChildren: 0.3,        // Atraso inicial
```

## 🌐 SEO Customization

### Meta Tags

Edite `index.html`:

```html
<title>Talent Scan - Triagem de Currículos com IA</title>
<meta name="description" content="Sua descrição aqui">
<meta name="keywords" content="palavras-chave, sep, por, virgula">
<meta name="og:image" content="url-da-imagem">
```

## 🚀 Build Customizado

### Build para Produção

```bash
npm run build
```

Gera uma pasta `dist/` otimizada para produção.

### Visualizar Build

```bash
npm run preview
```

### Variáveis de Ambiente

Crie um arquivo `.env`:

```env
VITE_API_URL=https://api.seu-site.com
VITE_TELEGRAM_BOT=@seu_bot
```

Use no código:

```jsx
const botUrl = import.meta.env.VITE_TELEGRAM_BOT
```

## 📊 Analytics

Para adicionar Google Analytics, insira em `index.html`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

## 🔐 Segurança

### HTTPS

Deploy sempre com HTTPS para melhor segurança e SEO.

### CORS

Se integrar com APIs, configure CORS apropriadamente.

### Rate Limiting

Implemente rate limiting para endpoints sensíveis.

## 📱 Testes Responsivos

```bash
# Usar no navegador
Chrome DevTools → F12 → Toggle Device Toolbar (Ctrl+Shift+M)
```

Teste em:
- iPhone (375px)
- Tablet (768px)
- Desktop (1920px)

## 🎯 Checklist de Customização

- [ ] Alterar cores neon
- [ ] Mudar fontes
- [ ] Atualizar textos e conteúdo
- [ ] Adicionar URLs dos CTAs
- [ ] Integrar modelo 3D Spline
- [ ] Configurar analytics
- [ ] Testar responsividade
- [ ] Otimizar imagens
- [ ] Deploy em produção

## 🆘 Suporte

Para dúvidas:
1. Verifique o `README.md`
2. Consulte a documentação do Tailwind CSS
3. Veja exemplos no Framer Motion docs
4. Abra uma issue no repositório

---

**Sua landing page personalizada está pronta!** 🎉
