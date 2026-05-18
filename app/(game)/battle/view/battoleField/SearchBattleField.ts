import { BattleScene } from "@/app/(game)/lib/types";
import { cave } from "./cave";
import { hill } from "./hill";
import { DefaultField } from "./DefaultField";

export class SearchBattleField {

    constructor() { }

    public searchEventClass(battleScene: BattleScene, battleFieldKey: string) {
        if (battleFieldKey === 'battle_hill') { return new hill(battleScene); }
        if (battleFieldKey === 'battle_cave') { return new cave(battleScene); }

        // どの条件にも合致しない場合はここに到達する
        console.warn(`未知の battleFieldKey が指定されました: ${battleFieldKey}`);

        // デフォルトのフィールドを返してクラッシュを防ぐ
        return new DefaultField(battleScene);
    }
}