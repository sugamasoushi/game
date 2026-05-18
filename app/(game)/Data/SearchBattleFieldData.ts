export interface BattleFieldDetail {
    light: boolean;
    gimic: string;
}

export interface BattleFieldData {
    infomation: string;
    battlefield: {
        [key: string]: BattleFieldDetail;
    };
}

export class SearchBattleFieldData {
    private battlefieldData: BattleFieldData;

    constructor(cache: Phaser.Cache.BaseCache) {
        this.battlefieldData = cache.get('battlefieldData');
    }

    /**
     * バトルフィールドデータを取得する
     * @param fieldKey フィールドのキー（例：'battle_hill'）
     * @returns バトルフィールド詳細データ、存在しない場合は undefined
     */
    public getBattleFieldData(fieldKey: string): BattleFieldDetail | undefined {
        if (!this.battlefieldData || !this.battlefieldData.battlefield) {
            return undefined;
        }
        return this.battlefieldData.battlefield[fieldKey];
    }
}
