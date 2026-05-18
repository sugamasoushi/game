import { ItemData, ItemDetail } from "../lib/ItemDataTypes";

export class SearchItem {
    private itemData: ItemData;

    constructor(cache: Phaser.Cache.BaseCache) {
        this.itemData = cache.get('itemdata');
    }

    /**
     * アイテムデータを取得する
     * @param type アイテムの種類（freeitemなど）
     * @param itemId アイテムID
     * @returns アイテム詳細オブジェクト
     */
    public getItemData(type: string, itemId: string): ItemDetail | undefined {
        const typeKey = type.toLowerCase();

        switch (typeKey) {
            case 'freeitem':
                return this.itemData.freeitem[itemId];
            case 'none':
                return this.itemData.none[itemId];
            default:
                // 全てのカテゴリから検索
                for (const category of Object.values(this.itemData)) {
                    if (typeof category === 'object' && category[itemId]) {
                        return category[itemId];
                    }
                }
                return undefined;
        }
    }

    /**
     * アイテム名からアイテムデータを検索する
     * @param itemName アイテム名
     * @returns アイテム詳細オブジェクト
     */
    public getItemDataByName(itemName: string): ItemDetail | undefined {
        // freeitemを優先的に検索
        for (const detail of Object.values(this.itemData.freeitem)) {
            if (detail.name === itemName) {
                return detail;
            }
        }
        
        // その他のカテゴリを検索
        for (const [key, category] of Object.entries(this.itemData)) {
            if (key === 'infomation' || key === 'freeitem') continue;
            if (typeof category === 'object') {
                for (const detail of Object.values(category)) {
                    if ((detail as ItemDetail).name === itemName) {
                        return detail as ItemDetail;
                    }
                }
            }
        }
        return undefined;
    }
}
