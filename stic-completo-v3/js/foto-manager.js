/**
 * GERENCIADOR DE FOTOS - ORDENS DE SERVIÇO
 * Sistema completo para upload, visualização e gerenciamento de fotos
 */

const FotoManager = {
    maxFotos: 4,
    fotosAtuais: [],
    osId: null,
    
    /**
     * Inicializar gerenciador
     */
    init(osId, fotosExistentes = []) {
        this.osId = osId;
        this.fotosAtuais = fotosExistentes || [];
        this.render();
        console.log('📸 Gerenciador de fotos inicializado');
    },
    
    /**
     * Renderizar interface
     */
    render() {
        const container = document.getElementById('fotosContainer');
        if (!container) return;
        
        const html = `
            <div class="fotos-section">
                <h3>📸 Fotos do Equipamento</h3>
                <p class="fotos-help">Adicione até ${this.maxFotos} fotos (antes, durante, depois do reparo)</p>
                
                <div class="fotos-upload-area">
                    <input type="file" 
                           id="inputFotos" 
                           accept="image/jpeg,image/jpg,image/png,image/webp" 
                           multiple 
                           style="display:none"
                           onchange="FotoManager.handleFiles(this.files)">
                    
                    <button type="button" 
                            class="btn-upload-foto ${this.fotosAtuais.length >= this.maxFotos ? 'disabled' : ''}" 
                            onclick="document.getElementById('inputFotos').click()"
                            ${this.fotosAtuais.length >= this.maxFotos ? 'disabled' : ''}>
                        📁 Escolher Fotos (${this.fotosAtuais.length}/${this.maxFotos})
                    </button>
                </div>
                
                <div class="fotos-grid" id="fotosGrid">
                    ${this.renderFotos()}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    /**
     * Renderizar lista de fotos
     */
    renderFotos() {
        if (this.fotosAtuais.length === 0) {
            return '<p class="fotos-empty">Nenhuma foto adicionada</p>';
        }
        
        return this.fotosAtuais.map((foto, index) => `
            <div class="foto-item" data-index="${index}">
                <div class="foto-preview">
                    <img src="${foto.thumbnail || foto.url}" alt="Foto ${index + 1}">
                    <div class="foto-overlay">
                        <button type="button" onclick="FotoManager.visualizarFoto(${index})" class="btn-icon" title="Ver ampliado">
                            🔍
                        </button>
                        <button type="button" onclick="FotoManager.removerFoto(${index})" class="btn-icon btn-danger" title="Remover">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="foto-info">
                    <input type="text" 
                           class="foto-legenda" 
                           placeholder="Legenda (opcional)" 
                           value="${foto.legenda || ''}"
                           onchange="FotoManager.atualizarLegenda(${index}, this.value)"
                           maxlength="50">
                    <small>${this.formatarTamanho(foto.bytes)}</small>
                </div>
            </div>
        `).join('');
    },
    
    /**
     * Processar arquivos selecionados
     */
    async handleFiles(files) {
        const fotosDisponiveis = this.maxFotos - this.fotosAtuais.length;
        
        if (fotosDisponiveis === 0) {
            mostrarErro('Máximo de fotos atingido!');
            return;
        }
        
        const arquivosArray = Array.from(files).slice(0, fotosDisponiveis);
        
        mostrarLoading('Fazendo upload das fotos...');
        
        try {
            for (const arquivo of arquivosArray) {
                await this.uploadFoto(arquivo);
            }
            
            ocultarLoading();
            mostrarSucesso(`${arquivosArray.length} foto(s) adicionada(s)!`);
            this.render();
            
        } catch (error) {
            ocultarLoading();
            mostrarErro('Erro ao fazer upload: ' + error.message);
        }
    },
    
    /**
     * Upload de uma foto
     */
    async uploadFoto(arquivo) {
        try {
            // Upload para Cloudinary
            const resultado = await uploadToCloudinary(arquivo, this.osId);
            
            // Gerar thumbnail
            const thumbnailUrl = getCloudinaryUrl(resultado.publicId, 'thumbnail');
            const displayUrl = getCloudinaryUrl(resultado.publicId, 'display');
            
            // Adicionar à lista
            this.fotosAtuais.push({
                url: displayUrl,
                thumbnail: thumbnailUrl,
                publicId: resultado.publicId,
                legenda: '',
                bytes: resultado.bytes,
                width: resultado.width,
                height: resultado.height,
                uploadedAt: new Date().toISOString()
            });
            
            console.log('✅ Foto adicionada:', resultado.publicId);
            
        } catch (error) {
            console.error('❌ Erro no upload:', error);
            throw error;
        }
    },
    
    /**
     * Remover foto
     */
    async removerFoto(index) {
        if (!confirm('Remover esta foto?')) return;
        
        try {
            const foto = this.fotosAtuais[index];
            
            // Remover do array
            this.fotosAtuais.splice(index, 1);
            
            // Atualizar interface
            this.render();
            
            mostrarSucesso('Foto removida!');
            
            // Nota: Não deletamos do Cloudinary por segurança
            // As fotos antigas ficam lá até limpeza manual
            
        } catch (error) {
            mostrarErro('Erro ao remover foto');
        }
    },
    
    /**
     * Visualizar foto ampliada
     */
    visualizarFoto(index) {
        const foto = this.fotosAtuais[index];
        
        // Criar modal lightbox
        const modal = document.createElement('div');
        modal.className = 'foto-lightbox';
        modal.innerHTML = `
            <div class="lightbox-overlay" onclick="this.parentElement.remove()">
                <div class="lightbox-content" onclick="event.stopPropagation()">
                    <button class="lightbox-close" onclick="this.closest('.foto-lightbox').remove()">✕</button>
                    <img src="${foto.url}" alt="Foto ${index + 1}">
                    ${foto.legenda ? `<p class="lightbox-legenda">${foto.legenda}</p>` : ''}
                    <div class="lightbox-nav">
                        ${index > 0 ? `<button onclick="FotoManager.visualizarFoto(${index - 1})">← Anterior</button>` : ''}
                        <span>${index + 1} / ${this.fotosAtuais.length}</span>
                        ${index < this.fotosAtuais.length - 1 ? `<button onclick="FotoManager.visualizarFoto(${index + 1})">Próxima →</button>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    /**
     * Atualizar legenda
     */
    atualizarLegenda(index, legenda) {
        this.fotosAtuais[index].legenda = legenda.trim();
        console.log('📝 Legenda atualizada:', legenda);
    },
    
    /**
     * Obter dados das fotos para salvar
     */
    getFotos() {
        return this.fotosAtuais.map(foto => ({
            url: foto.url,
            thumbnail: foto.thumbnail,
            publicId: foto.publicId,
            legenda: foto.legenda || '',
            bytes: foto.bytes,
            uploadedAt: foto.uploadedAt
        }));
    },
    
    /**
     * Formatar tamanho do arquivo
     */
    formatarTamanho(bytes) {
        if (!bytes) return '0 KB';
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(0)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    }
};

/**
 * Adicionar estilos CSS
 */
const fotoStyles = `
<style>
.fotos-section {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    margin: 1rem 0;
}

.fotos-section h3 {
    margin: 0 0 0.5rem 0;
    color: #495057;
}

.fotos-help {
    font-size: 0.875rem;
    color: #6c757d;
    margin-bottom: 1rem;
}

.fotos-upload-area {
    margin-bottom: 1rem;
}

.btn-upload-foto {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-upload-foto:hover:not(.disabled) {
    background: #0056b3;
}

.btn-upload-foto.disabled {
    background: #6c757d;
    cursor: not-allowed;
}

.fotos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

.fotos-empty {
    text-align: center;
    color: #6c757d;
    padding: 2rem;
    font-style: italic;
}

.foto-item {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.foto-preview {
    position: relative;
    padding-top: 75%; /* Aspect ratio 4:3 */
    overflow: hidden;
    background: #e9ecef;
}

.foto-preview img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.foto-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s;
}

.foto-item:hover .foto-overlay {
    opacity: 1;
}

.btn-icon {
    background: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 1.25rem;
    cursor: pointer;
    transition: transform 0.2s;
}

.btn-icon:hover {
    transform: scale(1.1);
}

.btn-danger {
    background: #dc3545;
}

.foto-info {
    padding: 0.75rem;
}

.foto-legenda {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
}

.foto-info small {
    color: #6c757d;
    font-size: 0.75rem;
}

/* Lightbox */
.foto-lightbox {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10000;
    animation: fadeIn 0.3s;
}

.lightbox-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.9);
    display: flex;
    align-items: center;
    justify-content: center;
}

.lightbox-content {
    position: relative;
    max-width: 90%;
    max-height: 90%;
    background: white;
    padding: 2rem;
    border-radius: 8px;
}

.lightbox-content img {
    max-width: 100%;
    max-height: 70vh;
    display: block;
    margin: 0 auto;
}

.lightbox-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: #dc3545;
    color: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
}

.lightbox-legenda {
    text-align: center;
    margin-top: 1rem;
    font-size: 1rem;
    color: #495057;
}

.lightbox-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
}

.lightbox-nav button {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
</style>
`;

// Adicionar estilos ao head
if (!document.getElementById('foto-manager-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'foto-manager-styles';
    styleElement.innerHTML = fotoStyles;
    document.head.appendChild(styleElement);
}

console.log('✅ Gerenciador de Fotos carregado!');
