export class CommandSelectModel extends Phaser.Events.EventEmitter {
    private actionQueue: Phaser.GameObjects.Sprite[] = [];
    private currentCharacterIndex: number = 0;//味方の左から数える

    // 戦闘開始時にキューを作成
    setupTurnOrder(characters: Phaser.GameObjects.Sprite[]) {

        this.actionQueue = characters;
        // console.log(this.actionQueue)

        // 最初のキャラも死んでいる可能性があるので、最初から生存者を探す
        this.skipDeadCharacters();
    }

    // 次のキャラクターのターンへ進める
    nextTurn() {
        this.currentCharacterIndex++;

        // 現在のインデックスから、生存しているキャラまでスキップ
        this.skipDeadCharacters();

        // 全員（末尾まで）終わったら最初に戻る
        if (this.currentCharacterIndex >= this.actionQueue.length) {
            this.currentCharacterIndex = 0;

            // 最初のキャラも死んでいる可能性があるので、最初から生存者を探す
            this.skipDeadCharacters();

            // もし最初から最後まで探して誰もいなかった場合、または全員終わった通知
            this.emit('CommandSelectFinish');
            return;
        }

        // 次のキャラを通知
        const currentActive = this.actionQueue[this.currentCharacterIndex];
        this.emit('CommandSelect', currentActive);
    }

    /**
     * 現在の index から生存しているキャラクターが見つかるまで index を進める
     * 配列の末尾に達した場合はそこで止まる
     */
    private skipDeadCharacters() {
        while (
            this.currentCharacterIndex < this.actionQueue.length &&
            this.actionQueue[this.currentCharacterIndex].data.values.HP <= 0
        ) {
            this.currentCharacterIndex++;
        }
    }

    // 最初のコマンド選択を開始する前などに呼ぶ用
    public checkNextCommandSelectStartCharacter() {
        this.skipDeadCharacters();
    }

    getCurrentCharacter(): Phaser.GameObjects.Sprite {
        return this.actionQueue[this.currentCharacterIndex];
    }
}






// // 次のキャラクターのターンへ進める
//     nextTurn() {
//         this.currentCharacterIndex++;

//         // 全員終わったら最初に戻る
//         if (this.currentCharacterIndex >= this.actionQueue.length) {
//             this.currentCharacterIndex = 0;

//             //先頭が生存しているか確認
//             if (this.actionQueue[this.currentCharacterIndex].data.values.HP <= 0) {

//                 //生存しているキャラクターを最初のコマンド選択対象にする
//                 while (++this.currentCharacterIndex < this.actionQueue.length) {
//                     if (this.actionQueue[this.currentCharacterIndex].data.values.HP > 0) {
//                         break;
//                     }
//                 }
//             }
//             this.emit('CommandSelectFinish');
//             return;
//         }

//         // 次のキャラを通知
//         const currentActive = this.actionQueue[this.currentCharacterIndex];
//         this.emit('CommandSelect', currentActive);

//     }

//     //生存チェック
//     public checkNextCommandSelectStartCharacter() {
//         //先頭が生存しているか確認
//         if (this.actionQueue[this.currentCharacterIndex].data.values.HP <= 0) {

//             //生存しているキャラクターを最初のコマンド選択対象にする
//             while (++this.currentCharacterIndex < this.actionQueue.length) {
//                 if (this.actionQueue[this.currentCharacterIndex].data.values.HP > 0) {
//                     break;
//                 }
//             }
//         }
//     }