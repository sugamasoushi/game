export class CommandSelectModel extends Phaser.Events.EventEmitter {
    private actionQueue: Phaser.GameObjects.Sprite[] = [];
    private currentCharacterIndex: number = 0;//味方の左から数える

    // 戦闘開始時に素早さ順などでキューを作成
    setupTurnOrder(characters: Phaser.GameObjects.Sprite[]) {

        this.actionQueue = characters;
        console.log(this.actionQueue)
    }

    // 次のターンへ進める
    nextTurn() {
        this.currentCharacterIndex++;

        // 全員終わったら最初に戻る（または再計算）
        if (this.currentCharacterIndex >= this.actionQueue.length) {
            this.currentCharacterIndex = 0;
            this.emit('CommandSelectFinish');
            return;
        }

        const currentActive = this.actionQueue[this.currentCharacterIndex];
        // 「ターンが変わったよ」と通知し、今の主役を渡す
        this.emit('CommandSelect', currentActive);
    }

    getCurrentCharacter(): Phaser.GameObjects.Sprite {
        return this.actionQueue[this.currentCharacterIndex];
    }
}