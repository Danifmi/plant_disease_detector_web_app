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
    // Habilitar soporte para WebAssembly (necesario para opencv-wasm)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false
      };
    }

    return config;
  },

  experimental: {
    serverComponentsExternalPackages: ['opencv-wasm'],
    outputFileTracingIncludes: {
      '/api/segment': ['./node_modules/opencv-wasm/opencv.wasm']
    }
  },

  // Optimización de imágenes
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256]
  }
};

module.exports = nextConfig;
