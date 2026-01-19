import React from 'react';
import { QrCode, Printer } from 'lucide-react';

const QRCodeGenerator: React.FC = () => {
    // Gera lista de 1 a 20
    const tables = Array.from({ length: 20 }, (_, i) => i + 1);
    const baseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';

    const printQRs = () => {
        window.print();
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-8 no-print">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">QR Codes das Mesas</h2>
                        <p className="text-gray-600">Imprima os códigos para colar nas mesas</p>
                    </div>
                </div>
                <button
                    onClick={printQRs}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <Printer className="w-5 h-5" />
                    Imprimir Tudo
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 print:grid-cols-3 print:gap-8">
                {tables.map(num => (
                    <div key={num} className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center text-center page-break-inside-avoid hover:border-blue-300 transition">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Mesa {num}</h3>
                        <div className="bg-white p-2 rounded-lg mb-2">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${baseUrl}/mesa/${num}`)}`}
                                alt={`QR Code Mesa ${num}`}
                                className="w-32 h-32 object-contain"
                            />
                        </div>
                        <p className="text-xs text-gray-500 break-all">
                            {`${baseUrl}/mesa/${num}`}
                        </p>
                    </div>
                ))}
            </div>

            <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .page-break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
        </div>
    );
};

export default QRCodeGenerator;
