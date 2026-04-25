'use client';
import { Suspense, lazy, useState } from 'react';
import { motion } from 'framer-motion';

const Spline = lazy(() => import('@splinetool/react-spline'));

function OrbFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="orb-fallback w-full h-full rounded-full" />
    </div>
  );
}

export function SplineScene({
  scene,
  className,
  targetOpacity = 1,
}: {
  scene: string;
  className?: string;
  targetOpacity?: number;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <OrbFallback />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: targetOpacity }}
      transition={{ duration: 2, ease: 'easeOut' }}
      className={className}
    >
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <SplineInner scene={scene} onError={() => setHasError(true)} />
      </Suspense>
    </motion.div>
  );
}

function SplineInner({ scene, onError }: { scene: string; onError: () => void }) {
  return (
    <Spline
      scene={scene}
      onError={onError}
      style={{ width: '100%', height: '100%', mixBlendMode: 'screen' }}
    />
  );
}
