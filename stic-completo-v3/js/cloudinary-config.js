/**
 * CLOUDINARY CONFIGURATION
 * Sistema completo de upload e gerenciamento de fotos
 */

const CloudinaryConfig = {
    cloudName: 'dizqp85po',
    apiKey: '412466336451561',
    uploadPreset: 'stic_os_fotos', // Criar no dashboard
    uploadUrl: 'https://api.cloudinary.com/v1_1/dizqp85po/image/upload',
    baseUrl: 'https://res.cloudinary.com/dizqp85po',
    
    // Limites
    maxFiles: 4,
    maxSizeMB: 10,
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    
    /**
     * Upload de foto para Cloudinary
     */
    async uploadFoto(file, osId, index) {
        try {
            console.log(`📤 Upload iniciado: ${file.name}`);
            
            // Validar
            if (!this.validarArquivo(file)) {
                throw new Error('Arquivo inválido');
            }
            
            // Comprimir
            const compressed = await this.comprimirImagem(file);
            console.log(`✅ Compressão: ${(file.size/1024).toFixed(0)}KB → ${(compressed.size/1024).toFixed(0)}KB`);
            
            // Upload
            const formData = new FormData();
            formData.append('file', compressed);
            formData.append('upload_preset', this.uploadPreset);
            formData.append('folder', `stic-os/${osId}`);
            formData.append('public_id', `foto_${index}_${Date.now()}`);
            
            const response = await fetch(this.uploadUrl, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error('Erro no upload');
            
            const result = await response.json();
            console.log('✅ Upload concluído:', result.secure_url);
            
            return {
                url: result.secure_url,
                publicId: result.public_id,
                thumbnail: this.getUrl(result.public_id, 'w_200,h_150,c_fill'),
                display: this.getUrl(result.public_id, 'w_1200,h_800,c_limit'),
                size: result.bytes
            };
            
        } catch (error) {
            console.error('❌ Erro upload:', error);
            throw error;
        }
    },
    
    validarArquivo(file) {
        if (!file.type.startsWith('image/')) {
            alert('Apenas imagens são permitidas');
            return false;
        }
        if (file.size > this.maxSizeMB * 1024 * 1024) {
            alert(`Arquivo muito grande. Máximo: ${this.maxSizeMB}MB`);
            return false;
        }
        return true;
    },
    
    comprimirImagem(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // Redimensionar se necessário
                    const maxDim = 1920;
                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = (height / width) * maxDim;
                            width = maxDim;
                        } else {
                            width = (width / height) * maxDim;
                            height = maxDim;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                    }, 'image/jpeg', 0.85);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    getUrl(publicId, transform) {
        return `${this.baseUrl}/image/upload/${transform}/${publicId}`;
    }
};

console.log('✅ Cloudinary configurado:', CloudinaryConfig.cloudName);
