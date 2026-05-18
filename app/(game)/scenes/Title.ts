import { GameObjects, Scene } from 'phaser';
import { State } from '../lib/StateTypes';
import { EventBus } from '../EventBus';
import { GameStateManager } from '../GameAllState/GameStateManager';
import { DataDefinition } from '../Data/DataDefinition';
import { SaveDataManager } from '../core/SaveDataManager';
import { InputManager } from '../core/input/InputManager';
import { Subscription } from 'rxjs';

export class Title extends Scene {
    private debugFlg: boolean | undefined;

    game: Phaser.Game;

    private manager: GameStateManager;
    private titleText: GameObjects.Text;
    private newGameStart: GameObjects.Text;
    private ContinueStart: GameObjects.Text;
    private logoTween: Phaser.Tweens.Tween | null;
    private saveDataManager: SaveDataManager;

    private inputManager: InputManager;
    private subs: Subscription;
    private nowSelectNo: number = 0;
    private maxSelectNo: number = 1;
    private hasContinueData: boolean = false;
    private selectTween: Phaser.Tweens.Tween | null = null;
    private isTransitioning: boolean = false;

    public SE_syakiin: Phaser.Sound.HTML5AudioSound;

    constructor() { super('Title'); }

    init() {
        console.log("Title scene")
        this.debugFlg = this.game.config.physics.arcade?.debug;
        this.isTransitioning = false;
    }

    preload() {
        this.load.json('savedata', 'assets/data/savedata.json');

        //ここでは文字列ベースのデータのみロードし、次のLoadSceneで画像などの重いデータをロードする
        this.load.tilemapTiledJSON({ key: '0001', url: 'assets/tiled/0001_testtile.json' });
        this.load.tilemapTiledJSON({ key: '0002', url: 'assets/tiled/0002_testtile.json' });
        this.load.tilemapTiledJSON({ key: '0101', url: 'assets/tiled/0101_home.json' });
        this.load.tilemapTiledJSON({ key: '0102', url: 'assets/tiled/0102_HomeForest.json' });
        this.load.tilemapTiledJSON({ key: '0201', url: 'assets/tiled/0201_Gensou.json' });

        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');
        this.load.image('alertImage', '/img/CharaStand/20240713_2.png');
    }

    async create() {

        this.SE_syakiin = this.sound.add('SE_syakiin', { loop: false }) as Phaser.Sound.HTML5AudioSound;
        this.SE_syakiin.volume = 0.7;

        //状態管理クラス
        this.manager = GameStateManager.getInstance();

        /**
         * サブスクリプション管理用のオブジェクトを初期化
         * 
         * subuscriptionの注意点
         * unSubscriptionするとclose:trueとなり購読解除となるが、インスタンスは残り続ける。
         * 購読解除したインスタンスは再講読する事は出来ず、この状態でsub.add()で追加しても即座に購読解除となる。
         * そのため、購読を再開したい場合は、新しいSubscriptionインスタンスを作成してsubに代入する必要がある。
         * Titleシーンで上記問題が発生したが、他シーンではsubscriptionを再定義しているため発生していない。
         */
        this.subs = new Subscription();

        //セーブデータ
        this.saveDataManager = new SaveDataManager();
        this.hasContinueData = await this.saveDataManager.checkSaveData(this);
        this.maxSelectNo = this.hasContinueData ? 1 : 0;
        this.nowSelectNo = this.hasContinueData ? 1 : 0; // セーブデータがあればコンティニューをデフォルトにする

        await this.opening();
        await this.title();
        this.newGame();
        await this.continue();

        this.inputManager = InputManager.getInstance(this);
        this.setupInput();
        this.updateSelection();

        //EventBusにシーンを登録するとuseEffect経由で外部から操作できる
        EventBus.emit('current-scene-ready', this);

        this.events.once('shutdown', () => {
            this.subs.unsubscribe();
        });
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
            gameWidth / 2, gameHeight / 2 + 25,
            "New Game", { fontFamily: "Arial Black", fontSize: 50, color: "#00a6ed" });
        this.newGameStart.setOrigin(0.5, 0.5).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        this.newGameStart.setDepth(gameHeight);

        this.newGameStart.setInteractive({ useHandCursor: true });


        this.newGameStart.on('pointerdown', () => {
            this.execNewGame();
        });
    }

    private async execNewGame() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        this.newGameStart.disableInteractive();
        if (this.ContinueStart) this.ContinueStart.disableInteractive();

        // 決定演出
        await this.playDecideEffect(this.newGameStart);

        //状態をスタートに更新
        this.manager.updateState({
            state: State.LOAD,
            fieldData: {
                gameMode: 'New Game',
                mapKey: '0101',
                x: 495,
                y: 337,
                x2: 0,
                y2: 0,
                initStandKey: 'stand_left',
            }
        }, 'New Game')

        this.events.emit('OPENING_MUSIC_END');

        this.scene.stop();
    }

    async continue() {
        const gameWidth = Number(this.game.config.width)
        const gameHeight = Number(this.game.config.height)

        //Continue
        this.ContinueStart = this.add.text(
            gameWidth / 2, gameHeight / 2 + 125,
            "Continue", { fontFamily: "Arial Black", fontSize: 50, color: "#00a6ed" });
        this.ContinueStart.setOrigin(0.5, 0.5).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        this.ContinueStart.setDepth(gameHeight);

        this.ContinueStart.setInteractive({ useHandCursor: true });

        //セーブデータが存在しない場合
        if (!this.hasContinueData) {
            this.ContinueStart.setAlpha(0.5);
            this.ContinueStart.disableInteractive();
            return;
        }

        this.ContinueStart.on('pointerdown', async () => {
            this.execContinue();
        });
    }

    private async execContinue() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        this.ContinueStart.disableInteractive();
        if (this.newGameStart) this.newGameStart.disableInteractive();

        // 決定演出
        await this.playDecideEffect(this.ContinueStart);

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
                x2: 0,
                y2: 0,
                initStandKey: this.cache.json.get('savedata').playerData.initStandKey,
            }
        }, 'Continue')

        //コンティニューの場合、初期イベントのフラグを倒す
        const settingData = new DataDefinition();
        settingData.updateEventFlg(this, 'EVENT0001', false);

        this.events.emit('OPENING_MUSIC_END');

        this.scene.stop();
    }

    private async playDecideEffect(target: GameObjects.Text): Promise<void> {
        this.SE_syakiin.play();
        if (this.selectTween) {
            this.selectTween.stop();
        }

        // 他のテキストをフェードアウト
        const other = (target === this.newGameStart) ? this.ContinueStart : this.newGameStart;
        if (other) {
            this.tweens.add({
                targets: other,
                alpha: 0,
                duration: 200
            });
        }

        return new Promise(resolve => {
            // スケールと点滅の演出
            this.tweens.add({
                targets: target,
                scale: 1.3,
                duration: 100,
                yoyo: true,
                repeat: 3,
                onComplete: () => {
                    resolve();
                }
            });

            this.tweens.addCounter({
                from: 0,
                to: 100,
                duration: 100,
                repeat: 3,
                yoyo: true,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                        Phaser.Display.Color.HexStringToColor('#ffffff'), // 白
                        Phaser.Display.Color.HexStringToColor('#00a6ed'), // 元の色
                        100,
                        value!
                    );
                    target.setColor('#ffffff');
                    target.setShadow(4, 4, '#00a6ed', 8, false, true);
                    target.setTint(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
                }
            });
        });
    }

    private setupInput() {
        this.subs.add(this.inputManager.downButton$.subscribe(() => {
            if (this.nowSelectNo < this.maxSelectNo) {
                this.nowSelectNo++;
                this.updateSelection();
            }
        }));

        this.subs.add(this.inputManager.upButton$.subscribe(() => {
            if (this.nowSelectNo > 0) {
                this.nowSelectNo--;
                this.updateSelection();
            }
        }));

        this.subs.add(this.inputManager.decideButton$.subscribe(() => {
            if (this.nowSelectNo === 0) {
                this.execNewGame();
            } else if (this.nowSelectNo === 1 && this.hasContinueData) {
                this.execContinue();
            }
        }));
    }

    private updateSelection() {
        if (this.selectTween) {
            this.selectTween.stop();
            this.selectTween = null;
        }

        // 全てリセット
        this.newGameStart.setScale(1);
        if (this.ContinueStart) this.ContinueStart.setScale(1);

        let target: GameObjects.Text;

        if (this.nowSelectNo === 0) {
            this.newGameStart.setTint(Phaser.Display.Color.GetColor(255, 255, 255)); // White
            if (this.hasContinueData) {
                this.ContinueStart.setTint(Phaser.Display.Color.GetColor(128, 128, 128)); // Gray
            }
            target = this.newGameStart;
        } else {
            this.newGameStart.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
            if (this.hasContinueData) {
                this.ContinueStart.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
            }
            target = this.ContinueStart;
        }

        // 選択中のテキストを拡大縮小アニメーション
        this.selectTween = this.tweens.add({
            targets: target,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}
