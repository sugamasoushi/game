import { BattleScene } from "../../lib/types";
import { MessageObject } from "../../util/MessageObject";
import { MessageWindow } from "../../util/MessageWindow";
import { SelectAllow } from "../../util/SelectAllow";
import DebugMessage from "../../util/DebugMessage";

export class AttackSelectWindow extends Phaser.GameObjects.Container {
    private nowSelectCharacter: Phaser.GameObjects.Sprite;

    private column: string[] = ['攻撃', '特技', '魔法'];
    private selectList: Phaser.GameObjects.Text[] = [];

    private nowSelectNo = 0;

    private columnWindow: MessageWindow;
    private allow: SelectAllow;
    private backButton: Phaser.GameObjects.Text;

    private characterIcon: Phaser.GameObjects.Image;

    constructor(battleScene: BattleScene) {
        super(battleScene);
        this.scene.add.existing(this);
        this.addToUpdateList();
        this.name = AttackSelectWindow.name;
    }

    init() {
        this.x = 0;
        this.y = 0;
        this.name = AttackSelectWindow.name;
        this.createWindow(this.column);
    }

    preUpdate() {
        this.updateSelectNo();
    }

    private createWindow(column: string[]) {
        //戻るボタン
        this.backButton = this.scene.add.text(
            20, -40,
            "✖", { fontFamily: "Arial Black", fontSize: 16, color: "#00a6ed" });
        this.backButton.setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        this.backButton.setInteractive({ useHandCursor: true });
        this.backButton.on('pointerdown', () => {
            this.emit('Select_back_Submit', 0);
            this.nowSelectNo = 0;
        }, this);

        const messageOBjectInstance = new MessageObject();
        messageOBjectInstance.init(this.scene);

        //項目テキスト作成
        column.forEach(str => {
            const messagaObject = messageOBjectInstance.createTextObject(this.scene, 0, 0, str)
            messagaObject.name = str;
            this.selectList.push(messagaObject);
        });

        //テキスト配置及びクリック時の動作を設定
        this.selectList.forEach((obj, index) => {
            obj.y = index * (obj.height + messageOBjectInstance.getTextInfomation().lineSpaceValue);

            obj.on('pointerover', () => {
                this.allow.updatePosition(obj);
                this.nowSelectNo = index;
            }, this);

            obj.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                pointer.reset();//入力状態をリセット、リセットしないと押下中に連続で処理される
                this.selectExec(index);
                this.scene.input.setDefaultCursor('default');//ポインターをデフォルトに設定
            }, this);
        });

        //ウィンドウ作成
        this.columnWindow = new MessageWindow(this.scene);
        this.columnWindow.init();
        this.columnWindow.createVerticalColumnWindow(this.selectList, 16);

        //カーソル作成配置
        this.allow = new SelectAllow(this.scene);
        this.allow.init(0, 0)
        this.allow.updatePosition(this.selectList[this.nowSelectNo]);

        //コンテナ作成
        this.add(this.columnWindow);
        this.add(this.selectList);
        this.add(this.allow);
        this.add(this.backButton);

        //クリック可能に設定
        this.enableSelect();

        this.setVisible(false);
    }

    //選択実行
    private selectExec(index: number) {
        if (index === 0) {//攻撃、敵キャラを選択
            this.emit('Attack_Select_Submit', this.nowSelectCharacter);

        } else if (index === 1) {//特技、次ウィンドウを開く
            const debugMessage = new DebugMessage(this.scene);
            debugMessage.NotImplemented(undefined);

        } else if (index === 2) {//魔法、次ウィンドウを開く
            const debugMessage = new DebugMessage(this.scene);
            debugMessage.NotImplemented(undefined);
        }
    }

    //選択中のアイコンを設定
    public setNowCharacterIcon(characterIcon: Phaser.GameObjects.Image) {
        this.characterIcon = characterIcon;
    }

    show(data: Phaser.GameObjects.Sprite) {

        this.nowSelectCharacter = data;

        this.setVisible(true);
        this.enableSelect();

        console.log(this)

        //コンテナ配置（キャラクターアイコンの近くに配置）
        this.x = this.characterIcon.parentContainer.x + 200;
        this.y = this.characterIcon.parentContainer.y - 75;
    }

    move() {
        this.disableSelect();
    }

    hide() {
        this.setVisible(false);
    }

    //オーバーライドする？
    //このメソッドはウィンドウによるため各自実装する事
    private updateSelectNo() {
        // if (this.battlePresenter.getSelectContainerNo() !== BattleViewNo.BattleSelectWindow) return;//更新しない方法を実装する事

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
        this.setVisible(true);
        this.selectList.forEach((obj) => {
            obj.setInteractive({ useHandCursor: true });//テキストをクリック可能にする
        });
    }

    //テキストクリック不可
    disableSelect() {
        this.allow.lightDown();
        this.lightDown();
        this.selectList.forEach(obj => {
            obj.disableInteractive();
        });
        this.backButton.disableInteractive();
    }

    //テキストクリック不可、ウィンドウ非表示
    deleteSelect() {
        this.setVisible(false);
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
