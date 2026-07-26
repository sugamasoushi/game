import { BattleScene } from "../../lib/types";
import { EnergyGauge } from "../../util/EnergyGauge";
import { MessageObject } from "../../util/MessageObject";
import { MessageWindow } from "../../util/MessageWindow";
import { InputManager } from "../../core/input/InputManager";
import { Subscription, throttleTime } from "rxjs";
import { GameSettingData } from "../../Data/GameSettingData";
import { GameStateManager } from "../../core/GameStateManager";
import { SearchBattleField } from "./battoleField/SearchBattleField";
import { SearchBattleFieldData } from "../../Data/SearchBattleFieldData";
import { SearchEnemyData } from "../../Data/SearchEnemyData";

export class EnemySelectWindow extends Phaser.GameObjects.Container {
    private debugFlg: boolean | undefined;
    private nowSelectCharacter: Phaser.GameObjects.Sprite;

    private messageText: string = '獲物はあいつだ！！';
    private enemyPartyList: Phaser.GameObjects.Image[];

    private messageObject: Phaser.GameObjects.Text;
    private messageWindow: MessageWindow;
    private backButton: Phaser.GameObjects.Text;
    private backButtonWindow: MessageWindow;

    private nowSelectNo: number = -1;
    private tweens: Phaser.Tweens.Tween[] = [];
    private subs = new Subscription();
    private canDecide: boolean = false;

    private light: Phaser.GameObjects.Light[] = [];
    private cursorLight: Phaser.GameObjects.Light;
    private lightFlg: boolean = false;

    constructor(battleScene: BattleScene) {
        super(battleScene);
        this.name = EnemySelectWindow.name;
        this.scene.add.existing(this);
        this.addToDisplayList();
        //this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    }

    public init(enemyPartyList: Phaser.GameObjects.Image[]) {
        this.createBattleField();

        this.enemyPartyList = enemyPartyList;
        this.x = 0;
        this.y = 0;
        this.createEnemy();
        this.createMessage();

        this.setVisible(true);
        this.setActive(false);
        this.setupInput();
    }

    update() {
        //this.updateView();

        if (this.lightFlg) {
            for (const [index, enemy] of this.enemyPartyList.entries()) {
                const light = this.light[index];
                light.x = this.x + enemy.x + (enemy.width * enemy.scaleX) / 2;
                light.y = this.y + enemy.y + (enemy.height * enemy.scaleY) / 2;
            }
        }
    }

    private createBattleField() {

        //背景画像
        //黒塗を作成（画面揺れによる背景非表示対策）
        const maskRect = this.scene.add.graphics();
        maskRect.fillStyle(0x000000, 1);
        maskRect.fillRect(-100, -100, Number(this.scene.game.config.width) + 200, Number(this.scene.game.config.height) + 200);

        //状態管理クラスから現在のバトル用データを取得
        const manager = GameStateManager.getInstance();
        const battleFieldKey = manager.currentBattleFieldKey;
        const serchInstance = new SearchBattleField();
        const battleField = serchInstance.searchEventClass(this.scene as BattleScene, battleFieldKey);
        battleField!.execute();

        if (manager.isDebugMode) {
            this.cursorLight = this.scene.lights.addLight(0, 0, 200)
            this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
                this.cursorLight.x = pointer.x;
                this.cursorLight.y = pointer.y;
            });
        }
    }

    //敵の画像を作成
    private createEnemy() {
        let maxWidth = 0;

        const manager = GameStateManager.getInstance();
        const battleFieldKey = manager.currentBattleFieldKey;
        const serchInstance = new SearchBattleFieldData(this.scene.cache.json);
        const battleField = serchInstance.getBattleFieldData(battleFieldKey);
        const lightFlag = battleField?.light;
        const searchEnemyData = new SearchEnemyData(this.scene.cache.json)

        const standardPosition = Number(this.scene.game.config.height) * 0.7;

        //キャラ画像の配置、キャラ等身（高さ）はイラストを調整すること
        for (const enemy of this.enemyPartyList) {

            const imageHeightUp = searchEnemyData.getEnemyData(enemy.name)?.ImageHeightUp ? searchEnemyData.getEnemyData(enemy.name)?.ImageHeightUp : 0;
            const hpGageHeightUp = searchEnemyData.getEnemyData(enemy.name)?.HpGageHeightUp ? searchEnemyData.getEnemyData(enemy.name)?.HpGageHeightUp : 0;

            enemy.setOrigin(0);
            enemy.x = maxWidth;
            enemy.y = standardPosition - enemy.height - imageHeightUp!;

            console.log(enemy.name, imageHeightUp!)

            //ゲージ作成配置
            const backGaugeHP = new EnergyGauge(this.scene, enemy, 'MaxHP');
            const gaugeHP = new EnergyGauge(this.scene, enemy, 'HP');
            const posX = maxWidth + (enemy.width * enemy.scaleX / 2 - backGaugeHP.getWidth() / 2);

            backGaugeHP.setPosition(posX, enemy.y - hpGageHeightUp!);
            gaugeHP.setPosition(posX, enemy.y - hpGageHeightUp!);

            //コンテナに追加
            this.add([enemy, backGaugeHP, gaugeHP]);

            //参照を画像データに格納しておく
            enemy.setData('backGaugeHP', backGaugeHP);
            enemy.setData('gaugeHP', gaugeHP);

            //バトルフィールドでライト有効の場合
            if (lightFlag) {
                enemy.setPipeline('Light2D');

                // 半径（radius）を元の想定の「2倍〜3倍」に大きく広げる
                // これにより、中心から外側に向かって非常に緩やかに光が消えていくようになります
                const radius = 300;
                const light = this.scene.lights.addLight(0, 0, radius)

                // カラーコードに「薄い青（例: 0xddecff）」を指定
                light.setColor(0xddecff);

                // 光の強さ（Intensity）を 1.0 未満（0.3 〜 0.6 程度）に下げる
                // これにより、中心部分だけがピカッと白飛びするのを完全に抑えられます
                light.setIntensity(0.6);

                this.lightFlg = true;
                this.light.push(light);
            }

            //次の敵配置用に数値を保存
            maxWidth = maxWidth + enemy.width * enemy.scaleX;
        }

        //コンテナ全体の配置を調整
        const displayPosX = Number(this.scene.game.config.width) / 2 - maxWidth / 2;
        this.x = displayPosX;
        this.y += 150;
    }

    private createMessage() {
        //const tilesize = 32;

        //テキスト作成
        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.scene);
        this.messageObject = messageObjectInstance.createTextObject(this.scene, 0, 0, this.messageText);
        this.messageObject.setDepth(100);

        //テキストオブジェクトの位置を更新
        this.messageObject.x = Number(this.scene.game.canvas.width) / 2 - this.messageObject.width / 2;
        this.messageObject.y = 500;

        //ウィンドウ作成
        const messageWindowInstance = new MessageWindow(this.scene);
        messageWindowInstance.init();
        messageWindowInstance.createOneColumnOneWindow(this.messageObject);
        this.messageWindow = messageWindowInstance;
        this.messageWindow.setDepth(this.messageObject.depth - 10)

        //戻るボタン (配置を調整)
        const backButtonX = this.messageWindow.x + this.messageWindow.width;
        const backButtonY = this.messageWindow.y;

        this.backButton = messageObjectInstance.createTextObject(this.scene, backButtonX, backButtonY, "✖");
        this.backButton.setDepth(101);

        //ウィンドウ作成
        this.backButtonWindow = new MessageWindow(this.scene);
        this.backButtonWindow.init();
        this.backButtonWindow.createOneColumnOneWindow(this.backButton, 16);
        this.backButtonWindow.setDepth(100);

        this.backButton.setDepth(this.backButtonWindow.depth + 1);
        this.backButton.setInteractive({ useHandCursor: true });
        this.backButton.on('pointerdown', () => {
            this.backSubmit();
        }, this);

        this.messageObject.setVisible(false);
        this.messageWindow.setVisible(false);
        this.backButton.setVisible(false);
        this.backButtonWindow.setVisible(false);
    }

    // private updateView() {
    //     for (const enemy of this.enemyPartyList) {
    //         enemy.getData('backGaugeHP').update();
    //         enemy.getData('gaugeHP').update();
    //     }
    // }

    show(playerSprite: Phaser.GameObjects.Sprite, playerCharacterIcon: Phaser.GameObjects.Image) {
        this.nowSelectCharacter = playerSprite;
        this.nowSelectNo = -1;

        this.messageObject.setVisible(true);
        this.messageWindow.setVisible(true);
        this.backButton.setVisible(true);
        this.backButtonWindow.setVisible(true);

        this.setActive(true);
        this.enableSelect();

        this.canDecide = false;
        this.scene.time.delayedCall(10, () => {
            this.canDecide = true;
        });
    }

    private setupInput() {
        const duration = GameSettingData.getInputSettings(this.scene).duration;
        const inputManager = InputManager.getInstance(this.scene);

        const navigate = (dir: 'next' | 'prev') => {
            const aliveIndices = this.enemyPartyList
                .map((e, i) => e.getData('HP') > 0 ? i : -1)
                .filter(i => i !== -1);

            if (aliveIndices.length === 0) return;

            if (this.nowSelectNo === -1) {
                this.nowSelectNo = aliveIndices[0];
            } else {
                let currentIndex = aliveIndices.indexOf(this.nowSelectNo);
                if (dir === 'next') {
                    currentIndex = (currentIndex + 1) % aliveIndices.length;
                } else {
                    currentIndex = (currentIndex - 1 + aliveIndices.length) % aliveIndices.length;
                }
                this.nowSelectNo = aliveIndices[currentIndex];
            }
            this.updateSelection();
        };

        this.subs.add(inputManager.rightButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active) return;
            navigate('next');
        }));
        this.subs.add(inputManager.downButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active) return;
            navigate('next');
        }));
        this.subs.add(inputManager.leftButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active) return;
            navigate('prev');
        }));
        this.subs.add(inputManager.upButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active) return;
            navigate('prev');
        }));

        this.subs.add(inputManager.decideButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active || !this.canDecide) return;
            if (this.nowSelectNo !== -1) {
                this.submit(this.enemyPartyList[this.nowSelectNo]);
            } else {
                const firstAlive = this.enemyPartyList.find(e => e.getData('HP') > 0);
                if (firstAlive) this.submit(firstAlive);
            }
        }));

        this.subs.add(inputManager.cancelButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active || !this.canDecide) return;
            this.backSubmit();
        }));
    }

    private submit(enemy: Phaser.GameObjects.Image) {
        this.scene.input.setDefaultCursor('default');
        this.emit('Enemy_Select_Submit', enemy);
        this.hide();
    }

    private backSubmit() {
        this.scene.input.setDefaultCursor('default');
        this.emit('Select_back_Submit');
        this.hide();
    }

    private updateSelection() {
        this.deleteLight();

        if (this.nowSelectNo === -1) {
            // 全員点滅
            for (const [index, enemy] of this.enemyPartyList.entries()) {
                if (enemy.getData('HP') > 0) {
                    this.addFlashTween(enemy, index % 2 === 0);
                }
            }
        } else {
            // 選択中のみ点滅
            const selectedEnemy = this.enemyPartyList[this.nowSelectNo];
            if (selectedEnemy) {
                this.addFlashTween(selectedEnemy, true);
            }
        }
    }

    private addFlashTween(enemy: Phaser.GameObjects.Image, isUpFirst: boolean) {
        const tween = this.scene.tweens.addCounter({
            from: isUpFirst ? 255 : 128,
            to: isUpFirst ? 128 : 255,
            duration: 400,
            ease: 'linear',
            yoyo: true,
            repeat: -1,
            onUpdate: (t) => {
                const val = Math.floor(t.getValue()!);
                enemy.setTint(Phaser.Display.Color.GetColor(val, val, val));
            }
        });
        this.tweens.push(tween);
    }

    move() {
        this.disableSelect();
    }

    hide() {
        this.setActive(false);

        this.messageObject.setVisible(false);
        this.messageWindow.setVisible(false);
        this.backButton.setVisible(false);
        this.backButtonWindow.setVisible(false);
        this.deleteLight();
        this.disableSelect();
    }

    private enableSelect() {
        this.setActive(true);
        this.updateSelection();

        for (const [index, enemy] of this.enemyPartyList.entries()) {
            if (enemy.getData('HP') <= 0) continue;

            enemy.setInteractive({ useHandCursor: true });

            enemy.on('pointerover', () => {
                this.nowSelectNo = index;
                this.updateSelection();
            }, this);

            enemy.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.leftButtonDown()) {
                    pointer.reset();
                    this.submit(enemy);
                }
                if (pointer.rightButtonDown()) {
                    pointer.reset();
                    this.backSubmit();
                }
            }, this);
        }
    }

    private disableSelect() {
        for (const enemy of this.enemyPartyList) {
            enemy.disableInteractive();
        }
    }

    private deleteLight() {
        for (const t of this.tweens) {
            t.destroy();
        }
        this.tweens = [];

        for (const enemy of this.enemyPartyList) {
            enemy.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
        }
    }

    public destroy(fromScene?: boolean) {
        this.subs.unsubscribe();
        this.deleteLight();
        super.destroy(fromScene);

        this.light = [];
        this.lightFlg = false;
    }
}
