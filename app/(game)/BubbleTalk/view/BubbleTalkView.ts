import { MessageOperation } from "@/app/(game)/util/MessageOperation";
import { MessageObject } from "@/app/(game)/util/MessageObject";
import { MessageWindow } from "@/app/(game)/util/MessageWindow";
import { SearchCharacterData } from "@/app/(game)/Data/SearchCharacterData";
import { CharacterDataDetail } from "@/app/(game)/lib/CharacterDataTypes";

export class BubbleTalkView {
    private messageOperation: MessageOperation;
    private messageObjectInstance: MessageObject;

    private textObject: Phaser.GameObjects.Text;
    private messageWindow: Phaser.GameObjects.Graphics;
    private characterNameText: Phaser.GameObjects.Text;
    private characterLabelWindow: Phaser.GameObjects.Graphics;
    private characterIcon: Phaser.GameObjects.Image;
    private clickZone: Phaser.GameObjects.Zone;
    private cropRectMask: Phaser.GameObjects.Graphics;

    private lineSpaceValue: number;
    private textLine: number;
    private messageWidth: number;

    constructor(private scene: Phaser.Scene) { }

    public init() {
        this.messageObjectInstance = new MessageObject();
        this.messageObjectInstance.init(this.scene, 'BubbleTalk');
        const textLine = this.messageObjectInstance.getTextInfomation().textLine;
        const lineSpaceValue = this.messageObjectInstance.getTextInfomation().lineSpaceValue;

        this.messageOperation = new MessageOperation(this.scene, 'BubbleTalk', textLine, lineSpaceValue);
    }

    public createMessageElements(
        charKey: string,
        talks: string[],
        baseScreenX: number,
        baseScreenY: number,
        bubblePosition: string,
        imageKey?: string
    ) {
        // テキストオブジェクト作成 (ダミー座標で生成し、後で幅を使って調整)
        this.textObject = this.messageObjectInstance.createTextObject(this.scene, 0, 0, talks);
        this.messageWidth = this.textObject.width;
        
        // 削除時のアニメーションターゲットをスクリーン座標に設定
        this.messageOperation.setDeleteTarget(baseScreenX, baseScreenY);

        let textX = baseScreenX;
        if (bubblePosition === 'left') {
            textX = baseScreenX - this.messageWidth;
        }

        // 画面左外にはみ出る場合
        if (textX - 100 < 0) {
            textX = 32 + 100; // 仮
        }
        const textY = baseScreenY - 150;

        this.textObject.setPosition(textX, textY);

        this.lineSpaceValue = this.textObject.lineSpacing;
        this.textLine = this.textObject.getData('textLine');
        this.textObject.setDepth(100);
        this.messageOperation.addMessageObjectList(this.textObject);

        // 吹き出しウィンドウ作成
        const messageWindow = new MessageWindow(this.scene);
        messageWindow.init();
        messageWindow.createBubbleWindow(
            this.textObject,
            baseScreenX,
            baseScreenY,
            bubblePosition,
            undefined
        );
        this.messageWindow = messageWindow;
        this.messageOperation.addMessageObjectList(this.messageWindow);

        // マスク作成
        this.createTextMask();

        // キャラクター名ラベル作成
        this.createCharacterLabel(charKey, textX, textY);

        // キャラクターアイコン設定
        this.setImage(charKey, textX, textY, imageKey);

        // オブジェクトの高さを設定
        this.setTextObjectDepth();

        // クリックゾーンを作成
        this.createClickZone();
    }

    private createTextMask() {
        const whiteColor = Phaser.Display.Color.HexStringToColor('#ffffff').color;
        this.cropRectMask = this.scene.add.graphics();
        this.cropRectMask.x = this.textObject.x;
        this.cropRectMask.y = this.textObject.y - 5;
        this.cropRectMask.fillStyle(whiteColor);
        this.cropRectMask.fillRect(0, 0, this.messageWidth, this.textObject.height * this.textLine + this.lineSpaceValue);
        this.cropRectMask.setVisible(false);
        this.textObject.setMask(this.cropRectMask.createGeometryMask());
        this.messageOperation.addMessageObjectList(this.cropRectMask);
    }

    private createCharacterLabel(charKey: string, textX: number, textY: number) {
        if (!charKey) return;
        const searchCharacterData = new SearchCharacterData(this.scene.cache.json);
        const name = searchCharacterData.getCharacterData(charKey).name;

        if (name !== 'noName') {
            this.characterNameText = this.messageObjectInstance.createTextObject(this.scene, 0, 0, name);
            const labelX = textX;
            const labelY = textY - this.characterNameText.getTextMetrics().fontSize * 2;
            this.characterNameText.setPosition(labelX, labelY);
            this.characterNameText.setDepth(this.textObject.depth + 10);
            this.messageOperation.addMessageObjectList(this.characterNameText);

            const characterLabelWindow = new MessageWindow(this.scene);
            characterLabelWindow.init();
            characterLabelWindow.createOneColumnOneWindow(this.characterNameText, 8);
            this.characterLabelWindow = characterLabelWindow;
            this.messageOperation.addMessageObjectList(this.characterLabelWindow);
        }
    }

    private setImage(charKey: string, textX: number, textY: number, imageKey?: string) {
        const searchCharacterData = new SearchCharacterData(this.scene.cache.json);
        const imageKeyData = searchCharacterData.getImageKeys(charKey) as CharacterDataDetail;

        if (imageKeyData.name !== 'noName') {
            this.characterIcon = this.scene.add.image(textX - 50, textY, 'Icon_' + imageKeyData.normal);
            this.messageOperation.addMessageObjectList(this.characterIcon);
        } else if (imageKey) {
            this.characterIcon = this.scene.add.image(textX - 50, textY, 'Icon_' + imageKey);
            if (this.characterIcon.texture.key === '__MISSING') {
                this.characterIcon.setVisible(false);
            }
            this.messageOperation.addMessageObjectList(this.characterIcon);
        }
    }

    private setTextObjectDepth() {
        const maxDepthValue = 1000;
        this.messageWindow.setDepth(maxDepthValue - 10);
        this.textObject.setDepth(maxDepthValue);
        if (this.characterLabelWindow) this.characterLabelWindow.setDepth(maxDepthValue + 10);
        if (this.characterNameText) this.characterNameText.setDepth(maxDepthValue + 20);
        if (this.characterIcon) this.characterIcon.setDepth(maxDepthValue + 30);
    }

    private createClickZone() {
        const gameWidth = Number(this.scene.game.config.width);
        const gameHeight = Number(this.scene.game.config.height);
        this.clickZone = this.scene.add.zone(
            gameWidth / 2,
            gameHeight / 2,
            gameWidth,
            gameHeight
        );
        this.clickZone.setInteractive({ useHandCursor: true });
        this.messageOperation.addMessageObjectList(this.clickZone);
    }

    public getMessageWidth(): number {
        return this.messageWidth;
    }

    public async animateText(talks: string[]) {
        this.textObject.text = '';
        let lineCount = 0;
        for (const text of talks) {
            lineCount++;
            await this.messageOperation.typeWriter(this.scene, this.textObject, text, this.clickZone);
            await this.messageOperation.textScroll(this.scene, this.textObject, this.clickZone, lineCount, talks.length, this.textLine);
        }
        this.messageOperation.deleteMessageObject();
    }

    public destroyAll() {
        if (this.textObject) this.textObject.destroy();
        if (this.clickZone) this.clickZone.destroy();
        if (this.cropRectMask) this.cropRectMask.destroy();
        if (this.messageOperation) this.messageOperation.destroy();
    }
}
