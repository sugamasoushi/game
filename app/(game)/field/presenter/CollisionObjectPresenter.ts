import { CollisionObjectModel } from "../model/CollisionObjectModel";
import { CollisionObjectView } from "../view/CollisionObjectView";
import { FieldScene } from "../../lib/types";
import { GameStateManager } from "../../core/GameStateManager";

export class CollisionObjectPresenter {

    constructor(
        private fieldScene: FieldScene,
        private collisionObjectModel: CollisionObjectModel,
        private collisionObjectView: CollisionObjectView,
        private makeTileMap: Phaser.Tilemaps.Tilemap,
    ) {
        this.collisionObjectModel = new CollisionObjectModel(this.fieldScene);
        this.collisionObjectView = new CollisionObjectView(this.fieldScene);
    }

    public async execute() {

        this.collisionObjectModel.execute();
        this.collisionObjectView.execute(this.makeTileMap);
        this.setCollision();
    }

    private setCollision() {
        const gameStateManager = GameStateManager.getInstance();
        const collision = this.collisionObjectView.getClickEventObjects();

        // //衝突判定の追加
        for (const player of gameStateManager.currentPlayerPartyList) {
            this.fieldScene.physics.add.collider(player, collision);
        }
    }

}