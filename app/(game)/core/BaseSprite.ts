import { Sound } from "../scenes/Sound";

export class BaseSprite extends Phaser.GameObjects.Sprite {
    private depthValue: number;
    protected textureKey: string;
    protected startAnimKey: string = 'start';
    protected finishAnimKey: string = 'finish';
    protected attackDuration: number = 200;
    protected deleteDuration: number = 1000;
    protected frameRateValue: number = 10;
    protected soundScene: Sound;

    constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string, attackDuration?: number, sprite?: Phaser.GameObjects.Sprite | undefined) {
        super(scene, x, y, textureKey);
        //シーンとマップで使い分ける
        if (sprite !== undefined) {
            this.attackDuration = attackDuration || 200;
            this.addToUpdateList();
            this.addToDisplayList();
            this.scene.physics.add.existing(this);//物理属性を有効、このゲームオブジェクトにArcade Physics bodyが設定される。
            this.depthValue = sprite.depth;
            this.animationSetting(textureKey);
            this.anims.play(this.startAnimKey, true);
            this.timerAnim();
        } else {
            this.attackDuration = attackDuration || 200;
            this.addToUpdateList();
            this.addToDisplayList();
            this.animationSetting(textureKey);
            // battle用にSoundシーンを取得
            this.soundScene = this.scene.scene.get('Sound') as Sound;
        }
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        this.setDepth(this.depthValue + 100);
    }

    //オーバーライドする事
    protected animationSetting(texture: string) { console.log('テクスチャ', texture); }

    //エフェクトのみ
    private timerAnim() {
        this.scene.time.delayedCall(this.attackDuration, () => {
            this.anims.play(this.finishAnimKey, true);
        }, undefined, this.scene);

        this.scene.time.delayedCall(this.deleteDuration, () => {
            this.destroy();
        }, undefined, this.scene);
    }

    //フィールドアタック用
    attackAnimation() {
        return new Promise<void>(resolve => {
            //発射時アニメーション
            this.anims.play(this.startAnimKey, true);

            //指定秒後に発生
            this.scene.time.delayedCall(this.attackDuration, () => {
                this.anims.play(this.finishAnimKey, true);
            }, undefined, this.scene);

            //指定秒後に削除
            this.scene.time.delayedCall(this.deleteDuration, () => {
                resolve();
                this.destroy();
            }, undefined, this.scene);
        })
    }

    //バトル用アニメーション
    async attackAnimationBattle() {
        //発射時アニメーション
        this.anims.play(this.startAnimKey, true);

        //追加効果用
        await this.specialEffect();

        //指定秒後に発生
        await this.finishAnimation();

        //削除
        this.destroy();
    }

    //オーバーライド用（バトル用特殊効果）
    protected specialEffect(): Promise<void> {
        return new Promise<void>(resolve => {
            resolve();
        })
    }

    //オーバーライド用（バトル用終了アニメーション）
    protected finishAnimation(): Promise<void> {
        return new Promise<void>(resolve => {
            resolve();
        })
    }
}

