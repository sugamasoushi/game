import { GameScene } from "../../lib/types";

export class MenuModel {

    private gameScene: GameScene;
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

    constructor(scene: Phaser.Scene, gameScene: GameScene) {
        this.scene = scene;
        this.gameScene = gameScene;
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
    }

    public getPlayerData() {
        return this.gameScene.getPlayer().data.list;
    }

    public getPlayerItemCount(itemName: string) {
        return this.gameScene.getPlayer().getData(itemName);
    }

    // アイテムリストから表示不要なステータス項目を除外して返す
    public getValidItemList(): string[] {
        const itemList: string[] = [];
        const playerData = this.getPlayerData();
        Object.keys(playerData).forEach(array => {
            if (array !== 'Lv' && array !== 'HP' && array !== 'MP' && array !== 'MaxHP' && array !== 'MaxMP' &&
                array !== 'Attack' && array !== 'Guard' && array !== 'Speed' &&
                array !== 'Weapon' && array !== 'Armor' &&
                array !== 'normalSkill' && array !== 'specialSkill' && array !== 'MagicSkill' &&
                array !== 'name' && array !== 'ImageKey'
            ) {
                itemList.push(array);
            }
        });
        return itemList;
    }
}
