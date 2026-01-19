import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface LogoUploadProps {
  onLogoChange: (logoDataUrl: string) => void;
  currentLogo?: string;
}

const LogoUpload: React.FC<LogoUploadProps> = ({ onLogoChange, currentLogo }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        onLogoChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearLogo = () => {
    setPreview(null);
    onLogoChange('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Logo Personalizada</h3>
          <p className="text-gray-600">Envie a imagem da sua logo</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Preview Area */}
        <div className="flex justify-center mb-4">
          {preview ? (
            <div className="relative">
              <img 
                src={preview} 
                alt="Logo Preview" 
                className="w-32 h-20 object-contain border-2 border-gray-200 rounded-lg"
              />
              <button
                onClick={clearLogo}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                title="Remover logo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : currentLogo ? (
            <img 
              src={currentLogo} 
              alt="Current Logo" 
              className="w-32 h-20 object-contain border-2 border-gray-200 rounded-lg"
            />
          ) : (
            <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma logo</p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragging 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('logo-input')?.click()}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Arraste a imagem aqui ou clique para selecionar
          </p>
          <p className="text-xs text-gray-500">
            Formatos: PNG, JPG, GIF (máx. 5MB)
          </p>
          <input
            id="logo-input"
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Como funciona:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Arraste a imagem da logo para a área acima</li>
            <li>• Ou clique na área para selecionar o arquivo</li>
            <li>• A logo será salva automaticamente</li>
            <li>• Funciona com PNG, JPG e GIF</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LogoUpload;
