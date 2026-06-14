import { BattleScene } from "@/app/(game)/lib/types";
import { ExecutionEnvironment } from "../../../core/ExecutionEnvironment";
import { Fog } from "../Effect/Fog";

export class forest extends Phaser.GameObjects.Container {
    private debugFlg: boolean | undefined;

    private battle_forest: Phaser.GameObjects.Image;


    private shader: Phaser.GameObjects.Shader | null = null;
    private fog: Fog;

    constructor(battleScene: BattleScene) {
        super(battleScene);
        this.name = forest.name;
        this.addToDisplayList();
        this.addToUpdateList();
        this.fog = new Fog(battleScene);
        this.debugFlg = battleScene.game.config.physics.arcade?.debug;
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

        this.battle_forest.destroy();

        this.shader?.destroy();

        super.destroy();
    }
}
