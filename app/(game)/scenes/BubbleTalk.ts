import { BubbleTalkModel } from "../BubbleTalk/model/BubbleTalkModel";
import { BubbleTalkView } from "../BubbleTalk/view/BubbleTalkView";
import { BubbleTalkPresenter } from "../BubbleTalk/presenter/BubbleTalkPresenter";
import { GameStateManager } from './../core/GameStateManager';
import { State } from "../lib/StateTypes";

export class BubbleTalk extends Phaser.Scene {
    private bubbleTalkPresenter: BubbleTalkPresenter;
    private bubbleTalkKey: string;

    constructor() { super('BubbleTalk'); }

    init(data: { sceneKey: string }) {
        this.bubbleTalkKey = data.sceneKey;
    }

    async create() {

        const model = new BubbleTalkModel(this.bubbleTalkKey);
        const view = new BubbleTalkView(this);

        this.bubbleTalkPresenter = new BubbleTalkPresenter(this, model, view);
        await this.bubbleTalkPresenter.execute();

        const manager = GameStateManager.getInstance();
        manager.updateState({ state: State.NOSTATE }, 'npc');
    }
}
