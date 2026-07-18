import { Title } from '../../scenes/Title';
import { TitleSelect } from '../../lib/TitleTypes';
import { TitleModel } from '../model/TitleModel';
import { Option, VolumeItem, VolumeItemType } from '../view/Option';
import { Omake } from '../view/Omake';
import { Opening } from '../view/Opening';
import { TitleLogo } from '../view/TitleLogo';
import { NewGameButton } from '../view/NewGameButton';
import { ContinueButton } from '../view/ContinueButton';
import { OptionButton } from '../view/OptionButton';
import { OmakeButton } from '../view/OmakeButton';
import { ManualButton } from '../view/ManualButton';

import { InputManager } from '../../core/input/InputManager';
import { GameStateManager } from '../../core/GameStateManager';
import { Subscription, throttleTime } from 'rxjs';
import { State } from '../../lib/StateTypes';
import { EventFlagData } from '../../Data/EventFlagData';
import { EventBus } from '../../EventBus';

export class TitlePresenter {
    private subs = new Subscription();
    private inputManager: InputManager;
    private manager: GameStateManager;
    private isOmakeFlg: boolean = true;

    constructor(
        private scene: Title,
        private titleModel: TitleModel,
        private option: Option,
        private omake: Omake,
        private opening: Opening,
        private logo: TitleLogo,
        private newGameButton: NewGameButton,
        private continueButton: ContinueButton,
        private optionButton: OptionButton,
        private omakeButton: OmakeButton,
        private manualButton: ManualButton
    ) {
        this.manager = GameStateManager.getInstance();
    }

    public update(time: number, delta: number) {
        void time;
        void delta;
    }

    public async execute() {

        // セーブデータを読み込み
        await this.titleModel.loadSaveData();

        // オプションデータ・描画モードを読み込み
        await this.titleModel.loadOptionData();

        // オープニングアニメーションとタイトルテキストの表示
        await this.opening.playOpening();
        await this.logo.showTitleText();

        // ボタン
        await this.newGameButton.createMenuButtons();
        await this.continueButton.createMenuButtons(this.titleModel.hasContinueData);
        await this.optionButton.createMenuButtons();
        await this.omakeButton.createOmakeButtons();
        await this.manualButton.createManualButtons();

        //おまけボタンの非表示設定
        if (!this.manager.isGameClearFlg) {

            //本番の場合は処理
            if (!this.manager.isDebugMode) {

                //項目を非表示、選択項目数を更新
                this.isOmakeFlg = false;
                this.omakeButton.omakeVisible();
                this.titleModel.maxSelectNo--;
            }
        }

        // 入力のセットアップ
        this.inputManager = InputManager.getInstance(this.scene);
        this.setupInput();
        this.setupViewCallbacks();

        this.enableInteractiveAll();

        // 選択状態の初期更新
        this.updateSelection();

        // 外部にシーンレディを通知
        EventBus.emit('current-scene-ready', this.scene);
    }

    // コールバックの設定
    private setupViewCallbacks() {
        /**
         * ボタンの関数が実行されたらpresenterの関数を実行
         */
        this.newGameButton.onNewGame = () => this.execNewGame();
        this.continueButton.onContinue = () => this.execContinue();
        this.optionButton.onOption = () => this.execOption();
        this.omakeButton.onOmake = () => this.execOmake();
        this.manualButton.onOmake = () => this.execManual();

        this.option.onVolumeClick = (item: VolumeItemType, volume: number) => this.onOptionVolumeClick(item, volume);
        this.option.onRenderModeClick = (highDraw: boolean) => this.onOptionRenderModeClick(highDraw);
        this.option.onVirtualPadClick = (virtualPad: boolean) => this.onOptionVirtualPadClick(virtualPad);

        // オプション画面の✖ボタンが押されたらcloseOptionを実行
        // ※ hideOptionMenuはbackSubmit内で既に呼ばれるため、ここではモデル状態の更新とボタン復帰のみ行う
        this.option.onBack = () => this.onOptionBack();
        this.omake.onBack = () => this.onOmakeBack();
    }

    private setupInput() {
        //const duration = GameSettingData.getInputSettings(this.scene).duration;
        const duration = 200;

        // 下キー
        this.subs.add(this.inputManager.downButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (this.titleModel.isOptionActive || this.titleModel.isOmakeActive) return;

            // 選択Noの更新（CONTINUE が無効ならスキップする）
            do {
                this.titleModel.nowSelectNo++;

                // 最大値を超えたらNEWGAMEに戻す
                if (this.titleModel.nowSelectNo > this.titleModel.maxSelectNo) {
                    this.titleModel.nowSelectNo = TitleSelect.NEWGAME;
                }
                // もし CONTINUE が無効ならループして次の選択肢へ進む
            } while (this.titleModel.nowSelectNo === TitleSelect.CONTINUE && !this.titleModel.hasContinueData);

            this.updateSelection();
        }));

        // 上キー
        this.subs.add(this.inputManager.upButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (this.titleModel.isOptionActive || this.titleModel.isOmakeActive) return;

            // 選択Noの更新（CONTINUE が無効ならスキップする）
            do {
                this.titleModel.nowSelectNo--;

                // 最小値を下回ったらOPTIONに戻す
                if (this.titleModel.nowSelectNo < this.titleModel.minSelectNo) {
                    if (this.isOmakeFlg) {
                        this.titleModel.nowSelectNo = TitleSelect.OMAKE;
                    } else {
                        this.titleModel.nowSelectNo = TitleSelect.OPTION;
                    }
                }
                // もし CONTINUE が無効ならループして前の選択肢へ戻る
            } while (this.titleModel.nowSelectNo === TitleSelect.CONTINUE && !this.titleModel.hasContinueData);

            this.updateSelection();
        }));

        this.subs.add(this.inputManager.decideButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {

            // オプション画面表示中は処理しない
            if (this.titleModel.isOptionActive) return;
            if (this.titleModel.isOmakeActive) {
                this.omake.decide();
                return;
            }

            // 各ボタンの実行
            switch (this.titleModel.nowSelectNo) {
                case TitleSelect.NEWGAME:
                    this.execNewGame();
                    break;
                case TitleSelect.CONTINUE:
                    this.execContinue();
                    break;
                case TitleSelect.OPTION:
                    this.execOption();
                    break;
                case TitleSelect.OMAKE:
                    this.execOmake();
                    break;
            }
        }));

        // オプション画面用入力
        this.subs.add(this.inputManager.leftButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.titleModel.isOptionActive) return;
            this.adjustVolume(-10);
        }));

        this.subs.add(this.inputManager.rightButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.titleModel.isOptionActive) return;
            this.adjustVolume(10);
        }));

        // オプション・おまけ画面中の上下キーはフォーカス移動
        this.subs.add(this.inputManager.upButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (this.titleModel.isOptionActive) this.option.focusPrev();
            if (this.titleModel.isOmakeActive) this.omake.focusPrev();
        }));

        this.subs.add(this.inputManager.downButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (this.titleModel.isOptionActive) this.option.focusNext();
            if (this.titleModel.isOmakeActive) this.omake.focusNext();
        }));

        this.subs.add(this.inputManager.cancelButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (this.titleModel.isOptionActive) this.closeOption();
            if (this.titleModel.isOmakeActive) this.closeOmake();
        }));
    }

    private async execNewGame() {
        console.log("execNewGame");

        this.disableInteractiveAll();

        /**
         * 初期データはLoadシーンで読み込むため、ここでは状態の更新のみ行う
         */

        // 決定演出
        await this.newGameButton.playDecideEffect();

        // 状態をロードに更新
        this.manager.updateState({
            state: State.LOAD,
            fieldData: {
                gameMode: 'New Game',
                mapKey: '0101',
                x: 495,
                y: 337,
                x2: 0,
                y2: 0,
                initStandKey: 'stand_left',
            }
        }, 'New Game');

        this.opening.stopOpening();

        this.scene.events.emit('OPENING_MUSIC_END');
        this.scene.scene.stop();
    }

    private async execContinue() {

        this.disableInteractiveAll();

        // 決定演出
        await this.continueButton.playDecideEffect();

        // ローカルストレージ等のデータを読み込み
        //await this.titleModel.loadSaveData(this.scene);

        // 状態を更新
        this.manager.updateState({
            state: State.LOAD,
            fieldData: {
                gameMode: 'Continue',
                mapKey: this.scene.cache.json.get('savedata').playerData.PlayerMapKey,
                x: this.scene.cache.json.get('savedata').playerData.PlayerPosition.x,
                y: this.scene.cache.json.get('savedata').playerData.PlayerPosition.y,
                x2: 0,
                y2: 0,
                initStandKey: this.scene.cache.json.get('savedata').playerData.initStandKey,
            }
        }, 'Continue');

        // コンティニューの場合、初期イベントのフラグを倒す
        EventFlagData.updateFlag(this.scene, 'EVENT0001', false);

        this.opening.stopOpening();

        this.scene.events.emit('OPENING_MUSIC_END');
        this.scene.scene.stop();
    }

    //オプションウィンドウ表示
    private execOption() {
        if (this.titleModel.isOptionActive) return;
        this.titleModel.isOptionActive = true;

        this.disableInteractiveAll();

        const currentVolumes = this.manager.currentOptionData;
        this.option.showOptionMenu(currentVolumes, this.manager.isHighDraw, this.manager.isVirtualPad);
    }

    private execOmake() {
        if (this.titleModel.isOmakeActive) return;
        this.titleModel.isOmakeActive = true;

        this.disableInteractiveAll();

        this.omake.showOmake();
    }

    private execManual() {
        if (this.titleModel.isOmakeActive) return;
        this.titleModel.isOmakeActive = true;

        this.disableInteractiveAll();

        this.omake.showOmake();
    }

    private closeOmake() {
        if (!this.titleModel.isOmakeActive) return;
        this.titleModel.isOmakeActive = false;

        this.omake.hideOmakeMenu();
        this.enableInteractiveAll();
        this.updateSelection();
    }

    private onOmakeBack() {
        if (!this.titleModel.isOmakeActive) return;
        this.titleModel.isOmakeActive = false;

        this.enableInteractiveAll();
        this.updateSelection();
    }

    //オプション選択
    private adjustVolume(delta: number) {
        const item = this.option.getFocusedItem();

        //描画モードの選択の場合
        if (item === VolumeItem.RENDER_MODE) {
            const highDraw = this.option.cycleRenderMode(delta);
            this.titleModel.updateHighDraw(highDraw);
            return;
        }

        //仮想パッドの選択の場合
        if (item === VolumeItem.VIRTUAL_PAD_SELECT) {
            const virtualPad = this.option.cycleVirtualPad(delta);
            this.titleModel.updateVirtualPad(virtualPad);
            return;
        }

        const currentVol = this.option.getFocusedVolume();
        const newVol = Phaser.Math.Clamp(currentVol + delta, 0, 100);

        this.option.setPendingVolume(item, newVol);
        this.titleModel.setPendingVolume(item, newVol);
        this.titleModel.updateOptionData();
    }

    private onOptionVolumeClick(item: VolumeItemType, volume: number) {
        this.option.setPendingVolume(item, volume);
        this.titleModel.setPendingVolume(item, volume);
        this.titleModel.updateOptionData();
    }

    private onOptionRenderModeClick(highDraw: boolean) {
        this.option.setPendingHighDraw(highDraw);
        this.titleModel.updateHighDraw(highDraw);
    }

    private onOptionVirtualPadClick(virtualPad: boolean) {
        this.option.setPendingVirtualPad(virtualPad);
        this.titleModel.updateVirtualPad(virtualPad);
    }

    private closeOption() {
        if (!this.titleModel.isOptionActive) return;
        this.titleModel.isOptionActive = false;

        this.option.hideOptionMenu();
        this.enableInteractiveAll();

        // 選択状態の更新
        this.updateSelection();
    }

    /** ✖ボタン経由で閉じる（hideOptionMenuはOption側で実行済みのため呼ばない） */
    private onOptionBack() {
        if (!this.titleModel.isOptionActive) return;
        this.titleModel.isOptionActive = false;

        this.enableInteractiveAll();
        this.updateSelection();
    }

    public updateSelection() {

        this.newGameButton.noSelect();
        this.continueButton.noSelect();
        this.optionButton.noSelect();
        this.omakeButton.noSelect();

        //NewGame選択中
        if (this.titleModel.nowSelectNo == TitleSelect.NEWGAME) {
            this.newGameButton.selection();
            this.continueButton.noSelect();
            this.optionButton.noSelect();
            this.omakeButton.noSelect();
        }

        //Continue選択中
        if (this.titleModel.nowSelectNo == TitleSelect.CONTINUE) {
            if (this.titleModel.hasContinueData) {
                this.continueButton.selection();
                this.newGameButton.noSelect();
                this.optionButton.noSelect();
                this.omakeButton.noSelect();
            }
        }

        //おぷしょん選択中
        if (this.titleModel.nowSelectNo == TitleSelect.OPTION) {
            this.optionButton.selection();
            this.newGameButton.noSelect();
            this.continueButton.noSelect();
            this.omakeButton.noSelect();
        }

        //おまけ選択中
        if (this.titleModel.nowSelectNo == TitleSelect.OMAKE) {
            this.omakeButton.selection();
            this.newGameButton.noSelect();
            this.continueButton.noSelect();
            this.optionButton.noSelect();
        }
    }

    public disableInteractiveAll() {
        this.newGameButton.disableInteractive();
        this.continueButton.disableInteractive();
        this.optionButton.disableInteractive();
        this.omakeButton.disableInteractive();
        this.manualButton.disableInteractive();
    }

    public enableInteractiveAll() {
        this.newGameButton.enableInteractive();
        if (this.titleModel.hasContinueData) {
            this.continueButton.enableInteractive();
        }
        this.optionButton.enableInteractive();
        this.omakeButton.enableInteractive();
        this.manualButton.enableInteractive();
    }

    public destroy() {
        this.subs.unsubscribe();
    }
}
