export type Direction = 'left' | 'right' | 'up' | 'down';

export const DEFAULT_DIRECTION_ORDER: readonly Direction[] = ['down', 'left', 'right', 'up'];
const VALID_DIRECTIONS = new Set<Direction>(['down', 'left', 'right', 'up']);

export function parseSpritesheetKeyOrder(order: string): readonly Direction[] {
    if (!order) return DEFAULT_DIRECTION_ORDER;

    const values = order
        .split(',')
        .map(item => item.trim().toLowerCase())
        .filter(Boolean) as Direction[];

    const uniqueValues = Array.from(new Set(values));
    if (uniqueValues.length !== 4 || uniqueValues.some(direction => !VALID_DIRECTIONS.has(direction))) {
        return DEFAULT_DIRECTION_ORDER;
    }

    return uniqueValues as readonly Direction[];
}

export interface DirectionalWalkOptions {
    repeat?: number;
    yoyo?: boolean;
}

export function createDirectionalWalkAnimation(
    anims: Phaser.Animations.AnimationState,
    spriteSheetKey: string,
    animationKey: string,
    direction: Direction,
    order: readonly Direction[],
    framesPerDirection: number,
    frameRate: number,
    options?: DirectionalWalkOptions
) {
    const rowIndex = order.indexOf(direction);
    const start = rowIndex * framesPerDirection;
    const end = start + framesPerDirection - 1;

    anims.create({
        key: animationKey,
        frames: anims.generateFrameNumbers(spriteSheetKey, { start, end }),
        frameRate,
        repeat: options?.repeat,
        yoyo: options?.yoyo
    });
}

export interface DirectionalStandOptions {
    repeat?: number;
}

export function createDirectionalStandAnimation(
    anims: Phaser.Animations.AnimationState,
    spriteSheetKey: string,
    animationKey: string,
    direction: Direction,
    order: readonly Direction[],
    framesPerDirection: number,
    standFrameOffset: number,
    frameRate: number,
    options?: DirectionalStandOptions
) {
    const rowIndex = order.indexOf(direction);
    const frame = rowIndex * framesPerDirection + standFrameOffset;

    anims.create({
        key: animationKey,
        frames: anims.generateFrameNumbers(spriteSheetKey, { start: frame, end: frame }),
        frameRate,
        repeat: options?.repeat
    });
}
