export interface TileMapData {
    infomation: string;
    normalmap: string[];
}

export class SearchTileNamedata {
    private tileMapData: TileMapData;

    constructor(cache: Phaser.Cache.BaseCache) {
        this.tileMapData = cache.get('tilemapdata');
    }

    /**
     * 指定されたタイルセット名が法線マップを持っているか判定する
     * @param tileSetName タイルセット名
     * @returns 法線マップを持つ場合はtrue
     */
    public isNormalMap(tileSetName: string): boolean {
        if (!this.tileMapData || !this.tileMapData.normalmap) {
            return false;
        }
        return this.tileMapData.normalmap.includes(tileSetName);
    }
}
