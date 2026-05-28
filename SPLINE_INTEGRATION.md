# 🎨 Guia de Integração Spline 3D

Este guia mostra como integrar modelos 3D do Spline na landing page do Talent Scan.

## 📌 Pré-requisitos

1. Ter uma conta em [Spline.design](https://spline.design)
2. Criar e publicar um modelo 3D no Spline
3. Obter o URL do modelo publicado

## 🚀 Como Integrar o Spline

### Passo 1: Instalar o Pacote Spline

```bash
npm install @spline/runtime
```

### Passo 2: Criar Componente Spline

Crie um novo arquivo `src/components/SplineModel.jsx`:

```jsx
import { useEffect, useRef } from 'react'

export default function SplineModel({ sceneUrl, className = "" }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Importar e inicializar Spline runtime
    import('@spline/runtime').then(({ Application }) => {
      const app = new Application(canvasRef.current)
      app.load(sceneUrl)
    })
  }, [sceneUrl])

  return <canvas ref={canvasRef} className={className} />
}
```

### Passo 3: Substituir o Placeholder no HeroSection

Em `src/components/HeroSection.jsx`, substitua:

```jsx
{/* Right side - 3D placeholder */}
<motion.div 
  variants={itemVariants}
  className="relative h-96 lg:h-full min-h-96 flex items-center justify-center"
>
  <div className="absolute inset-0 glass rounded-2xl overflow-hidden flex items-center justify-center">
    {/* Seu modelo Spline aqui */}
    <SplineModel 
      sceneUrl="https://prod.spline.design/SUA_SCENE_ID/scene.splinecode"
      className="w-full h-full"
    />
  </div>
  {/* Decorative elements */}
  ...
</motion.div>
```

### Passo 4: Importar o Componente

No topo de `HeroSection.jsx`:

```jsx
import SplineModel from './SplineModel'
```

## 🎯 Obter URL do Spline

1. Acesse [Spline.design](https://spline.design)
2. Crie ou abra um projeto
3. Clique em "Share" → "Publish"
4. Copie o URL do formato: `https://prod.spline.design/[ID]/scene.splinecode`
5. Use este URL no componente

## 🎨 Ideias de Modelos 3D para o Talent Scan

- **Pasta de arquivo sendo escaneada** - Representa a triagem de documentos
- **Cérebro digital** - Representa a IA analisando
- **Gráficos fluindo** - Representa o pipeline de dados
- **Documentos com IA** - Conceito visual de análise
- **Animação de laser escaneando** - Representa a leitura dos CVs

## ⚙️ Método Alternativo: Embed HTML

Se preferir usar o embed direto do Spline:

```jsx
<iframe 
  width="100%" 
  height="100%" 
  src="https://my.spline.design/SUA_SCENE_ID/scene"
  frameBorder="0"
  style={{ border: 'none' }}
></iframe>
```

## 🔧 Personalizações Avançadas

### Controlar Animações via JavaScript

```jsx
useEffect(() => {
  import('@spline/runtime').then(({ Application }) => {
    const app = new Application(canvasRef.current)
    app.load(sceneUrl)
    
    // Pausar animações
    app.pause()
    
    // Reproduzir
    app.play()
    
    // Descarregar
    app.dispose()
  })
}, [])
```

### Responder a Interações do Usuário

```jsx
// Iniciar animação ao scroll
const handleScroll = () => {
  if (app) {
    app.play()
  }
}
```

## 📱 Responsividade

Certifique-se de que:
- O canvas do Spline tem `width: 100%` e `height: 100%`
- O container pai tem dimensões definidas
- Use `@media` queries para ajustar tamanhos em mobile

```css
@media (max-width: 768px) {
  .spline-container {
    min-height: 300px;
  }
}
```

## 🐛 Troubleshooting

**Modelo não carrega:**
- Verifique se o URL está correto
- Certifique-se de que o modelo está publicado
- Verifique o console para erros

**Performance ruim:**
- Reduza a complexidade do modelo
- Use LOD (Level of Detail)
- Otimize as texturas

**Animação não funciona:**
- Verifique se a animação está configurada no Spline
- Confira a duração e loop settings
- Teste em diferentes navegadores

## 📚 Recursos Adicionais

- [Documentação Spline Runtime](https://github.com/splinetool/spline-web-runtime)
- [Exemplos de Projetos](https://www.spline.design/examples)
- [Comunidade Spline](https://forum.spline.design)

---

**Pronto! Sua landing page agora tem um modelo 3D interativo!** 🚀✨
