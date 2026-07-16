// Game configuration
const STARTING_STACK = 3000;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;
const MIN_RAISE = 20;
const SHORT_STACK_JAM_BB = 10;
const NORMAL_RAISE_STACK_CAP = 0.32;
const AUTO_NEW_HAND_DELAY = 3000;
const MAX_LOG_ENTRIES = 36;
const DIALOGUE_DISPLAY_MS = 3300;
const DIALOGUE_COOLDOWN_MS = 8000;
const MAX_DIALOGUE_PER_STREET = 2;
const CARD_MOTION_MS = 620;
const THEME_STORAGE_KEY = "texasHoldemTheme";
const LAYOUT_STORAGE_KEY = "texasHoldemTableLayoutV2";
const LAYOUT_PANEL_STORAGE_KEY = "texasHoldemLayoutPanelPositionV1";
const LAYOUT_ARROW_STORAGE_KEY = "texasHoldemDialogueArrowsV1";
const DEFAULT_LAYOUT = {
  seat1: { left: 4, top: 53 },
  seat2: { left: 7.2, top: 25.5 },
  seat3: { left: 27, top: 7 },
  seat4: { left: 60.5, top: 7 },
  seat5: { left: 79.5, top: 25.5 },
  seat6: { left: 82, top: 53 },
  seatCards1: { left: 14, top: 63 },
  seatCards2: { left: 16, top: 39 },
  seatCards3: { left: 36, top: 20 },
  seatCards4: { left: 64, top: 20 },
  seatCards5: { left: 84, top: 39 },
  seatCards6: { left: 84, top: 63 },
  dialogue1: { left: 22, top: 48 },
  dialogue2: { left: 19, top: 24 },
  dialogue3: { left: 33, top: 18 },
  dialogue4: { left: 66, top: 18 },
  dialogue5: { left: 78, top: 24 },
  dialogue6: { left: 78, top: 48 },
  board: { left: 50, top: 53 },
  pot: { left: 50, top: 35 },
  stage: { left: 50, top: 43 },
  hero: { left: 50, top: 88 },
  heroCards: { left: 43, top: 88 },
  heroPanel: { left: 61, top: 88 },
  heroStack: { left: 50, top: 77 },
};
const DEFAULT_DIALOGUE_ARROWS = {
  dialogue1: "left",
  dialogue2: "left",
  dialogue3: "up",
  dialogue4: "up",
  dialogue5: "right",
  dialogue6: "right",
};
const DIALOGUE_ARROW_DIRECTIONS = new Set(["up", "down", "left", "right"]);
const CENTERED_LAYOUT_KEYS = new Set([
  "board",
  "pot",
  "stage",
  "hero",
  "heroCards",
  "heroPanel",
  "heroStack",
  "seatCards1",
  "seatCards2",
  "seatCards3",
  "seatCards4",
  "seatCards5",
  "seatCards6",
  "dialogue1",
  "dialogue2",
  "dialogue3",
  "dialogue4",
  "dialogue5",
  "dialogue6",
]);
const LAYOUT_SNAP_POINTS = [25, 50, 75];
const LAYOUT_SNAP_THRESHOLD = 0.8;
const LAYOUT_NUDGE_STEP = 0.5;
const LAYOUT_NUDGE_FAST_STEP = 2;
const DEFAULT_LAYOUT_PANEL = { left: null, top: 14 };
const STREET_LABELS = {
  "翻牌前": "PREFLOP",
  "翻牌": "FLOP",
  "轉牌": "TURN",
  "河牌": "RIVER",
  "結算": "SHOWDOWN",
};
