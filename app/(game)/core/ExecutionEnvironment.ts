import { GameStateManager } from '@/app/(game)/core/GameStateManager';

export class ExecutionEnvironment {

    constructor() { }

    public updateHighDraw = (): void => {

        //状態管理クラス
        const gameStateManager = GameStateManager.getInstance();

        //実行環境の情報を更新
        if (this.isBowserSmartPhone() || this.isPWA()) {
            gameStateManager.updateState({ highDraw: false }, 'system');
        } else {
            gameStateManager.updateState({ highDraw: true }, 'system');
        }
    }
    

    public isDebug() {
        let result = false;

        //状態管理クラス
        const gameStateManager = GameStateManager.getInstance();

        // UserAgentからのスマホ判定
        if (gameStateManager.isDebugMode) {
            console.log("デバッグ・開発モード")
            result = true;
        }
        return result;
    }

    
    //ブラウザPC判定
    public isBowserPC = (): boolean => {
        let result = false;

        // UserAgentからスマホ判定
        if (!navigator.userAgent.match(/iPhone|Android.+Mobile/)) {
            console.log("PC画面")
            result = true;
        }
        return result;
    };

    //ブラウザスマートフォン判定
    public isBowserSmartPhone = (): boolean => {
        let result = false;

        // UserAgentからスマホ判定
        if (navigator.userAgent.match(/iPhone|Android.+Mobile/)) {
            console.log("スマホ画面")
            result = true;
        }
        return result;
    };

    public isPWA(): boolean {
        // 1. SSR（サーバーサイド）対策
        if (typeof window === 'undefined') return false;

        const nav = window.navigator as Navigator & { standalone?: boolean };

        // 標準的な判定
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isfullscreen = window.matchMedia('(display-mode: fullscreen)').matches;

        // iOS Safari 用の判定
        const isIOSStandalone = nav.standalone === true;

        return isStandalone || isIOSStandalone || isfullscreen;
    };

    public isElectron(): boolean {
        // 必要なプロパティだけを持つ型を定義
        interface ElectronProcess extends NodeJS.Process {
            type: string;
        }

        const proc = window.process as unknown as ElectronProcess;

        const check = (
            (typeof window !== 'undefined' && typeof proc === 'object' && proc.type === 'renderer') ||
            (typeof navigator === 'object' && navigator.userAgent.includes('Electron'))
        );

        if (check) {
            console.log("Electron環境です");
            return true;
        }
        return false;
    }
}