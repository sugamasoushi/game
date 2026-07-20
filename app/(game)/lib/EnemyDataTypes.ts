/** 敵データの全体構造 */
export interface EnemyStatus {
    SpriteType: string,
    SpritesheetKey: string,
    SpritesheetKeyOrder: string,
    ImageKey: string,
    Name: string;
    Level: number;
    HP: number;
    MP: number;
    MaxHP: number;
    MaxMP: number;
    Attack: number;
    Guard: number;
    Speed: number;
    gold: number;
}

export interface EnemyData {
    infomation: string;
    EnemyNameData: {
        [key: string]: EnemyStatus;
    };
}
