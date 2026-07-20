import { SkillDetail } from "../../lib/types";
import { BaseSprite } from "../../core/BaseSprite";
import { MagicFrame } from "../../util/Sprite/MagicFrame";
import { WindCutter } from "../../util/Sprite/WindCutter";

export class SearchMagicEffect {
    constructor(
        private skillDetail: SkillDetail,
        private battleScene: Phaser.Scene,
        private targetX: number,
        private targetY: number
    ) { }

    public searchMagicEffect(): BaseSprite | undefined {
        //console.log(this.skillDetail);
        if (this.skillDetail.effectClassName === 'MagicFrame') { return new MagicFrame(this.battleScene, this.targetX, this.targetY); }
        if (this.skillDetail.effectClassName === 'WindCutter') { return new WindCutter(this.battleScene, this.targetX, this.targetY); }

        return undefined;
    }

}