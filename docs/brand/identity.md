# Visual identity (v1.7, P1)

Direction: **friendly, calm, text-first**. Small shapes, real information, soft colour. It should feel like a helpful neighbour, not a template and not a city-hall portal. Light theme first; dark is a later "should". See `brand-board.html` for the rendered version.

Everything is a proposal. Name and copy are placeholders until the team picks a brand.

## 1. Name

Working name: **hop** (lowercase). Short, bouncy, works in Romanian and English ("hop în oraș"). Alternates: *Pulse*, *Zest*, *Bega*. Keep it in one constant (`BRAND_NAME`) once `packages/ui` exists.

Tagline (placeholder): **EN** "Everything in Timișoara, one tap away." · **RO** "Tot Timișoara-ul, la un tap distanță." (needs a native check)

## 2. Principles

1. **No pale boxes.** A screen made of tinted rounded rectangles (icon tiles, badges, cards, pills in a wash of lilac) looks like a form builder, not a product. The page is plain white. Nothing is wrapped in a tinted container just to separate it; space, type and a hairline do that job.
2. **Text first.** A shape earns its size by the information inside it. No large colour blocks that hold a word or two.
3. **Colour lives in a few places:** the free-standing illustrations, the coloured numbers that lead a row, solid avatars, one dark pill, and the single pink button. Never in backgrounds.
4. **Lists, not cards.** The main pattern is a hairline list straight on the page: a leading datum (a coloured number, a date), a title, one line of detail, a trailing status.
5. **Pink is rare.** The logo and the one main button on a screen, nothing else. Not the active tab, not icons, not avatars, not links, not the switch, not focus rings, not backgrounds or glows.
6. **Serious screens go quieter.** Outages and safety use a plain timeline, no glass, no illustration, no jokes.

The arch (a baroque window from the facades around Piața Unirii) is the one signature shape, and it is small: the logo and the crop of the featured event picture. Module marks no longer sit in arches (they read like tombstones).

## 3. Logo

`docs/brand/logo.svg`: a white baroque gable with an arched window, on a pink tile. At small sizes it reads a little like a "home" icon; fine for a city app, but worth a look from the team.

- App icon: the tile as drawn (export a full-bleed square for the stores; the OS applies its own mask).
- Wordmark: "hop" in Nunito 800, lowercase, ink, set next to the mark at the same height. Keep it modest in size (about 64 px on the board), never a giant hero word.
- Clear space: half the mark's height. Minimum mark size 24 px. Do not recolour or stretch.

## 4. Colour

**Text on pink is always ink** (5.3:1). White on this pink reaches only 3.4:1, so it is never used, at any size. Coloured text and glyphs on white use that hue's **deep** shade. Yellow is not part of the palette.

| Token | Hex | Use | Contrast |
| --- | --- | --- | --- |
| `bg` | `#F8F6FB` | the board and web page background only; phone screens are plain white | ink 16.6:1 |
| `surface` | `#FFFFFF` | groups, sheets, inputs | |
| `ink` | `#1A1033` | text, icons | 16.6:1 on bg |
| `muted` | `#5A5070` | secondary text | 6.9:1 on bg |
| `hair` | ink at 7% | row separators | |

| Hue | Solid | Deep (text and glyphs) | Deep on white |
| --- | --- | --- | --- |
| pink (brand, rare) | `#FF3D7F` | none | n/a |
| blue | `#3D5BFF` | `#2438C9` | 8.5:1 |
| mint | `#12C99B` | `#00704F` | 6.1:1 |
| apricot | `#FF7A2F` | `#A84300` | 6.1:1 |

A pale tint of each hue exists (`#E9EDFF`, `#DFFAF1`, `#FFEDE0`, and neutral `#EFEDF5`) but is only for the lightest parts inside illustrations and for tiny non-text accents, never for a background behind content.

- **Pink** is only the logo and the one primary button on a screen, with an ink label.
- **Solid blue, mint, apricot** are for small dots (live, progress), avatars (apricot with ink initials, blue with white, mint with ink, or ink with white) and inside illustrations. **Deep** shades are for status glyphs and coloured text on white. **Tints are not used as backgrounds.**
- **Neutral** is ink: the active tab (a soft ink-8% pill behind it), tonal buttons (ink at 7%), the switch and focus rings, and the ink-filled ask pill. Community modules (events, buddy, forum) use the multi-colour illustrations like the others.
- **Hue by meaning:** blue for getting around and information (transit, parkie, visitor info, assistant), mint for home and services (utilities, wallet, feedback), apricot for safety and warnings (safety, smell).
- **Red** (`#B3261E`, 6.5:1 on white) is for error glyphs and text only.
- Status uses a coloured glyph (no circle behind it) plus text, never colour alone: success mint, warning apricot, error red, info blue.

### Dark theme (later)

`bg #14091F`, surface `#20123A`, text `#F8F6FB`. Design after the light theme ships.

## 5. Typography

- **Headlines:** Nunito, 700 and 800. Rounded terminals make it warm and easy on the eyes at any size.
- **Interface and body:** Figtree, 400 to 700.

Both render Romanian comma-below **ș ț** and ă â î, plus Hungarian ő ű (checked in a render). Headlines use normal tracking and balanced wrapping (`text-wrap: balance`). Numbers that line up use tabular figures.

| Style | Size / line | Font |
| --- | --- | --- |
| Display | 52 / 58 | Nunito 800 |
| Title | 36 / 42 | Nunito 800 |
| Heading | 26 / 32 | Nunito 800 |
| Section | 18 / 24 | Nunito 800 |
| Subheading | 20 / 26 | Nunito 700 |
| Body large | 18 / 26 | Figtree 500 |
| Body | 16 / 24 | Figtree 400 |
| Row title | 16 / 22 | Figtree 700 |
| Row detail | 14 / 20 | Figtree 500 |
| Label | 14 / 20 | Figtree 600 |
| Caption | 12 / 16 | Figtree 500 |

Body at least 16 px on mobile; respect the system font-size setting; lines under 60 characters. Use curly apostrophes and quotes in copy.

## 6. Shape, depth, material, motion

**Shape.** Continuous corners (squircle): `corner-shape: squircle` on web, `borderCurve: "continuous"` on iOS. Groups 24, inputs 18, sheets 28 on top, buttons, chips and nav fully round; data badges radius 13.

**Depth is quiet.** Lists have no card, no ring and no shadow: just a 1 px hairline (ink at 7%) between rows. Inputs, chips and the segmented control keep a soft ring and a small shadow because they must read as controls. Floating things (tab bar, toast, sheet) get the larger soft shadow. The only coloured glow is a tight one under the pink button (`0 6px 12px -8px rgba(255,61,127,.5)`); it must never reach the next component, so leave at least 12 px below it and do not make glowing elements `position: relative` (that stacks their shadow over following siblings).

**Glass is for floating controls only:** the tab bar, the ask bar, toasts. White at 60%, blur 22 px, saturate 1.8, white inner edge. It needs content or colour passing beneath it. With "reduce transparency" on, glass becomes near-opaque white. Serious screens use no glass.

**Layout.** 4 px grid (4, 8, 12, 16, 24, 32). Touch targets at least 44 px (chips, segmented controls, rows). Boundaries come from space and hairlines, not heavy rules or thick frames.

**Buttons: three variants, two sizes, one label colour.**

| Variant | Fill | Label | Use |
| --- | --- | --- | --- |
| Primary | pink `#FF3D7F` | ink | the single main action on a screen |
| Secondary | ink at 7% | ink | a lesser action next to a primary |
| Text | none | ink | the quietest option ("Not now", "My building has it too") |

| Size | Height | Label | Use |
| --- | --- | --- | --- |
| Large | 52 | 17 px / 700 | pinned bottom actions, full-width (`block`), standalone calls to action |
| Medium | 44 | 15 px / 700 | inline actions inside a content row, next to avatars or text |

All buttons are fully rounded with a 700 label, nowrap, and a 44 px minimum height. **The label is always ink**, never white, on every variant and size (the `on-primary` token). Only one primary button per screen; everything else on the screen is secondary or text. Pressed: scale to 0.97 (primary also dims 6%, which keeps ink above 4.7:1). Loading: replace the label with a small ink spinner and disable the button. Focus: a 3 px ink ring.

**Components:** grouped list with rows (leading data badge); module marks in arches; chips; segmented control; switch; floating-label input; avatar stack; one-line notices (small icon circle plus text, no big fill); live dot with a slow pulse; small progress meter; toast; bottom sheet (grab handle, 28 px top radius, scrim); vertical timeline; floating glass tab bar.

**Motion** answers actions only. A press is a quick springy scale to 0.97; a new item pops in. The live dot pulses slowly because it signals real-time data. Everything respects "reduce motion". Visible 3 px focus ring on every control.

## 7. Icons and marks

Icons are used at three separate levels, each with one consistent style (one family per level, one stroke width per level, never mixed at the same level):

1. **Rows lead with the module's own illustration.** Each alert or status row starts with the same small free-standing spot illustration as its module (44 px, no box behind it): the drop for utilities, the tram for transit, the P sign for parking, the cloud for smell, the lamp for safety. Then a 16 px bold title that already states the fact ("Hot water is off", "42 free spots"), one 14 px muted detail line, and a trailing element aligned to the title line (a muted time, a small apricot dot for new, or a tiny progress meter). This keeps one visual family, shows where an alert comes from at a glance, and avoids the three things that did not work: giant coloured numerals (three competing type voices in a row), tinted boxes (read as a cheap form), and bare stock pictograms (generic). Plain text with no leading element was tried and felt empty. Event rows may lead with a small date instead.

   **Use each illustration at most once per screen.** The same picture repeated down a page reads as filler. So: (a) a shortcut or Explore strip only shows modules that are not already visible in a list on that screen; (b) when several rows come from the same module, group them under one heading that carries the illustration, or lead only the first row and leave the others text-only; (c) detail screens do not repeat the illustration of the row that led to them. The same rule applies to the board's demo content: show different modules in different examples.
2. **Module spot illustrations: small flat scenes** for the module list and the Explore group only (13 of them). Built from simple filled shapes on a 56 px grid, **no outlines**, using only palette colours: the hue's solid and light tones plus plum `#3A2F5C` for fine parts, white for highlights. Each tells a tiny story with two or three details (a tram with its pantograph and rails, a lamp with its glow, a folded map with a pin, festival bunting, a water drop with a ripple), and stands **free, with no tile or container behind it**, 52 px, with the label beside it (illustration left, label right, never stacked). Fills use the richer tones (blue `#8FA3FF`/`#6C84FF`, mint `#7EE6C8`, apricot `#FFB88A`) so they hold on a white page. Lists of modules run two per row on the phone. The featured event picture follows the same language, on a dark night tile. (Earlier versions used thin-line pictograms in tiles and arches; they read as a generic stock set and were replaced.)
3. **Controls, navigation, status: Phosphor** (`phosphor-react-native`), bold weight, fill weight for the active tab. Outline-only, 22 to 24 px.

| Module | Mark | Hue | Module | Mark | Hue |
| --- | --- | --- | --- | --- | --- |
| events | calendar | neutral | wallet | wallet with clasp | mint |
| buddy | two people | neutral | feedback | heart | mint |
| forum | chat bubble | neutral | safety | street lantern | apricot |
| transit | tram front | blue | smell | wind | apricot |
| parkie | P sign | blue | dashboard | bars (web only) | neutral |
| visitor-info | i in a circle | blue | assistant | four-point spark | blue |
| utilities | drop | mint | | | |

The source drawings are the inline SVGs in the Modules section of `brand-board.html`. When `packages/ui` exists they become one SVG component per module. These are a first pass drawn in code: expect a real illustrator to refine them, and keep the same rules (flat shapes, no outlines, palette only).

**Rules.** Decorative icons beside visible text are hidden from assistive tech (`aria-hidden`); an icon that stands alone gets a text alternative. Icon sizes are tokens (16, 22, 24, 32), not ad-hoc values. Meaningful icons keep at least 3:1 contrast against their background (each deep colour is above 6:1 on white).

**Navigation shows an icon and a label on every tab**, never icon-only, with a soft ink-8% pill behind the active one. Four tabs: Home, Map, Community, Profile (never more than five). **Alerts is not a tab: it is a bell at the top-right of every main screen**, with a small apricot dot when something is new, because that is where people expect it and it keeps the tab bar short.

The module manifest's `icon` field names the illustration id (for example `utilities`).

## 8. Layout patterns

- **Header (all main screens):** a small muted greeting over the name in headline type on the left; the alerts bell, a 44 px target, on the right.
- **Home** (top to bottom): header; the "Ask hop" bar (one solid ink pill); **Tonight** (one feature: a night-scene illustration, title, time and place, avatars with "12 going", and the screen's one pink button); **Right now** (illustrated rows: utility status, transit detour, parking spots); **Explore** (one horizontal strip of illustrated shortcuts for modules not already shown above, label under each, the next one peeking in so it is clear it scrolls); **This week** (event rows led by a date).
- **Every section header has a quiet "See all"** on the right (muted, 14 px, 44 px tap area). Section titles are plain 19 px headings, no labels above them. Keep each section to what fits without crowding; the rest is behind "See all".
- **Alerts list** (opened from the bell; `Alerts` title left, a settings icon right): two groups with plain headings, **For your places** (alerts that affect the user's saved addresses and lines) and **Around the city** (crowd-reported smells, lights, safety). Each row is the same row as elsewhere: the module illustration, a title, one line of detail, and trailing either a small apricot dot (new) or a muted time ("1h", "Today", "Until Dec"). The home "Right now" section shows the top rows of this list, so the story is the same everywhere. The tab bar stays, with nothing highlighted.
- **Alert detail is short:** no illustration (the row the user tapped already carried it, and a large repeat adds nothing), just the **answer as the headline** ("No hot water until about 18:00"), one line of cause, a **three-step status** (confirmed, in progress, expected back) instead of a long timeline, the neighbours who confirmed it, and **one primary action** ("Tell me when it's back") with one quiet text link ("My building has it too"). No grey pills. The actions are pinned to the bottom and the tab bar is hidden. Left-aligned throughout.

## 9. Tone of voice

Friendly, quick, second person. Short sentences, plain words, active verbs, sentence case. A button names what happens ("Find a buddy", not "Submit"), and an action keeps one name through its flow. Errors say what went wrong and how to fix it, without apologising. Humour only where little is at stake.

**Serious moments drop the jokes.** Outages, safety, transit disruptions: calm and factual. What happened, what it means for you, what to do next. No exclamation marks, no emoji.

| Moment | Write | Not |
| --- | --- | --- |
| Empty events list | "Nothing on tonight. Be the first to plan something." | "No data found." |
| Buddy match | "Maria is going too. Say hi?" | "A user matched your criteria." |
| Outage | "Hot water is off in your building until about 18:00. We'll tell you when it's back." | "ATTENTION!! Service disruption!!!" |
| Transit | "Tram 5 isn't running. Take 5C from Piața Sfântul Gheorghe." | "Line 5 suspended." |
| Error | "Couldn't send. Check your connection and try again." | "Error 500." |

Romanian is the default language, English the second. Every string goes through i18n from the start, and a native speaker reviews the Romanian.

## 10. Build notes (from the skill reviews)

**Tokens.** `docs/brand/design-tokens.json` holds every value in three layers (primitive, then semantic, then component); `design-tokens.css` is generated from it with the design-system skill's generator. Components reference semantic or component tokens only, never raw hex. For example, the primary button's label resolves to `semantic.color.primary-foreground`, which is ink.

**Accessibility (AccessLint scan plus the Vercel web-interface guidelines).** The board scans clean (0 violations after fixing heading order, adding a `main` landmark and giving each `nav` a unique label). Rules for the build: use real controls (`button`, `role="switch"`, links, labelled inputs), never clickable spans; every icon-only control has a label; decorative icons and illustrations are hidden from assistive tech; a visible 3 px focus ring on every control; `touch-action: manipulation`; respect reduced motion and reduced transparency; placeholders end with an ellipsis; tabular figures for times and counts.

**React Native (Vercel RN skills).**
- *Animation:* only transform and opacity, on the UI thread with Reanimated. Press = scale 0.97; the live dot = a ring that scales and fades; skeleton = a gradient sliding with translateX. Never animate box-shadow, width or height (the board's old CSS did; it is fixed).
- *Lists:* FlashList for alerts and events, a memoized row component, stable callbacks, no inline style objects, item types for the different rows (alert, event, section header).
- *Navigation:* use native stack and native tabs from Expo Router. The floating glass pill tab bar is a custom component; see open decision 1.
- *Images and touch:* `expo-image` for event pictures, illustrations as `react-native-svg` components, `Pressable` (not TouchableOpacity), safe-area insets on scroll content and the tab bar.
- *Styling:* `StyleSheet.create` or NativeWind, `borderCurve: "continuous"` for the squircle corners, `expo-blur` only for the few glass surfaces, fonts through the `expo-font` config plugin, and Intl formatters created once (RO/EN dates and times).
- *Monorepo:* native dependencies (reanimated, svg, blur) live in `apps/app`; `packages/ui` lists them as peer dependencies.

**Component APIs (Vercel composition patterns).** Avoid boolean props. Explicit variants: `PrimaryButton`, `SecondaryButton`, `TextButton`, each with `size: "lg" | "md"`; full width comes from the parent's layout, not a `block` prop. Rows are compound components: `Row`, `Row.Illustration`, `Row.Title`, `Row.Detail`, `Row.Trailing`, with trailing content passed as children (a time, a new-dot, a meter), not as props. `Section` with `Section.Header` (title plus "See all"). Prefer children over render props.

## 11. Open decisions (conflicts with the Bencium UX Designer guidance)

The Bencium skill insists on asking before design decisions, and a few of its rules disagree with choices we made. Not changed; these need the team's call.

1. **Glass and shadows.** Bencium prefers a flat look: no glass, no soft shadows. We use glass on the tab bar and toasts, and soft shadows on controls and floating things. Option: go fully flat (borders and tone only), or keep glass only where a native control provides it for free.
2. **Label on primary.** Bencium says white text on the accent. We use ink because white on this pink is 3.4:1 (see section 6). Option: deepen the primary to about `#EB005A` (4.5:1) and use white.
3. **Type scale.** Bencium recommends a 1.25 modular scale. Ours (12, 14, 16, 18, 20, 26, 36, 52) is close but not strict. Option: snap to 12, 16, 20, 25, 31, 39, 49.
4. **Casing.** The Vercel guidelines ask for Title Case on headings and buttons. We use sentence case by design (friendlier). Option: keep sentence case.

## 12. Next steps

1. Review `brand-board.html` and tell me what to change.
2. Turn `design-tokens.json` into `packages/ui` and build the first components: Button (three variants), Row, Section, Chip, Notice, AvatarStack, Timeline, Sheet, Toast, TabBar, following the build notes above.
3. Write the string tables for the core screens in Romanian and English.
