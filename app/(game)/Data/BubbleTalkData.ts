type TalkLine = { [chara: string]: string[] };

/** bubbleTalkData.json から吹き出し会話データを取得する */
export class BubbleTalkData {
    private bubbletalkKey: string;

    constructor(bubbletalkKey: string) {
        this.bubbletalkKey = bubbletalkKey;
    }

    /** JSON から会話データを取得 */
    public getTalkData(scene: Phaser.Scene): TalkLine[] | null {
        const bubbleTalkData = scene.cache.json.get('bubbleTalkData').bubbleTalkData;
        const bubbleKey = this.bubbletalkKey.split('.')[0];
        const talkKey = this.bubbletalkKey.split('.')[1];

        if (!bubbleTalkData[bubbleKey]?.[talkKey]) {
            return bubbleTalkData['bubbleTalk0000']?.['talk000'] ?? null;
        }

        return bubbleTalkData[bubbleKey]?.[talkKey] ?? null;
    }
}
