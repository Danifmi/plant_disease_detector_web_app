/**
 * Type definitions for opencv-wasm
 * Basado en la API de OpenCV.js 4.3.0
 * 
 * Uso: Crear este archivo como types/opencvWasm.d.ts
 * y añadir en tsconfig.json:
 * {
 *   "compilerOptions": {
 *     "typeRoots": ["./node_modules/@types", "./types"]
 *   }
 * }
 */

declare module 'opencv-wasm' {
  export const cv: OpenCV;
  export function cvTranslateError(cv: OpenCV, error: any): string;

  export interface OpenCV {
    // Constantes de tipo
    CV_8UC1: number;
    CV_8UC3: number;
    CV_8UC4: number;
    CV_32FC1: number;
    CV_32FC3: number;

    // Color conversion
    COLOR_BGR2HSV: number;
    COLOR_BGR2RGB: number;
    COLOR_RGB2BGR: number;
    COLOR_BGR2GRAY: number;
    COLOR_RGBA2RGB: number;
    COLOR_RGB2HSV: number;

    // Morphology
    MORPH_OPEN: number;
    MORPH_CLOSE: number;
    MORPH_ELLIPSE: number;
    MORPH_RECT: number;
    MORPH_CROSS: number;

    // Contour retrieval modes
    RETR_EXTERNAL: number;
    RETR_LIST: number;
    RETR_TREE: number;

    // Contour approximation
    CHAIN_APPROX_SIMPLE: number;
    CHAIN_APPROX_NONE: number;

    // Interpolation
    INTER_AREA: number;
    INTER_LINEAR: number;
    INTER_CUBIC: number;

    // Image encoding
    IMREAD_COLOR: number;
    IMREAD_GRAYSCALE: number;
    IMWRITE_PNG_COMPRESSION: number;
    IMWRITE_JPEG_QUALITY: number;

    // Constructors
    Mat: new () => Mat;
    MatVector: new () => MatVector;
    IntVector: new () => IntVector;
    Size: new (width: number, height: number) => Size;
    Point: new (x: number, y: number) => Point;
    Scalar: new (v0: number, v1?: number, v2?: number, v3?: number) => Scalar;
    Rect: new (x: number, y: number, width: number, height: number) => Rect;

    // Factory functions
    matFromArray(rows: number, cols: number, type: number, data: number[]): Mat;
    matFromImageData(imageData: ImageData): Mat;
    imread(element: HTMLImageElement | HTMLCanvasElement | string): Mat;

    // Image operations
    imdecode(buf: Mat, flags: number): Mat;
    imencode(ext: string, img: Mat, buf: Mat, params?: IntVector): boolean;
    imshow(canvas: HTMLCanvasElement | string, mat: Mat): void;
    cvtColor(src: Mat, dst: Mat, code: number): void;
    resize(src: Mat, dst: Mat, dsize: Size, fx?: number, fy?: number, interpolation?: number): void;
    
    // Color range
    inRange(src: Mat, lowerb: Mat | Scalar, upperb: Mat | Scalar, dst: Mat): void;
    
    // Morphology
    morphologyEx(src: Mat, dst: Mat, op: number, kernel: Mat): void;
    getStructuringElement(shape: number, ksize: Size): Mat;
    
    // Contours
    findContours(image: Mat, contours: MatVector, hierarchy: Mat, mode: number, method: number): void;
    drawContours(image: Mat, contours: MatVector, contourIdx: number, color: Scalar, thickness?: number): void;
    contourArea(contour: Mat): number;
    boundingRect(contour: Mat): Rect;
    moments(contour: Mat): Moments;
    
    // Bitwise operations
    bitwise_or(src1: Mat, src2: Mat, dst: Mat): void;
    bitwise_and(src1: Mat, src2: Mat, dst: Mat): void;
    bitwise_not(src: Mat, dst: Mat): void;
    
    // Statistics
    countNonZero(src: Mat): number;
    
    // Misc
    transpose(src: Mat, dst: Mat): void;
  }

  export interface Mat {
    rows: number;
    cols: number;
    data: Uint8Array;
    data8S: Int8Array;
    data16U: Uint16Array;
    data16S: Int16Array;
    data32S: Int32Array;
    data32F: Float32Array;
    data64F: Float64Array;
    
    clone(): Mat;
    delete(): void;
    empty(): boolean;
    type(): number;
    channels(): number;
    
    roi(rect: Rect): Mat;
    setTo(scalar: Scalar): void;
    copyTo(dst: Mat, mask?: Mat): void;
  }

  export interface MatVector {
    size(): number;
    get(index: number): Mat;
    push_back(mat: Mat): void;
    delete(): void;
  }

  export interface IntVector {
    push_back(value: number): void;
    delete(): void;
  }

  export interface Size {
    width: number;
    height: number;
  }

  export interface Point {
    x: number;
    y: number;
  }

  export interface Scalar {
    [index: number]: number;
  }

  export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export interface Moments {
    m00: number;
    m10: number;
    m01: number;
    m20: number;
    m11: number;
    m02: number;
    m30: number;
    m21: number;
    m12: number;
    m03: number;
  }
}