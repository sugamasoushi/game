import { MessageObject } from "../../util/MessageObject";
import { SelectAllow } from "../../util/SelectAllow";
import { MessageWindow } from "../../util/MessageWindow";
import { BattleScene } from "../../lib/types";
import DebugMessage from "../../util/DebugMessage";
import { Sound } from "../../scenes/Sound";
import { ItemUpdate } from "../../Data/ItemUpdate";
import { InputManager } from "../../core/input/InputManager";
import { Subscription, throttleTime } from "rxjs";
import { GameSettingData } from "../../Data/GameSettingData";

export class BattleSelectWindow extends Phaser.GameObjects.Container {
    private getCanNotRunawayFlg: boolean = false;

    private column: string[] = ['戦う', 'オート', 'アイテム', '逃げる'];
    private selectList: Phaser.GameObjects.Text[] = [];
    private nowSelectNo: number = 0;

    private columnWindow: MessageWindow;
    private allow: SelectAllow;
    private canDecide: boolean = false;

    private soundScene: Sound;
    private subs = new Subscription();

    constructor(private battleScene: BattleScene, getCanNotRunawayFlg: boolean) {
        super(battleScene);
        this.getCanNotRunawayFlg = getCanNotRunawayFlg;
    }

    public init() {
        this.x = 0;
        this.y = 0;
        this.name = BattleSelectWindow.name;
        this.scene.add.existing(this);
        this.addToUpdateList();
        this.soundScene = this.scene.scene.get('Sound') as Sound;
        this.setupInput();
    }

    public createBattleSelectWindow(x: number, y: number) {
        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        //項目テキスト作成
        this.column.forEach(str => {
            const to = messageObject.createTextObject(this.scene, 0, 0, str)
            to.name = str;
            this.selectList.push(to);
        });

        //テキスト配置及びクリック時の動作を設定
        this.selectList.forEach((obj, index) => {
            obj.y = index * (obj.height + obj.lineSpacing);

            //一旦全てグレーアウト
            obj.setTint(Phaser.Display.Color.GetColor(128, 128, 128));

            obj.on('pointerover', () => {
                this.allow.updatePosition(obj);
                this.nowSelectNo = index;
            }, this);

            obj.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                pointer.reset();
                this.selectExec(index);
                this.scene.input.setDefaultCursor('default');
            }, this);
        });

        //ウィンドウ作成
        this.columnWindow = new MessageWindow(this.scene);
        this.columnWindow.init();
        this.columnWindow.createVerticalColumnWindow(this.selectList, 16);

        //カーソル作成配置
        this.allow = new SelectAllow(this.scene);
        this.allow.init(0, 0);
        this.allow.createAllow();
        this.allow.updatePosition(this.selectList[this.nowSelectNo]);

        //コンテナに追加
        this.add(this.columnWindow);
        this.add(this.selectList);
        this.add(this.allow);

        //クリック可能に設定
        this.enableSelect();

        //非表示
        this.setVisible(false);

        //コンテナ座標を更新
        this.x = x;
        this.y = y;
    }

    preUpdate() {//time: number, delta: number
        this.updateSelectNo();
    }

    //選択実行
    private selectExec(index: number) {
        if (index === 0) {//戦う
            this.emit('Battle_Select_Submit', 0);//パーティの戦闘を指定
            this.disableSelect();
        } else if (index === 1) {//オート
            this.soundScene.playSe('SE_boosterJump1');
            this.battleScene.events.emit('AUTO_BATTLE_SELECT', true)
            this.disableSelect();
        } else if (index === 2) {//アイテム

            const itemUpdate = new ItemUpdate(this.battleScene);
            const itemList = itemUpdate.getValidItemList();

            if (itemList.length == 0 || itemList == null) {
                this.battleScene.events.emit('BATTLE_MESSAGE_OUTPUT', '何も持ってない！', 1200);
                return;
            }
            this.emit('Item_Select_Submit', true)
            this.disableSelect();
        } else if (index === 3) {//逃げる
            //逃走可否チェック
            if (this.getCanNotRunawayFlg) {
                const debugMessage = new DebugMessage(this.scene);
                debugMessage.NotImplemented('お？逃げんの？ｗ');
            } else {
                this.soundScene.stopAllBgm();
                (this.scene as BattleScene).endScene();
            }
        }
    }

    show() {
        this.enableSelect();
        this.setVisible(true);
        this.canDecide = false;
        this.scene.time.delayedCall(10, () => {
            this.canDecide = true;
        });
    }
    move() {
        this.setActive(false);
        this.lightDown();
        this.disableInteractive();
    }
    hide() {
        this.setVisible(false);
    }

    private setupInput() {
        const duration = GameSettingData.getInputSettings(this.scene).duration;
        const inputManager = InputManager.getInstance(this.scene);

        this.subs.add(inputManager.downButton$.pipe(
            // 一定時間、最初の1回以外の入力を無視する
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active) return;
            if (this.nowSelectNo + 1 < this.selectList.length) {
                this.nowSelectNo++;
            } else {
                this.nowSelectNo = 0; // ループして最初に戻る
            }
            this.allow.updatePosition(this.selectList[this.nowSelectNo]);
        }));

        this.subs.add(inputManager.upButton$.pipe(
            // 一定時間、最初の1回以外の入力を無視する
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active) return;
            if (this.nowSelectNo - 1 >= 0) {
                this.nowSelectNo--;
            } else {
                this.nowSelectNo = this.selectList.length - 1; // ループして最後に移動する
            }
            this.allow.updatePosition(this.selectList[this.nowSelectNo]);
        }));

        this.subs.add(inputManager.decideButton$.pipe(
            // 一定時間、最初の1回以外の入力を無視する
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active || !this.canDecide) return;
            this.selectExec(this.nowSelectNo);
        }));
    }

    public destroy(fromScene?: boolean) {
        this.subs.unsubscribe();
        super.destroy(fromScene);
    }

    private updateSelectNo() {
        // InputManager側で制御するため、従来のキーボード直接参照は削除または無効化
    }

    //テキストクリック可
    enableSelect() {
        this.setAlpha(1);
        this.setActive(true);
        this.allow.lightUp();
        this.lightUp();
        this.selectList.forEach((obj) => {
            obj.setInteractive({ useHandCursor: true });//テキストをクリック可能にする
        });
    }

    //テキストクリック不可
    disableSelect() {
        this.setAlpha(0.5);
        this.setActive(false);//更新を停止
        this.allow.lightDown();
        this.lightDown();
        this.selectList.forEach(obj => {
            obj.disableInteractive();
        });
    }

    lightUp() {
        this.selectList.forEach(list => {
            list.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
        })
        this.columnWindow.setLineLightUp();
    }

    lightDown() {
        this.selectList.forEach(list => {
            list.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        });
        this.columnWindow.setLineLightDown();
    }
}
