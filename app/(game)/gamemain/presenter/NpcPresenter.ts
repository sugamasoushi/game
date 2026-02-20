import { GameScene, State } from "../../lib/types";
import { InputManager } from "../../core/input/InputManager";
import { FieldPresenter } from "./FieldPresenter";

import { FieldMapModel } from "../model/FieldMapModel";
import { DataDefinition } from '../../Data/DataDefinition';

export class NpcPresenter {

    constructor(
        private gameScene: GameScene,
        private fieldMapModel: FieldMapModel,
        private fieldPresenter: FieldPresenter,
        private inputManager: InputManager
    ) { }

    public execute() {
        /**
         * このクラスにNPCの操作を移動したいが、後回しにする
         * 今のところは各スプライトで描画や移動を詰め込んでいる状態
         * NPCは外部からの入力は吹き出し会話くらいしか無く、MVPデザインから逸脱しすぎているわけでは無いと評価
         */

    }





}