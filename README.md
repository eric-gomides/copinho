# Copinho 💧

App Android de rastreamento de hidratação diária com mascote animado, conquistas, lembretes inteligentes e insights de consumo.

---

## Índice

- [Visão geral](#visão-geral)
- [Stack](#stack)
- [Funcionalidades](#funcionalidades)
- [Arquitetura do projeto](#arquitetura-do-projeto)
- [Como rodar em desenvolvimento](#como-rodar-em-desenvolvimento)
- [Como gerar a APK](#como-gerar-a-apk)
- [Boas práticas do projeto](#boas-práticas-do-projeto)

---

## Visão geral

O **Copinho** é um app Android construído com React Native + Expo que ajuda o usuário a beber água ao longo do dia. O diferencial é o mascote animado — uma garrafa com rosto que enche à medida que o usuário registra goles — acompanhado de efeitos sonoros, conquistas, lembretes por notificação e um histórico semanal com insights calculados do consumo real.

O projeto nasceu de um design handoff completo (HTML/CSS/JSX de referência) e foi implementado inteiramente em TypeScript com foco em fidelidade visual e experiência mobile nativa.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React Native 0.81.5 + Expo SDK 54 (New Architecture) |
| Linguagem | TypeScript |
| Estado global | Zustand 5 + `persist` middleware + AsyncStorage |
| Animações | Reanimated 4.3 |
| Gráficos/SVG | react-native-svg 15 |
| Ícones | lucide-react-native 1.14 |
| Notificações | expo-notifications |
| Persistência | @react-native-async-storage/async-storage 1.23 |
| Saúde (Android) | react-native-health-connect |
| Áudio | expo-av + WAV gerado em memória (PCM puro, sem arquivos) |
| Tema | ThemeContext customizado (light/dark via `useColorScheme`) |
| Build | Gradle 8 · Java 17 · `arm64-v8a` · minSdk 26 |

---

## Funcionalidades

### Registro de hidratação
- Selecione o volume (50 ml–1.5 L) via slider ou atalhos rápidos
- 5 tipos de líquido com multiplicador de hidratação real (água pura, chá, café, suco, água de coco)
- Histórico do dia com opção de excluir registros individuais
- Célula de celebração animada ao bater a meta diária (confetes + fanfarra sonora)

### Mascote Copinho
- Garrafa SVG animada que enche progressivamente conforme o consumo
- 3 formatos: **Clássico**, **Galão**, **Copinho**
- 8 paletas de cor: Aqua, Ocean, Grape, Rose, Coral, Tangerine, Lime, Forest
- Rosto expressivo com olhos piscando e bolhas de água animadas
- Personalização via tela dedicada (cor + formato com preview ao vivo)

### Meta diária
- Meta configurável de 1,5 L a 6 L (padrão: 4 L)
- Progresso salvo por dia; reseta automaticamente à meia-noite
- GoalSheet com slider, atalhos populares e texto contextual

### Lembretes
- 6 lembretes-template pré-configurados (Ao acordar, Meio da manhã, Almoço, Meio da tarde, Fim de expediente, Jantar)
- Editar horário de qualquer lembrete via **TimeEditSheet** com spinner de hora/minuto e 6 presets rápidos
- Sugestões de mensagem de notificação por template
- Criar novos lembretes por **intervalo** (ex.: a cada 2h das 8h às 20h, com preview dos horários gerados) ou **horário único** (com nome e mensagem personalizados)
- Templates não podem ser deletados; lembretes criados pelo usuário podem
- Tudo reagendado via `expo-notifications` após qualquer mudança

### Conquistas
- **19 badges** divididos em 3 categorias:
  - **Diárias** (7): Primeiro gole, Meta cumprida, Passarinho, Só água, 5L boss, Coruja, Ritmo certo
  - **Semanais** (6): Tri-dia, Semana hidratada, Maratona líquida, Fim de semana firme, Madrugadora, Sem cafué
  - **Mensais** (6): 20 em 30, Mês perfeito, Tanque cheio, Novo recorde, Constante, Em evolução
- Hero card por aba (coral / plum / teal-900) com ícone animado e track de progresso
- Badges desbloqueados automaticamente ao atingir critérios

### Histórico e insights
- Gráfico de barras dos últimos 7 dias com linha de meta
- 3 seções de insights calculados em tempo real:
  - **Padrões da semana** — horário de pico, intervalo médio entre goles, gole médio, participação do café
  - **Comparativos** — variação vs. semana anterior, sequência atual vs. recorde
  - **Recomendações** — CTA para criar lembrete às 14h30 direto da tela de histórico

### Dark mode
- Tema claro/escuro automático via `useColorScheme()`
- Todas as cores definidas em `ThemeContext` (light/dark); nenhum valor hardcoded nos componentes

### Widget Android
- Widget nativo (Kotlin `AppWidgetProvider`) que exibe consumo atual / meta
- Atualizado via `ReactMethod` a cada gole registrado

### Saúde
- Integração opcional com **Health Connect** (permissão solicitada no primeiro gole)
- Registra cada drink como `HYDRATION` record

---

## Arquitetura do projeto

```
app/
├── App.tsx                   # Raiz: ThemeProvider, navegação por estado, overlays
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx        # Tela principal com Copinho e log do dia
│   │   ├── HistoryScreen.tsx     # Histórico semanal + insights
│   │   ├── BadgesScreen.tsx      # Conquistas com 3 tabs
│   │   ├── RemindersScreen.tsx   # Lembretes com edição/criação
│   │   ├── PersonalizeScreen.tsx # Seletor de cor e formato
│   │   └── OnboardingScreen.tsx  # 3 passos de onboarding
│   ├── components/
│   │   ├── Bottle.tsx            # Mascote SVG animado
│   │   ├── BottomNav.tsx         # Nav bar com FAB central
│   │   ├── AddSheet.tsx          # Bottom sheet de registro
│   │   ├── GoalSheet.tsx         # Bottom sheet de meta
│   │   ├── TimeEditSheet.tsx     # Bottom sheet de edição de lembrete
│   │   └── NewReminderSheet.tsx  # Bottom sheet de criação de lembrete
│   ├── store/
│   │   └── useAppStore.ts        # Zustand store com persist + AsyncStorage
│   ├── theme/
│   │   ├── ThemeContext.tsx       # ThemeProvider + makeStyles helper
│   │   ├── tokens.ts             # Colors, FontSizes, Spacing, Radii
│   │   └── colorShades.ts        # Paletas das 8 cores da garrafa (oklch → hex)
│   ├── hooks/
│   │   └── useBoolean.ts         # Hook utilitário para toggle booleano
│   ├── native/
│   │   └── CopinhoWidgetModule.ts # Bridge JS → Kotlin para atualizar widget
│   └── utils/
│       ├── sounds.ts             # Síntese PCM de sons (drop + fanfarra)
│       ├── notifications.ts      # Agendamento de lembretes diários
│       └── healthConnect.ts      # Integração Health Connect
└── android/
    └── app/src/main/java/com/anonymous/copinho/
        ├── CopinhoWidget.kt      # AppWidgetProvider nativo
        ├── WidgetModule.kt       # ReactMethod updateWidget()
        └── WidgetPackage.kt      # Registro do módulo nativo
```

### Fluxo de estado

O estado da aplicação vive inteiro em **um único store Zustand** (`useAppStore`). Toda mutação passa por actions tipadas; componentes apenas leem e chamam actions — nunca escrevem estado diretamente.

```
addDrink(ml, type)
  → atualiza log, streak, badges, goalMetToday
  → side-effects: playDrop(), writeHydrationRecord(), updateWidget()
  → se cruzou a meta: playFanfare() + showCelebration
```

O store é persistido via `AsyncStorage` com `partialize` (exclui funções e estado transiente como `showCelebration`). Ao reidratar, o `onRehydrateStorage` filtra o log para apenas entradas de hoje e migra campos novos (ex.: `template` nos lembretes).

### Navegação

A navegação é baseada em **estado React** simples (`useState<Screen>`), sem React Navigation ou expo-router. Cada tela é renderizada condicionalmente no `AppShell`. Isso evita conflitos de versão com o Expo SDK e mantém o bundle pequeno.

### Tema e estilos

Nenhum componente usa `StyleSheet.create` diretamente. Todos usam o helper `makeStyles`:

```ts
const useStyles = makeStyles(c => ({
  card: { backgroundColor: c.paper, borderRadius: Radii.card },
  title: { color: c.ink, fontSize: FontSizes.h2 },
}));

// No componente:
const styles = useStyles(); // memoizado por tema
```

Isso garante que o dark mode funcione automaticamente em todos os componentes sem lógica extra.

---

## Como rodar em desenvolvimento

### Pré-requisitos

- Node.js 18+
- Android Studio com SDK Android (API 26+)
- Emulador Android ou dispositivo físico

### Instalação

```bash
git clone https://github.com/eric-gomides/copinho.git
cd copinho
npm install
```

### Iniciar o Metro bundler

```bash
npx expo start --android
```

> O app usa **New Architecture** (Fabric + JSI). Se o emulador travar, reinicie via `adb reboot`.

### Nota sobre o ambiente nativo

A pasta `android/` está versionada com o código nativo do widget. Se rodar `expo prebuild --clean`, ela será **sobrescrita** e os arquivos do widget serão perdidos. Nesse caso, restaure os arquivos via `git checkout -- android/` antes de compilar.

---

## Como gerar a APK

O build exige **Java 17**. Se a máquina tiver apenas Java 21+, baixe o Temurin 17 e aponte via `org.gradle.java.home` no `android/gradle.properties`.

```bash
# Crie o local.properties com o caminho do Android SDK
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties

# Build da APK de release
cd android
./gradlew assembleRelease
```

A APK gerada fica em:
```
android/app/build/outputs/apk/release/app-release.apk
```

> O arquivo `android/local.properties` está no `.gitignore` — cada desenvolvedor precisa criá-lo localmente.

---

## Boas práticas do projeto

### Adicionar uma nova tela

1. Crie o arquivo em `src/screens/NovaTela.tsx`
2. Exporte a função com o mesmo nome do arquivo
3. Adicione o tipo ao union `Screen` em `useAppStore.ts`
4. Monte condicionalmente no `AppShell` dentro de `App.tsx`
5. Adicione o item de navegação ao `BottomNav` se necessário

### Adicionar estado global

Toda adição ao store deve seguir o padrão:

```ts
// 1. Declare o campo na interface AppState
novoValor: string;
setNovoValor: (v: string) => void;

// 2. Implemente na factory do create()
novoValor: 'default',
setNovoValor: (v) => set({ novoValor: v }),

// 3. Adicione ao partialize() se deve ser persistido
partialize: (state) => ({
  ...
  novoValor: state.novoValor,
})
```

### Adicionar um novo lembrete template

Edite `DEFAULT_REMINDERS` e `REMINDER_TEMPLATES` em `useAppStore.ts` e `TimeEditSheet.tsx` respectivamente. O campo `template: true` impede que o usuário exclua o lembrete pela UI.

### Adicionar um novo badge

```ts
// Em ALL_BADGES (useAppStore.ts):
{ id: 'novo', kind: 'daily', name: 'Nome', desc: 'Descrição', icon: 'drop' }

// Em computeNewBadges():
if (/* condição */) add('novo');
```

### Estilos e tokens

- Nunca use valores de cor ou tamanho hardcoded nos componentes
- Cores: sempre via `c.nomeDoToken` dentro do `makeStyles` ou `colors.nomeDoToken` via `useTheme()`
- Tamanhos: `FontSizes.*`, `Spacing.*`, `Radii.*` de `src/theme/tokens.ts`
- Cores da garrafa: `SHADES[bottleColor].nomeDoShade` de `src/theme/colorShades.ts`

### Sons

Sons são gerados sinteticamente em PCM e cacheados como WAV no sistema de arquivos local. Para adicionar um novo som:

```ts
// Em sounds.ts
async function buildNovoSom(): Promise<Float32Array> {
  // sintetize aqui
}

export async function playNovoSom(): Promise<void> {
  const uri = await getUri('novo', buildNovoSom);
  await play(uri);
}
```

### Notificações

Após qualquer alteração nos lembretes, chame `scheduleReminders(reminders)` para reprocessar todos os agendamentos. O handler global é registrado uma única vez em `App.tsx` (fora de qualquer componente) via `setupNotificationHandler()`.

### Build nativo (widget)

Se precisar alterar o widget Android:

| Arquivo | Responsabilidade |
|---|---|
| `CopinhoWidget.kt` | Renderiza o RemoteViews e lê SharedPreferences |
| `WidgetModule.kt` | Expõe `updateWidget(cur, goal)` para o JS via `@ReactMethod` |
| `WidgetPackage.kt` | Registra o módulo no ReactPackage |
| `MainApplication.kt` | Adiciona `WidgetPackage()` à lista de pacotes |
| `res/layout/copinho_widget.xml` | Layout do widget |
| `res/xml/copinho_appwidget_info.xml` | Metadados do widget (tamanho, update interval) |
