import { SkillDetail } from "../../lib/types";
import { EffectCommon } from "../view/Effect/EffectCommon";
import { MagicFrame } from "../view/Effect/MagicFrame";
import { WindCutter } from "../view/Effect/WindCutter";

export class SearchMagicEffect {
    constructor(
        private skillDetail: SkillDetail,
        private battleScene: Phaser.Scene,
        private targetX: number,
        private targetY: number
    ) { }

    public searchMagicEffect(): EffectCommon | undefined {
        //console.log(this.skillDetail);
        if (this.skillDetail.effectClassName === 'MagicFrame') { return new MagicFrame(this.battleScene, this.targetX, this.targetY); }
        if (this.skillDetail.effectClassName === 'WindCutter') { return new WindCutter(this.battleScene, this.targetX, this.targetY); }

        return undefined;
    }

}