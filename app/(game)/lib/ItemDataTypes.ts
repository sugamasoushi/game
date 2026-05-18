export interface ItemDetail {
    name: string;
    type: string;
    description: string;
    subject: string;
    effectClassName?: string;
    value: number;
    selectComment: string;
}

export interface ItemData {
    infomation: string;
    none: { [key: string]: ItemDetail };
    freeitem: { [key: string]: ItemDetail };
}
