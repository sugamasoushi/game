import { EnemyData, EnemyStatus } from "../lib/EnemyDataTypes";

export class SearchEnemyData {

    //scene.cache.json.get('enemydata')
    private enemyData: EnemyData;

    constructor(cache: Phaser.Cache.BaseCache) {
        this.enemyData = cache.get('enemydata');
    }

    // imageKey(enemy00等)から敵データを取得
    public getEnemyData(enemyKey: string): EnemyStatus | null {
        if (!enemyKey) return this.enemyData?.EnemyNameData?.enemy02 ?? null;
        const query = enemyKey.toLowerCase();

        const enemyNameData = this.enemyData?.EnemyNameData;
        if (!enemyNameData) return null;

        for (const key in enemyNameData) {
            if (key.toLowerCase() === query) {
                return enemyNameData[key];
            }
        }
        // 検索結果が無い場合はデフォルトでenemy02を返す
        return enemyNameData.enemy02 ?? null;
    }

    // 互換用: 名前だけ欲しいケース向け
    public getEnemyName(enemyKey: string): string {
        const data = this.getEnemyData(enemyKey);
        return data?.Name ?? "Unknown";
    }
}