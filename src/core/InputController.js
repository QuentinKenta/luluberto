const DIRECTIONS = ["up", "down", "left", "right"];
const GAMEPAD_DIRECTION_BUTTONS = {
  up: 12,
  down: 13,
  left: 14,
  right: 15,
};
const GAMEPAD_ACTION_BUTTONS = {
  interact: [0, 1],
  confirm: [9],
  cancel: [8],
  advance: [0, 1, 9],
};

export class InputController {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.useCursors = options.useCursors ?? true;
    this.cursors = this.useCursors ? scene.input.keyboard.createCursorKeys() : {};
    this.lastDirection = null;
    this.directionPriority = options.directionPriority ?? ["up", "down", "left", "right"];
    this.gamepadIndex = options.gamepadIndex ?? options.gamepad?.index ?? "any";
    this.gamepadDeadzone = options.gamepadDeadzone ?? options.gamepad?.deadzone ?? 0.45;
    this.gamepadEnabled = options.gamepadEnabled ?? options.gamepad?.enabled ?? true;
    this.gamepadFrame = this.scene.game?.loop?.frame ?? -1;
    this.currentGamepadState = this.gamepadEnabled ? this.readGamepadState() : this.emptyGamepadState();
    this.previousGamepadState = this.currentGamepadState;

    const defaultKeys = {
      up: "W",
      down: "S",
      left: "A",
      right: "D",
      interact: "E",
      confirm: "ENTER",
      cancel: "ESC",
      advance: "SPACE",
    };

    this.keys = scene.input.keyboard.addKeys(options.keysOnly ?? { ...defaultKeys, ...(options.keys ?? {}) });
  }

  emptyGamepadState() {
    return {
      directions: Object.fromEntries(DIRECTIONS.map((direction) => [direction, false])),
      actions: Object.fromEntries(Object.keys(GAMEPAD_ACTION_BUTTONS).map((action) => [action, false])),
    };
  }

  getMovement() {
    const x =
      Number(this.isDirectionDown("right")) -
      Number(this.isDirectionDown("left"));
    const y =
      Number(this.isDirectionDown("down")) -
      Number(this.isDirectionDown("up"));

    const vector = new Phaser.Math.Vector2(x, y);
    return vector.lengthSq() > 0 ? vector.normalize() : vector;
  }

  getGridDirection() {
    for (const direction of this.directionPriority) {
      if (this.isDirectionJustDown(direction)) {
        this.lastDirection = direction;
      }
    }

    if (this.lastDirection && this.isDirectionDown(this.lastDirection)) {
      return this.lastDirection;
    }

    const heldDirection = this.directionPriority.find((direction) => this.isDirectionDown(direction));
    this.lastDirection = heldDirection ?? null;
    return heldDirection ?? null;
  }

  isDirectionDown(direction) {
    this.refreshGamepadState();
    return Boolean(
      this.cursors[direction]?.isDown ||
        this.keys[direction]?.isDown ||
        this.currentGamepadState.directions[direction],
    );
  }

  isDirectionJustDown(direction) {
    this.refreshGamepadState();
    return Boolean(
      (this.cursors[direction] && Phaser.Input.Keyboard.JustDown(this.cursors[direction])) ||
        (this.keys[direction] && Phaser.Input.Keyboard.JustDown(this.keys[direction])) ||
        this.isGamepadDirectionJustDown(direction),
    );
  }

  isInteractPressed() {
    return Boolean(this.isKeyboardActionJustDown("interact") || this.isGamepadActionJustDown("interact"));
  }

  isConfirmPressed() {
    return Boolean(this.isKeyboardActionJustDown("confirm") || this.isGamepadActionJustDown("confirm"));
  }

  isCancelPressed() {
    return Boolean(this.isKeyboardActionJustDown("cancel") || this.isGamepadActionJustDown("cancel"));
  }

  isAdvancePressed() {
    return (
      this.isKeyboardActionJustDown("advance") ||
      this.isKeyboardActionJustDown("confirm") ||
      this.isKeyboardActionJustDown("interact") ||
      this.isGamepadActionJustDown("advance") ||
      this.isGamepadActionJustDown("confirm") ||
      this.isGamepadActionJustDown("interact")
    );
  }

  isKeyboardActionJustDown(action) {
    return Boolean(this.keys[action] && Phaser.Input.Keyboard.JustDown(this.keys[action]));
  }

  isGamepadDirectionJustDown(direction) {
    return Boolean(
      this.currentGamepadState.directions[direction] &&
        !this.previousGamepadState.directions[direction],
    );
  }

  isGamepadActionJustDown(action) {
    this.refreshGamepadState();
    return Boolean(this.currentGamepadState.actions[action] && !this.previousGamepadState.actions[action]);
  }

  refreshGamepadState() {
    if (!this.gamepadEnabled) {
      return;
    }

    const frame = this.scene.game?.loop?.frame ?? 0;

    if (this.gamepadFrame === frame) {
      return;
    }

    this.gamepadFrame = frame;
    this.previousGamepadState = this.currentGamepadState;
    this.currentGamepadState = this.readGamepadState();
  }

  readGamepadState() {
    const state = this.emptyGamepadState();
    const gamepads = this.getGamepads();

    for (const gamepad of gamepads) {
      this.readGamepadDirections(gamepad, state);
      this.readGamepadActions(gamepad, state);
    }

    return state;
  }

  getGamepads() {
    if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") {
      return [];
    }

    const gamepads = [...navigator.getGamepads()].filter(Boolean);

    if (this.gamepadIndex === "any") {
      return gamepads;
    }

    return gamepads.filter((gamepad) => gamepad.index === this.gamepadIndex);
  }

  readGamepadDirections(gamepad, state) {
    const axisX = gamepad.axes[0] ?? 0;
    const axisY = gamepad.axes[1] ?? 0;

    state.directions.left ||= axisX <= -this.gamepadDeadzone || this.isGamepadButtonDown(gamepad, GAMEPAD_DIRECTION_BUTTONS.left);
    state.directions.right ||= axisX >= this.gamepadDeadzone || this.isGamepadButtonDown(gamepad, GAMEPAD_DIRECTION_BUTTONS.right);
    state.directions.up ||= axisY <= -this.gamepadDeadzone || this.isGamepadButtonDown(gamepad, GAMEPAD_DIRECTION_BUTTONS.up);
    state.directions.down ||= axisY >= this.gamepadDeadzone || this.isGamepadButtonDown(gamepad, GAMEPAD_DIRECTION_BUTTONS.down);
  }

  readGamepadActions(gamepad, state) {
    for (const [action, buttonIndexes] of Object.entries(GAMEPAD_ACTION_BUTTONS)) {
      state.actions[action] ||= buttonIndexes.some((buttonIndex) => this.isGamepadButtonDown(gamepad, buttonIndex));
    }
  }

  isGamepadButtonDown(gamepad, buttonIndex) {
    return Boolean(gamepad.buttons[buttonIndex]?.pressed);
  }
}
