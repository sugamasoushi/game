import { TitleSelect } from "../../lib/TitleTypes";
import { OptionData } from "../../lib/FieldTypes";
import { VolumeItem, VolumeItemType } from "../view/Option";
import { SaveDataManager } from "../../core/SaveDataManager";
import { Title } from "../../scenes/Title";
import { GameStateManager } from "../../core/GameStateManager";
import { ExecutionEnvironment } from '@/app/(game)/core/ExecutionEnvironment';

export class TitleModel {
    public nowSelectNo: number = TitleSelect.NEWGAME;//初期値
    public minSelectNo: number = TitleSelect.NEWGAME;
    public maxSelectNo: number = TitleSelect.OMAKE;
    public hasContinueData: boolean = false;
    public isOptionActive: boolean = false;
    public isOmakeActive: boolean = false;
    private gameClearFlg: boolean = false;
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

    public async loadSaveData(): Promise<void> {
        this.hasContinueData = await this.saveDataManager.loadSaveDataToChache(this.titleScene);

        //セーブデータが存在する場合
        if (this.hasContinueData) {
            this.nowSelectNo = TitleSelect.CONTINUE;

            //クリアフラグ
            if (this.titleScene.cache.json.get('savedata').GameClearFlg as boolean) {
                const flg = this.titleScene.cache.json.get('savedata').GameClearFlg as boolean
                this.gameStateManager.updateState({ gameClearFlg: flg }, 'system')
            }
        }
    }

    /** savedata から音量データを読み込み、optionData と GameStateManager の両方を更新する */
    public async loadOptionData(): Promise<void> {
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

        const env = new ExecutionEnvironment();

        //描画モード、仮想パッド
        if (this.saveDataManager.loadHighDrawFlg() !== undefined || null) {

            //セーブデータが存在する場合
            this.updateHighDraw(this.saveDataManager.loadHighDrawFlg());
            this.updateVirtualPad(this.saveDataManager.loadHighDrawFlg());

        } else if (env.isBowserSmartPhone() || env.isPWA()) {
            console.log('スマホ版')
            this.updateHighDraw(false);
            this.updateVirtualPad(true);

        } else {
            console.log('PC版')
            this.updateHighDraw(true);

            //一旦必ずONにする
            // this.updateVirtualPad(false);
            this.updateVirtualPad(true);
        }

        // this.saveDataManager.writeSaveData(this.titleScene);

        //デバッグモード
        if (env.isDebug()) {
            this.updateHighDraw(true);
            this.updateVirtualPad(true);
        }
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

    /** 描画モードフラグを更新 */
    public updateHighDraw(flg: boolean) {
        this.gameStateManager.updateState({ highDraw: flg }, 'system');
    }

    /** 仮想パッドフラグを更新 */
    public updateVirtualPad(flg: boolean) {
        this.gameStateManager.updateState({ virtualPad: flg }, 'system');
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
    get isGameClearFlg(): boolean { return this.gameClearFlg; }
}
