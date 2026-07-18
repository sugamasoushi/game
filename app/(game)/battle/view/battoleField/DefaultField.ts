import { BattleScene } from "@/app/(game)/lib/types";
// import { GameStateManager } from "@/app/(game)/core/GameStateManager";

export class DefaultField extends Phaser.GameObjects.Container {

    private backGroundImage: Phaser.GameObjects.Image;

    constructor(battleScene: BattleScene) {
        super(battleScene);
        this.name = DefaultField.name;
    }

    public execute() {
        this.createBackground();
    }

    private createBackground() {
        const width = Number(this.scene.game.config.width);
        const height = Number(this.scene.game.config.height);

        // const gameStateManager = GameStateManager.getInstance();
        // const battleFieldKey = gameStateManager.currentBattleFieldKey;

        //背景画像の作成
        this.backGroundImage = this.scene.add.image(width / 2, height / 2, 'lamyOpImageHome');
    }

    public destroy() {
        this.backGroundImage.destroy();

        super.destroy();
    }
}
