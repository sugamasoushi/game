import { EventObjectModel } from "../model/EventObjectModel";
import { EventObjectView } from "../view/EventObjectView";
import { FieldScene } from "../../lib/types";

export class EventObjectPresenter {

    constructor(
        private fieldScene: FieldScene,
        private eventObjectModel: EventObjectModel,
        private eventObjectView: EventObjectView,
        private makeTileMap: Phaser.Tilemaps.Tilemap,
    ) {
    }

    public async execute() {

        this.eventObjectModel.execute();
        this.eventObjectView.execute(this.makeTileMap);
    }

}