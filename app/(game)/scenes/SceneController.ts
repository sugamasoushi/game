/**
 * シャットダウンしない事
 */

import { Scene } from 'phaser';
import { State } from '../lib/StateTypes';
import { Subscription } from 'rxjs';
import { GameStateManager } from '../core/GameStateManager';
import { ExecutionEnvironment } from '../core/ExecutionEnvironment';

export class SceneController extends Scene {
    private stateSubscription: Subscription | undefined;

    constructor() { super('SceneController'); }

    init() { }

    preload() {

        //オープニング用ファイル読み込み
        //※Phaserやブラウザが読み込み完了を待ってくれないため、事前に読み込んでおく必要がある
        this.load.audio('opening', 'assets/audio/opening.mp3');
        this.load.audio('SE_syakiin', 'assets/sound/シャキーン3.mp3');
        this.load.audio('SE_cardTurnOver', 'assets/sound/カードをめくる.mp3');

        this.load.image('meinaOpImage', 'assets/img/CharaStand/メイナOP画像.png');
        this.load.image('meinaOpImageHome', 'assets/img/background/ComfyUI_temp_xsgbd_00098_.png');
        this.load.image('lamyOpImage', 'assets/img/CharaStand/ラミィOP画像.png');
        this.load.image('lamyOpImageHome', 'assets/img/background/battle_forest mansion.png');
        this.load.image('manualIcon', 'assets/img/manual/manualIcon.png');

        this.load.image('spark', 'assets/img/effect/elec3.png');
    }

    async create(data: { sceneKey?: string }) {
        console.log("SceneController")

        //スマホの画面回転時、100ミリ秒後に画面更新。
        this.scale.on('resize', () => {
            setTimeout(() => {
                this.scale.setGameSize(1280, 720);
                this.scale.scaleMode = Phaser.Scale.FIT;
            }, 100);
        });

        //状態管理クラス
        const manager = GameStateManager.getInstance();

        //開発モードの設定
        if (this.game.config.physics.arcade?.debug) { manager.updateState({ debugMode: true }, 'system'); }

        //実行環境の情報を更新
        const executionEnvironment = new ExecutionEnvironment();
        executionEnvironment.updateHighDraw();

        await this.alert();

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

        //もし、Bootシーンから「GAME_RESTART」というキーで遷移してきた場合は、状態を GAME_RESTART に更新してからタイトルへ遷移する
        if (data.sceneKey === 'GAME_RESTART') {
            manager.updateState({ state: State.GAME_RESTART }, 'GAME_RESTART');
            return;
        }

        //状態をスタートに更新
        manager.updateState({ state: State.TITLE }, '')

        this.scene.launch('UI');
        this.scene.bringToTop('UI');
        this.scene.sleep('UI');// 非表示にする（眠らせる）

        //サウンドシーンを並行して実行
        this.scene.launch('Sound');
    }

    private handleStateChange(state: State, sceneKey: string) {
        const transitions: Partial<Record<State, (sceneKey: string) => void>> = {
            [State.NOSTATE]: () => {
                //処理無
            },
            [State.TITLE]: () => this.transitionToTitle(sceneKey),
            [State.LOAD]: () => this.transitionToLoad(sceneKey),
            [State.FIELD]: () => this.transitionToField(sceneKey),
            [State.FIELD_RESTART]: () => this.transitionToFieldRestart(sceneKey),
            [State.FIELD_RESUME]: () => this.transitionToFieldResume(sceneKey),
            [State.BATTLE]: () => this.transitionToBattle(sceneKey),
            [State.MENU]: () => this.transitionToMenu(sceneKey),
            [State.EVENT]: () => this.transitionToEvent(sceneKey),
            [State.BUBBLE_TALK]: () => this.transitionToBubbleTalk(),
            [State.GAMEOVER]: () => this.transitionToGameOver(),
            [State.GAME_RESTART]: () => this.transitionToGameRestart(sceneKey)
        };

        transitions[state]?.(sceneKey);
    }

    private transitionToTitle(sceneKey: string) {
        console.log('Title')
        console.log(this.scene.manager.scenes.map(s => `${s.scene.key}: ${s.scene.settings.status}`));
        this.scene.launch('Title', { sceneKey });
    }

    private transitionToLoad(sceneKey: string) {
        console.log('Load')
        this.scene.launch('Load', { sceneKey });
    }

    private transitionToField(sceneKey: string) {
        console.log('Field')
        this.scene.launch('Field', { sceneKey });
    }

    private transitionToFieldRestart(sceneKey: string) {
        console.log('Game restart', sceneKey)
        this.scene.get('Field').scene.restart({ sceneKey });
        this.scene.moveBelow('UI', 'Field')
    }

    private transitionToFieldResume(sceneKey: string) {
        console.log('Game resume', sceneKey)
        this.scene.get('Field').scene.resume();
        if (this.scene.isActive('Event')) {
            this.scene.get('Event').scene.resume();
        }
    }

    private transitionToBattle(sceneKey: string) {
        console.log('Battle')
        this.scene.pause('Field');

        //イベント戦闘の場合、イベントシーンも停止する
        if (this.scene.isActive('Event')) {
            this.scene.pause('Event');
        }
        this.scene.launch('Battle', { sceneKey });
    }

    private transitionToMenu(sceneKey: string) {
        console.log('Menu')
        this.scene.pause('Field');
        this.scene.launch('Menu', { sceneKey });
    }

    private transitionToEvent(sceneKey: string) {
        console.log('Event')
        // this.scene.pause('Field');
        this.scene.launch('Event', { sceneKey });
    }

    private transitionToBubbleTalk() {
        console.log('BubbleTalk')
        this.scene.launch('BubbleTalk');
    }

    private transitionToGameOver() {
        console.log('GameOver transition')
        this.scene.launch('GameOver');
        this.scene.stop('Field');
        this.scene.stop('Menu');
        this.scene.stop('Event');
        this.scene.stop('Battle');
        this.scene.stop('UI');
    }

    private transitionToGameRestart(sceneKey: string) {
        console.log('Game restart', sceneKey)
        this.scene.stop('Field');
        this.scene.stop('Menu');
        this.scene.stop('Event');
        this.scene.stop('Battle');
        this.scene.stop('SceneController');

        this.scene.start('Boot');

        /**
         * this.scene.stop()とsubscriptionについて
         * Titleにも記載したが、購読の定義と解除を間違えると操作不能状態が発生するため注意。
         * 各シーンではstop()によるshutdownイベントをトリガーに購読解除等を行っているため、stop()を呼ぶ際は各シーンのshutdownイベントと購読の定義を確認する事。
         */
    }

    async alert() {
        const executionEnvironment = new ExecutionEnvironment();
        if (executionEnvironment.isDebug()) return;

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