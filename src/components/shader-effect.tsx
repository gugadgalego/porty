"use client";

import {
  Shader,
  CRTScreen,
  CursorTrail,
  ImageTexture,
  Pixelate,
  Spherize,
  VHS,
} from "shaders/react";

export function ShaderEffect() {
  return (
    <Shader className="size-full min-h-[200px]">
      <ImageTexture
        objectFit="contain"
        url="https://data.shaders.com/storage/v1/object/public/user-uploaded-images/user_3CfsWiRipzJElZrstKNHEySeuqn/Gk_eotPbUWnQ.jpg"
      />
      <Pixelate>
        <CursorTrail
          colorA="#ffffff"
          colorB="#262626"
          visible={true}
        />
      </Pixelate>
      <Spherize depth={0.2} radius={2} />
      <CRTScreen
        pixelSize={{
          type: "map",
          source: "",
          channel: "alpha",
          inputMax: 1,
          inputMin: 0,
          outputMax: 128,
          outputMin: 8,
        }}
        visible={true}
      />
      <VHS
        visible={true}
        wobble={{
          axis: "y",
          type: "mouse",
          outputMax: 5,
          outputMin: 0,
        }}
      />
    </Shader>
  );
}
