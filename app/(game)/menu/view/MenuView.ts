import { FieldScene } from '../../lib/SceneTypes';
import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { ConditionWindow } from "./ConditionWindow";
import { ItemWindow } from "./ItemWindow";
import { EquipWindow } from "./EquipWindow";
import { SkillWindow } from "./SkillWindow";
import { CharStatusWindow } from "./CharStatusWindow";
import { SaveWindow } from "./SaveWindow";
import { MovieWindow } from "./MovieWindow";

export class MenuView {

    private scene: Phaser.Scene;
    private fieldScene: FieldScene;
    private menuModel: MenuModel;

    public mainColumnWindow: MainColumnWindow;
    public conditionWindow: ConditionWindow;
    public itemWindow: ItemWindow;
    public equipWindow: EquipWindow;
    public skillWindow: SkillWindow;
    public charStatusWindow: CharStatusWindow;
    public saveWindow: SaveWindow;
    public movieWindow: MovieWindow;

    constructor(scene: Phaser.Scene, fieldScene: FieldScene, menuModel: MenuModel) {
        this.scene = scene;
        this.fieldScene = fieldScene;
        this.menuModel = menuModel;

        this.mainColumnWindow = new MainColumnWindow(this.scene, this.menuModel);
        this.conditionWindow = new ConditionWindow(this.scene, this.menuModel);
        this.itemWindow = new ItemWindow(this.scene, this.menuModel);
        this.equipWindow = new EquipWindow(this.scene, this.menuModel);
        this.skillWindow = new SkillWindow(this.scene, this.menuModel);
        this.charStatusWindow = new CharStatusWindow(this.scene, this.menuModel);
        this.saveWindow = new SaveWindow(this.scene, this.menuModel);
        this.movieWindow = new MovieWindow(this.scene, this.menuModel);
    }

    public create() {
        // 大枠とタブを作成
        this.mainColumnWindow.create();

        // 各タブのコンテナを作成
        this.conditionWindow.create(this.mainColumnWindow);
        this.itemWindow.create(this.mainColumnWindow);
        this.equipWindow.create(this.mainColumnWindow);
        this.skillWindow.create(this.mainColumnWindow);
        this.charStatusWindow.create(this.mainColumnWindow);
        this.saveWindow.create(this.mainColumnWindow);
        this.movieWindow.create(this.mainColumnWindow);

        // 各コンテナをMainColumnWindowへ登録し、Tweenアニメーションで動かせるようにする
        this.mainColumnWindow.setContainers([
            this.conditionWindow,
            this.itemWindow,
            this.equipWindow,
            this.skillWindow,
            this.charStatusWindow,
            this.saveWindow,
            this.movieWindow,
        ]);
    }

    public executeEndAnimation(onComplete: () => void) {
        this.mainColumnWindow.executeEndAnimation(onComplete);
    }

    /** MenuScene の停止経路（タイトルへ戻る、ゲーム再起動など）用の後始末。 */
    public destroy() {
        this.mainColumnWindow.destroy();
    }
}
