import { BattleScene } from "../../lib/types";
import { MessageObject } from "../../util/MessageObject";
import { MessageWindow } from "../../util/MessageWindow";
import { SelectAllow } from "../../util/SelectAllow";
import { InputManager } from "../../core/input/InputManager";
import { Subscription } from "rxjs";

export class AttackSelectWindow extends Phaser.GameObjects.Container {
    private nowSelectCharacter: Phaser.GameObjects.Sprite;

    private column: string[] = ['攻撃', '特技', '魔法'];
    private selectList: Phaser.GameObjects.Text[] = [];

    private nowSelectNo = 0;

    private columnWindow: MessageWindow;
    private allow: SelectAllow;
    private backButton: Phaser.GameObjects.Text;
    private backButtonWindow: MessageWindow;

    private characterIcon: Phaser.GameObjects.Image;
    private canDecide: boolean = false;
    private subs = new Subscription();

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
        this.setVisible(false);
        this.setActive(false);
        this.createWindow(this.column);
        this.setupInput();
    }

    private createWindow(column: string[]) {

        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.scene);
        messageObjectInstance.getTextInfomation();

        this.backButton = messageObjectInstance.createTextObject(this.scene, 80, -48, "✖");
        this.backButton.setDepth(Number(this.scene.game.config.height) + 1);
        this.backButton.setInteractive({ useHandCursor: true });
        this.backButton.on('pointerdown', () => {
            this.backSubmit();
        }, this);

        this.backButtonWindow = new MessageWindow(this.scene);
        this.backButtonWindow.init();
        this.backButtonWindow.createOneColumnOneWindow(this.backButton, 16);


        //項目テキスト作成
        column.forEach(str => {
            const messagaObject = messageObjectInstance.createTextObject(this.scene, 0, 0, str)
            messagaObject.name = str;
            this.selectList.push(messagaObject);
        });

        //テキスト配置及びクリック時の動作を設定
        this.selectList.forEach((obj, index) => {
            obj.y = index * (obj.height + messageObjectInstance.getTextInfomation().lineSpaceValue);

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
        this.allow.createAllow();
        this.allow.updatePosition(this.selectList[this.nowSelectNo]);

        //コンテナ作成
        this.add(this.columnWindow);
        this.add(this.selectList);
        this.add(this.allow);
        this.add(this.backButtonWindow);
        this.add(this.backButton);

        //クリック可能に設定
        this.enableSelect();

        this.setVisible(false);
    }

    //選択実行
    private selectExec(index: number) {

        switch (index) {
            case 0: //攻撃、敵キャラを選択
                this.emit('Attack_Select_Submit', this.nowSelectCharacter);
                break;
            case 1: //特技、次ウィンドウを開く
                this.emit('SpecialSkill_Select_Submit', this.nowSelectCharacter);
                break;
            case 2: //魔法、次ウィンドウを開く
                this.emit('MagicSkill_Select_Submit', this.nowSelectCharacter);
                break;
        }
    }

    //選択中のアイコンを設定
    public setNowCharacterIcon(characterIcon: Phaser.GameObjects.Image) {
        this.characterIcon = characterIcon;
    }

    show(data: Phaser.GameObjects.Sprite) {

        this.nowSelectCharacter = data;
        this.nowSelectNo = 0;
        this.allow.updatePosition(this.selectList[this.nowSelectNo]);

        this.setVisible(true);
        this.enableSelect();

        this.canDecide = false;
        this.scene.time.delayedCall(10, () => {
            this.canDecide = true;
        });

        //コンテナ配置（キャラクターアイコンの近くに配置）
        this.x = this.characterIcon.parentContainer.x + 200;
        this.y = this.characterIcon.parentContainer.y - 75;
    }

    move() {
        this.disableSelect();
    }

    hide() {
        this.setVisible(false);
        this.setActive(false);
    }

    private setupInput() {
        const inputManager = InputManager.getInstance(this.scene);

        this.subs.add(inputManager.downButton$.subscribe(() => {
            if (!this.visible || !this.active) return;
            if (this.nowSelectNo + 1 < this.selectList.length) {
                this.nowSelectNo++;
                this.allow.updatePosition(this.selectList[this.nowSelectNo]);
            }
        }));

        this.subs.add(inputManager.upButton$.subscribe(() => {
            if (!this.visible || !this.active) return;
            if (this.nowSelectNo - 1 >= 0) {
                this.nowSelectNo--;
                this.allow.updatePosition(this.selectList[this.nowSelectNo]);
            }
        }));

        this.subs.add(inputManager.decideButton$.subscribe(() => {
            if (!this.visible || !this.active || !this.canDecide) return;
            this.selectExec(this.nowSelectNo);
        }));

        this.subs.add(inputManager.cancelButton$.subscribe(() => {
            if (!this.visible || !this.active) return;
            this.backSubmit();
        }));
    }

    private backSubmit() {
        this.emit('Select_back_Submit', 0);
        this.nowSelectNo = 0;
        this.allow.updatePosition(this.selectList[this.nowSelectNo]);
    }

    public destroy(fromScene?: boolean) {
        this.subs.unsubscribe();
        super.destroy(fromScene);
    }


    //テキストクリック可
    enableSelect() {
        this.setActive(true);
        this.allow.lightUp();
        this.lightUp();
        this.setVisible(true);
        this.selectList.forEach((obj) => {
            obj.setInteractive({ useHandCursor: true });//テキストをクリック可能にする
        });
    }

    //テキストクリック不可
    disableSelect() {
        this.setActive(false);
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
