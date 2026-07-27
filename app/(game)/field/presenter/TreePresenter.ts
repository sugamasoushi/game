import { TreeModel } from "../model/TreeModel";
import { TreeView } from "../view/TreeView";
import { FieldScene } from "../../lib/SceneTypes";

export class TreePresenter {

    constructor(
        private fieldScene: FieldScene,
        private makeTileMap: Phaser.Tilemaps.Tilemap,
        private treeModel: TreeModel,
        private treeView: TreeView
    ) {
    }

    public async execute() {
        this.treeModel.execute();
        await this.treeView.execute(this.makeTileMap);
    }
}
