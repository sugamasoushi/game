import { FieldScene } from "../../../lib/SceneTypes";
import { GameStateManager } from "@/app/(game)/core/GameStateManager";
import { State } from "@/app/(game)/lib/StateTypes";
import { SearchEnemyData } from './../../../Data/SearchEnemyData';
import { CharacterState } from '@/app/(game)/lib/FieldTypes';
import { createSprite } from './../../../util/Sprite/CharacterNpc';

export class BattleTestButton {
    private fieldScene: FieldScene;

    constructor(private uiScene: Phaser.Scene) {
        this.fieldScene = this.uiScene.scene.get('Field') as FieldScene;
    }

    public execute() {

        const testButton = this.uiScene.add.text(20, 110, 'Battle Start', {
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


            /**
             * バトル時の敵生成は本体を改良すべき
             */
            const enemy = createSprite(
                '0304',
                'tex_enemy02',
                'up,right,down,left',
                this.fieldScene,
                0,
                0,
                'enemy',
                'enemy02'
            )!;
            enemy.state = CharacterState.event;

            const searchEnemyData = new SearchEnemyData(this.fieldScene.cache.json);
            const enemyData = searchEnemyData.getEnemyData(enemy.getData('ImageKey'));
            enemy.setData({
                level: enemyData!.Level,
                HP: enemyData!.HP,
                MP: enemyData!.MP,
                MaxHP: enemyData!.MaxHP,
                MaxMP: enemyData!.MaxMP,
                Attack: enemyData!.Attack,
                Guard: enemyData!.Guard,
                Speed: enemyData!.Speed,
                gold: enemyData!.gold
            });
            enemy.setData('name', enemyData!.Name);

            //状態更新
            const gameStateManager = GameStateManager.getInstance();
            gameStateManager.updateState({
                state: State.BATTLE,
                battleData: { usePatern: 'normal', fieldHitEnemy: enemy, canNotRunaway: false }
            }, 'debug');
        })
    }
}