import { GameScene } from '../../lib/SceneTypes';
import { SaveDataManager } from "../../core/SaveDataManager";
import { GameStateManager } from '../../GameAllState/GameStateManager';

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

        const gameStateManager = GameStateManager.getInstance();

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

    public getPlayerPartyList(): Phaser.GameObjects.Sprite[] {
        const gameStateManager = GameStateManager.getInstance();
        return gameStateManager.currentPlayerPartyList;
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

    public useItem(itemName: string, count: number, memberIndex: number = 0) {

        // 更新後のアイテム数が0以下なら登録情報を削除
        if (count <= 0 || count == undefined) {
            this.gameScene.getPlayer().data.remove(itemName);
            console.log(itemName, this.gameScene.getPlayer().data);
        }

        // 使用対象のメンバーデータを取得
        const gameStateManager = GameStateManager.getInstance();
        const targetMember = gameStateManager.currentPlayerPartyList[memberIndex];
        if (!targetMember) return;
        const memberData = targetMember.data.values;

        // アイテムごとの回復処理
        switch (itemName) {
            case 'やくそう':
                memberData['HP'] += 10;
                break;
            case 'おにぎり':
                memberData['HP'] += memberData['MaxHP'];
                break;
            case 'ばんそうこう':
                memberData['MP'] += 10;
                break;
            default:
                break;
        }

        // 回復後の最大値チェック
        if (memberData['HP'] > memberData['MaxHP']) {
            memberData['HP'] = memberData['MaxHP'];
        }
        if (memberData['MP'] > memberData['MaxMP']) {
            memberData['MP'] = memberData['MaxMP'];
        }
    }
}
