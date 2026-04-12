import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";
import { MenuTab } from "../../lib/types";
import { SelectAllow } from "../../util/SelectAllow";
import { SearchSkill } from "../../Data/SearchSkill";

export class CharStatusWindow extends Phaser.GameObjects.Container {

    private menuModel: MenuModel;
    private charContainers: Phaser.GameObjects.Container[] = [];
    private currentIndex: number = 0;
    private isSrolling: boolean = false;
    private mainWindowDepth: number = 500;
    private contentHeight: number = 0;
    private upArrow!: SelectAllow;
    private downArrow!: SelectAllow;

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        super(scene);
        this.menuModel = menuModel;
        this.scene.add.existing(this);
    }

    public create(mainColumn: MainColumnWindow): void {
        this.x = mainColumn.containtsX + mainColumn.scrollValue * MenuTab.Status;
        this.y = mainColumn.containtsY;
        this.contentHeight = mainColumn.mainWindow.height - 80 - 16;

        const partyList = this.menuModel.getPlayerPartyList();
        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        for (let i = 0; i < partyList.length; i++) {
            const charContainer = this.scene.add.container(0, i * this.contentHeight);
            this.createCharacterContent(charContainer, partyList[i], messageObject);
            this.add(charContainer);
            this.charContainers.push(charContainer);
        }

        const centerX = mainColumn.scrollValue / 2;
        this.upArrow = new SelectAllow(this.scene);
        this.upArrow.init(centerX, 0, 'up');
        this.upArrow.createAllow();
        this.upArrow.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(-20, -20, 40, 40),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });
        this.upArrow.on('pointerdown', () => this.scroll('up'));
        this.add(this.upArrow);

        this.downArrow = new SelectAllow(this.scene);
        this.downArrow.init(centerX, this.contentHeight - 30, 'down');
        this.downArrow.createAllow();
        this.downArrow.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(-20, -20, 40, 40),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });
        this.downArrow.on('pointerdown', () => this.scroll('down'));
        this.add(this.downArrow);

        this.setMask(mainColumn.cropRectMask.createGeometryMask());
        this.setDepth(this.mainWindowDepth + 50);

        this.bringToTop(this.upArrow);
        this.bringToTop(this.downArrow);
    }

    private createCharacterContent(container: Phaser.GameObjects.Container, sprite: Phaser.GameObjects.Sprite, messageObject: MessageObject): void {
        const portraitKey = this.getPortraitKey(sprite.name);

        const charImage = this.scene.add.image(0, 0, portraitKey).setOrigin(0, 0).setScale(0.5);
        container.add(charImage);

        // setCrop を使って表示範囲（340 x contentHeight）を切り抜く
        // スケール(0.5)を考慮して、テクスチャ座標でのピクセル数を指定
        const cropWidth = 340 / charImage.scaleX;
        const cropHeight = this.contentHeight / charImage.scaleY;
        charImage.setCrop(0, 0, cropWidth, cropHeight);

        const playerData = sprite.data.list;
        const statsX = 350;
        const statsY = 20;

        const labels = ['Lv', 'HP', 'MP', '攻撃力', '防御力', '運'];
        const values = [
            String(playerData.Lv),
            playerData.HP + ' / ' + playerData.MaxHP,
            playerData.MP + ' / ' + playerData.MaxMP,
            '10', '5', '0'
        ];

        const labelObj = messageObject.createTextObject(this.scene, statsX, statsY, labels, this.menuModel.fontSize);
        const valueObj = messageObject.createTextObject(this.scene, statsX + 100, statsY, values, this.menuModel.fontSize);
        container.add([labelObj, valueObj]);

        const skillX = 650;
        const searchSkill = new SearchSkill(this.scene.cache.json);

        container.add(messageObject.createTextObject(this.scene, skillX, statsY, ['【 特技 】'], this.menuModel.fontSize));
        const specialSkills = (playerData.special as string[]) || [];
        for (let i = 0; i < specialSkills.length; i++) {
            const skillData = searchSkill.getSkillData('special', specialSkills[i]);
            container.add(messageObject.createTextObject(this.scene, skillX + 20, statsY + 40 + i * 35, [skillData?.name || '---'], this.menuModel.fontSize));
        }

        const magicY = statsY + 230;
        container.add(messageObject.createTextObject(this.scene, skillX, magicY, ['【 魔法 】'], this.menuModel.fontSize));
        const magicSkills = (playerData.magic as string[]) || [];
        for (let i = 0; i < magicSkills.length; i++) {
            const skillData = searchSkill.getSkillData('magic', magicSkills[i]);
            container.add(messageObject.createTextObject(this.scene, skillX + 20, magicY + 40 + i * 35, [skillData?.name || '---'], this.menuModel.fontSize));
        }
    }

    private scroll(direction: 'up' | 'down'): void {
        if (this.isSrolling || this.charContainers.length <= 1) return;
        this.isSrolling = true;

        const prevIndex = this.currentIndex;
        if (direction === 'up') {
            this.currentIndex = (this.currentIndex - 1 + this.charContainers.length) % this.charContainers.length;
        } else {
            this.currentIndex = (this.currentIndex + 1) % this.charContainers.length;
        }

        const nextContainer = this.charContainers[this.currentIndex];
        const currentContainer = this.charContainers[prevIndex];

        const initialYOffset = (direction === 'up' ? -this.contentHeight : this.contentHeight);
        nextContainer.y = initialYOffset;

        const duration = 300;
        const distance = (direction === 'up' ? this.contentHeight : -this.contentHeight);

        this.scene.tweens.add({
            targets: currentContainer,
            y: currentContainer.y + distance,
            duration: duration,
            ease: 'Quad.out'
        });

        this.scene.tweens.add({
            targets: nextContainer,
            y: nextContainer.y + distance,
            duration: duration,
            ease: 'Quad.out',
            onComplete: () => {
                this.isSrolling = false;
            }
        });
    }

    private getPortraitKey(name: string): string {
        const mapping: { [key: string]: string } = {
            'meina': '20250609',
            'grandpa': '20240622_鶏',
            'lamy': '20240908',
            'player2': '20240908'
        };
        return mapping[name] || '20250609';
    }
}
