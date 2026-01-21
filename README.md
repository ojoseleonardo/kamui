# 🌀 Kamui - Gameplay Clip Manager

<p align="center">
  <img src="public/kamui-icon.svg" alt="Kamui Logo" width="120" height="120">
</p>

<p align="center">
  <strong>神威</strong> - Gerenciador automático de clipes de gameplay com upload para YouTube
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-28.0.0-47848F?style=for-the-badge&logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Tailwind-3.3.6-38B2AC?style=for-the-badge&logo=tailwindcss" alt="Tailwind">
</p>

---

## ✨ Características

- 🎮 **Monitoramento Automático** - Detecta novos clipes de gameplay automaticamente
- 📤 **Upload para YouTube** - Envia clipes diretamente para seu canal
- 🎨 **Interface Moderna** - Design inspirado no Sharingan/Kamui com tema dark elegante
- 📊 **Dashboard Completo** - Métricas, gráficos e estatísticas em tempo real
- 🗂️ **Gestão Local** - Organize e visualize clipes antes do upload
- ⚙️ **Configurável** - Personalize cada aspecto do aplicativo
- 📜 **Histórico Detalhado** - Timeline completa de todas as ações

## 🚀 Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/kamui.git
cd kamui

# Instale as dependências
npm install

# Inicie em modo desenvolvimento
npm run electron:dev
```

## 📁 Estrutura do Projeto

```
kamui/
├── electron/
│   └── main.js           # Processo principal do Electron
├── public/
│   └── kamui-icon.svg    # Ícone da aplicação
├── src/
│   ├── components/
│   │   ├── dashboard/    # Componentes do dashboard
│   │   ├── layout/       # Layout (Sidebar, Header, Terminal)
│   │   └── ui/           # Componentes de UI reutilizáveis
│   ├── lib/
│   │   └── utils.js      # Funções utilitárias
│   ├── pages/
│   │   ├── Home.jsx      # Dashboard principal
│   │   ├── YouTube.jsx   # Clipes no YouTube
│   │   ├── Local.jsx     # Clipes locais
│   │   ├── Settings.jsx  # Configurações
│   │   └── History.jsx   # Histórico
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css         # Estilos globais
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## 🎨 Design System

### Cores

| Nome | Hex | Uso |
|------|-----|-----|
| Kamui Black | `#0a0a0a` | Background principal |
| Kamui Red | `#c41e3a` | Cor de destaque (Sharingan) |
| Kamui Red Glow | `#ff2d55` | Efeitos de brilho |
| Kamui Gray | `#2a2a2a` | Cards e elementos |
| Kamui White | `#f5f5f5` | Texto principal |

### Componentes UI

- `Card` - Container com efeito glassmorphism
- `Button` - Botões com variantes (primary, outline, ghost, danger)
- `Badge` - Labels de status
- `Progress` - Barra de progresso com gradiente
- `MetricCard` - Cards de métricas
- `SharinganIcon` - Ícone animado do Sharingan
- `KamuiLoader` - Loader com animação vortex

## 🛠️ Scripts

```bash
# Desenvolvimento
npm run dev              # Inicia Vite dev server
npm run electron:dev     # Inicia Electron + Vite

# Build
npm run build            # Build para produção
npm run electron         # Executa Electron
```

## 📦 Dependências Principais

- **Electron** - Framework para aplicações desktop
- **React** - Biblioteca de UI
- **React Router** - Navegação
- **Tailwind CSS** - Estilização
- **Framer Motion** - Animações
- **Recharts** - Gráficos
- **Lucide React** - Ícones

## 🎯 Roadmap

- [ ] Integração com YouTube API
- [ ] Monitoramento de pasta em tempo real
- [ ] Sistema de notificações nativas
- [ ] Auto-update da aplicação
- [ ] Suporte a múltiplos canais
- [ ] Editor de thumbnails integrado
- [ ] Agendamento de uploads

## 📄 Licença

MIT License - Veja [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  <sub>Desenvolvido com 🔴 inspirado na técnica ocular <strong>Kamui</strong> de Naruto</sub>
</p>
