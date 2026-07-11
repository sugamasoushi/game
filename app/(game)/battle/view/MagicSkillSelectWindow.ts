import { BattleScene } from "../../lib/types";
import { MessageObject } from "../../util/MessageObject";
import { MessageWindow } from "../../util/MessageWindow";
import { SelectAllow } from "../../util/SelectAllow";
import { SearchSkill } from "../../Data/SearchSkill";
import { SkillDetail } from "../../lib/types";
import { InputManager } from "../../core/input/InputManager";
import { Subscription, throttleTime } from "rxjs";
import { GameSettingData } from "../../Data/GameSettingData";

export class MagicSkillSelectWindow extends Phaser.GameObjects.Container {
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
    private canDecide: boolean = false;
    private subs = new Subscription();

    constructor(battleScene: BattleScene) {
        super(battleScene);
        this.scene.add.existing(this);
        this.addToUpdateList();
        this.name = MagicSkillSelectWindow.name;
    }

    init() {
        this.x = 0;
        this.y = 0;
        this.name = MagicSkillSelectWindow.name;
        this.setVisible(false);
        this.setActive(false);
        this.setupInput();
    }

    private createSkillList() {
        const textX = this.windowMarginX + 60;
        const textY = Number(this.scene.game.config.height) - this.windowHeight + 20;

        const playerData = this.nowSelectCharacter.data.list;
        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.scene);
        const { lineSpaceValue, fontSize } = messageObjectInstance.getTextInfomation();

        const magicSkills = playerData.magic || [];
        for (const [i, skillId] of magicSkills.entries()) {

            //検索
            const searchSkill = new SearchSkill(this.scene.cache.json);
            const skillDetail: SkillDetail = searchSkill.getSkillData('magic', skillId)!;

            const textObj = messageObjectInstance.createTextObject(this.scene, 0, 0, skillDetail.name);
            textObj.name = skillDetail.name;

            // 2列表示の座標計算
            const col = i % this.maxColumns;
            const row = Math.floor(i / this.maxColumns);
            const columnWidth = 150; // 列の幅

            textObj.x = textX + (col * columnWidth);
            textObj.y = textY + (row * (textObj.height + lineSpaceValue));
            //textObj.setDepth(Number(this.scene.game.config.height) + 1);
            textObj.setDepth(this.depth);

            textObj.on('pointerover', () => {
                this.allow.updatePosition(textObj);
                this.nowSelectNo = i;
            }, this);

            textObj.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                pointer.reset();

                // MPが足りない場合は選択できないようにする
                if (this.nowSelectCharacter.data.values.MP < skillDetail.mpCost) {
                    (this.scene as BattleScene).events.emit('BATTLE_MESSAGE_OUTPUT', 'MPが足りない！', 1200);
                    return;
                }

                this.nowSelectCharacter.setData('SkillType', 'magic');
                this.nowSelectCharacter.setData('UseSkill', skillDetail);

                this.selectExec(skillDetail.type);

                this.scene.input.setDefaultCursor('default');
            }, this);

            this.selectList.push(textObj);
        }
    }

    private createWindow() {

        if (this.messageWindow) {
            this.messageWindow.destroy();
        }

        //ウィンドウ作成
        const messageWindowInstance = new MessageWindow(this.scene);
        messageWindowInstance.init();
        messageWindowInstance.createEventMessageWindow(this.selectList[0]);
        this.messageWindow = messageWindowInstance;

        //戻るボタン
        this.backButtonCreate(this.messageWindow.x + this.windowWidth - 64, this.messageWindow.y + 16);

        //カーソル作成、初期位置設定
        this.allow = new SelectAllow(this.scene);
        this.allow.init(0, 0);
        this.allow.createAllow();
        if (this.selectList.length > 0) {
            this.allow.updatePosition(this.selectList[this.nowSelectNo]);
        }
        //this.allow.setDepth(Number(this.scene.game.config.height) + 1);
        this.allow.setDepth(this.depth);

        //クリック可能に設定
        this.enableSelect();

        this.messageWindow.setVisible(false);
        this.allow.setVisible(false);
        this.backButton.setVisible(false);
        this.backButtonWindow.setVisible(false);
    }

    private backButtonCreate(x: number, y: number) {

        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.scene);
        messageObjectInstance.getTextInfomation();

        this.backButton = messageObjectInstance.createTextObject(this.scene, x, y + 16, "✖");
        //this.backButton.setDepth(Number(this.scene.game.config.height) + 1);
        this.backButton.setDepth(this.depth);

        //ウィンドウ作成
        this.backButtonWindow = new MessageWindow(this.scene);
        this.backButtonWindow.init();
        // createMessageWindow内で(rectR, rectR)の位置に描画されるため、-rectRして位置を合わせる
        this.backButtonWindow.createOneColumnOneWindow(this.backButton, 16);

        // 左右の余白を等しく設定
        this.backButtonWindow.x = x;
        this.backButtonWindow.y = y + 16;
        //this.backButtonWindow.setDepth(Number(this.scene.game.config.height));
        this.backButtonWindow.setDepth(this.depth);

        this.backButton.setDepth(this.backButtonWindow.depth + 1);
        this.backButton.setInteractive({ useHandCursor: true });
        this.backButton.on('pointerdown', () => {
            this.backSubmit();
        }, this);
    }

    private backSubmit() {
        this.emit('Select_back_Submit');

        //スキルリストのみ削除
        for (const list of this.selectList) {
            list.destroy();
        }
        this.selectList = [];

        this.nowSelectNo = 0;
    }

    private setupInput() {
        const duration = GameSettingData.getInputSettings(this.scene).duration;
        const inputManager = InputManager.getInstance(this.scene);

        this.subs.add(inputManager.downButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active) return;
            this.navigate(this.maxColumns);
        }));

        this.subs.add(inputManager.upButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active) return;
            this.navigate(-this.maxColumns);
        }));

        this.subs.add(inputManager.rightButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active) return;
            this.navigate(1);
        }));

        this.subs.add(inputManager.leftButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active) return;
            this.navigate(-1);
        }));

        this.subs.add(inputManager.decideButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active || !this.canDecide) return;
            if (this.selectList.length > 0) {

                const playerData = this.nowSelectCharacter.data.list;
                const magicSkills = playerData.magic || [];
                const skillId = magicSkills[this.nowSelectNo];
                if (skillId) {
                    const searchSkill = new SearchSkill(this.scene.cache.json);
                    const skillDetail: SkillDetail = searchSkill.getSkillData('magic', skillId)!;
                    this.nowSelectCharacter.setData('SkillType', 'magic');
                    this.nowSelectCharacter.setData('UseSkill', skillDetail);

                    // MPが足りない場合は処理しない
                    if (this.nowSelectCharacter.data.values.MP < skillDetail.mpCost) {
                        (this.scene as BattleScene).events.emit('BATTLE_MESSAGE_OUTPUT', 'MPが足りない！', 1200);
                        return;
                    }

                    this.selectExec(skillDetail.type);
                }
            }
        }));

        this.subs.add(inputManager.cancelButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active || !this.canDecide) return;
            this.backSubmit();
        }));
    }

    private navigate(offset: number) {
        const maxNo = this.selectList.length;
        if (maxNo === 0) return;

        let newSelectNo = this.nowSelectNo + offset;
        if (newSelectNo < 0) newSelectNo = 0;
        if (newSelectNo >= maxNo) newSelectNo = maxNo - 1;

        if (newSelectNo !== this.nowSelectNo) {
            this.nowSelectNo = newSelectNo;
            this.allow.updatePosition(this.selectList[this.nowSelectNo]);
        }
    }

    //選択実行
    private selectExec(skillType: string) {
        this.hide();

        switch (skillType) {
            case 'guard':
                this.emit('No_Attack_Select_Submit', skillType);
                break;
            default:
                this.emit('Attack_Select_Submit', skillType);
                break;
        }
    }

    show(playerSprite: Phaser.GameObjects.Sprite, playerCharacterIcon: Phaser.GameObjects.Image) {

        //選択中キャラクターの更新が必要な場合のみ更新（戻るボタンによる遷移の場合は未更新）
        if (playerSprite) {
            this.nowSelectCharacter = playerSprite;
        }
        this.nowSelectNo = 0;

        //キャラクター固有のリストの為、show()で作成
        this.createSkillList();
        this.createWindow();

        this.messageWindow.setVisible(true);
        this.allow.setVisible(true);
        this.backButton.setVisible(true);
        this.backButtonWindow.setVisible(true);

        this.enableSelect();

        this.canDecide = false;
        this.scene.time.delayedCall(10, () => {
            this.canDecide = true;
        });
    }

    hide() {
        this.setVisible(false);
        this.setActive(false);

        if (this.messageWindow) this.messageWindow.setVisible(false);
        if (this.allow) this.allow.setVisible(false);
        if (this.backButton) this.backButton.setVisible(false);
        if (this.backButtonWindow) this.backButtonWindow.setVisible(false);

        //スキルリストのみ削除
        for (const list of this.selectList) {
            if (list) list.destroy();
        }
        this.selectList = [];
    }

    move() {
        this.disableSelect();
    }

    //テキストクリック可
    enableSelect() {
        this.setActive(true);
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
        this.setActive(false);
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

    public destroy(fromScene?: boolean) {
        this.subs.unsubscribe();
        super.destroy(fromScene);
    }
}
