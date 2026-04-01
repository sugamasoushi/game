/** 個別のスキル詳細 */
export interface SkillDetail {
    name: string;
    type: string;
    description: string;
    mpCost: number;
    effect: string;
    value: number;
}

/** IDをキーとしたスキルのマップ（"01", "02"など） */
export interface SkillMap {
    [id: string]: SkillDetail;
}

/** スキルデータの全体構造 */
export interface SkillData {
    infomation: string;
    none: SkillMap;
    special: SkillMap;
    magic: SkillMap;
}