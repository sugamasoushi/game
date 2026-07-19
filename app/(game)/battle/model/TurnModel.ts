export class TurnModel extends Phaser.Events.EventEmitter {
    private actionQueue: Phaser.GameObjects.GameObject[] = [];
    private currentCharacterIndex: number = 0;//味方の左から数える

    // 戦闘開始時に素早さ順などでキューを作成
    setupTurnOrder(characters: Phaser.GameObjects.GameObject[]) {

        //avoidとguardの場合は先頭とする。同じ設定値を持つ場合はspeed順とする。
        this.actionQueue = [...characters].sort((a, b) => {
            const aType = a.getData('UseSkill')?.type;
            const bType = b.getData('UseSkill')?.type;
            const aIsPriority = aType === 'avoid' || aType === 'guard';
            const bIsPriority = bType === 'avoid' || bType === 'guard';

            if (aIsPriority && !bIsPriority) {
                return -1;
            } else if (!aIsPriority && bIsPriority) {
                return 1;
            } else {
                return b.getData('Speed') - a.getData('Speed');
            }
        });
        this.currentCharacterIndex = 0;

        // console.log(this.actionQueue)
    }

    // 次キャラクターのターンへ進める
    nextTurn() {
        this.currentCharacterIndex++;

        // 全員終わったら最初に戻る（または再計算）
        if (this.currentCharacterIndex >= this.actionQueue.length) {
            this.currentCharacterIndex = 0;
            this.emit('TurnFinish');
            return;
        }

        const currentActive = this.actionQueue[this.currentCharacterIndex];

        // 「ターンが変わったよ」と通知し、今の主役を渡す
        this.emit('TurnChange', currentActive);
    }

    getCurrentCharacter(): Phaser.GameObjects.GameObject {
        return this.actionQueue[this.currentCharacterIndex];
    }
}