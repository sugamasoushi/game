import { SkillData } from "../lib/SkillDataTypes";

export class SearchSkill {
    private skillData: SkillData;

    constructor(skilldataJson: SkillData) {
        this.skillData = skilldataJson;
    }

    /**
     * スキルデータを取得する
     * @param type スキルの種類（special, magicなど）
     * @param id スキルID
     * @returns スキル名と説明を含むオブジェクト
     */
    public getSkillData(type: string, skillId: string) {

        // skilldata.jsonのキーは小文字（special, magic）
        const typeKey = type.toLowerCase();


        switch (typeKey) {
            case 'special':
                for (const [id, detail] of Object.entries(this.skillData.special)) {
                    //console.log(id, skillId);
                    if (id === skillId) {
                        return detail;
                    }
                }
            case 'magic':
                for (const [id, detail] of Object.entries(this.skillData.magic)) {
                    if (id === skillId) {
                        return detail;
                    }
                }
            case 'none':
                for (const [id, detail] of Object.entries(this.skillData.none)) {
                    if (id === skillId) {
                        return detail;
                    }
                }
        }
    }
}
