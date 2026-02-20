import { MessageObject } from "../../util/MessageObject";
import { SelectAllow } from "../../util/SelectAllow";
import { MessageWindow } from "../../util/MessageWindow";
import { BattleScene } from "../../lib/types";
import DebugMessage from "../../util/DebugMessage";
import { Sound } from "../../scenes/Sound";

export class BattleSelectWindow extends Phaser.GameObjects.Container {
    private getCanNotRunawayFlg: boolean = false;

    private column: string[] = ['戦う', '作戦', '設定', '逃げる'];
    private selectList: Phaser.GameObjects.Text[] = [];
    private nowSelectNo: number = 0;

    private columnWindow: MessageWindow;
    private allow: SelectAllow;

    private soundScene: Sound;

    constructor(battleScene: BattleScene, getCanNotRunawayFlg: boolean) {
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

            obj.on('pointerover', () => {
                this.allow.updatePosition(obj);
                this.nowSelectNo = index;
            }, this);

            obj.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                pointer.reset();//入力状態をリセット、リセットしないと押下中に連続で処理される
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
        } else if (index === 1) {//作戦
            console.log('作戦')
        } else if (index === 2) {//設定
            console.log('設定')
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
    }
    move() {
        this.lightDown();
        this.disableInteractive();
    }
    hide() {
        this.setVisible(false);
    }

    //オーバーライドする？
    private updateSelectNo() {

        const minNo = 0;
        const maxNo = this.selectList.length;
        let selectText = null;
        const cursor: Phaser.Types.Input.Keyboard.CursorKeys = (this.scene as BattleScene).getCursorsKeys();

        //キー押下でリストの選択番号を更新する
        if (cursor.down.isDown) {
            //更新後の選択番号がリスト番号の最大値を超える場合
            if (this.nowSelectNo + 1 >= maxNo) { return; }
            cursor.down.isDown = false;
            this.nowSelectNo++;
            selectText = this.selectList[this.nowSelectNo];
            this.allow.updatePosition(selectText);

        } else if (cursor.up.isDown) {
            //更新後の選択番号がリスト番号の最小値を超える場合
            if (this.nowSelectNo - 1 < minNo) { return; }
            cursor.up.isDown = false;
            this.nowSelectNo--;
            selectText = this.selectList[this.nowSelectNo];
            this.allow.updatePosition(selectText);
        }
    }

    //テキストクリック可
    enableSelect() {
        this.allow.lightUp();
        this.lightUp();
        this.selectList.forEach((obj) => {
            obj.setInteractive({ useHandCursor: true });//テキストをクリック可能にする
        });
    }

    //テキストクリック不可
    disableSelect() {
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
