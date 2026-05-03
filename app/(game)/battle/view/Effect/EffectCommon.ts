export class EffectCommon extends Phaser.GameObjects.Sprite {
    private depthValue: number;
    protected textureKey: string;
    protected startAnimKey: string = 'start';
    protected finishAnimKey: string = 'finish';
    protected attackDuration: number = 200;
    protected deleteDuration: number = 1000;
    protected frameRateValue: number = 10;

    constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
        super(scene, x, y, textureKey);
        this.addToUpdateList();
        this.addToDisplayList();
        this.animationSetting(textureKey);
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        this.setDepth(this.depthValue + 100);
    }

    //オーバーライドする事
    protected animationSetting(texture: string) { console.log('テクスチャ', texture); }

    //フィールドアタック用
    async attackAnimation() {
        //発射時アニメーション
        this.anims.play(this.startAnimKey, true);

        //追加効果用
        await this.specialEffect();

        //指定秒後に発生
        await this.finishAnimation();

        //削除
        this.destroy();
    }

    //オーバーライド
    protected specialEffect(): Promise<void> {
        /**
         * 各エフェクトで実装
         */
        return new Promise<void>(resolve => {
            resolve();
        })
    }

    //オーバーライド
    protected finishAnimation(): Promise<void> {
        return new Promise<void>(resolve => {
            resolve();

            //例：指定秒後に発生
            // this.scene.time.delayedCall(this.attackDuration, () => {
            //     this.anims.play(this.finishAnimKey, true);
            //     resolve();
            // }, undefined, this.scene);
        })
    }

}

