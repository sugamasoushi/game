export class ExecutionEnvironment {

    constructor() { }

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