/**
 * シャットダウンしない事
 */

import { Scene } from 'phaser';
import { State } from '../lib/StateTypes';
import { Subscription } from 'rxjs';
import { GameStateManager } from '../GameAllState/GameStateManager';
import { ExecutionEnvironment } from './ExecutionEnvironment';

export class SceneController extends Scene {
    private debugFlg: boolean | undefined;
    private stateSubscription: Subscription | undefined;

    constructor() { super('SceneController'); }

    init() {
        this.debugFlg = this.game.config.physics.arcade?.debug;
    }

    preload() {
        //オープニング用ファイル読み込み
        //※Phaserやブラウザが読み込み完了を待ってくれないため、事前に読み込んでおく必要がある
        this.load.audio('opening', 'assets/audio/opening.mp3');

        this.load.image('meinaOpImage', 'assets/img/CharaStand/メイナOP画像.png');
        this.load.image('meinaOpImageHome', 'assets/img/background/ComfyUI_temp_xsgbd_00098_.png');
        this.load.image('lamyOpImage', 'assets/img/CharaStand/ラミィOP画像.png');
        this.load.image('lamyOpImageHome', 'assets/img/background/ComfyUI_temp_xsgbd_00071_.png');
        this.load.image('spark', 'assets/img/effect/elec3.png');
    }

    async create() {
        console.log("SceneController")

        //スマホの画面回転時、100ミリ秒後に画面更新。
        this.scale.on('resize', () => {
            setTimeout(() => {
                this.scale.setGameSize(1280, 720);
                this.scale.scaleMode = Phaser.Scale.FIT;
            }, 100);
        });

        //gameAllStateModel.isInitialize(this.registry, this.cache);//まだ使えてない

        await this.alert();

        //状態管理クラス
        const manager = GameStateManager.getInstance();

        // 既存インスタンスが存在する場合は購読を解除（念押しチェック）
        if (this.stateSubscription) {
            this.stateSubscription.unsubscribe();
        }

        // 状態の切り替わりを購読
        this.stateSubscription = manager.state$.subscribe(({ state, sceneKey }) => {
            this.handleStateChange(state, sceneKey);
        });

        // シーン終了時に購読を解除
        this.events.once('shutdown', () => {
            if (this.stateSubscription) {
                this.stateSubscription.unsubscribe();
                this.stateSubscription = undefined;
            }
        });

        //状態をスタートに更新
        manager.updateState({ state: State.START }, '')

        this.scene.launch('UI');
        this.scene.bringToTop('UI');
        this.scene.sleep('UI');// 非表示にする（眠らせる）
    }

    private handleStateChange(state: State, sceneKey: string) {
        //状態管理クラス
        const manager = GameStateManager.getInstance();

        switch (state) {
            case State.NOSTATE:
                //処理無
                break;
            case State.START:
                console.log('Title')
                this.scene.launch('Title', { sceneKey });
                break;
            case State.LOAD:
                console.log('Load')
                this.scene.launch('Load', { sceneKey });
                break;
            case State.FIELD:
                console.log('Game')
                this.scene.launch('Game', { sceneKey });
                break;
            case State.FIELD_RESTART:
                console.log('Game restart', sceneKey)
                this.scene.get('Game').scene.restart({ sceneKey });
                break;
            case State.FIELD_RESUME:
                console.log('Game resume', sceneKey)
                this.scene.get('Game').scene.resume();
                break;
            case State.BATTLE:
                console.log('Battle')
                this.scene.pause('Game');
                this.scene.launch('Battle', { sceneKey });// launchで現在のシーンの上に重ねてシーンを出す
                break;
            case State.MENU:
                console.log('Menu')
                this.scene.pause('Game');
                this.scene.launch('Menu', { sceneKey });
                break;
            case State.EVENT:
                console.log('Event')
                // this.scene.pause('Game');
                this.scene.launch('Event', { sceneKey });
                break;
            case State.BUBBLE_TALK:
                console.log('BubbleTalk')
                break;
            case State.GAMEOVER:
                console.log('GameOver transition')
                this.scene.stop('Game');
                this.scene.stop('Battle');
                this.scene.stop('Event');
                this.scene.stop('Menu');
                this.scene.launch('GameOver');
                break;
        }

    }

    async alert() {
        if (this.debugFlg) return;

        const executionEnvironment = new ExecutionEnvironment();

        const gameWidth = Number(this.game.config.width)
        const gameHeight = Number(this.game.config.height)

        //ブラウザ版の場合は注記を表示
        if (!executionEnvironment.isPWA() && !executionEnvironment.isElectron()) {
            const gameStartAlert = this.add.image(gameWidth / 2, gameHeight / 2, 'GameStartAlert');

            const tapStart = this.add.text(
                gameWidth / 2, gameHeight / 2 - 128,
                "▼TAP!!", { fontFamily: "Arial Black", fontSize: 32, color: "#00a6ed" });
            tapStart.setOrigin(0.5).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);

            const button = this.add.text(
                gameWidth / 2, gameHeight / 2,
                "◎", { fontFamily: "Arial Black", fontSize: 256, color: "#00a6ed" });
            button.setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true).setAlpha(0.5);
            button.setOrigin(0.5);

            //ボタンは非表示
            tapStart.setVisible(false);
            button.setVisible(false);

            return new Promise<void>(resolve => {
                this.input.once('pointerdown', () => {
                    gameStartAlert.destroy();
                    tapStart.destroy();
                    button.destroy();
                    resolve();
                });

                //2秒後にボタンを表示
                this.time.delayedCall(2000, () => {

                    tapStart.setVisible(true);
                    button.setVisible(true);

                    // 中心を基準にする（必須）
                    button.setOrigin(0.5);

                    this.tweens.add({
                        targets: tapStart,
                        y: tapStart.y - 15,       // 15ピクセル上に持ち上げる
                        duration: 400,          // 素早く（0.4秒）
                        yoyo: true,             // 元に戻る
                        repeat: -1,             // 無限に繰り返す
                        ease: 'Bounce.easeOut'  // 着地時に少し弾む動き（重要！）
                    });

                    this.tweens.add({
                        targets: button,
                        alpha: 0.1,             // 半透明まで薄くする
                        duration: 800,          // 0.8秒かけて薄く
                        yoyo: true,             // 元に戻る
                        repeat: -1,             // 無限に繰り返す
                        ease: 'Sine.easeInOut'  // 滑らかな動き（重要！）
                    });

                    this.tweens.add({
                        targets: button,
                        scale: 1.1,             // 1.1倍（110%）の大きさに
                        duration: 600,          // 0.6秒かけて大きく
                        yoyo: true,             // 元に戻る
                        repeat: -1,             // 無限に繰り返す
                        ease: 'Quad.easeInOut'  // 滑らかな伸縮
                    });

                }, [], this);
            })
        }
    }
}