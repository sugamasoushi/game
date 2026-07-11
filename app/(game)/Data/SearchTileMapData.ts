export interface TileMapData {
    infomation: string;
    normalmap: string[];
}

/** tilemapdata.json からタイルマップ関連データを検索する */
export class SearchTileMapData {
    private tileMapData: TileMapData;

    constructor(cache: Phaser.Cache.BaseCache) {
        this.tileMapData = cache.get('tilemapdata');
    }

    /** 指定タイルセットが法線マップを持つか判定 */
    public isNormalMap(tileSetName: string): boolean {
        if (!this.tileMapData?.normalmap) {
            return false;
        }
        return this.tileMapData.normalmap.includes(tileSetName);
    }
}
