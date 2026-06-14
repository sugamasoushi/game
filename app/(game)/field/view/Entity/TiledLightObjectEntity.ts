/**
 * 元データの型定義（配列の各要素）
 */
interface PropertyItem {
    name: string;
    type: string;
    value: string | number;
}

/**
 * データの取得と加工（パス置換など）を管理するラッパークラス
 */
export class TiledLightObjectEntity {
    private readonly dataMap: Map<string, string | number>;

    constructor(rawData: PropertyItem[]) {
        // コンストラクタでMapに変換し、検索を効率化
        this.dataMap = new Map(rawData.map((item) => [item.name, item.value]));
    }

    get color(): string {
        const value = this.dataMap.get("color");
        return typeof value === "string" ? value :  "";
    }

    get intensity(): number {
        const value = this.dataMap.get("intensity");
        return typeof value === "number" ? value : 0;
    }

    get radius(): number {
        const value = this.dataMap.get("radius");
        return typeof value === "number" ? value : 1;
    }

    get type(): string {
        const value = this.dataMap.get("type");
        return typeof value === "string" ? value : "";
    }

    get scrollX(): number | undefined {
        const value = this.dataMap.get("scrollX");
        return typeof value === "number" ? value : undefined;
    }

    get scrollY(): number | undefined {
        const value = this.dataMap.get("scrollY");
        return typeof value === "number" ? value : undefined;
    }
}