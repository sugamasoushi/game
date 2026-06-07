import { Sound } from "../../scenes/Sound";
import { BattleMessageWindow } from "../view/BattleMessageWindow";
import { BattleModel } from "../model/BattleModel";
import { PlayerPartyWindow } from "../view/PlayerPartyWindow";

export default class EnemyAttack {
    private attacker: Phaser.GameObjects.Image;
    private target: Phaser.GameObjects.Sprite;

    private soundScene: Sound;

    //現状は単体選択のみ対応
    constructor(
        private battleScene: Phaser.Scene,
        private battleModel: BattleModel,
        private playerPartyWindow: PlayerPartyWindow
    ) {
        this.soundScene = this.battleScene.scene.get('Sound') as Sound;
    }

    //仮、通常攻撃のエフェクトは別途作成する
    public attack(battleMessageWindow: BattleMessageWindow, attacker: Phaser.GameObjects.Image) {

        //敵キャラクターの攻撃対象を設定
        const targetPlayer = this.battleModel.getEnemyAttackTarget();
        const targetPlayerIcon = this.playerPartyWindow.getCharacterIcon(targetPlayer!.name);
        attacker.setData('BattleTarget', targetPlayer);
        attacker.setData('BattleTargetIcon', targetPlayerIcon);

        return new Promise<void>(resolve => {
            if (attacker.data.values.HP <= 0) return resolve();
            this.attacker = attacker;
            //this.attackType = attacker.getData('attackType');
            this.target = attacker.getData('BattleTarget');
            const targetIcon = attacker.getData('BattleTargetIcon');

            (async () => {
                await Promise.all([
                    battleMessageWindow.messageOutput(this.attacker.getData('name') + 'の攻撃！', undefined),
                    await this.attackTween(),
                    this.leanBack()
                ]);

                //ダメージ計算（ガード状態の時のみ、そのキャラクターの防御値を差し引く）
                const baseAttack = this.attacker.getData('Attack') || 0;
                const guardBonus = this.target.getData('GuardValue') || 0;
                const damage = Math.max(baseAttack - guardBonus, 1);

                //回避チェック
                if (this.target.getData('avoid')) {
                    await Promise.all([
                        battleMessageWindow.messageOutput(this.target.getData('name') + 'は回避した！', 600),
                        this.soundScene.playSe('SE_highSpeedMove')
                    ]);
                } else {

                    await Promise.all([
                        battleMessageWindow.messageOutput(this.target.getData('name') + 'に' + damage + 'のダメージ！', undefined),
                        this.blinking(targetIcon)
                    ]);

                    //ガードチェック
                    if (this.target.getData('guardPoint') > 0) {
                        await battleMessageWindow.messageOutput(this.target.getData('name') + 'は防御した！', 600);
                        // this.target.setData('guardPoint', 0);
                    }

                    //HP更新
                    this.target.data.values.HP -= damage;
                    if (this.target.data.values.HP <= 0) {
                        this.target.data.values.HP = 0;

                        //倒した相手のアイコンをグレーアウト
                        this.battleScene.events.emit('PLAYER_ICON_LIGHTDOWN', this.target.name);
                    }
                }

                //攻撃対象を初期化
                this.attacker.setData('BattleTarget', undefined);

                await new Promise<void>(resolve => {
                    this.battleScene.time.delayedCall(500, () => {
                        resolve();
                    }, [], this.battleScene);
                })

                resolve();
            })();
        })
    }

    //通常攻撃エフェクト
    private attackTween() {
        console.log('attackTween')
        return new Promise<void>(resolve => {
            this.battleScene.tweens.add({
                targets: this.attacker,
                scale: this.attacker.scaleX + 0.02,
                ease: 'sine.inout',
                yoyo: true,
                duration: 100,
                delay: 500,
                onComplete: () => {
                    resolve();
                    // tween.destroy();
                }
            });
        })
    }

    //画面効果
    private leanBack() {
        this.soundScene.playSe('SE_punch');
        return new Promise<void>(resolve => {
            this.battleScene.cameras.main.shake(100, 0.02);
            this.battleScene.time.delayedCall(500, () => {
                resolve();
            }, [], this.battleScene);
        });
    }

    //相手点滅
    private blinking(target: Phaser.GameObjects.Image) {
        this.soundScene.playSe('SE_attack');

        return new Promise<void>(resolve => {
            let flag = true;
            const timer = this.battleScene.time.addEvent({
                delay: 100,
                callback: () => {
                    if (flag) {
                        flag = !flag;
                        target.setAlpha(0.5);
                    } else {
                        flag = !flag;
                        target.setAlpha(1);
                    }
                    if (timer.repeatCount === 0) {
                        // this.soundScene.attackSE.stop();
                        resolve();
                    }
                },
                callbackScope: this.battleScene,
                repeat: 3,
            });
        })
    }

}