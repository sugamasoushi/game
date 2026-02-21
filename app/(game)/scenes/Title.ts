import { GameObjects, Scene } from 'phaser';
import { State } from '../lib/types';
import { EventBus } from '../EventBus';
import { GameStateManager } from '../GameAllState/GameStateManager';
import { DataDefinition } from '../Data/DataDefinition';

export class Title extends Scene {
    game: Phaser.Game;
    private gameConfigWidth: number;
    private gameConfigHeight: number;
    private background: GameObjects.Image;
    private logo: GameObjects.Image;
    private titleText: GameObjects.Text;
    private newGameStart: GameObjects.Text;
    private ContinueStart: GameObjects.Text;
    private logoTween: Phaser.Tweens.Tween | null;

    constructor() { super('Title'); }

    init() { console.log("Title scene") }

    preload() {
        this.load.json('savedata', 'assets/savedata/savedata.json');

        //ここでは文字列ベースのデータのみロードし、次のLoadSceneで画像などの重いデータをロードする
        this.load.tilemapTiledJSON({ key: '0001', url: 'assets/tiled/0001_testtile.json' });
        this.load.tilemapTiledJSON({ key: '0002', url: 'assets/tiled/0002_testtile.json' });
        this.load.tilemapTiledJSON({ key: '0101', url: 'assets/tiled/0101_home.json' });
        this.load.tilemapTiledJSON({ key: '0102', url: 'assets/tiled/0102_HomeForest.json' });

        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('logo', 'logo.png');
        this.load.image('star', 'star.png');
    }

    create() {

        setTimeout(() => {
            if (window.innerWidth < window.innerHeight) {
                alert("お願い、横画面で遊んでぇ(´;ω;｀)")
            }
        }, 100);



        //状態管理クラス
        const manager = GameStateManager.getInstance();

        const gameWidth = Number(this.game.config.width)
        const gameHeight = Number(this.game.config.height)

        this.add.image(gameWidth / 2, gameHeight / 2, 'LondonBridge');

        //タイトルテキスト
        this.titleText = this.add.text(
            gameWidth / 2, gameHeight / 2 - 200,
            "GameStart", { fontFamily: "Arial Black", fontSize: 128, color: "#00a6ed" });
        this.titleText.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);

        //NewGame
        this.newGameStart = this.add.text(
            gameWidth / 2, gameHeight / 2,
            "New Game", { fontFamily: "Arial Black", fontSize: 50, color: "#00a6ed" });
        this.newGameStart.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        this.newGameStart.setDepth(gameHeight);

        this.newGameStart.setInteractive({
            useHandCursor: true  // マウスオーバーでカーソルが指マークになる
        });
        this.newGameStart.on('pointerdown', () => {
            this.newGameStart.disableInteractive();

            //状態をスタートに更新
            manager.updateState({
                state: State.LOAD,
                fieldData: {
                    gameMode: 'New Game',
                    mapKey: '0101',
                    x: 495,
                    y: 337,
                    initStandKey: 'stand_left',
                }
            }, 'New Game')

            this.scene.stop();
        });




        //Continue
        this.ContinueStart = this.add.text(
            gameWidth / 2, gameHeight / 2 + 100,
            "Continue", { fontFamily: "Arial Black", fontSize: 50, color: "#00a6ed" });
        this.ContinueStart.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        this.ContinueStart.setDepth(gameHeight);

        this.ContinueStart.setInteractive({
            useHandCursor: true  // マウスオーバーでカーソルが指マークになる
        });
        this.ContinueStart.on('pointerdown', () => {
            this.ContinueStart.disableInteractive();

            //状態を更新
            manager.updateState({
                state: State.LOAD,
                fieldData: {
                    gameMode: 'Continue',
                    mapKey: this.cache.json.get('savedata').playerData.PlayerMapKey,
                    x: this.cache.json.get('savedata').playerData.PlayerPosition.x,
                    y: this.cache.json.get('savedata').playerData.PlayerPosition.y,
                    initStandKey: this.cache.json.get('savedata').playerData.initStandKey,
                }
            }, 'Continue')

            //コンティニューの場合、初期イベントのフラグを倒す
            const settingData = new DataDefinition();
            settingData.updateEventFlg(this, 'EVENT0001', false);

            this.scene.stop();
        });

        //EventBusにシーンを登録するとuseEffect経由で外部から操作できる
        EventBus.emit('current-scene-ready', this);



        //this.scene.start('MainMenu');
    }

    //EventBus経由で外部から参照され、シーン切替が可能
    changeScene() {
        console.log("Title changeScene")
        this.scene.start('MainMenu');
    }
}
