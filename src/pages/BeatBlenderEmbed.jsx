import React from "react";

export default function BeatBlenderEmbed() {
  return (
    <div style={{ height: "calc(100vh - 80px)" }}>
      <iframe
        title="Beat Blender"
        src="/beat-blender/index.html"
        style={{ width: "100%", height: "100%", border: 0 }}
      />
    </div>
  );
}