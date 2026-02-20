export class GameAllState {
    private isInitialized = false;

    private registry: Phaser.Data.DataManager;
    private cache: Phaser.Cache.CacheManager;
    private partyList: string[] = ['player'];//現状はプレイヤーのみ
    private playerPartyList: Phaser.GameObjects.Sprite[] = [];//現状はプレイヤーのみ

    constructor() { }

    public isInitialize(registry: Phaser.Data.DataManager, cache: Phaser.Cache.CacheManager) {
        if (this.isInitialized) {
            //throw new Error("初期化エラー: ゲーム開始時の初期化処理は実行済み.");
            return
        }

        this.registry = registry;
        this.cache = cache;

        console.log(registry);
        console.log(cache);

        this.isInitialized = true; // 完了フラグを立てる
    }

    public getPartyList(): string[] { return this.partyList; }
    public getPlayerPartyList(): Phaser.GameObjects.Sprite[] { return this.playerPartyList; }

}

// インスタンスを公開（シングルトン）
export const gameAllStateModel = new GameAllState();