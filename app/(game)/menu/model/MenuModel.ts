import { FieldScene } from '../../lib/SceneTypes';
import { GameStateManager } from '../../GameAllState/GameStateManager';
import { ItemUpdate } from '../../Data/ItemUpdate';

export class MenuModel {

    private fieldScene: FieldScene;
    private scene: Phaser.Scene;

    // Setting Data
    public fontFamily: string;
    public fontColor: string;
    public fontSize: number;
    public lineSpaceValue: number;
    public textLine: number;

    public backColor: number;
    public alphaValue: number;
    public lineColor: number;

    private itemUpdate: ItemUpdate;

    constructor(scene: Phaser.Scene, gameScene: FieldScene) {
        this.scene = scene;
        this.fieldScene = gameScene;
        this.initSettings();
    }

    private initSettings() {
        // 設定関連の初期化処理
        const settingData = this.scene.cache.json.get('savedata').GameSetting.EventWindow;
        this.fontFamily = settingData.fontFamily;
        this.fontColor = settingData.fontColor;
        this.fontSize = 24;
        this.lineSpaceValue = settingData.lineSpaceValue;
        this.textLine = settingData.textLine;

        const settingBubbleData = this.scene.cache.json.get('savedata').GameSetting.MessageWindow;
        this.backColor = settingBubbleData.backColor;
        this.alphaValue = settingBubbleData.alphaValue;
        this.lineColor = settingBubbleData.lineColor;

        this.itemUpdate = new ItemUpdate(this.scene);
    }

    public getPlayerData() {
        return this.fieldScene.getPlayer().data;
    }

    public getPlayerDataList() {
        return this.fieldScene.getPlayer().data.list;
    }

    public getItemData() {
        return this.fieldScene.getPlayer().data;
    }

    public getPlayerItemCount(itemName: string) {
        return this.fieldScene.getPlayer().getData(itemName);
    }

    public getPlayerPartyList(): Phaser.GameObjects.Sprite[] {
        const gameStateManager = GameStateManager.getInstance();
        return gameStateManager.currentPlayerPartyList;
    }

    // アイテムリストから表示不要なステータス項目を除外して返す
    public getValidItemList(): string[] {
        return this.itemUpdate.getValidItemList();
    }

    public useItem(itemName: string, count: number, memberIndex: number = 0) {
        this.itemUpdate.useItem(itemName, count, memberIndex);
    }
}
