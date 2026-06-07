import { SaveDataManager } from "../core/SaveDataManager";
import { GameStateManager } from "../core/GameStateManager";
import { Sound } from "../scenes/Sound";
import { SearchItem } from "./SearchItem";

export class ItemUpdate {

    private scene: Phaser.Scene;
    private soundScene: Sound;
    private searchItem: SearchItem;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.soundScene = this.scene.scene.get('Sound') as Sound;
        this.searchItem = new SearchItem(this.scene.cache.json);
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

        // アイテムデータを検索
        const itemDetail = this.searchItem.getItemDataByName(itemName);
        if (!itemDetail) return;

        // 効果音再生
        this.soundScene.playSe('SE_idea');
        console.log('ItemUpdate - useItem:', itemName, 'count:', count, 'memberIndex:', memberIndex);

        // アイテムごとの回復処理
        if (itemDetail.type === 'heal' && itemDetail.subject) {
            // subjectに指定されたステータスを回復
            memberData[itemDetail.subject] += itemDetail.value;
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
