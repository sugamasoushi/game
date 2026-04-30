import { CharacterStatus } from '../lib/BattleTypes';
import { SkillMap } from '../lib/SkillDataTypes';

/**
 * キャラクター（アクター）のデータモデル（将来用）
 * GameObjectsに依存せず、ロジック上の状態を保持する
 */
export class ActorState {
    public id: string;
    public name: string;
    public imageKey: string;
    public npcType: string;

    public status: CharacterStatus;
    public skillData: {
        special: string[];
        magic: string[];
    } = { special: [], magic: [] };

    public battleTemp: {
        guardValue: number;
        attackType: string;
        target: ActorState | null;
        isDead: boolean;
        //selectedSkill?: any; // 将来的に SkillDetail に置き換え
    } = { guardValue: 0, attackType: 'normal', target: null, isDead: false };

    constructor(id: string, name: string, imageKey: string, status: CharacterStatus, npcType: string = 'player') {
        this.id = id;
        this.name = name;
        this.imageKey = imageKey;
        this.status = { ...status };
        this.npcType = npcType;
        this.battleTemp.isDead = status.HP <= 0;
    }
}
