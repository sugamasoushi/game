import { BattleScene } from "../../lib/types";
import { MessageObject } from "../../util/MessageObject";
import { MessageWindow } from "../../util/MessageWindow";
import { SelectAllow } from "../../util/SelectAllow";
import { SearchSkill } from "../../Data/SearchSkill";
import { SkillDetail } from "../../lib/types";

export class SpecialSkillSelectWindow extends Phaser.GameObjects.Container {
    private nowSelectCharacter: Phaser.GameObjects.Sprite;

    private windowMarginX = 200;
    private windowWidth = Number(this.scene.game.config.width) - this.windowMarginX * 2;
    private windowHeight = 200;

    private selectList: Phaser.GameObjects.Text[] = [];
    private nowSelectNo = 0;
    private maxColumns = 2;

    private messageWindow: MessageWindow;
    private allow: SelectAllow;
    private backButton: Phaser.GameObjects.Text;
    private backButtonWindow: MessageWindow;

    private characterIcon: Phaser.GameObjects.Image;

    constructor(battleScene: BattleScene) {
        super(battleScene);
        this.scene.add.existing(this);
        this.addToUpdateList();
        this.name = SpecialSkillSelectWindow.name;
    }

    init() {
        this.x = 0;
        this.y = 0;
        this.name = SpecialSkillSelectWindow.name;

        this.createWindow();
    }

    preUpdate() {
        this.updateSelectNo();
    }

    //パーティキャラクター共通とし、スキルリストのみ書き換えでキャラクターごとに対応する
    private createWindow() {
        const rectR = 32;

        //ウィンドウ作成
        this.messageWindow = new MessageWindow(this.scene);
        this.messageWindow.init();
        // createMessageWindow内で(rectR, rectR)の位置に描画されるため、-rectRして位置を合わせる
        this.messageWindow.createMessageWindow(-rectR, -rectR, this.windowWidth, this.windowHeight, rectR, undefined);

        // 左右の余白を等しく設定
        this.messageWindow.x = this.windowMarginX;
        this.messageWindow.y = Number(this.scene.game.config.height) - this.windowHeight - 40;
        this.messageWindow.setDepth(Number(this.scene.game.config.height));

        //戻るボタン
        this.backButtonCreate(this.messageWindow.x + this.windowWidth, this.messageWindow.y);

        //カーソル作成、初期位置設定
        this.allow = new SelectAllow(this.scene);
        this.allow.init(0, 0);
        this.allow.createAllow();
        if (this.selectList.length > 0) {
            this.allow.updatePosition(this.selectList[this.nowSelectNo]);
        }
        this.allow.setDepth(Number(this.scene.game.config.height) + 1);

        //クリック可能に設定
        this.enableSelect();

        this.messageWindow.setVisible(false);
        this.allow.setVisible(false);
        this.backButton.setVisible(false);
        this.backButtonWindow.setVisible(false);
    }

    private createSkillList() {
        const textX = this.windowMarginX + 60;
        const textY = Number(this.scene.game.config.height) - this.windowHeight + 20;

        const playerData = this.nowSelectCharacter.data.list;
        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.scene);
        const { lineSpaceValue, fontSize } = messageObjectInstance.getTextInfomation();

        const specialSkills = playerData.special || [];
        for (const [i, skillId] of specialSkills.entries()) {

            //検索
            const skilldata = this.scene.cache.json.get('skilldata');
            const searchSkill = new SearchSkill(skilldata);
            const skillDetail: SkillDetail = searchSkill.getSkillData('special', skillId)!;

            const textObj = messageObjectInstance.createTextObject(this.scene, 0, 0, skillDetail.name);
            textObj.name = skillDetail.name;

            // 2列表示の座標計算
            const col = i % this.maxColumns;
            const row = Math.floor(i / this.maxColumns);
            const columnWidth = 150; // 列の幅

            textObj.x = textX + (col * columnWidth);
            textObj.y = textY + (row * (textObj.height + lineSpaceValue));
            textObj.setDepth(Number(this.scene.game.config.height) + 1);

            textObj.on('pointerover', () => {
                this.allow.updatePosition(textObj);
                this.nowSelectNo = i;
            }, this);

            textObj.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                pointer.reset();

                this.nowSelectCharacter.setData('SkillType', 'special');
                this.nowSelectCharacter.setData('UseSkill', skillDetail);

                this.selectExec(skillDetail.type);

                this.scene.input.setDefaultCursor('default');
            }, this);

            this.selectList.push(textObj);
        }
    }

    private backButtonCreate(x: number, y: number) {

        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.scene);
        messageObjectInstance.getTextInfomation();

        this.backButton = messageObjectInstance.createTextObject(this.scene, x, y + 16, "✖");
        this.backButton.setDepth(Number(this.scene.game.config.height) + 1);

        //ウィンドウ作成
        this.backButtonWindow = new MessageWindow(this.scene);
        this.backButtonWindow.init();
        // createMessageWindow内で(rectR, rectR)の位置に描画されるため、-rectRして位置を合わせる
        this.backButtonWindow.createOneColumnOneWindow(this.backButton, 16);

        // 左右の余白を等しく設定
        this.backButtonWindow.x = x;
        this.backButtonWindow.y = y + 16;
        this.backButtonWindow.setDepth(Number(this.scene.game.config.height));

        this.backButton.setDepth(this.backButtonWindow.depth + 1);
        this.backButton.setInteractive({ useHandCursor: true });
        this.backButton.on('pointerdown', () => {
            this.emit('Select_back_Submit');

            //スキルリストのみ削除
            for (const list of this.selectList) {
                list.destroy();
            }
            this.selectList = [];

            this.nowSelectNo = 0;
        }, this);
    }

    //選択実行
    private selectExec(skillType: string) {

        switch (skillType) {
            case 'guard':
                this.emit('No_Attack_Select_Submit', skillType);
                break;
            default:
                this.emit('Attack_Select_Submit', skillType);
                break;
        }
    }

    //選択中のアイコンを設定
    public setNowCharacterIcon(characterIcon: Phaser.GameObjects.Image) {
        this.characterIcon = characterIcon;
    }

    show(data: Phaser.GameObjects.Sprite) {
        this.nowSelectCharacter = data;

        //キャラクター固有のリストの為、show()で作成
        this.createSkillList();

        this.messageWindow.setVisible(true);
        this.allow.setVisible(true);
        this.backButton.setVisible(true);
        this.backButtonWindow.setVisible(true);

        this.enableSelect();
    }

    hide() {
        this.messageWindow.setVisible(false);
        this.allow.setVisible(false);
        this.backButton.setVisible(false);
        this.backButtonWindow.setVisible(false);

        //スキルリストのみ削除
        for (const list of this.selectList) {
            list.destroy();
        }
        this.selectList = [];
    }

    move() {
        this.disableSelect();
    }

    private updateSelectNo() {
        const maxNo = this.selectList.length;
        if (maxNo === 0) return;

        const cursor: Phaser.Types.Input.Keyboard.CursorKeys = (this.scene as BattleScene).getCursorsKeys();

        let newSelectNo = this.nowSelectNo;

        if (cursor.down.isDown) {
            cursor.down.isDown = false;
            newSelectNo += this.maxColumns;
        } else if (cursor.up.isDown) {
            cursor.up.isDown = false;
            newSelectNo -= this.maxColumns;
        } else if (cursor.right.isDown) {
            cursor.right.isDown = false;
            newSelectNo += 1;
        } else if (cursor.left.isDown) {
            cursor.left.isDown = false;
            newSelectNo -= 1;
        }

        // 範囲内に収める
        if (newSelectNo < 0) newSelectNo = 0;
        if (newSelectNo >= maxNo) newSelectNo = maxNo - 1;

        if (newSelectNo !== this.nowSelectNo) {
            this.nowSelectNo = newSelectNo;
            this.allow.updatePosition(this.selectList[this.nowSelectNo]);
        }
    }

    //テキストクリック可
    enableSelect() {
        //this.allow.lightUp();
        this.lightUp();
        this.setVisible(true);
        this.selectList.forEach((obj) => {
            obj.setInteractive({ useHandCursor: true });
        });
        this.backButton.setInteractive({ useHandCursor: true });
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

    lightUp() {
        this.selectList.forEach(list => {
            list.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
        });
        //this.columnWindow.setLineLightUp();
    }

    lightDown() {
        this.selectList.forEach(list => {
            list.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        });
        //this.columnWindow.setLineLightDown();
    }
}
