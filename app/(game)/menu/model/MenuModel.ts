import { GameScene } from '../../lib/SceneTypes';
import { SaveDataManager } from "../../core/SaveDataManager";

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

    private saveDataManager: SaveDataManager;

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

        this.saveDataManager = new SaveDataManager();
    }

    public getPlayerData() {
        return this.gameScene.getPlayer().data;
    }

    public getPlayerDataList() {
        return this.gameScene.getPlayer().data.list;
    }

    public getItemData() {
        return this.gameScene.getPlayer().data;
    }

    public getPlayerItemCount(itemName: string) {
        return this.gameScene.getPlayer().getData(itemName);
    }

    // アイテムリストから表示不要なステータス項目を除外して返す
    public getValidItemList(): string[] {
        const itemList: string[] = [];
        const playerData = this.getPlayerDataList();

        // Lvやスキル等、アイテム以外の項目を除外
        Object.keys(playerData).forEach(array => {
            if (this.saveDataManager.checkItemListData(array)) {
                itemList.push(array);
            }
        });
        return itemList;
    }

    public useItem(itemName: string, count: number) {

        // 更新後のアイテム数が0以下なら登録情報を削除
        if (count <= 0 || count == undefined) {
            this.gameScene.getPlayer().data.remove(itemName);
            console.log(itemName, this.gameScene.getPlayer().data);
        }

        // アイテムごとの回復処理
        switch (itemName) {
            case 'やくそう':
                this.gameScene.getPlayer().data.values['HP'] += 10;
                break;
            case 'おにぎり':
                this.gameScene.getPlayer().data.values['HP'] += this.gameScene.getPlayer().data.values['MaxHP'];
                break;
            case 'ばんそうこう':
                this.gameScene.getPlayer().data.values['MP'] += 10;
                break;
            default:
                break;
        }

        // 回復後の最大値チェック
        if (this.gameScene.getPlayer().data.values['HP'] > this.gameScene.getPlayer().data.values['MaxHP']) {
            this.gameScene.getPlayer().data.values['HP'] = this.gameScene.getPlayer().data.values['MaxHP'];
        }
        if (this.gameScene.getPlayer().data.values['MP'] > this.gameScene.getPlayer().data.values['MaxMP']) {
            this.gameScene.getPlayer().data.values['MP'] = this.gameScene.getPlayer().data.values['MaxMP'];
        }
    }
}
