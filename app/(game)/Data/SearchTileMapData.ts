export interface TileMapEnemyData {
    EnemyList: string[];
    Appearance50: string;
}

export interface TileMapData {
    infomation: string;
    normalmap: string[];
    MapEnemyList?: Record<string, TileMapEnemyData>;
}

/** tilemapdata.json からタイルマップ関連データを検索する */
export class SearchTileMapData {
    private tileMapData: TileMapData | null;
    private enemyList: TileMapData;

    constructor(cache: Phaser.Cache.BaseCache) {
        this.tileMapData = cache.get('tilemapdata') as TileMapData | null;
        this.enemyList = this.tileMapData ?? { infomation: '', normalmap: [] };
    }

    /** 指定タイルセットが法線マップを持つか判定 */
    public isNormalMap(tileSetName: string): boolean {
        if (!this.tileMapData?.normalmap) {
            return false;
        }
        return this.tileMapData.normalmap.includes(tileSetName);
    }

    /** 指定マップIDの敵データを取得 */
    public getMapEnemyList(mapId: string): TileMapEnemyData | null {
        if (!this.tileMapData?.MapEnemyList) {
            return null;
        }

        return this.tileMapData.MapEnemyList[mapId] ?? null;
    }
}
