import { BattleScene } from "@/app/(game)/lib/types";
import { cave } from "./cave";
import { hill } from "./hill";

export class SearchBattleField {

    constructor() { }

    public searchEventClass(battleScene: BattleScene, battleFieldKey: string) {
        if (battleFieldKey === 'battle_hill') { return new hill(battleScene); }
        if (battleFieldKey === 'battle_cave') { return new cave(battleScene); }
    }
}