# Talent Scan Landing Page

Landing page moderna e responsiva para o Talent Scan - sistema de IA para análise de currículos.

## 🎨 Design

- **Dark Mode** com elementos futuristas
- **Glassmorphism** para cards e componentes
- **Animações suaves** com Framer Motion
- **Responsivo** e Mobile-First
- **Espaço para modelos 3D** do Spline

## 🛠️ Tech Stack

- **React 18** - UI Framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animações
- **JavaScript** - Vanilla JS para hooks customizados

## 📋 Seções da Landing Page

1. **Hero Section** - Apresentação inicial com CTA
2. **Como Funciona** - Pipeline de 3 passos (Upload → Análise → Resultados)
3. **Benefícios** - 6 cards com vantagens do sistema
4. **Tech Stack** - Integrações e ferramenta (n8n, OpenAI, Telegram, Google Sheets)
5. **Footer** - Links, CTA final e informações

## 🚀 Como Executar

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

O servidor abrirá automaticamente em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
.
├── index.html           # HTML principal
├── package.json         # Dependências
├── vite.config.js       # Configuração Vite
├── tailwind.config.js   # Configuração Tailwind
├── postcss.config.js    # Configuração PostCSS
└── src/
    ├── main.jsx         # Entrada React
    ├── App.jsx          # Componente raiz
    ├── index.css        # Estilos globais
    └── components/
        ├── HeroSection.jsx     # Seção hero
        ├── HowItWorks.jsx      # Pipeline visual
        ├── Benefits.jsx        # Cards de benefícios
        ├── TechStack.jsx       # Tech stack showcase
        └── Footer.jsx          # Rodapé
```

## 🎨 Personalizações

### Integrar Modelo 3D do Spline

No componente `HeroSection.jsx`, substitua o placeholder:

```jsx
// Substitua este bloco:
<div className="text-center">
  <motion.div...>
    <svg...></svg>
  </motion.div>
  <p>Espaço para Modelo 3D Spline</p>
</div>

// Por algo como:
<Spline scene="https://prod.spline.design/..." />
```

### Cores Personalizadas

Edite `tailwind.config.js`:

```js
colors: {
  'neon-blue': '#0ff',      // Customize as cores
  'neon-purple': '#bf00ff',
  'neon-green': '#39ff14',
  // ...
}
```

### Links e CTAs

Atualize os links dos botões em cada componente:

```jsx
<a href="https://t.me/seu_bot">Testar no Telegram</a>
```

## 📱 Responsividade

- Mobile First design
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Layout adaptativo para todos os dispositivos

## ⚡ Performance

- Zero JavaScript framework overhead com Vite
- Code splitting automático
- Lazy loading de componentes
- Otimizações de animação com Framer Motion

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento com HMR
- `npm run build` - Cria build otimizada para produção
- `npm run preview` - Visualiza build em ambiente local

## 📝 Licença

© 2024 Talent Scan. Todos os direitos reservados.

## 🤝 Suporte

Para dúvidas ou sugestões, entre em contato através do Telegram ou abra uma issue.

---

**Pronto para integrar seu modelo 3D? Vamos lá!** 🚀
