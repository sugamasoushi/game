/**
 * 元データの型定義（配列の各要素）
 */
interface PropertyItem {
    name: string;
    type: string;
    value: string | number | boolean;
}

/**
 * データの取得と加工（パス置換など）を管理するラッパークラス
 */
export class TiledObjectEntity {
    private readonly dataMap: Map<string, string | number | boolean>;

    constructor(rawData: PropertyItem[]) {
        // コンストラクタでMapに変換し、検索を効率化
        this.dataMap = new Map(rawData.map((item) => [item.name, item.value]));
    }

    get filepath(): string {
        const value = this.dataMap.get("filepath");
        if (typeof value !== "string") return "";

        //画像パスの取得（".." を "assets" に置換）
        return value.replace(/^\.\./, "assets");
    }

    get id(): number {
        const value = this.dataMap.get("id");
        return typeof value === "number" ? value : 0;
    }

    get name(): string {
        const value = this.dataMap.get("name");
        return typeof value === "string" ? value : "";
    }

    get bubbleTalkDefaultKey(): string {
        const value = this.dataMap.get("bubbleTalkDefaultKey");
        return typeof value === "string" ? value : "";
    }

    get bubbleTalkKeyEventOff(): string {
        const value = this.dataMap.get("bubbleTalkKeyEventOff");
        return typeof value === "string" ? value : "";
    }

    get bubbleJugeEventKey(): string {
        const value = this.dataMap.get("bubbleJugeEventKey");
        return typeof value === "string" ? value : "";
    }

    get link(): number {
        const value = this.dataMap.get("link");
        return typeof value === "number" ? value : 0;
    }

    get npcType(): string {
        const value = this.dataMap.get("npcType");
        return typeof value === "string" ? value : "normal";
    }

    get spriteType(): string {
        const value = this.dataMap.get("spriteType");
        return typeof value === "string" ? value : "";
    }

    get standkey(): string {
        const value = this.dataMap.get("standkey");
        return typeof value === "string" ? value : "";
    }

    get isVisible(): boolean {
        const value = this.dataMap.get("visible");
        return typeof value === "boolean" ? value : false;
    }

    get imageKey(): string {
        const value = this.dataMap.get("imageKey");
        return typeof value === "string" ? value : "";
    }

    get spritesheetKey(): string {
        const value = this.dataMap.get("spritesheetKey");
        return typeof value === "string" ? "tex_" + value : "";
    }

    get scale(): number {
        const value = this.dataMap.get("scale");
        return typeof value === "number" ? value : 1;
    }

    get createJudgeEventKey(): string {
        const value = this.dataMap.get("createJudgeEventKey");
        return typeof value === "string" ? value : "";
    }

    get spritesheetKeyOrder(): string {
        const value = this.dataMap.get("spritesheetKeyOrder");
        return typeof value === "string" ? value : "";
    }
}