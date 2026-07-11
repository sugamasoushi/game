import { CharacterData, CharacterDataDetail } from "../lib/CharacterDataTypes";

/** characterdata.json からキャラクター情報を検索する */
export class SearchCharacterData {
    private characterData: CharacterData;

    constructor(cache: Phaser.Cache.BaseCache) {
        this.characterData = cache.get('characterdata');
    }

    /** characterdata.json 全体を取得 */
    public getAllData(): CharacterData {
        return this.characterData;
    }

    /**
     * キャラクター名から詳細データを取得する
     * @param characterName キャラクター名 (例: 'meina')
     */
    public getCharacterData(characterName: string): CharacterDataDetail {
        const query = characterName.toLowerCase();
        for (const key in this.characterData) {
            if (key.toLowerCase() === query) {
                return this.characterData[key] as CharacterDataDetail;
            }
        }

        return this.characterData['noName'] as CharacterDataDetail;
    }

    /** 表示名を取得 */
    public getDisplayName(characterName: string): string {
        return this.getCharacterData(characterName).name;
    }

    /** 立ち絵・表情用の画像キーを取得 */
    public getImageKeys(characterName: string): CharacterDataDetail {
        const data = this.getCharacterData(characterName) as CharacterDataDetail;
        return data;
    }
}