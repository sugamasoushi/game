import { FieldScene } from "../../lib/SceneTypes";
import { Npc } from "../../field/view/character/Npc";

export function createSprite(
    spritetype: string,
    spriteSheetKey: string,
    spritesheetKeyOrder: string,
    gameScene: FieldScene,
    x: number,
    y: number,
    npcType: string,
    imageKey: string) {

    if (spritetype === '0404') {
        const npc = new Npc(gameScene, x, y, npcType, spriteSheetKey, imageKey)
        npc.setupDirectionalAnimations(
            spriteSheetKey,
            spritesheetKeyOrder,
            4,
            10,
            { repeat: -1 },
            { repeat: -1 },
            0
        );
        return npc;
    }

    if (spritetype === '0304') {
        const npc = new Npc(gameScene, x, y, npcType, spriteSheetKey, imageKey)
        npc.setupDirectionalAnimations(
            spriteSheetKey,
            spritesheetKeyOrder,
            3,
            10,
            { yoyo: true },
            undefined,
            1
        );
        return npc;
    }
}

