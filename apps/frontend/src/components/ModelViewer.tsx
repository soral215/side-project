/* eslint-disable react/no-unknown-property */
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import React, { Suspense } from 'react';

const GltfModel = ({ url }: { url: string }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
};

export const ModelViewer = ({ url }: { url: string }) => {
  return (
    <div className="w-full h-[520px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <Canvas camera={{ position: [0, 1, 3], fov: 50 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 3, 3]} intensity={1.2} />
        <Suspense fallback={null}>
          <GltfModel url={url} />
        </Suspense>
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
};


