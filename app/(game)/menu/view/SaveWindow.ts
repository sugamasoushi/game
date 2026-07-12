import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";
import { MenuTab } from "../../lib/types";
import { Sound } from "../../scenes/Sound";
import { MessageWindow } from "../../util/MessageWindow";
import { SaveDataManager } from "../../core/SaveDataManager";
import { CacheDataUpdate } from "../../core/CacheDataUpdate";
import { InputManager } from "../../core/input/InputManager";
import { Subscription, throttleTime } from "rxjs";
import { GameSettingData } from "../../Data/GameSettingData";

export class SaveWindow extends Phaser.GameObjects.Container {
    private menuModel: MenuModel;
    private mainWindowDepth: number = 500;
    private soundScene: Sound;

    private isSaveSelectMode: boolean = false;
    private subs = new Subscription();
    private canDecide: boolean = false;

    private saveLabels: Phaser.GameObjects.Text[] = [];
    private saveWindows: MessageWindow[] = [];
    private selectedIndex: number = 0;
    private selectedTween: Phaser.Tweens.Tween | null = null;
    private optionsArray = ['セーブする', 'タイトルへ戻る'];

    private niwatori: Phaser.GameObjects.Image;
    private meina: Phaser.GameObjects.Image;
    private lamy: Phaser.GameObjects.Image;
    private mainColumn: MainColumnWindow;

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        super(scene);
        this.menuModel = menuModel;
        this.scene.add.existing(this);
        this.soundScene = this.scene.scene.get('Sound') as Sound;
    }

    public async create(mainColumn: MainColumnWindow) {
        this.mainColumn = mainColumn;

        //キャラクターを配置
        this.niwatori = this.scene.add.image(800, 250, '20240622_鶏').setScale(0.9);
        this.meina = this.scene.add.image(260, 280, '20240713_2').setScale(0.7);
        this.lamy = this.scene.add.image(450, 250, '20240907_3').setScale(0.9);

        this.add(this.niwatori);
        this.add(this.meina);
        this.add(this.lamy);

        //コンテナの位置設定
        this.x = mainColumn.containtsX + mainColumn.scrollValue * MenuTab.Save;
        this.y = mainColumn.containtsY;

        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.scene);

        const startY = mainColumn.containtsY / 2 + 100;
        const spacingY = 120;

        for (let i = 0; i < this.optionsArray.length; i++) {
            const label = messageObjectInstance.createTextObject(this.scene, 0, 0, [this.optionsArray[i]], 56);
            label.setDepth(100);

            // 中央基準に設定
            label.setOrigin(0.5);
            label.x = mainColumn.scrollValue / 2;
            label.y = startY + i * spacingY;

            //ウィンドウを作成
            const messageWindowInstance = new MessageWindow(this.scene);
            messageWindowInstance.init();

            label.setOrigin(0);
            label.x -= label.width / 2;
            label.y -= label.height / 2;

            messageWindowInstance.createOneColumnOneWindow(label);

            label.setOrigin(0.5);
            label.x += label.width / 2;
            label.y += label.height / 2;

            messageWindowInstance.setInteractive({ useHandCursor: true });

            messageWindowInstance.on('pointerover', () => {
                if (this.isSaveSelectMode) {
                    this.setSelectedIndex(i);
                }
            });

            messageWindowInstance.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.leftButtonDown()) {
                    pointer.reset();
                    this.setSelectedIndex(i);
                    this.executeAction(this.optionsArray[i], label, messageWindowInstance);
                }
            });

            this.saveLabels.push(label);
            this.saveWindows.push(messageWindowInstance);

            this.add(messageWindowInstance);
            this.add(label);
        }

        this.setDepth(this.mainWindowDepth + 50);
        this.setMask(mainColumn.cropRectMask.createGeometryMask());

        this.setupPadKeyboardInput();
    }

    private setupPadKeyboardInput() {
        const duration = GameSettingData.getInputSettings(this.scene).duration;
        const inputManager = InputManager.getInstance(this.scene);

        this.scene.events.on('SaveSelectModeStart', () => {
            this.isSaveSelectMode = true;
            this.canDecide = false;
            this.scene.time.delayedCall(10, () => { this.canDecide = true; });

            this.setSelectedIndex(0);
        });

        this.scene.events.on('SaveSelectModeEnd', () => {
            this.isSaveSelectMode = false;
            if (this.selectedTween) {
                this.selectedTween.stop();
                this.selectedTween = null;
            }
            if (this.saveLabels[this.selectedIndex]) {
                this.saveLabels[this.selectedIndex].setScale(1);
            }
        });

        this.subs.add(inputManager.downButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isSaveSelectMode) return;
            if (this.selectedIndex + 1 < this.saveLabels.length) {
                this.setSelectedIndex(this.selectedIndex + 1);
            }
        }));

        this.subs.add(inputManager.upButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isSaveSelectMode) return;
            if (this.selectedIndex - 1 >= 0) {
                this.setSelectedIndex(this.selectedIndex - 1);
            }
        }));

        this.subs.add(inputManager.decideButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isSaveSelectMode || !this.canDecide) return;
            this.executeAction(this.optionsArray[this.selectedIndex], this.saveLabels[this.selectedIndex], this.saveWindows[this.selectedIndex]);
        }));
    }

    private setSelectedIndex(index: number) {
        if (index < 0 || index >= this.saveLabels.length) return;

        this.selectedIndex = index;
        this.updateSelectedTween();
    }

    private updateSelectedTween() {
        if (this.selectedTween) {
            this.selectedTween.stop();
            this.selectedTween = null;
        }

        const selectedLabel = this.saveLabels[this.selectedIndex];
        if (!selectedLabel || !selectedLabel.active) return;

        selectedLabel.setScale(1);
        this.selectedTween = this.scene.tweens.add({
            targets: selectedLabel,
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private async executeAction(key: string, label: Phaser.GameObjects.Text, window: MessageWindow) {
        if (key === 'セーブする') {
            //effect（パーティクル）
            const emitter = this.scene.add.particles(0, 0, 'spark', {
                speed: { min: 100, max: 200 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.4, end: 0 },
                lifespan: 600,
                gravityY: 300,
                blendMode: 'ADD',
                emitting: false // 最初は出さない
            });
            emitter.setDepth(10000);
            emitter.explode(15, this.niwatori.x, this.niwatori.y);
            emitter.explode(15, this.meina.x, this.meina.y);
            emitter.explode(15, this.lamy.x, this.lamy.y);

            const cacheDataUpdate = new CacheDataUpdate(this.scene);
            cacheDataUpdate.phaserCacheDataUpdate();

            //セーブ処理
            const saveDataManager = new SaveDataManager();
            await saveDataManager.setSaveData(this.scene);

            //セーブ完了
            this.soundScene.playSe('SE_jajaann');

            // テキストとウィンドウを差し替える前に、選択 tweens を停止
            if (this.selectedTween) {
                this.selectedTween.stop();
                this.selectedTween = null;
            }

            //テキストを再設定
            label.destroy();
            const messageObjectInstance = new MessageObject();
            messageObjectInstance.init(this.scene);
            const newLabel = messageObjectInstance.createTextObject(this.scene, 0, 0, ['セーブ完了！！'], 56);
            newLabel.setDepth(100);
            newLabel.setOrigin(0.5);
            newLabel.x = this.mainColumn.scrollValue / 2;
            newLabel.y = window.y + window.height / 2;

            console.log(this.scene.cache.json.get('savedata'));

            //ウィンドウを再設定
            window.destroy();
            const messageWindowInstance = new MessageWindow(this.scene);
            messageWindowInstance.init();
            newLabel.setOrigin(0);
            newLabel.x -= newLabel.width / 2;
            newLabel.y -= newLabel.height / 2;
            messageWindowInstance.createOneColumnOneWindow(newLabel);
            newLabel.setOrigin(0.5);
            newLabel.x += newLabel.width / 2;
            newLabel.y += newLabel.height / 2;

            // 新しいウィンドウとラベルで配列を更新
            this.saveLabels[this.selectedIndex] = newLabel;
            this.saveWindows[this.selectedIndex] = messageWindowInstance;
            messageWindowInstance.setInteractive({ useHandCursor: true });
            messageWindowInstance.on('pointerover', () => {
                if (this.isSaveSelectMode) {
                    this.setSelectedIndex(0); // セーブする は index 0
                }
            });
            messageWindowInstance.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.leftButtonDown()) {
                    pointer.reset();
                    this.setSelectedIndex(0);
                    this.executeAction(this.optionsArray[0], newLabel, messageWindowInstance);
                }
            });

            this.add(messageWindowInstance);
            this.add(newLabel);

        } else if (key === 'タイトルへ戻る') {
            this.scene.events.emit('TITLE_BACK');
        }
    }

    public destroy(fromScene?: boolean) {
        this.subs.unsubscribe();
        this.scene.events.off('SaveSelectModeStart');
        this.scene.events.off('SaveSelectModeEnd');
        super.destroy(fromScene);
    }
}
