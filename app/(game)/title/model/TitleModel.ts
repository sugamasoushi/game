import { TitleSelect } from "../../lib/TitleTypes";
import { OptionData } from "../../lib/FieldTypes";
import { VolumeItem, VolumeItemType } from "../view/Option";
import { SaveDataManager } from "../../core/SaveDataManager";
import { Title } from "../../scenes/Title";
import { GameStateManager } from "../../core/GameStateManager";

export class TitleModel {
    public nowSelectNo: number = TitleSelect.NEWGAME;//初期値
    public minSelectNo: number = TitleSelect.NEWGAME;
    public maxSelectNo: number = TitleSelect.OMAKE;
    public hasContinueData: boolean = false;
    public isOptionActive: boolean = false;
    public isOmakeActive: boolean = false;
    private saveDataManager: SaveDataManager;
    private gameStateManager: GameStateManager;

    private optionData: OptionData = {
        masterVolume: 100,
        bgmVolume: 100,
        bgsVolume: 100,
        seVolume: 100,
        textSpeed: 50,
    };

    constructor(private titleScene: Title) {
        this.saveDataManager = new SaveDataManager();
        // コンストラクタ時点でシングルトンを確保（同一インスタンス保証）
        this.gameStateManager = GameStateManager.getInstance();
    }

    // public async checkSaveData(): Promise<boolean> {
    //     this.hasContinueData = await this.saveDataManager.checkSaveData();
    //     if (this.hasContinueData) {
    //         this.nowSelectNo = TitleSelect.CONTINUE;
    //     }
    //     return this.hasContinueData;
    // }

    public async loadSaveData(): Promise<void> { 
         this.hasContinueData = await this.saveDataManager.loadSaveData(this.titleScene); 
         if (this.hasContinueData) {
            this.nowSelectNo = TitleSelect.CONTINUE;
        }
    }

    /** savedata から音量データを読み込み、optionData と GameStateManager の両方を更新する */
    public loadOptionData() {
        const sv = this.titleScene.cache.json.get('savedata').OptionData as OptionData;

        // optionData を savedata の値で同期させる
        this.optionData.masterVolume = sv.masterVolume;
        this.optionData.bgmVolume = sv.bgmVolume;
        this.optionData.bgsVolume = sv.bgsVolume;
        this.optionData.seVolume = sv.seVolume;
        this.optionData.textSpeed = sv.textSpeed;

        // GameStateManager へ反映（Option シーンの購読に通知）
        this.gameStateManager.setOptionData(
            sv.masterVolume,
            sv.bgmVolume,
            sv.bgsVolume,
            sv.seVolume,
            sv.textSpeed
        );

        //console.log(this.titleScene.cache.json.get('savedata'));
    }

    /** 現在の optionData を GameStateManager へ反映する */
    public updateOptionData() {
        this.gameStateManager.setOptionData(
            this.optionData.masterVolume,
            this.optionData.bgmVolume,
            this.optionData.bgsVolume,
            this.optionData.seVolume,
            this.optionData.textSpeed
        );
    }

    public setPendingVolume(item: VolumeItemType, volume: number) {
        const clamped = Math.min(100, Math.max(0, volume));
        switch (item) {
            case VolumeItem.MASTER: this.optionData.masterVolume = clamped; break;
            case VolumeItem.BGM: this.optionData.bgmVolume = clamped; break;
            case VolumeItem.BGS: this.optionData.bgsVolume = clamped; break;
            case VolumeItem.SE: this.optionData.seVolume = clamped; break;
            case VolumeItem.TEXT_SPEED: this.optionData.textSpeed = clamped; break;
        }
    }

    get currentOptionData(): OptionData { return this.optionData; }
}
