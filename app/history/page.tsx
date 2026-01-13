'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { getHistory, clearHistory, deleteHistoryItem } from '@/lib/utils/storageUtils';
import { DISEASES_INFO } from '@/lib/constants/diseases';
import { HistoryItem } from '@/types/analysis';

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const items = await getHistory();
      setHistory(items);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHistoryItem(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar todo el historial?')) {
      try {
        await clearHistory();
        setHistory([]);
      } catch (error) {
        console.error('Error clearing history:', error);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 mb-4">
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio
                </Button>
              </Link>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Historial de Análisis
              </h1>
              <p className="text-gray-600">
                Revisa los análisis que has realizado anteriormente.
              </p>
            </div>

            {history.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar todo
              </Button>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <div className="spinner mx-auto mb-4" />
              <p className="text-gray-600">Cargando historial...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && history.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Sin análisis previos
              </h2>
              <p className="text-gray-600 mb-6">
                Aún no has realizado ningún análisis de plantas.
              </p>
              <Link href="/analyze">
                <Button>Realizar primer análisis</Button>
              </Link>
            </div>
          )}

          {/* History List */}
          {!loading && history.length > 0 && (
            <div className="space-y-4">
              {history.map((item) => {
                const diseaseInfo = DISEASES_INFO[item.prediction.disease];
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        {/* Image */}
                        <div className="sm:w-48 h-48 sm:h-auto bg-gray-100 relative flex-shrink-0">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt="Planta analizada"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 sm:p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">{diseaseInfo.icon}</span>
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {diseaseInfo.nameEs}
                                </h3>
                              </div>
                              <p className="text-sm text-gray-500 mb-3">
                                {diseaseInfo.description.substring(0, 100)}...
                              </p>

                              {/* Confidence */}
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-gray-600">Confianza</span>
                                  <span className="font-medium">
                                    {(item.prediction.confidence * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${item.prediction.confidence * 100}%`,
                                      backgroundColor: diseaseInfo.color,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Metadata */}
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(item.timestamp)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatTime(item.timestamp)}
                                </span>
                              </div>
                            </div>

                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
