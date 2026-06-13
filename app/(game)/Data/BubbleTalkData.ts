type TalkLine = { [chara: string]: string[] };
// type TalkGroup = Record<string, TalkLine[]>;

// type TalkData = Record<string, TalkGroup>;

export class BubbleTalkData {

    private bubbletalkKey: string;
    constructor(bubbletalkKey: string) {
        this.bubbletalkKey = bubbletalkKey;
    };

    // bubbleTalkData: TalkData = {

    //     //吹き出し会話に使用
    //     bubbleTalk0000: {
    //         talk000: [
    //             { player: ['メッセージは無し\n'] },
    //         ]
    //     },

    //     // //吹き出し会話に使用
    //     // bubbleTalk0101: {
    //     //     talk001: [
    //     //         { player: ['新しく覚える魔法は何が良いかな？\n', 'やっぱり生活に役立つ方が良いかな\n', '・・・・・また今度！！\n'] }
    //     //     ],
    //     //     talk002: [
    //     //         { player: ['今日は何食べようかな～♪\n'] },
    //     //         { grandpa: ['ちゃんと野菜を食べやさい\n'] },
    //     //         { player: ['アツアツのから揚げ・・・\n'] },
    //     //         { grandpa: ['若鳥じゃないからまずいじゃろうて\n'] },
    //     //         { player: ['冗談だってば！\n'] },
    //     //     ]
    //     // },


    //     // bubbleTalk0102: {
    //     //     talk001: [
    //     //         { mob: ['我が力を欲するか？\n', '・・・・・・・\n', '我が力いらない？\n'] },
    //     //         { player: ['えぇ？\n', 'う～ん、どうしようかな\n', 'やっぱりいらねっす・・・\n'] },
    //     //         { mob: ['そんなぁ(´;ω;｀)\n'] }
    //     //     ],
    //     //     talk002: [
    //     //         {
    //     //             chicken_walk02: [
    //     //                 'あ。、aAJjｑq\n',
    //     //                 '・がおｒｇ　ｈｊだ\n',
    //     //                 '948１０　＿「」｛｝ｑjjj\n',
    //     //                 'ひやしんす\n',
    //     //                 '衝撃波\n',
    //     //                 'おおおおおおaio\n']
    //     //         }
    //     //     ],
    //     //     talk003: [
    //     //         { player: ['魔物と戦うかもしれないし\n', 'やくそう でも持っていくかな。\n'] }
    //     //     ],
    //     //     talk004: [
    //     //         { player: ['何かイベントがありそうだけど\n', '別に何もないんだ～\n'] }
    //     //     ]
    //     // },

    //     // //吹き出し会話に使用
    //     // bubbleTalk0001: {
    //     //     talk001: [
    //     //         { mob01: ['こんにちは、この先は危ないよ。\n', '準備した方が良いんじゃない？\n'] },
    //     //     ],
    //     //     talk002: [
    //     //         { lamy: ['あぁもう！どっかいけ！\n', '私はお腹すいてんだ！！\n'] },
    //     //         { player: ['元気だなぁ\n'] }
    //     //     ],
    //     //     talk003: [
    //     //         { mob02: ['異世界転生したのに魔法とか全く使えず\n', '体力も気力も無い設定のおっさんです。\n'] },
    //     //         { player: ['イラスト制作時間は30分らしいよ\n'] },
    //     //         { mob02: ['こんなモブに30分も使ってくださるなんて。。。\n'] },
    //     //         { player: ['自己肯定感も無い！！\n'] },
    //     //     ]
    //     // }
    // }

    // /**
    //  * Jsonファイルを使用する前のコード、現在は未使用。
    //  * モジュール化すると簡単な修正のたびにデプロイが必要になるため、Jsonファイルを使用するように変更した。
    //  * @returns 
    //  */
    // // public getBubbleTalkData(): TalkLine[] | null {
    // //     const bubbletalkKey = this.bubbletalkKey;
    // //     const bubbleKey: string = bubbletalkKey.split('.')[0];
    // //     const talkKey: string = bubbletalkKey.split('.')[1];

    // //     //検索の結果が無しの場合
    // //     if (!this.bubbleTalkData[bubbleKey]?.[talkKey]) {
    // //         return this.bubbleTalkData['bubbleTalk0000']?.['talk000'] ?? null;
    // //     }

    // //     return this.bubbleTalkData[bubbleKey]?.[talkKey] ?? null;
    // // }

    /**
     * JSONファイルから会話データを取得する
     * @param scene 
     * @returns 
     */
    public getBubbleTalkDataJson(scene: Phaser.Scene): TalkLine[] | null {

        //Jsonファイルから会話データを取得する
        const bubbleTalkData = scene.cache.json.get('bubbleTalkData').bubbleTalkData;

        const bubbletalkKey = this.bubbletalkKey;
        const bubbleKey: string = bubbletalkKey.split('.')[0];
        const talkKey: string = bubbletalkKey.split('.')[1];

        //検索の結果が無しの場合
        if (!bubbleTalkData[bubbleKey]?.[talkKey]) {
            return bubbleTalkData['bubbleTalk0000']?.['talk000'] ?? null;
        }

        return bubbleTalkData[bubbleKey]?.[talkKey] ?? null;
    }

}