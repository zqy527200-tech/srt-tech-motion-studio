import {registerRoot} from 'remotion';
import React from 'react';
import {Composition} from 'remotion';
import {TechVideo} from './Video';
import {demoScenes} from './scenes';
const Root: React.FC = () => <Composition id="TechVideo" component={TechVideo} durationInFrames={Math.max(1, Math.ceil(demoScenes[demoScenes.length-1].end*30))} fps={30} width={1080} height={1920} defaultProps={{scenes:demoScenes,transparent:false}}/>;
registerRoot(Root);
