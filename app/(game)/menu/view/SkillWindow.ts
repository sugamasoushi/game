import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";
import { MenuTab } from "../../lib/types";
import { SelectAllow } from "../../util/SelectAllow";
import DebugMessage from '../../util/DebugMessage';
import { SearchSkill } from "../../Data/SearchSkill";
import { InputManager } from "../../core/input/InputManager";
import { Subscription, throttleTime } from "rxjs";
import { GameSettingData } from "../../Data/GameSettingData";

export class SkillWindow extends Phaser.GameObjects.Container {
    private mainWindowDepth: number = 500;
    public selectAllow: SelectAllow;
    private skillLabels: Phaser.GameObjects.Text[] = [];
    private isSkillSelectMode: boolean = false;
    private canDecide: boolean = false;
    private selectedIndex: number = 0;
    private subs = new Subscription();

    constructor(scene: Phaser.Scene, private menuModel: MenuModel) {
        super(scene);
        this.scene.add.existing(this);
    }

    public create(mainColumn: MainColumnWindow) {
        this.x = mainColumn.containtsX + mainColumn.scrollValue * MenuTab.Skill;
        this.y = mainColumn.containtsY;

        const skillX = 430;
        const skillY = 0;
        const rightValue = 200;

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        const playerData = this.menuModel.getPlayerDataList();

        // --- 特技セクション ---
        const specialLabelY = skillY;
        const specialSkillsY = specialLabelY + 40;
        const specialLabel = messageObject.createTextObject(
            this.scene,
            skillX,
            specialLabelY,
            ['【 特技 】'],
            this.menuModel.fontSize
        ).setDepth(this.mainWindowDepth + 50);
        this.add(specialLabel);

        const specialSkills = playerData.special || [];
        for (const [i, skillId] of specialSkills.entries()) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const xOffset = col * rightValue;
            const yOffset = row * (this.menuModel.lineSpaceValue + this.menuModel.fontSize);

            this.createSkillElement(messageObject, skillX + xOffset, specialSkillsY + yOffset, 'special', skillId);
        }

        // --- 魔法セクション ---
        const magicLabelY = 250; // 下半分
        const magicSkillsY = magicLabelY + 40;
        const magicLabel = messageObject.createTextObject(
            this.scene,
            skillX,
            magicLabelY,
            ['【 魔法 】'],
            this.menuModel.fontSize
        ).setDepth(this.mainWindowDepth + 50);
        this.add(magicLabel);

        const magicSkills = playerData.magic || [];
        for (const [i, skillId] of magicSkills.entries()) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const xOffset = col * rightValue;
            const yOffset = row * (this.menuModel.lineSpaceValue + this.menuModel.fontSize);

            this.createSkillElement(messageObject, skillX + xOffset, magicSkillsY + yOffset, 'magic', skillId);
        }

        this.selectAllow = new SelectAllow(this.scene);
        this.selectAllow.init(0, 0);
        this.selectAllow.createAllow();
        this.selectAllow.setVisible(false);
        this.add(this.selectAllow);

        this.setDepth(this.mainWindowDepth + 50);
        this.setMask(mainColumn.cropRectMask.createGeometryMask());

        this.setupPadKeyboardInput();
    }

    private setupPadKeyboardInput() {
        const duration = GameSettingData.getInputSettings(this.scene).duration;
        const inputManager = InputManager.getInstance(this.scene);

        const onSelectStart = () => {
            if (this.skillLabels.length > 0) {
                this.isSkillSelectMode = true;
                this.canDecide = false;
                // 1フレーム待ってから決定可能にする
                this.scene.time.delayedCall(10, () => {
                    this.canDecide = true;
                });
                this.selectedIndex = 0;
                this.selectAllow.setVisible(true);
                this.selectAllow.updatePosition(this.skillLabels[0]);
            }
        };

        const onSelectEnd = () => {
            this.isSkillSelectMode = false;
            this.selectAllow.setVisible(false);
        };

        this.scene.events.on('SkillSelectModeStart', onSelectStart);
        this.scene.events.on('SkillSelectModeEnd', onSelectEnd);

        this.subs.add(inputManager.downButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isSkillSelectMode) return;
            if (this.selectedIndex + 2 < this.skillLabels.length) {
                this.selectedIndex += 2;
                this.selectAllow.updatePosition(this.skillLabels[this.selectedIndex]);
            }
        }));

        this.subs.add(inputManager.upButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isSkillSelectMode) return;
            if (this.selectedIndex - 2 >= 0) {
                this.selectedIndex -= 2;
                this.selectAllow.updatePosition(this.skillLabels[this.selectedIndex]);
            }
        }));

        this.subs.add(inputManager.rightButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isSkillSelectMode) return;
            if (this.selectedIndex + 1 < this.skillLabels.length && this.selectedIndex % 2 === 0) {
                this.selectedIndex += 1;
                this.selectAllow.updatePosition(this.skillLabels[this.selectedIndex]);
            }
        }));

        this.subs.add(inputManager.leftButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isSkillSelectMode) return;
            if (this.selectedIndex - 1 >= 0 && this.selectedIndex % 2 === 1) {
                this.selectedIndex -= 1;
                this.selectAllow.updatePosition(this.skillLabels[this.selectedIndex]);
            }
        }));

        this.subs.add(inputManager.decideButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isSkillSelectMode || !this.canDecide) return;
            this.execSkillUse(this.selectedIndex);
        }));
    }

    private execSkillUse(index: number) {
        if (index < 0 || index >= this.skillLabels.length) return;
        const skill = this.skillLabels[index];
        const listeners = skill.listeners('pointerdown');
        if (listeners.length > 0) {
            const listener = listeners[0] as (pointer: Phaser.Input.Pointer) => void;
            listener({ leftButtonDown: () => true, reset: () => { } } as Phaser.Input.Pointer);
        }
    }

    public destroy(fromScene?: boolean) {
        this.subs.unsubscribe();
        this.scene.events.off('SkillSelectModeStart');
        this.scene.events.off('SkillSelectModeEnd');
        super.destroy(fromScene);
    }

    /**
     * スキル要素（ラベルとスキル名）を作成して追加する
     */
    private createSkillElement(messageObject: MessageObject, x: number, y: number, skillType: string, skillId: string) {
        // console.log(skillId);
        const searchSkill = new SearchSkill(this.scene.cache.json);
        const skillData = searchSkill.getSkillData(skillType, skillId);

        const label = messageObject.createTextObject(
            this.scene,
            x,
            y,
            ['E'],
            this.menuModel.fontSize
        ).setDepth(this.mainWindowDepth + 50);

        const skill = messageObject.createTextObject(
            this.scene,
            x + 50,
            y,
            [skillData!.name],
            this.menuModel.fontSize
        ).setDepth(this.mainWindowDepth + 50);

        this.add([label, skill]);

        // マウスオーバーで選択位置を更新
        skill.setInteractive({ useHandCursor: true });
        skill.on('pointerover', () => {
            if (this.isSkillSelectMode) {
                this.selectedIndex = this.skillLabels.indexOf(skill);
                this.selectAllow.updatePosition(skill);
            }
        });

        this.skillLabels.push(skill);

        // クリックでスキルを使用
        skill.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                pointer.reset();

                const debugMessage = new DebugMessage(this.scene);
                debugMessage.NotImplemented(skillData!.description, 2000);
            }
        });
    }
}
