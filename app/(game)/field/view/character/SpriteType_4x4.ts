import { FieldScene } from "@/app/(game)/lib/types";
import { Npc } from "./Npc";
import { bubble } from "./part/bubble";

export class SpriteType_4x4 extends Npc {
    shadowFlag = true;

    constructor(fieldScene: FieldScene, x: number, y: number, npcType: string, spriteSheetKey: string, spritesheetKeyOrder: string, characterName: string, initStandKey: string, imageKey: string, bubbleTalkKey: string) {
        super(fieldScene, x, y, npcType, spriteSheetKey, characterName, initStandKey, imageKey, bubbleTalkKey);
        this._animationSetting(spriteSheetKey, spritesheetKeyOrder);
        this._setBubble();
    }

    //アニメーション設定
    //charKeyはアニメーションテクスチャ名およびキャラ名に使用する
    _animationSetting(spriteSheetKey: string, spritesheetKeyOrder: string) {
        this.setupDirectionalAnimations(
            spriteSheetKey,
            spritesheetKeyOrder,
            4,
            10,
            { repeat: -1 },
            { repeat: -1 },
            0
        );
    }

    _setBubble() {
        //吹き出しテキストがある場合に設定
        if (this.bubbleTalkKey) {
            const bubbleSprite = new bubble(this, this.fieldScene, this.x, this.y, 'bubble', 'stand_down');
            this.spriteObjList.push(bubbleSprite);
        }
    }
}
