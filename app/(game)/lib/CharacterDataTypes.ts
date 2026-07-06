/** 各キャラクターの画像キー詳細 */
export interface CharacterDataDetail {
    name: string;
    icon: string;
    normal: string;
    smile: string;
    unger: string;
    menu:string;
}

/** キャラクターデータの全体構造 */
export interface CharacterData {
    infomation: string;
    [key: string]: CharacterDataDetail | string;
}
