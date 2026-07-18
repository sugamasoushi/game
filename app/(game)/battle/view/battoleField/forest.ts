import { BattleScene } from "@/app/(game)/lib/types";
import { Fog } from "../Effect/Fog";

export class forest extends Phaser.GameObjects.Container {

    private battle_forest: Phaser.GameObjects.Image;
    private fog: Fog;

    constructor(battleScene: BattleScene) {
        super(battleScene);
        this.name = forest.name;
        this.addToDisplayList();
        this.addToUpdateList();
        this.fog = new Fog(battleScene);
    }

    public execute() {
        this.createBackground();

        this.fog.createFog(9999);
    }

    private createBackground() {
        const width = Number(this.scene.game.config.width);
        const height = Number(this.scene.game.config.height);

        //背景画像の作成
        this.battle_forest = this.scene.add.image(width / 2, height / 2, 'battle_forest');

        this.battle_forest.setDepth(10);

    }

    public destroy() {
        this.fog.fogDestroy();
        this.battle_forest.destroy();
        super.destroy();
    }
}
