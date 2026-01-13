// Gestión de permisos de cámara

import { CameraPermissionStatus } from '@/types/camera';

/**
 * Verifica el estado del permiso de cámara
 */
export async function getCameraPermissionStatus(): Promise<CameraPermissionStatus> {
  // Verificar si la API de permisos está disponible
  if (!navigator.permissions) {
    return 'unknown';
  }

  try {
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    
    switch (result.state) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied';
      case 'prompt':
        return 'prompt';
      default:
        return 'unknown';
    }
  } catch {
    // Algunos navegadores no soportan 'camera' en permissions.query
    return 'unknown';
  }
}

/**
 * Solicita permiso de cámara
 */
export async function requestCameraPermission(): Promise<CameraPermissionStatus> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // Permiso concedido - detener el stream
    stream.getTracks().forEach((track) => track.stop());
    return 'granted';
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return 'denied';
      }
    }
    throw error;
  }
}

/**
 * Escucha cambios en el permiso de cámara
 */
export function onCameraPermissionChange(
  callback: (status: CameraPermissionStatus) => void
): () => void {
  if (!navigator.permissions) {
    return () => {};
  }

  let permissionStatus: PermissionStatus | null = null;

  navigator.permissions
    .query({ name: 'camera' as PermissionName })
    .then((status) => {
      permissionStatus = status;
      status.addEventListener('change', () => {
        callback(status.state as CameraPermissionStatus);
      });
    })
    .catch(() => {
      // Ignorar si no está soportado
    });

  // Retornar función de cleanup
  return () => {
    if (permissionStatus) {
      permissionStatus.onchange = null;
    }
  };
}

/**
 * Verifica si estamos en un contexto seguro (HTTPS)
 */
export function isSecureContext(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext;
}

/**
 * Obtiene información sobre el soporte de cámara
 */
export function getCameraSupport(): {
  supported: boolean;
  secureContext: boolean;
  mediaDevices: boolean;
  getUserMedia: boolean;
  reason?: string;
} {
  const result = {
    supported: false,
    secureContext: isSecureContext(),
    mediaDevices: typeof navigator !== 'undefined' && !!navigator.mediaDevices,
    getUserMedia:
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia,
    reason: undefined as string | undefined
  };

  if (!result.secureContext) {
    result.reason = 'Se requiere HTTPS para acceder a la cámara';
  } else if (!result.mediaDevices) {
    result.reason = 'El navegador no soporta MediaDevices API';
  } else if (!result.getUserMedia) {
    result.reason = 'El navegador no soporta getUserMedia';
  } else {
    result.supported = true;
  }

  return result;
}

/**
 * Mensaje de error amigable para el usuario
 */
export function getPermissionErrorMessage(status: CameraPermissionStatus): string {
  switch (status) {
    case 'denied':
      return 'El acceso a la cámara ha sido denegado. Por favor, habilite el permiso en la configuración de su navegador.';
    case 'prompt':
      return 'Se necesita permiso para acceder a la cámara. Por favor, conceda el permiso cuando se solicite.';
    case 'unknown':
      return 'No se puede determinar el estado del permiso de cámara.';
    default:
      return '';
  }
}
