export default class EffectCommon extends Phaser.GameObjects.Sprite {
    private depthValue: number;
    protected fireAnimKey: string = 'fire';
    protected finishAnimKey: string = 'finish';
    private attackDuration: number;
    private deleteDuration: number = 1000;
    protected frameRateValue: number = 10;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, attackDuration: number, sprite: Phaser.GameObjects.Sprite | undefined) {
        super(scene, x, y, texture);
        //シーンとマップで使い分ける
        if (sprite !== undefined) {
            this.attackDuration = attackDuration;
            this.addToUpdateList();
            this.addToDisplayList();
            this.scene.physics.add.existing(this);//物理属性を有効、このゲームオブジェクトにArcade Physics bodyが設定される。
            this.depthValue = sprite.depth;
            this.animationSetting('flames32');
            this.anims.play(this.fireAnimKey, true);
            this.timerAnim();
        } else {
            this.attackDuration = attackDuration;
            this.addToUpdateList();
            this.addToDisplayList();
            this.animationSetting('flames32');
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
            this.anims.play(this.fireAnimKey, true);

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
}

