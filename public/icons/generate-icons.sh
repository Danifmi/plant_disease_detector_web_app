#!/bin/bash
# Script para generar íconos PWA desde el SVG base
# Requiere: ImageMagick (convert) o librsvg (rsvg-convert)

ICON_SOURCE="icon.svg"
SIZES=(72 96 128 144 152 192 384 512)

echo "Generando íconos PWA..."

# Verificar si existe el SVG fuente
if [ ! -f "$ICON_SOURCE" ]; then
    echo "Error: No se encontró $ICON_SOURCE"
    exit 1
fi

# Intentar usar rsvg-convert (mejor calidad para SVG)
if command -v rsvg-convert &> /dev/null; then
    echo "Usando rsvg-convert..."
    for size in "${SIZES[@]}"; do
        rsvg-convert -w $size -h $size "$ICON_SOURCE" -o "icon-${size}x${size}.png"
        echo "✓ Generado icon-${size}x${size}.png"
    done
# Fallback a ImageMagick
elif command -v convert &> /dev/null; then
    echo "Usando ImageMagick..."
    for size in "${SIZES[@]}"; do
        convert -background none -resize "${size}x${size}" "$ICON_SOURCE" "icon-${size}x${size}.png"
        echo "✓ Generado icon-${size}x${size}.png"
    done
else
    echo "Error: Se requiere rsvg-convert o ImageMagick (convert)"
    echo ""
    echo "Instalar en Ubuntu/Debian:"
    echo "  sudo apt install librsvg2-bin"
    echo "  # o"
    echo "  sudo apt install imagemagick"
    echo ""
    echo "Instalar en macOS:"
    echo "  brew install librsvg"
    echo "  # o"
    echo "  brew install imagemagick"
    exit 1
fi

echo ""
echo "¡Íconos generados exitosamente!"
echo "Archivos creados en: $(pwd)"
