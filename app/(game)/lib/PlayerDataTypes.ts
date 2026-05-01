export interface PlayerPosition {
    x: number;
    y: number;
}

export interface PlayerStatus {
    Lv: number;
    HP: number;
    MP: number;
    MaxHP: number;
    MaxMP: number;
    Attack: number;
    Guard: number;
    Speed: number;
}

export interface PlayerEquip {
    Weapon: string;
    Armor: string;
}

export interface PlayerSkill {
    special: string[];
    magic: string[];
}

export interface PlayerItem {
    [itemName: string]: number;
}

export interface PlayerData {
    PlayerMapKey?: string;
    PlayerPosition?: PlayerPosition;
    initStandKey?: string;
    PartyMemberFlg?: boolean; // 2人目のフラグ
    PartyMember?: boolean;    // 3人目のフラグ
    status: PlayerStatus;
    Equip: PlayerEquip;
    Skill: PlayerSkill;
    Item?: PlayerItem; // アイテムは1人目のみ保持
}