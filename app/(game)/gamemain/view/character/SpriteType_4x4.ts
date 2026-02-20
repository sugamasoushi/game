import { GameScene } from "@/app/(game)/lib/types";
import { Npc } from "./Npc";
import { Shadow } from "./part/Shadow";
import { bubble } from "./part/bubble";

export class SpriteType_4x4 extends Npc {
    shadowFlag = true;

    constructor(gameScene: GameScene, x: number, y: number, npcType: string, spriteSheetKey: string, characterName: string, initStandKey: string, imageKey: string, bubbleTalkKey: string) {
        super(gameScene, x, y, npcType, spriteSheetKey, characterName, initStandKey, imageKey, bubbleTalkKey);
        this._animationSetting(spriteSheetKey);
        this._setShadow(initStandKey);
        this._setBubble();
    }

    //アニメーション設定
    //charKeyはアニメーションテクスチャ名およびキャラ名に使用する
    _animationSetting(spriteSheetKey: string) {
        this.anims.create({
            key: this.walkLeft,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: this.walkRight,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 12, end: 15 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: this.walkUp,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: this.walkDown,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 8, end: 11 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: this.standLeft,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 4, end: 4 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: this.standRight,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 12, end: 12 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: this.standUp,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 0, end: 0 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: this.standDown,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 8, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
    }

    _setShadow(initStandKey: string) {
        if (this.shadowFlag) {
            const shadowSprite = new Shadow(this, this.gameScene, this.x, this.y, 'chicken_shadow', initStandKey);
            this.spriteObjList.push(shadowSprite);
        }
    }

    _setBubble() {
        //吹き出しテキストがある場合に設定
        if (this.bubbleTalkKey) {
            const bubbleSprite = new bubble(this, this.gameScene, this.x, this.y, 'bubble', 'stand_down');
            this.spriteObjList.push(bubbleSprite);
        }
    }
}
