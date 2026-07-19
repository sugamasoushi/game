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
        this.setupDirectionalAnimations(
            spriteSheetKey,
            spritesheetKeyOrder,
            3,
            this.frameRate,
            { yoyo: true },
            undefined,
            1
        );
    }

    public setBubble() {
        //吹き出しテキストがある場合に設定
        if (this.bubbleTalkKey) {
            const bubbleSprite = new bubble(this, this.fieldScene, this.x, this.y, 'bubble', 'stand_down');
            this.spriteObjList.push(bubbleSprite);
        }
    }
}
