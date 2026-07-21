// import { FieldScene } from "@/app/(game)/lib/types";
// import { Npc } from "./Npc";

// export class SpriteType_4x4 extends Npc {
//     shadowFlag = true;

//     constructor(fieldScene: FieldScene, x: number, y: number, npcType: string, spriteSheetKey: string, spritesheetKeyOrder: string, characterName: string, initStandKey: string, imageKey: string, bubbleTalkKey: string) {
//         super(fieldScene, x, y, npcType, spriteSheetKey, imageKey, bubbleTalkKey);
//         this._animationSetting(spriteSheetKey, spritesheetKeyOrder);
//     }

//     //アニメーション設定
//     //charKeyはアニメーションテクスチャ名およびキャラ名に使用する
//     _animationSetting(spriteSheetKey: string, spritesheetKeyOrder: string) {
//         this.setupDirectionalAnimations(
//             spriteSheetKey,
//             spritesheetKeyOrder,
//             4,
//             10,
//             { repeat: -1 },
//             { repeat: -1 },
//             0
//         );
//     }
// }
