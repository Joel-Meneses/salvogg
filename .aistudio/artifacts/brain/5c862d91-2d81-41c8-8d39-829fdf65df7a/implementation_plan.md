# Barra Bandeira - MVP (Adaptação ao Repositório `salvogg`)

Adaptação completa do jogo 3D no navegador e substituição do pacote de exportação para alinhar integralmente a jogabilidade, nomenclatura, balanceamento de habilidades e estrutura técnica ao repositório Unity 6.3 LTS (`vitormigueld/salvogg`).

---

## Decisões Confirmadas e Pontos Críticos

> [!IMPORTANT] Todas as decisões abaixo foram confirmadas durante o alinhamento inicial e orientam diretamente esta atualização.

- **Estratégia de Adaptação (Repositório sem `Assets/`)**: O repositório `salvogg` contém o `README.md`, `Packages/manifest.json` e `ProjectSettings/` da **Unity 6.3 LTS (`6000.3.28f1`)**, mas ainda não possui a pasta `Assets/`. Vamos adaptar o jogo Web 3D ao `README.md` e gerar o pacote completo da pasta `Assets/` em C# pronto para ser colado no projeto Unity.
- **Substituição do Exportador de Engine**: O inspetor e exportador de Godot 4 será substituído por um **Inspetor e Exportador Unity 6.3 C# (`.zip`)** compatível com os pacotes nativos já configurados no repositório.
- **Mecânica da Granada da Luppy (Regra Fiel ao README)**: Ao explodir em um raio de **4 metros**, a granada descongelante da Luppy **descongela todos os jogadores congelados na área — tanto aliados quanto inimigos** — exigindo precisão tática para não salvar adversários por acidente.
- **Identidade e Balanceamento Exatos do README**:
  - Título: **Barra Bandeira - MVP** (substituindo a marca anterior na interface e metadados).
  - **Bobby (Escudeiro)**: Imune a congelamento por toque durante **6 segundos**.
  - **Silver (Velocista)**: Arrancada rápida (dash) de **5 metros** para frente.
  - **Luppy (Suporte)**: Granada descongelante com área de **4 metros** (e remoção de congelamento em inimigos na área como risco tático).

---

## 1. Visão Geral e Conceito Central

- **O Que Entrega**: Uma experiência 3D competitiva 3v3 jogável instantaneamente no navegador com bots autônomos, som procedural e controles responsivos, acompanhada de um pacote exportável de código C# (`Assets/`) para o projeto Unity 6.3 LTS (`salvo-projeto`).
- **Público-Alvo**: Jogadores casuais e competitivos que buscam partidas rápidas de barra-bandeira tática, além dos desenvolvedores do projeto `salvogg` na Unity 6.3.
- **Valor Principal**: Sincronia total entre o protótipo jogável Web e a base de código C# para Unity 6.3, eliminando divergências de regras e preenchendo a lacuna da pasta `Assets/` no repositório.

---

## 2. Experiência do Usuário e Design Visual

### Fluxos Principais do Jogador
1. **Menu Principal (`Barra Bandeira - MVP`)**: O jogador visualiza a arena 3D ao fundo, escolhe sua equipe (**Time Azul** ou **Time Vermelho**), seleciona um dos três personagens (**Bobby**, **Silver** ou **Luppy**) com seus parâmetros reais do README, consulta as regras ou abre o modal **Unity 6.3 & Scripts C#**.
2. **Partida em Tempo Real (3v3)**: O jogador movimenta seu personagem (`WASD` / Setas / Analógico Virtual), mira com o mouse e ativa a habilidade especial (`Espaço`). Alertas flutuantes 3D e áudio sintetizado sinalizam eventos críticos (*"ESCUDO 6s!"*, *"DASH 5m!"*, *"GRANADA DESCONGELANTE!"*, *"CUIDADO: INIMIGO DESCONGELADO!"*, *"BANDEIRA CAPTURADA!"*).
3. **HUD de Partida**: Exibe placar de bandeiras (0 a 3 para cada lado), cronômetro regressivo central, cartão discreto do personagem ativo e botão de habilidade com contagem regressiva de recarga, mantendo o centro do viewport 3D 100% desobstruído.
4. **Tela de Resultado**: Apresenta vitória ou derrota com confetes, placar final de bandeiras, destaque de MVP, estatísticas por jogador (bandeiras, congelamentos e resgates) e botões para jogar novamente, voltar ao menu ou baixar o pacote Unity.
5. **Inspetor e Exportador Unity 6.3 (`Unity 6.3 & Scripts C#`)**: Navegação entre os scripts C# gerados e guia passo a passo para extrair a pasta `Assets/` diretamente dentro do clone de `vitormigueld/salvogg` e gerar as cenas `MainScene` e `MenuScene` via menu do Editor.

### Identidade Visual e Tema
- **Direção Estética**: Arena 3D estilizada e vibrante em viewport completo (`w-full h-full`), com iluminação em três pontos (luz direcional quente, preenchimento hemisférico frio e neblina atmosférica) e HUD flutuante em camadas escuras translúcidas com alto contraste.
- **Paleta de Cores (60-30-10)**:
  - *Base Neutra (60%)*: Ardósia profunda (`slate-950` / `slate-900`) para superfícies de UI e gramado natural na arena.
  - *Superfícies Estruturais (30%)*: Cartões de equipe em azul cobalto e vermelho carmesim com bordas sutis sem ruído visual.
  - *Acentos Funcionais (10%)*: Âmbar para ações primárias e escudo do Bobby, esmeralda para o dash do Silver e ciano/violeta para a granada criogênica da Luppy.
- **Tipografia e Hierarquia**: `Outfit` para títulos e placares, `Plus Jakarta Sans` para textos de interface e `JetBrains Mono` com algarismos tabulares (`tabular-nums`) para cronômetro, recargas e estatísticas.
- **Feedback Interativo**: Transições suaves de câmera e rotação com amortecimento exponencial, indicadores claros de estado congelado/escudo e ausência total de botões sem ação.

---

## 3. Decisões de Produto e Trade-Offs

- **Decisão 1 — Granada da Luppy fiel ao risco tático do README**:
  - *Abordagem Escolhida*: A granada descongelante da Luppy possui alcance de lançamento de 5m e área de efeito de **4m de raio**, descongelando **qualquer jogador congelado** dentro dessa área (aliados e adversários). Quando um inimigo é descongelado pela granada, o sistema exibe alerta visual de advertência e a IA dos bots evita arremessar a granada perto de inimigos congelados.
  - *Por quê*: Garante fidelidade estrita às regras documentadas no `README.md` de `salvogg` e adiciona profundidade estratégica ao papel de suporte.
  - *Alternativa Descartada*: Congelar inimigos com a granada (contrariaria diretamente o aviso explícito do `README.md`).

- **Decisão 2 — Compatibilidade zero-dependência para Unity 6.3 (`Packages/manifest.json`)**:
  - *Abordagem Escolhida*: Os scripts C# exportados utilizam exclusivamente APIs nativas já habilitadas no `manifest.json` do repositório (`UnityEngine`, `UnityEngine.SceneManagement`, `UnityEngine.Input` mapeado para `InputManager.asset` e `OnGUI`/Canvas padrão sem exigir instalação manual de `TextMeshPro` ou `InputSystem`). Inclui também um script de Editor (`BarraBandeiraSceneBuilder.cs`) para montar automaticamente `MenuScene` e `MainScene` com piso, linha central, obstáculos com `BoxCollider`, bandeiras e os 6 personagens.
  - *Por quê*: O repositório `salvogg` usa Built-in Render Pipeline e Input Manager clássico; gerar código que dependesse de pacotes ausentes causaria erros de compilação ao abrir na Unity 6.3.
  - *Alternativa Descartada*: Exigir que o usuário instale pacotes extras via Package Manager antes de compilar os scripts.

- **Decisão 3 — Remoção do exportador Godot 4 em favor do pacote Unity 6.3**:
  - *Abordagem Escolhida*: Substituir integralmente os artefatos e o modal do Godot pelo fluxo voltado ao projeto `salvo-projeto` na Unity 6.3 (`Assets/Scripts/`, `Assets/Editor/` e `README_UNITY.md`).
  - *Por quê*: Alinha a ferramenta ao fluxo real do repositório informado pelo usuário.

---

## 4. Arquitetura Técnica e Estratégia de Dados

### Diagrama de Arquitetura e Fluxo

```
┌────────────────────────────────────────────────────────────────────┐
│                        App & Orquestração                          │
│  Estado da Partida (menu / playing / game_over), Equipe e Herói    │
└───────────────┬───────────────────────────────────┬────────────────┘
                │                                   │
                ▼                                   ▼
┌───────────────────────────────┐   ┌────────────────────────────────┐
│   Simulação & IA (Web 3D)     │   │  Camada de Interface & Export  │
│                               │   │                                │
│ ┌───────────────────────────┐ │   │ ┌────────────────────────────┐ │
│ │ Motor de Regras           │ │   │ │ Menu & Seleção (Bobby 6s,  │ │
│ │ • Território Azul vs Verm │ │   │ │ Silver 5m, Luppy 4m)       │ │
│ │ • Colisão AABB / Cilindro │ │   │ └────────────────────────────┘ │
│ │ • Captura 3 Bandeiras     │ │   │ ┌────────────────────────────┐ │
│ └─────────────┬─────────────┘ │   │ │ HUD & Resultado Final      │ │
│               ▼               │   │ │ Placar, Timer, Recarga,    │ │
│ ┌───────────────────────────┐ │   │ │ Joystick Virtual e MVP     │ │
│ │ Habilidades & Bots        │ │   │ └────────────────────────────┘ │
│ │ • Bobby: Escudo 6s        │ │   │ ┌────────────────────────────┐ │
│ │ • Silver: Dash 5m         │ │   │ │ Inspetor & ZIP Unity 6.3   │ │
│ │ • Luppy: Granada 4m (All) │ │   │ │ Scripts C# + SceneBuilder  │ │
│ └───────────────────────────┘ │   │ └────────────────────────────┘ │
└───────────────┬───────────────┘   └────────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│   Renderizador Three.js PBR   │
│ Modelos 3D, Câmera Suave,     │
│ Áudio Procedural & Partículas │
└───────────────────────────────┘
```

### Modelo de Dados e Estado
- **Personagens (`Bobby`, `Silver`, `Luppy`)**: Definições centralizadas com nome, função (`Escudeiro`, `Velocista`, `Suporte`), duração do escudo (`6.0s`), distância de dash (`5.0m`), raio da granada descongelante (`4.0m`) e tempos de recarga.
- **Estado de Jogador**: Posição, velocidade, rotação suavizada, estado congelado, estado de escudo ativo (com temporizador de 6s), estado de dash, identificador de bandeira carregada e contadores individuais de desempenho.
- **Bandeiras e Projéteis**: Controle de posse, retorno à base ao ser derrubada em campo e projéteis parabólicos com raio de explosão de 4m.

### Mapeamento Interativo de Componentes e Estados
- **Seleção no Menu Principal**: Alternar equipe ou personagem atualiza os parâmetros iniciais passados ao motor da partida; clicar em **Entrar na Partida** inicia o loop em tempo real e oculta o menu.
- **Controles em Jogo (`GameCanvas` + `HUD`)**: Entradas de teclado (`WASD`/Setas/`Espaço`), mouse e joystick virtual transformam-se em vetores alinhados à câmera; o botão de habilidade exibe o progresso de recarga em tempo real e dispara a habilidade do personagem selecionado.
- **Exportador Unity 6.3**: Selecionar um arquivo C# na barra lateral exibe seu conteúdo completo com botão de cópia rápida; clicar em **Baixar Pasta `Assets/` (.ZIP)** gera dinamicamente o pacote pronto para extração na raiz do repositório `salvogg`.
