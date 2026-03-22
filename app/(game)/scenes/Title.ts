import { GameObjects, Scene } from 'phaser';
import { State } from '../lib/types';
import { EventBus } from '../EventBus';
import { GameStateManager } from '../GameAllState/GameStateManager';
import { DataDefinition } from '../Data/DataDefinition';
import { SaveDataManager } from '../core/SaveDataManager';

export class Title extends Scene {
    private debugFlg: boolean | undefined;

    game: Phaser.Game;

    private manager: GameStateManager;
    private titleText: GameObjects.Text;
    private newGameStart: GameObjects.Text;
    private ContinueStart: GameObjects.Text;
    private logoTween: Phaser.Tweens.Tween | null;
    private saveDataManager: SaveDataManager;

    constructor() { super('Title'); }

    init() {
        console.log("Title scene")
        this.debugFlg = this.game.config.physics.arcade?.debug;
    }

    preload() {
        this.load.json('savedata', 'assets/data/savedata.json');

        //ここでは文字列ベースのデータのみロードし、次のLoadSceneで画像などの重いデータをロードする
        this.load.tilemapTiledJSON({ key: '0001', url: 'assets/tiled/0001_testtile.json' });
        this.load.tilemapTiledJSON({ key: '0002', url: 'assets/tiled/0002_testtile.json' });
        this.load.tilemapTiledJSON({ key: '0101', url: 'assets/tiled/0101_home.json' });
        this.load.tilemapTiledJSON({ key: '0102', url: 'assets/tiled/0102_HomeForest.json' });

        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');
        this.load.image('alertImage', '/img/CharaStand/20240713_2.png');
    }

    async create() {

        //状態管理クラス
        this.manager = GameStateManager.getInstance();

        //セーブデータ
        this.saveDataManager = new SaveDataManager();

        await this.opening();
        await this.title();
        this.newGame();
        this.continue();

        //EventBusにシーンを登録するとuseEffect経由で外部から操作できる
        EventBus.emit('current-scene-ready', this);

        //this.scene.start('MainMenu');
    }

    //EventBus経由で外部から参照され、シーン切替が可能
    changeScene() {
        console.log("Title changeScene")
        this.scene.start('MainMenu');
    }

    async opening() {
        if (this.debugFlg) return;

        const opening = this.sound.add('opening', { loop: true }) as Phaser.Sound.HTML5AudioSound;
        opening.setVolume(0.5);
        opening.play();

        this.events.once('OPENING_MUSIC_END', () => {
            opening.stop();
        });


        const gameWidth = Number(this.game.config.width)
        const gameHeight = Number(this.game.config.height)

        //一旦中央に配置
        const meinaOpImage = this.add.image(0, gameHeight / 2, 'meinaOpImage');
        const lamyOpImage = this.add.image(gameWidth, gameHeight / 2, 'lamyOpImage');
        const meinaOpImageHome = this.add.image(0, gameHeight / 2, 'meinaOpImageHome');
        const lamyOpImageHome = this.add.image(gameWidth, gameHeight / 2, 'lamyOpImageHome');


        //人物を画面端に配置
        meinaOpImage.setPosition(gameWidth + meinaOpImage.width / 2, gameHeight / 2 + 100).setDepth(gameHeight);
        meinaOpImageHome.setPosition(gameWidth + meinaOpImageHome.width / 2, gameHeight / 2).setDepth(gameHeight - 10);
        lamyOpImage.setPosition(- lamyOpImage.width / 2, gameHeight / 2 + 100).setDepth(gameHeight - 5);
        lamyOpImageHome.setPosition(- lamyOpImageHome.width / 2, gameHeight / 2).setDepth(gameHeight - 20);

        return new Promise<void>(resolve => {

            const timeline = this.add.timeline([
                {
                    at: 0,
                    tween: {
                        targets: lamyOpImageHome,
                        x: gameWidth - lamyOpImageHome.width / 2,
                        ease: 'Power2',
                        duration: 200
                    }
                },
                {
                    at: 200,
                    tween: {
                        targets: lamyOpImage,
                        x: gameWidth - lamyOpImage.width / 2,
                        ease: 'circ.out',
                        duration: 500
                    }
                },
                {
                    at: 1000,
                    tween: {
                        targets: meinaOpImageHome,
                        x: gameWidth - meinaOpImageHome.width / 2,
                        ease: 'Power2',
                        duration: 200
                    }
                },
                {
                    at: 1200,
                    tween: {
                        targets: meinaOpImage,
                        x: meinaOpImage.width / 2,
                        ease: 'circ.out',
                        duration: 500
                    }
                },
                {
                    at: 2000,
                    tween: {
                        targets: meinaOpImage,
                        x: - meinaOpImage.width,
                        ease: 'back.in',
                        duration: 400
                    }
                },
                {
                    at: 2200,
                    tween: {
                        targets: lamyOpImage,
                        x: gameWidth + lamyOpImage.width,
                        ease: 'back.in',
                        duration: 400
                    },
                },
            ]);

            timeline.once('complete', () => {
                resolve();
            });

            timeline.play();
        })
    }

    async title() {

        const gameWidth = Number(this.game.config.width)
        const gameHeight = Number(this.game.config.height)

        //this.add.image(gameWidth / 2, gameHeight / 2, 'LondonBridge');

        //タイトルテキスト
        this.titleText = this.add.text(
            gameWidth / 2, gameHeight / 2 - 200,
            "ちょっとだけRPG", { fontFamily: "Arial Black", fontSize: 128, color: "#00a6ed" });

        this.titleText.setDepth(gameHeight);
        this.titleText.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true).setAlpha(0);

        await new Promise<void>(resolve => {
            this.tweens.add({
                targets: this.titleText,
                alpha: 1,
                duration: 1000,
                ease: 'Power1',
                onComplete: () => {
                    resolve();
                }
            });
        })

        // --- ここからが光らせるTween ---
        this.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 1000,
            repeat: -1,
            yoyo: true,
            onUpdate: (tween) => {
                const value = tween.getValue();
                // 青から白へ、色が変化する
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.HexStringToColor('#00a6ed'),
                    Phaser.Display.Color.HexStringToColor('#ffffff'),
                    100,
                    value!
                );
                this.titleText.setTint(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
            }
        });


        //パーティクル
        const emitter = this.add.particles(0, 0, 'spark', {
            scale: 0.5,
            lifespan: 10000,
            gravityY: -50,
            frequency: 20,
            maxVelocityX: 200,
            maxVelocityY: 200,
            blendMode: 'ADD'
        });

        const shape1 = new Phaser.Geom.Rectangle(0, 600, gameWidth, 128);

        emitter.addEmitZone({
            type: 'random',
            source: shape1
        } as Phaser.Types.GameObjects.Particles.EmitZoneData);

        emitter.createGravityWell({
            x: gameWidth / 2,
            y: 150,
            power: 4.2,
            epsilon: 250,
            gravity: 100
        });

        emitter.setDepth(gameHeight - 5)

    }

    newGame() {
        const gameWidth = Number(this.game.config.width)
        const gameHeight = Number(this.game.config.height)

        //NewGame
        this.newGameStart = this.add.text(
            gameWidth / 2, gameHeight / 2,
            "New Game", { fontFamily: "Arial Black", fontSize: 50, color: "#00a6ed" });
        this.newGameStart.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        this.newGameStart.setDepth(gameHeight);

        this.newGameStart.setInteractive({ useHandCursor: true });


        this.newGameStart.on('pointerdown', () => {
            this.newGameStart.disableInteractive();

            //状態をスタートに更新
            this.manager.updateState({
                state: State.LOAD,
                fieldData: {
                    gameMode: 'New Game',
                    mapKey: '0101',
                    x: 495,
                    y: 337,
                    initStandKey: 'stand_left',
                }
            }, 'New Game')

            this.events.emit('OPENING_MUSIC_END');

            this.scene.stop();
        });
    }

    continue() {
        const gameWidth = Number(this.game.config.width)
        const gameHeight = Number(this.game.config.height)

        //Continue
        this.ContinueStart = this.add.text(
            gameWidth / 2, gameHeight / 2 + 100,
            "Continue", { fontFamily: "Arial Black", fontSize: 50, color: "#00a6ed" });
        this.ContinueStart.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        this.ContinueStart.setDepth(gameHeight);

        this.ContinueStart.setInteractive({ useHandCursor: true });
        this.ContinueStart.on('pointerdown', async () => {
            this.ContinueStart.disableInteractive();

            //ローカルストレージ等のデータを読み込み
            await this.saveDataManager.loadSaveData(this);

            //状態を更新
            this.manager.updateState({
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

            this.events.emit('OPENING_MUSIC_END');

            this.scene.stop();
        });
    }

}
