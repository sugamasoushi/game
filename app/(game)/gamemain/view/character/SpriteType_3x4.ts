import { GameScene } from "@/app/(game)/lib/types";
import { Npc } from "./Npc";
import { Shadow } from "./part/Shadow";
import { bubble } from "./part/bubble";

export class SpriteType_3x4 extends Npc {
    frameRate = 10;
    shadowFlag = true;

    constructor(gameScene: GameScene, x: number, y: number, npcType: string, spriteSheetKey: string, characterName: string, initStandKey: string, imageKey: string, bubbleTalkKey: string) {
        super(gameScene, x, y, npcType, spriteSheetKey, characterName, initStandKey, imageKey, bubbleTalkKey);
        this._animationSetting(spriteSheetKey);
        this._setShadow(initStandKey);
        this.setBubble();
    }

    //アニメーション設定
    //charKeyはアニメーションテクスチャ名およびキャラ名に使用する
    _animationSetting(spriteSheetKey: string) {
        this.anims.create({
            key: this.walkLeft,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 3, end: 5 }),
            frameRate: this.frameRate,
            yoyo: true
        });
        this.anims.create({
            key: this.walkRight,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 6, end: 8 }),
            frameRate: this.frameRate,
            yoyo: true
        });
        this.anims.create({
            key: this.walkUp,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 9, end: 11 }),
            frameRate: this.frameRate,
            yoyo: true
        });
        this.anims.create({
            key: this.walkDown,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 0, end: 2 }),
            frameRate: this.frameRate,
            yoyo: true
        });
        this.anims.create({
            key: this.standLeft,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 4, end: 4 }),
            frameRate: this.frameRate,
        });
        this.anims.create({
            key: this.standRight,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 7, end: 7 }),
            frameRate: this.frameRate,
        });
        this.anims.create({
            key: this.standUp,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 10, end: 10 }),
            frameRate: this.frameRate,
        });
        this.anims.create({
            key: this.standDown,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 1, end: 1 }),
            frameRate: this.frameRate,
        });
    }

    _setShadow(initStandKey: string) {
        if (this.shadowFlag) {
            const shadowSprite = new Shadow(this, this.gameScene, this.x, this.y, 'chicken_shadow', initStandKey);
            this.spriteObjList.push(shadowSprite);
        }
    }

    public setBubble() {
        //吹き出しテキストがある場合に設定
        if (this.bubbleTalkKey) {
            const bubbleSprite = new bubble(this, this.gameScene, this.x, this.y, 'bubble', 'stand_down');
            this.spriteObjList.push(bubbleSprite);
        }
    }
}
