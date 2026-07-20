import { FieldScene } from "../../../lib/SceneTypes";
import { GameStateManager } from "@/app/(game)/core/GameStateManager";


export class StatusTestButton {
    private fieldScene: FieldScene;

    constructor(private uiScene: Phaser.Scene) {
        this.fieldScene = this.uiScene.scene.get('Field') as FieldScene;
    }

    public execute() {

        const testButton = this.uiScene.add.text(20, 80, 'Set Status Max', {
            fontSize: '24px',
            color: '#ffffff'
        });
        testButton.setDepth(101).setInteractive({ useHandCursor: true });


        testButton.on(Phaser.Input.Events.POINTER_UP, async (
            pointer: Phaser.Input.Pointer,
            localX: number,
            localY: number,
            event: Phaser.Types.Input.EventData) => {

            //下層のオブジェクトのイベントを止める
            event.stopPropagation();

            //右クリックの場合は処理しない
            if (pointer.rightButtonReleased()) return;

            const gameStateManager = GameStateManager.getInstance();
            gameStateManager.currentPlayerPartyList[0].setData('やくそう', 50);
            gameStateManager.currentPlayerPartyList[0].setData('おにぎり', 50);
            gameStateManager.currentPlayerPartyList[0].setData('ばんそうこう', 50);

            for (const pl of gameStateManager.currentPlayerPartyList) {
                const memberData = pl.data.values;
                memberData['HP'] = memberData['MaxHP'];
                memberData['MP'] = memberData['MaxMP'];
            }
        })
    }
}