// キーアサイン定義（W=上、など）

export const KEY_MAP = {
    CURSOR_UP: Phaser.Input.Keyboard.KeyCodes.UP,
    CURSOR_LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
    CURSOR_DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
    CURSOR_RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    // UP: Phaser.Input.Keyboard.KeyCodes.W,
    // LEFT: Phaser.Input.Keyboard.KeyCodes.A,
    // DOWN: Phaser.Input.Keyboard.KeyCodes.S,
    // RIGHT: Phaser.Input.Keyboard.KeyCodes.D,
    SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
    ESC: Phaser.Input.Keyboard.KeyCodes.ESC,
    P: Phaser.Input.Keyboard.KeyCodes.P,
    H: Phaser.Input.Keyboard.KeyCodes.H,
    // A: Phaser.Input.Keyboard.KeyCodes.A,
    // S: Phaser.Input.Keyboard.KeyCodes.S,
    E: Phaser.Input.Keyboard.KeyCodes.E,
    R: Phaser.Input.Keyboard.KeyCodes.R,
    // W: Phaser.Input.Keyboard.KeyCodes.W,
    // D: Phaser.Input.Keyboard.KeyCodes.D,
    M: Phaser.Input.Keyboard.KeyCodes.M
} as const;

export type InputAction = keyof typeof KEY_MAP;