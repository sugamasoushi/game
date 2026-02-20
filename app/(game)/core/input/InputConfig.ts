// キーアサイン定義（W=上、など）

export const KEY_MAP = {
    UP: Phaser.Input.Keyboard.KeyCodes.W,
    LEFT: Phaser.Input.Keyboard.KeyCodes.A,
    DOWN: Phaser.Input.Keyboard.KeyCodes.S,
    RIGHT: Phaser.Input.Keyboard.KeyCodes.D,
    CONFIRM: Phaser.Input.Keyboard.KeyCodes.SPACE,
    CANCEL: Phaser.Input.Keyboard.KeyCodes.ESC,
    P: Phaser.Input.Keyboard.KeyCodes.P,
    H: Phaser.Input.Keyboard.KeyCodes.H,
    A: Phaser.Input.Keyboard.KeyCodes.A,
    S: Phaser.Input.Keyboard.KeyCodes.S,
    E: Phaser.Input.Keyboard.KeyCodes.E,
    R: Phaser.Input.Keyboard.KeyCodes.R
} as const;

export type InputAction = keyof typeof KEY_MAP;