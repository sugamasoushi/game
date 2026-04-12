import { CharacterData, CharacterDataDetail } from "../lib/CharacterDataTypes";

export class SearchCharacterData {

    private characterData: CharacterData;

    constructor(cache: Phaser.Cache.BaseCache) {
        this.characterData = cache.get('characterdata');
    }

    /**
     * キャラクター名から画像キー詳細を取得する
     * @param characterName キャラクター名 (例: 'meina')
     * @returns キャラクターデータ詳細
     */
    public getCharacterData(characterName: string): CharacterDataDetail {
        const query = characterName.toLowerCase();
        for (const key in this.characterData) {
            if (key.toLowerCase() === query) {
                return this.characterData[key] as CharacterDataDetail;
            }
        }

        // 見つからない場合はデフォルトとして 空文字 を返す
        return this.characterData['noName'] as CharacterDataDetail;
    }
}