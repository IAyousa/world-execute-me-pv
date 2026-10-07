import React from 'react';
import { Composition } from 'remotion';
import { FullPV } from './FullPV';

const FPS = 30;
const W = 1920, H = 1080;
const DURATION_S = 211.8;

export const Root: React.FC = () => (
  <Composition
    id="FullPV" component={FullPV}
    durationInFrames={Math.round(DURATION_S * FPS)} fps={FPS} width={W} height={H}
  />
);
