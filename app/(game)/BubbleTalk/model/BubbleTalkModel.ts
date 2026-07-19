import { BubbleTalkData } from "@/app/(game)/Data/BubbleTalkData";
import { Scene } from "phaser";

type TalkLine = { [chara: string]: string[] };

export class BubbleTalkModel {
    private bubbleTalkData: BubbleTalkData;
    private talkData: TalkLine[] | null = null;

    constructor(private bubbleTalkKey: string) {
        this.bubbleTalkData = new BubbleTalkData(this.bubbleTalkKey);
    }

    public init(scene: Scene) {
        this.talkData = this.bubbleTalkData.getTalkData(scene);
    }

    public getTalkData(): TalkLine[] | null {
        return this.talkData;
    }
}
