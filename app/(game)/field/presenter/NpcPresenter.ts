import { FieldScene } from "../../lib/types";
import { NpcModel } from "../model/NpcModel";
import { NpcView } from "../view/NpcView";
import { TileMap } from "../view/TileMap";
import { InputManager } from "../../core/input/InputManager";

export class NpcPresenter {

    constructor(
        private fieldScene: FieldScene,
        private npcModel: NpcModel,
        private npcView: NpcView,
        private tileMap: TileMap,
        private inputManager: InputManager
    ) {
        this.npcModel = new NpcModel(fieldScene);
        this.npcView = new NpcView(this.fieldScene, this.tileMap, this.inputManager);
    }

    public update(time: number, delta: number) {

    }

    public async execute() {
        await this.npcModel.execute();
        await this.npcView.execute();
    }





}