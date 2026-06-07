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
import { DataDefinition } from "../../Data/DataDefinition";

export class SaveWindow extends Phaser.GameObjects.Container {
    private menuModel: MenuModel;
    private messageObject: Phaser.GameObjects.Text;
    private messageWindow: MessageWindow;

    private mainWindowDepth: number = 500;
    private soundScene: Sound;

    private isSaveSelectMode: boolean = false;
    private saveTween: Phaser.Tweens.Tween | null = null;
    private subs = new Subscription();
    private canDecide: boolean = false;

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        super(scene);
        this.menuModel = menuModel;
        this.scene.add.existing(this);
        this.soundScene = this.scene.scene.get('Sound') as Sound;
    }

    public async create(mainColumn: MainColumnWindow) {

        //キャラクターを配置
        const niwatori = this.scene.add.image(800, 250, '20240622_鶏').setScale(0.2);
        const meina = this.scene.add.image(260, 280, '20240713_2').setScale(0.7);
        const lamy = this.scene.add.image(450, 250, '20240907_3').setScale(0.9);

        //コンテナの位置設定
        this.x = mainColumn.containtsX + mainColumn.scrollValue * MenuTab.Save;
        this.y = mainColumn.containtsY;

        //テキストを作成
        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.scene);
        this.messageObject = messageObjectInstance.createTextObject(this.scene, 0, 0, ['セーブする'], 56);
        this.messageObject.setDepth(100)

        // 中央基準に設定
        this.messageObject.setOrigin(0.5);
        this.messageObject.x = mainColumn.scrollValue / 2;
        this.messageObject.y = mainColumn.containtsY / 2 + this.messageObject.height * 2 + this.messageObject.height / 2;

        //ウィンドウを作成
        const messageWindowInstance = new MessageWindow(this.scene);
        messageWindowInstance.init();
        // ウィンドウ作成時は一時的にOriginを戻すか、座標を補正して渡す
        this.messageObject.setOrigin(0);
        this.messageObject.x -= this.messageObject.width / 2;
        this.messageObject.y -= this.messageObject.height / 2;

        messageWindowInstance.createOneColumnOneWindow(this.messageObject);
        this.messageWindow = messageWindowInstance;

        // ウィンドウ作成後に再び中央基準に戻す
        this.messageObject.setOrigin(0.5);
        this.messageObject.x += this.messageObject.width / 2;
        this.messageObject.y += this.messageObject.height / 2;

        this.messageWindow.setInteractive({
            useHandCursor: true  // マウスオーバーでカーソルが指マークになる
        });

        this.messageWindow.once(Phaser.Input.Events.POINTER_UP, async () => {

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
            emitter.explode(15, niwatori.x, niwatori.y);
            emitter.explode(15, meina.x, meina.y);
            emitter.explode(15, lamy.x, lamy.y);

            const cacheDataUpdate = new CacheDataUpdate(this.scene);
            cacheDataUpdate.phaserCacheDataUpdate();

            //セーブ処理
            const saveDataManager = new SaveDataManager();
            await saveDataManager.setSaveData(this.scene);

            //セーブ完了
            this.soundScene.playSe('SE_jajaann');
            this.stopSaveAnimation();

            //テキストを再設定
            this.messageObject.destroy();
            const messageObjectInstance = new MessageObject();
            messageObjectInstance.init(this.scene);
            this.messageObject = messageObjectInstance.createTextObject(this.scene, 0, 0, ['セーブ完了！！'], 56);
            this.messageObject.setDepth(100)
            this.messageObject.setOrigin(0.5);
            this.messageObject.x = mainColumn.scrollValue / 2;
            this.messageObject.y = mainColumn.containtsY / 2 + this.messageObject.height * 2 + this.messageObject.height / 2;

            console.log(this.scene.cache.json.get('savedata'));

            //ウィンドウを再設定
            this.messageWindow.destroy();
            const messageWindowInstance = new MessageWindow(this.scene);
            messageWindowInstance.init();
            this.messageObject.setOrigin(0);
            this.messageObject.x -= this.messageObject.width / 2;
            this.messageObject.y -= this.messageObject.height / 2;
            messageWindowInstance.createOneColumnOneWindow(this.messageObject);
            this.messageObject.setOrigin(0.5);
            this.messageObject.x += this.messageObject.width / 2;
            this.messageObject.y += this.messageObject.height / 2;
            this.messageWindow = messageWindowInstance;

            this.add(this.messageWindow);
            this.add(this.messageObject);
        });

        this.add(niwatori);
        this.add(meina);
        this.add(lamy);
        this.add(this.messageWindow);
        this.add(this.messageObject);

        this.setDepth(this.mainWindowDepth + 50);
        this.setMask(mainColumn.cropRectMask.createGeometryMask());

        this.setupPadKeyboardInput();
    }

    private setupPadKeyboardInput() {
        const duration = new DataDefinition().getInputInfomation(this.scene).duration;
        const inputManager = InputManager.getInstance(this.scene);

        this.scene.events.on('SaveSelectModeStart', () => {
            this.isSaveSelectMode = true;
            this.canDecide = false;
            this.scene.time.delayedCall(10, () => { this.canDecide = true; });

            // 拡大縮小アニメーション開始
            if (this.saveTween) this.saveTween.stop();
            this.saveTween = this.scene.tweens.add({
                targets: [this.messageObject, this.messageWindow],
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        this.scene.events.on('SaveSelectModeEnd', () => {
            this.isSaveSelectMode = false;
            if (this.saveTween) {
                this.saveTween.stop();
                this.saveTween = null;
            }
            this.messageObject.setScale(1);
            this.messageWindow.setScale(1);
        });

        this.subs.add(inputManager.decideButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isSaveSelectMode || !this.canDecide) return;
            // POINTER_UPイベントを発火させる
            this.messageWindow.emit(Phaser.Input.Events.POINTER_UP);
        }));
    }

    private stopSaveAnimation() {
        if (this.saveTween) {
            this.saveTween.stop();
            this.saveTween = null;
        }
        this.messageObject.setScale(1);
        this.messageWindow.setScale(1);
    }

    public destroy(fromScene?: boolean) {
        this.subs.unsubscribe();
        this.scene.events.off('SaveSelectModeStart');
        this.scene.events.off('SaveSelectModeEnd');
        super.destroy(fromScene);
    }

}
