import { SaveDataManager } from "../core/SaveDataManager";
import { GameStateManager } from "../GameAllState/GameStateManager";

export class ItemUpdate {

    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    // アイテムリストから表示不要なステータス項目を除外して返す
    public getValidItemList(): string[] {
        const gameStateManager = GameStateManager.getInstance();
        const saveDataManager = new SaveDataManager();

        const itemList: string[] = [];
        const playerData = gameStateManager.currentPlayerPartyList[0].data.list;

        // Lvやスキル等、アイテム以外の項目を除外
        Object.keys(playerData).forEach(array => {
            if (saveDataManager.checkItemListData(array)) {
                itemList.push(array);
            }
        });
        return itemList;
    }

    public useItem(itemName: string, count: number, memberIndex: number = 0) {
        const gameStateManager = GameStateManager.getInstance();

        // 更新後のアイテム数が0以下なら登録情報を削除
        if (count <= 0 || count == undefined) {
            gameStateManager.currentPlayerPartyList[0].data.remove(itemName);
            // console.log(itemName, this.gameStateManager.currentPlayerPartyList[0].data);
        }

        // 使用対象のメンバーデータを取得
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
