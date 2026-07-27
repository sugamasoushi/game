import { FieldScene } from "../../lib/types";
import { NpcModel } from "../model/NpcModel";
import { NpcView } from "../view/NpcView";

export class NpcPresenter {

    constructor(
        private fieldScene: FieldScene,
        private npcModel: NpcModel,
        private npcView: NpcView
    ) {
    }

    public update(time: number, delta: number) {
        void time;
        void delta;
    }

    public async execute() {
        await this.npcModel.execute();
        await this.npcView.execute();
    }
}