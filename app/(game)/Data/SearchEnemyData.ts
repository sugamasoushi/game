import { EnemyData } from "../lib/EnemyDataTypes";

export class SearchEnemyData {

    //scene.cache.json.get('enemydata')
    private enemyData: EnemyData;

    constructor(cache: Phaser.Cache.BaseCache) {
        this.enemyData = cache.get('enemydata');
    }

    /**
     * 敵名（画像キー）から表示用の名前を取得する
     * @param enemyName 敵名 (例: 'enemy01')
     * @returns 敵表示名 (例: 'ラミア')
     */
    public getEnemyData(enemyName: string): string {
        const query = enemyName.toLowerCase();
        
        const enemyNameData = this.enemyData.EnemyNameData;
        if (enemyNameData) {
            for (const key in enemyNameData) {
                if (key.toLowerCase() === query) {
                    return enemyNameData[key];
                }
            }
        }

        return "Unknown";
    }
}