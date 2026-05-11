import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";
import { MenuTab } from "../../lib/types";
import { SelectAllow } from "../../util/SelectAllow";
import DebugMessage from '../../util/DebugMessage';
import { InputManager } from "../../core/input/InputManager";
import { Subscription, throttleTime } from "rxjs";
import { DataDefinition } from "../../Data/DataDefinition";

export class EquipWindow extends Phaser.GameObjects.Container {
    private mainWindowDepth: number = 500;
    public selectAllow: SelectAllow;
    private equipLabels: Phaser.GameObjects.Text[] = [];
    private isEquipSelectMode: boolean = false;
    private canDecide: boolean = false;
    private selectedIndex: number = 0;
    private subs = new Subscription();

    constructor(scene: Phaser.Scene, private menuModel: MenuModel) {
        super(scene);
        this.scene.add.existing(this);
    }

    public create(mainColumn: MainColumnWindow) {
        const equipX = 430;
        const equipY = 0;
        const rightValue = 200;

        this.x = mainColumn.containtsX + mainColumn.scrollValue * MenuTab.Equip;
        this.y = mainColumn.containtsY;

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        const playerData = this.menuModel.getPlayerDataList();
        const array = [playerData.Weapon, playerData.Armor];

        // 装備リストは2列で表示する
        for (let i = 0; i < array.length; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const xOffset = col * rightValue;
            const yOffset = row * (this.menuModel.lineSpaceValue + this.menuModel.fontSize);

            //左　項目
            const Label = messageObject.createTextObject(
                this.scene,
                equipX + xOffset,
                equipY + yOffset,
                ['E'],
                this.menuModel.fontSize
            ).setDepth(this.mainWindowDepth + 50);

            const charEquip = messageObject.createTextObject(
                this.scene,
                equipX + xOffset + 50,
                equipY + yOffset,
                [array[i]],
                this.menuModel.fontSize
            ).setDepth(this.mainWindowDepth + 50);

            this.add([Label, charEquip]);

            // マウスオーバーで選択位置を更新
            charEquip.setInteractive({ useHandCursor: true });
            charEquip.on('pointerover', () => {
                if (this.isEquipSelectMode) {
                    this.selectedIndex = i;
                    this.selectAllow.updatePosition(charEquip);
                }
            });

            this.equipLabels.push(charEquip);

            // クリックで装備を変更
            charEquip.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.leftButtonDown()) {
                    pointer.reset();

                    let text = '';
                    if (array[i] === '短剣') {
                        text = 'オンボロの短剣らしいよ';
                    } else if (array[i] === 'マント') {
                        text = 'ぷぷ～、ダサいマント笑';
                    }
                    const debugMessage = new DebugMessage(this.scene);
                    debugMessage.NotImplemented(text, 2000);
                }
            });
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
        const duration = new DataDefinition().getInputInfomation(this.scene).duration;
        const inputManager = InputManager.getInstance(this.scene);

        const onSelectStart = () => {
            if (this.equipLabels.length > 0) {
                this.isEquipSelectMode = true;
                this.canDecide = false;
                // 1フレーム待ってから決定可能にする
                this.scene.time.delayedCall(10, () => {
                    this.canDecide = true;
                });
                this.selectedIndex = 0;
                this.selectAllow.setVisible(true);
                this.selectAllow.updatePosition(this.equipLabels[0]);
            }
        };

        const onSelectEnd = () => {
            this.isEquipSelectMode = false;
            this.selectAllow.setVisible(false);
        };

        this.scene.events.on('EquipSelectModeStart', onSelectStart);
        this.scene.events.on('EquipSelectModeEnd', onSelectEnd);

        this.subs.add(inputManager.downButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isEquipSelectMode) return;
            if (this.selectedIndex + 2 < this.equipLabels.length) {
                this.selectedIndex += 2;
                this.selectAllow.updatePosition(this.equipLabels[this.selectedIndex]);
            }
        }));

        this.subs.add(inputManager.upButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isEquipSelectMode) return;
            if (this.selectedIndex - 2 >= 0) {
                this.selectedIndex -= 2;
                this.selectAllow.updatePosition(this.equipLabels[this.selectedIndex]);
            }
        }));

        this.subs.add(inputManager.rightButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isEquipSelectMode) return;
            if (this.selectedIndex + 1 < this.equipLabels.length && this.selectedIndex % 2 === 0) {
                this.selectedIndex += 1;
                this.selectAllow.updatePosition(this.equipLabels[this.selectedIndex]);
            }
        }));

        this.subs.add(inputManager.leftButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isEquipSelectMode) return;
            if (this.selectedIndex - 1 >= 0 && this.selectedIndex % 2 === 1) {
                this.selectedIndex -= 1;
                this.selectAllow.updatePosition(this.equipLabels[this.selectedIndex]);
            }
        }));

        this.subs.add(inputManager.decideButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isEquipSelectMode || !this.canDecide) return;
            this.execEquipAction(this.selectedIndex);
        }));
    }

    private execEquipAction(index: number) {
        if (index < 0 || index >= this.equipLabels.length) return;
        const equipLabel = this.equipLabels[index];
        const listeners = equipLabel.listeners('pointerdown');
        if (listeners.length > 0) {
            const listener = listeners[0] as (pointer: Phaser.Input.Pointer) => void;
            listener({ leftButtonDown: () => true, reset: () => { } } as Phaser.Input.Pointer);
        }
    }

    public destroy(fromScene?: boolean) {
        this.subs.unsubscribe();
        this.scene.events.off('EquipSelectModeStart');
        this.scene.events.off('EquipSelectModeEnd');
        super.destroy(fromScene);
    }
}
