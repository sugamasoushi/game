"use client";
import dynamic from "next/dynamic";

// PhaserGameコンポーネントをSSR無効で動的にインポート
const PhaserGame = dynamic(() => import("./PhaserGame").then(mod => mod.PhaserGame), { ssr: false });

export default function GamePage() {
  return (
    <main id="app">
      <PhaserGame />
    </main>
  );
}