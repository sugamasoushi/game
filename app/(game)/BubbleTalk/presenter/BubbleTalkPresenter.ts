import { BubbleTalkModel } from "../model/BubbleTalkModel";
import { BubbleTalkView } from "../view/BubbleTalkView";
import { GameStateManager } from "@/app/(game)/core/GameStateManager";
import { FieldObjectCheck } from "@/app/(game)/util/FieldObjectCheck";
import { Player } from "@/app/(game)/field/view/character/Player";
import { Npc } from "@/app/(game)/field/view/character/Npc";
import { State } from "@/app/(game)/lib/StateTypes";

export class BubbleTalkPresenter {
    constructor(
        private scene: Phaser.Scene,
        private model: BubbleTalkModel,
        private view: BubbleTalkView
    ) { }

    public async execute() {
        this.model.init(this.scene);
        this.view.init();

        const talkdata = this.model.getTalkData();
        if (!talkdata) {
            this.finishTalk();
            return;
        }

        for (const obj of talkdata) {
            const [chara, talks] = Object.entries(obj)[0];
            await this.execTalk(chara, talks);
        }

        this.finishTalk();
    }

    private async execTalk(charKey: string, talks: string[]) {
        const gameStateManager = GameStateManager.getInstance();
        const fieldScene = this.scene.scene.get('Field');
        const fieldSceneCamera = fieldScene.cameras.main;

        let playerSprite: Player | undefined;
        for (const p of gameStateManager.currentPlayerPartyList) {
            if (p.name === charKey) {
                playerSprite = p as Player;
            }
        }

        const npcSprite = gameStateManager.currentEventObj as Npc | undefined;

        let playerPosition = 'right';
        let npcPosition = 'left';

        if (npcSprite && gameStateManager.currentPlayerPartyList.length > 0) {
            const player = gameStateManager.currentPlayerPartyList[0] as Player;
            const fieldObjectCheck = new FieldObjectCheck(player, npcSprite);
            playerPosition = fieldObjectCheck.getObjectPosition().object1XPosition;
            npcPosition = fieldObjectCheck.getObjectPosition().object2XPosition;
        }

        const targetSprite = playerSprite || npcSprite;
        if (!targetSprite) return;

        // スクリーン座標に変換
        const baseScreenX = targetSprite.x - fieldSceneCamera.scrollX;
        const baseScreenY = targetSprite.y - fieldSceneCamera.scrollY;

        const bubblePosition = playerSprite ? playerPosition : npcPosition;
        const imageKey = npcSprite ? npcSprite.getData('ImageKey') : undefined;

        this.view.createMessageElements(charKey, talks, baseScreenX, baseScreenY, bubblePosition, imageKey);

        await this.view.animateText(talks);
    }

    private finishTalk() {
        this.view.destroyAll();

        const manager = GameStateManager.getInstance();
        manager.updateState({ state: State.NOSTATE }, 'BubbleTalkEnd');

        this.scene.scene.stop();
    }
}
