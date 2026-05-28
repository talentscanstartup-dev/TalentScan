# 🚀 Guia de Deployment

Deploy da Landing Page do Talent Scan em diferentes plataformas.

## 📋 Pré-requisitos

1. Código já buildado: `npm run build`
2. Pasta `dist/` criada
3. Conta em um serviço de hosting

## 🔵 Vercel (Recomendado)

Plataforma ideal para React e Vite.

### Passo 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Passo 2: Deploy

```bash
vercel
```

### Passo 3: Seguir as instruções

- Confirmar o projeto
- Selecionar "Vite" como framework
- Finalizar deploy

**Resultado**: Site ao vivo em `talentscan.vercel.app`

## ⚪ Netlify

Alternativa popular com ótimo suporte.

### Passo 1: Instalar Netlify CLI

```bash
npm install -g netlify-cli
```

### Passo 2: Deploy

```bash
netlify deploy --prod --dir=dist
```

### Passo 3: Autenticar

- Abrir link de autenticação
- Confirmar acesso

**Resultado**: Site ao vivo no Netlify

## 🟦 GitHub Pages

Deploy gratuito diretamente do GitHub.

### Passo 1: Criar repositório

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/talentscan.git
git push -u origin main
```

### Passo 2: Configurar `vite.config.js`

```js
export default {
  base: '/talentscan/',  // Se for sub-diretório
  // ... resto da config
}
```

### Passo 3: Adicionar GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build
      
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Passo 4: Ativar GitHub Pages

- Ir em Settings → Pages
- Source: Deploy from a branch
- Branch: gh-pages

## ☁️ AWS Amplify

Para projetos mais robustos.

### Passo 1: Instalar Amplify CLI

```bash
npm install -g @aws-amplify/cli
amplify configure
```

### Passo 2: Inicializar

```bash
amplify init
```

### Passo 3: Adicionar hosting

```bash
amplify add hosting
```

- Escolher "Hosting with Amplify Console"
- Selecionar "Manual deployment"

### Passo 4: Deploy

```bash
amplify publish
```

## 🌐 Heroku (com servidor backend)

Se quiser adicionar um backend.

### Passo 1: Instalar Heroku CLI

```bash
npm install -g heroku
heroku login
```

### Passo 2: Criar app

```bash
heroku create seu-app-nome
```

### Passo 3: Configurar `Procfile`

```
web: npm run preview
```

### Passo 4: Deploy

```bash
git push heroku main
```

## 🏠 Hospedagem Própria (VPS/Servidor)

### Opção 1: Nginx

```bash
# Copiar arquivos do dist
scp -r dist/* usuario@seu-servidor:/var/www/talentscan/

# Configurar nginx.conf
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        root /var/www/talentscan;
        try_files $uri $uri/ /index.html;
    }
}
```

### Opção 2: Node.js

```bash
npm install -g serve
serve -s dist -l 3000
```

## 🔒 SSL/HTTPS

Essencial para segurança e SEO.

### Let's Encrypt (Gratuito)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d seu-dominio.com
```

### Cloudflare (Recomendado)

1. Criar conta em Cloudflare
2. Adicionar seu domínio
3. Usar nameservers do Cloudflare
4. SSL automático ativado

## 🗂️ Domínio Personalizado

### Transferir Domínio

1. Ir em registrador (GoDaddy, Namecheap, etc)
2. Apontar nameservers para seu hosting
3. Aguardar propagação (24-48h)

### Exemplo Vercel

```
Nameservers:
- ns1.vercel-dns.com
- ns2.vercel-dns.com
```

## 📊 Monitoring e Análise

### Google Analytics

```html
<!-- Em index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

### Sentry (Error Tracking)

```bash
npm install @sentry/react @sentry/tracing
```

```jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://seu-dsn@sentry.io/projeto-id",
  environment: "production",
});
```

## 📈 Otimização de Produção

### Build Otimizado

```bash
npm run build
```

Verifica:
- ✅ Tree-shaking
- ✅ Minificação
- ✅ Compressão

### Lighthouse Score

1. Abrir DevTools (F12)
2. Abrir aba "Lighthouse"
3. Gerar relatório
4. Otimizar conforme recomendações

## 🔄 CI/CD Pipeline

### Exemplo com GitHub Actions

```yaml
name: CI/CD

on: [push, pull_request]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        if: github.ref == 'refs/heads/main'
        run: |
          # Seu comando de deploy aqui
          vercel --prod
```

## 🚨 Troubleshooting

### Build Fails

```bash
# Limpar cache
rm -rf node_modules dist
npm install
npm run build
```

### Website não carrega

- Verificar console (DevTools)
- Checar status code HTTP
- Verificar CORS se houver API

### Performance lenta

- Otimizar imagens
- Minificar CSS/JS
- Usar CDN
- Ativar gzip compression

## ✅ Checklist Pré-Deploy

- [ ] `npm run build` sem erros
- [ ] Testar em múltiplos navegadores
- [ ] Responsive em mobile
- [ ] Links funcionando
- [ ] Meta tags corretas
- [ ] Analytics configurado
- [ ] SSL/HTTPS ativo
- [ ] Domínio apontando
- [ ] Sitemap.xml criado
- [ ] robots.txt configurado

## 📚 Recursos Úteis

- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Vite Deploy Guide](https://vitejs.dev/guide/static-deploy.html)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)

---

**Seu site está pronto para o mundo!** 🌍🚀
