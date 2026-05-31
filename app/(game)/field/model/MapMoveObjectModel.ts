import { CacheDataUpdate } from "../../core/CacheDataUpdate";

export class MapMoveObjectModel {

    constructor(private scene: Phaser.Scene) { }

    public async execute() {

    }

    public execCacheData() {

        //キャッシュを更新
        const cacheDataUpdate = new CacheDataUpdate(this.scene);
        cacheDataUpdate.phaserCacheDataUpdate();
    }

}