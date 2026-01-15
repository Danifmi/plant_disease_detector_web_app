/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Headers para cámara y CORS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=self'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          }
        ]
      }
    ];
  },

  // Configuración de Webpack para TensorFlow.js y OpenCV
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false
      };
    }
    
    // Excluir OpenCV.js de SSR
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('opencv.js');
    }

    return config;
  },

  experimental: {
    serverComponentsExternalPackages: ['opencv-wasm']
  },

  // Optimización de imágenes
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256]
  }
};

module.exports = nextConfig;
