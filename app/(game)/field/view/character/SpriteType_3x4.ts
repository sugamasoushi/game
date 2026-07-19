import { FieldScene } from "@/app/(game)/lib/types";
import { Npc } from "./Npc";
import { bubble } from "./part/bubble";

export class SpriteType_3x4 extends Npc {
    frameRate = 10;
    shadowFlag = true;

    constructor(fieldScene: FieldScene, x: number, y: number, npcType: string, spriteSheetKey: string, spritesheetKeyOrder: string, characterName: string, initStandKey: string, imageKey: string, bubbleTalkKey: string) {
        super(fieldScene, x, y, npcType, spriteSheetKey, characterName, initStandKey, imageKey, bubbleTalkKey);
        this._animationSetting(spriteSheetKey, spritesheetKeyOrder);
        this.setBubble();
    }

    // アニメーションを生成するエントリ。
    // spritesheetKeyOrder を解析して向き順を決め、歩行／待機アニメを作成する。
    _animationSetting(spriteSheetKey: string, spritesheetKeyOrder: string) {
        const order = this.parseSpritesheetKeyOrder(spritesheetKeyOrder);

        this.createDirectionalWalkAnimation(spriteSheetKey, 'left', order, 3, this.frameRate, { yoyo: true });
        this.createDirectionalWalkAnimation(spriteSheetKey, 'right', order, 3, this.frameRate, { yoyo: true });
        this.createDirectionalWalkAnimation(spriteSheetKey, 'up', order, 3, this.frameRate, { yoyo: true });
        this.createDirectionalWalkAnimation(spriteSheetKey, 'down', order, 3, this.frameRate, { yoyo: true });

        this.createDirectionalStandAnimation(spriteSheetKey, 'left', order, 3, 1, this.frameRate);
        this.createDirectionalStandAnimation(spriteSheetKey, 'right', order, 3, 1, this.frameRate);
        this.createDirectionalStandAnimation(spriteSheetKey, 'up', order, 3, 1, this.frameRate);
        this.createDirectionalStandAnimation(spriteSheetKey, 'down', order, 3, 1, this.frameRate);
    }

    public setBubble() {
        //吹き出しテキストがある場合に設定
        if (this.bubbleTalkKey) {
            const bubbleSprite = new bubble(this, this.fieldScene, this.x, this.y, 'bubble', 'stand_down');
            this.spriteObjList.push(bubbleSprite);
        }
    }
}
