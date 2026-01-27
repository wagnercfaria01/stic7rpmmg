// Gerenciador de Ordens de Serviço

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formNovaOS');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await criarOrdemServico();
        });
        
        // Preencher data de hoje
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('dataEntrada')?.setAttribute('value', hoje);
        
        // Carregar técnicos cadastrados
        carregarTecnicosResponsaveis();
    }
});

// Carregar técnicos responsáveis do banco de dados
async function carregarTecnicosResponsaveis() {
    try {
        const selectTecnico = document.getElementById('tecnicoResponsavel');
        if (!selectTecnico) return;
        
        // Limpar opções existentes
        selectTecnico.innerHTML = '<option value="">Selecione o técnico...</option>';
        
        // Buscar usuários ativos do tipo militar (técnicos)
        const usuariosRef = db.collection('usuarios_recebedores');
        const snapshot = await usuariosRef
            .where('ativo', '==', true)
            .where('tipo', '==', 'militar')
            .get();
        
        // Adicionar técnicos fixos (Cb Wagner e Sgt Simão)
        const tecnicosFixos = [
            { nome: 'Cb Wagner', numero_policia: '163396-5' },
            { nome: 'Sgt Simão', numero_policia: '159989-3' }
        ];
        
        tecnicosFixos.forEach(tecnico => {
            const option = document.createElement('option');
            option.value = `${tecnico.nome} - ${tecnico.numero_policia}`;
            option.textContent = `${tecnico.nome} (${tecnico.numero_policia})`;
            selectTecnico.appendChild(option);
        });
        
        // Adicionar técnicos cadastrados no sistema
        snapshot.forEach(doc => {
            const usuario = doc.data();
            const valor = `${usuario.nome} - ${usuario.numero_policia}`;
            
            // Evitar duplicatas (não adicionar se já existe nos fixos)
            const jaExiste = Array.from(selectTecnico.options).some(
                opt => opt.value === valor
            );
            
            if (!jaExiste) {
                const option = document.createElement('option');
                option.value = valor;
                option.textContent = `${usuario.nome} (${usuario.numero_policia})`;
                selectTecnico.appendChild(option);
            }
        });
        
        console.log('✅ Técnicos carregados:', selectTecnico.options.length - 1);
        
    } catch (error) {
        console.error('❌ Erro ao carregar técnicos:', error);
        // Manter técnicos fixos se houver erro
    }
}

// Criar nova ordem de serviço
async function criarOrdemServico() {
    const form = document.getElementById('formNovaOS');
    
    // Validar formulário
    if (!validarFormulario(form)) {
        mostrarErro('Por favor, preencha todos os campos obrigatórios!');
        return;
    }
    
    mostrarLoading('Criando ordem de serviço...');
    
    try {
        // Obter usuário logado
        const usuarioNome = sessionStorage.getItem('stic_usuario_nome') || 'Sistema';
        const usuarioNumero = sessionStorage.getItem('stic_usuario_numero') || '';
        const usuarioLogado = `${usuarioNome}${usuarioNumero ? ' - ' + usuarioNumero : ''}`;
        
        // Obter tipo de OS
        const tipoOS = document.querySelector('input[name="tipoOS"]:checked').value;
        
        // Obter tipo de solicitante
        const tipoSolicitante = document.getElementById('tipoSolicitante').value;
        
        // Obter unidade (pode ser selecionada ou digitada)
        const unidadeSelect = document.getElementById('unidadeSolicitante').value;
        const outraUnidade = document.getElementById('outraUnidadeOS').value;
        const unidade = unidadeSelect === 'OUTRA' ? outraUnidade : unidadeSelect;
        
        // Dados básicos da OS
        const os = {
            numero: gerarNumeroOS(),
            tipo_os: tipoOS, // 'equipamento' ou 'servico'
            
            solicitante: {
                tipo: tipoSolicitante,
                nome: document.getElementById('nomeSolicitante').value,
                numero_pm: tipoSolicitante === 'militar' ? document.getElementById('numeroPolicia')?.value : '',
                telefone: document.getElementById('telefoneSolicitante').value,
                unidade: unidade
            },
            
            defeito: document.getElementById('defeito').value,
            observacoes: document.getElementById('observacoes').value,
            
            status: document.getElementById('status').value,
            prioridade: document.getElementById('prioridade').value,
            tecnico_responsavel: document.getElementById('tecnicoResponsavel').value,
            prazo_estimado: document.getElementById('prazoEstimado') ? 
                document.getElementById('prazoEstimado').value : '',
            
            data_abertura: firebase.firestore.FieldValue.serverTimestamp(),
            aberto_por: usuarioLogado,
            criado_por: usuarioLogado,
            
            historico: [{
                data: new Date().toISOString(),
                acao: 'OS Criada',
                usuario: usuarioLogado,
                detalhes: `Técnico responsável: ${document.getElementById('tecnicoResponsavel').value}`
            }]
        };
        
        // Adicionar campos específicos por TIPO DE OS
        if (tipoOS === 'equipamento') {
            os.tipo_equipamento = document.getElementById('tipoEquipamento').value;
            os.patrimonio = document.getElementById('patrimonio').value;
            os.numero_serie = document.getElementById('numeroSerie').value;
            os.marca = document.getElementById('marca').value;
            os.modelo = document.getElementById('modelo').value;
        } else {
            // Serviço
            os.tipo_servico = document.getElementById('tipoServico').value;
            os.descricao_servico = document.getElementById('descricaoServico').value;
            
            // CAMPOS OPCIONAIS DO SERVIÇO
            // A. Local do serviço
            const localServico = document.getElementById('localServico')?.value;
            if (localServico) {
                os.local_servico = localServico === 'outro' ? 
                    document.getElementById('outroLocal')?.value : localServico;
            }
            
            // B. Quantidade/Escopo
            if (document.getElementById('quantidadeEscopo')?.value) {
                os.quantidade_escopo = document.getElementById('quantidadeEscopo').value;
            }
            
            // C. Materiais necessários (lista dinâmica)
            if (typeof materiaisNecessarios !== 'undefined' && materiaisNecessarios.length > 0) {
                os.materiais_necessarios = materiaisNecessarios;
            }
            
            // D. Prazo solicitado
            if (document.getElementById('prazoSolicitado')?.value) {
                os.prazo_solicitado = {
                    data: document.getElementById('prazoSolicitado').value,
                    horario: document.getElementById('horarioPrazo')?.value || '',
                    urgente: document.getElementById('urgente')?.checked || false
                };
            }
            
            // E. Horário disponível
            const horarioDisp = document.querySelector('input[name="horarioDisponivel"]:checked');
            if (horarioDisp) {
                os.horario_disponivel = horarioDisp.value;
            }
            
            // F. Responsável no local
            if (document.getElementById('responsavelLocal')?.value) {
                os.responsavel_local = {
                    nome: document.getElementById('responsavelLocal').value,
                    telefone: document.getElementById('telefoneResponsavel')?.value || ''
                };
            }
            
            // 2. Checklist
            const checklistItems = Array.from(document.querySelectorAll('input[name="checklist[]"]:checked'))
                .map(cb => ({ item: cb.value, concluido: cb.checked }));
            if (checklistItems.length > 0) {
                os.checklist = checklistItems;
            }
            
            // 4. Orçamento
            const custoMaterial = parseFloat(document.getElementById('custoMaterial')?.value);
            const horasTrabalho = parseFloat(document.getElementById('horasTrabalho')?.value);
            const custoDeslocamento = parseFloat(document.getElementById('custoDeslocamento')?.value);
            if (custoMaterial || horasTrabalho || custoDeslocamento) {
                os.orcamento = {
                    material: custoMaterial || 0,
                    horas: horasTrabalho || 0,
                    deslocamento: custoDeslocamento || 0,
                    total: (custoMaterial || 0) + ((horasTrabalho || 0) * 50) + (custoDeslocamento || 0)
                };
            }
            
            // 7. Etapas
            if (document.getElementById('temEtapas')?.checked) {
                const etapas = Array.from(document.querySelectorAll('.etapa-input'))
                    .map((input, index) => ({
                        numero: index + 1,
                        descricao: input.value,
                        concluida: false
                    }))
                    .filter(e => e.descricao.trim());
                if (etapas.length > 0) {
                    os.etapas = etapas;
                }
            }
            
            // 8. OS Relacionada
            if (document.getElementById('osRelacionada')?.value) {
                os.os_relacionada = document.getElementById('osRelacionada').value;
            }
            
            // 9. Recorrência
            if (document.getElementById('servicoRecorrente')?.checked) {
                os.recorrencia = {
                    ativa: true,
                    frequencia: document.getElementById('frequenciaRecorrencia')?.value,
                    proxima_data: document.getElementById('proximaData')?.value,
                    criar_automatico: document.getElementById('criarAutomatico')?.checked || false
                };
            }
        }
        
        // Adicionar campos específicos por tipo de solicitante
        if (tipoSolicitante === 'militar') {
            os.solicitante.numero_policia = document.getElementById('numeroPolicia').value;
        } else {
            os.solicitante.cpf = document.getElementById('cpf').value;
            os.solicitante.orgao = document.getElementById('orgaoCivil') ? 
                document.getElementById('orgaoCivil').value : '';
        }
        
        // Adicionar fotos se existirem (global fotosOSArray definido em nova-os.html)
        if (typeof fotosOSArray !== 'undefined' && fotosOSArray.length > 0) {
            os.fotos = fotosOSArray.map(foto => ({
                url: foto.url,
                thumbnail: foto.thumbnail,
                display: foto.display,
                publicId: foto.publicId,
                legenda: foto.legenda || '',
                size: foto.size
            }));
            os.total_fotos = fotosOSArray.length;
            console.log(`📸 ${fotosOSArray.length} fotos adicionadas à OS`);
        }
        
        // Salvar OS no Firebase
        const docRefOS = await ordensServicoRef.add(os);
        console.log('✅ OS criada:', docRefOS.id);
        
        // Registrar log
        if (typeof logCriacao === 'function') {
            await logCriacao('os', docRefOS.id, {
                tipo_os: tipoOS,
                numero: os.numero,
                patrimonio: os.patrimonio || 'N/A (Serviço)',
                tipo_servico: os.tipo_servico || 'N/A (Equipamento)',
                solicitante: os.solicitante.nome
            });
        }
        
        // CRIAR ENTRADA DE MATERIAL AUTOMÁTICA (apenas para OS de equipamento)
        let docRefEntrada = null;
        
        if (tipoOS === 'equipamento') {
            // Validar dados do solicitante
            if (!os.solicitante || !os.solicitante.nome) {
                console.warn('⚠️ Solicitante sem dados completos, entrada não criada');
            } else {
                const entrada = {
                    tipo_material: os.tipo_equipamento,
                    patrimonio: os.patrimonio,
                    numero_serie: os.numero_serie,
                    marca: os.marca,
                    modelo: os.modelo,
                    estado_conservacao: 'com_defeito',
                    estado_recebimento: 'com_defeito',
                    
                    // DADOS DO MILITAR QUE ENTREGA
                    militar_entregador: {
                        nome: os.solicitante.nome,
                        numero_pm: os.solicitante.numero_pm || null,
                        telefone: os.solicitante.telefone || null,
                        unidade: os.solicitante.unidade || null
                    },
                    
                    data_entrada: firebase.firestore.Timestamp.now(),
                    hora_entrada: new Date().toTimeString().slice(0, 5),
                    motivo: 'Abertura de OS',
                    problema_relatado: os.defeito,
                    
                    os_vinculada: docRefOS.id,
                    
                    status: 'aguardando_assinatura',
                    assinado: false,
                    registrado_por: usuarioLogado,
                    data_registro: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Salvar entrada
                docRefEntrada = await entradasRef.add(entrada);
                console.log('✅ Entrada criada:', docRefEntrada.id);
                console.log('📋 Militar entregador:', os.solicitante.nome, '| PM:', os.solicitante.numero_pm || 'N/A');
                
                // Atualizar OS com ID da entrada
                await ordensServicoRef.doc(docRefOS.id).update({
                    entrada_material_id: docRefEntrada.id
                });
            }
        }
        
        // 📱 ENVIAR TELEGRAM AUTOMÁTICO (ÚNICO AUTOMÁTICO)
        try {
            console.log('📱 Enviando Telegram automático...');
            
            // Preparar dados para notificação
            const numeroPolicia = os.solicitante?.numero_pm || os.numeroPolicia || null;
            
            const dadosNotificacao = {
                numero: os.numero,
                numeroPolicia: numeroPolicia,
                solicitante: {
                    nome: os.solicitante?.nome || 'Não informado',
                    numero_pm: numeroPolicia
                },
                tipo_servico: os.tipo_servico || os.tipo_equipamento || 'N/A',
                defeito: os.defeito || os.descricao_servico || '',
                prioridade: os.prioridade || 'Normal'
            };
            
            // Enviar APENAS Telegram (automático)
            if (typeof TelegramSTIC !== 'undefined' && TelegramSTIC.notificarNovaOS) {
                await TelegramSTIC.notificarNovaOS(dadosNotificacao);
                console.log('✅ Telegram enviado automaticamente');
            } else {
                console.warn('⚠️ TelegramSTIC não disponível');
            }
        } catch (notifError) {
            console.warn('⚠️ Erro ao enviar Telegram:', notifError.message);
        }
        
        ocultarLoading();
        
        // 🎉 MOSTRAR MODAL DE SUCESSO
        ModalSucesso.mostrarOS(docRefOS.id, os);
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao criar OS:', error);
        mostrarErro('Erro ao criar ordem de serviço: ' + error.message);
    }
}

// Atualizar status da OS
async function atualizarStatusOS(osId, novoStatus) {
    try {
        mostrarLoading('Atualizando status...');
        
        // Obter usuário logado
        const usuarioNome = sessionStorage.getItem('stic_usuario_nome') || 'Sistema';
        const usuarioNumero = sessionStorage.getItem('stic_usuario_numero') || '';
        const usuarioLogado = `${usuarioNome}${usuarioNumero ? ' - ' + usuarioNumero : ''}`;
        
        // Dados para atualizar
        const updates = {
            status: novoStatus,
            data_atualizacao: firebase.firestore.FieldValue.serverTimestamp(),
            historico: firebase.firestore.FieldValue.arrayUnion({
                data: new Date().toISOString(),
                acao: `Status alterado para: ${novoStatus}`,
                usuario: usuarioLogado
            })
        };
        
        // Se está finalizando, registrar quem fechou
        if (novoStatus === 'finalizada') {
            updates.fechado_por = usuarioLogado;
            updates.data_fechamento = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        await ordensServicoRef.doc(osId).update(updates);
        
        ocultarLoading();
        mostrarSucesso('Status atualizado com sucesso!');
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao atualizar status:', error);
        mostrarErro('Erro ao atualizar status');
    }
}

// Buscar OS por patrimônio
async function buscarPorPatrimonio(patrimonio) {
    try {
        const snapshot = await ordensServicoRef
            .where('patrimonio', '==', patrimonio)
            .get();
        
        if (snapshot.empty) {
            mostrarErro('Nenhuma OS encontrada com esse patrimônio');
            return null;
        }
        
        const docs = [];
        snapshot.forEach(doc => {
            docs.push({ id: doc.id, ...doc.data() });
        });
        
        return docs;
        
    } catch (error) {
        console.error('Erro ao buscar OS:', error);
        mostrarErro('Erro na busca');
        return null;
    }
}

// Listar todas as OS
async function listarTodasOS(limite = 50) {
    try {
        const snapshot = await ordensServicoRef
            .orderBy('data_abertura', 'desc')
            .limit(limite)
            .get();
        
        const docs = [];
        snapshot.forEach(doc => {
            docs.push({ id: doc.id, ...doc.data() });
        });
        
        return docs;
        
    } catch (error) {
        console.error('Erro ao listar OS:', error);
        return [];
    }
}

// Adicionar comentário/observação
async function adicionarComentario(osId, comentario) {
    try {
        // Obter usuário logado
        const usuarioNome = sessionStorage.getItem('stic_usuario_nome') || 'Sistema';
        const usuarioNumero = sessionStorage.getItem('stic_usuario_numero') || '';
        const usuarioLogado = `${usuarioNome}${usuarioNumero ? ' - ' + usuarioNumero : ''}`;
        
        await ordensServicoRef.doc(osId).update({
            historico: firebase.firestore.FieldValue.arrayUnion({
                data: new Date().toISOString(),
                acao: 'Comentário adicionado',
                comentario: comentario,
                usuario: usuarioLogado
            })
        });
        
        mostrarSucesso('Comentário adicionado!');
        
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
        mostrarErro('Erro ao adicionar comentário');
    }
}

// Finalizar OS
async function finalizarOS(osId, solucao) {
    try {
        mostrarLoading('Finalizando OS...');
        
        // Obter usuário logado
        const usuarioNome = sessionStorage.getItem('stic_usuario_nome') || 'Sistema';
        const usuarioNumero = sessionStorage.getItem('stic_usuario_numero') || '';
        const usuarioLogado = `${usuarioNome}${usuarioNumero ? ' - ' + usuarioNumero : ''}`;
        
        await ordensServicoRef.doc(osId).update({
            status: 'finalizada',
            data_finalizacao: firebase.firestore.FieldValue.serverTimestamp(),
            fechado_por: usuarioLogado,
            solucao: solucao,
            historico: firebase.firestore.FieldValue.arrayUnion({
                data: new Date().toISOString(),
                acao: 'OS Finalizada',
                solucao: solucao,
                usuario: usuarioLogado
            })
        });
        
        ocultarLoading();
        
        // Mostrar opção de gerar saída
        if (confirm('✅ OS finalizada com sucesso!\n\n📤 Deseja gerar a SAÍDA DE MATERIAL agora?\n\n(O material será devolvido ao solicitante)')) {
            await gerarSaidaDeOS(osId);
        } else {
            mostrarSucesso('OS finalizada! Você pode gerar a saída depois.');
            setTimeout(() => location.reload(), 2000);
        }
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao finalizar OS:', error);
        mostrarErro('Erro ao finalizar OS');
    }
}

// Excluir OS com registro de auditoria
async function excluirOS(osId, numeroOS = '') {
    try {
        // Confirmar exclusão
        const mensagem = numeroOS ? 
            `⚠️ ATENÇÃO! Deseja realmente EXCLUIR a OS ${numeroOS}?\n\nEsta ação NÃO pode ser desfeita!` :
            '⚠️ ATENÇÃO! Deseja realmente EXCLUIR esta OS?\n\nEsta ação NÃO pode ser desfeita!';
            
        if (!confirm(mensagem)) {
            return;
        }
        
        const segundaConfirmacao = confirm('Confirma a exclusão? Esta é sua última chance!');
        if (!segundaConfirmacao) {
            return;
        }
        
        mostrarLoading('Excluindo OS...');
        
        // Buscar dados da OS antes de excluir
        const docOS = await ordensServicoRef.doc(osId).get();
        if (!docOS.exists) {
            throw new Error('OS não encontrada');
        }
        
        const osData = docOS.data();
        
        // Obter usuário logado
        const usuarioNome = sessionStorage.getItem('stic_usuario_nome') || 'Sistema';
        const usuarioNumero = sessionStorage.getItem('stic_usuario_numero') || '';
        const usuarioLogado = `${usuarioNome}${usuarioNumero ? ' - ' + usuarioNumero : ''}`;
        
        // Criar log de auditoria ANTES de excluir
        await db.collection('logs_exclusoes').add({
            tipo: 'EXCLUSAO_OS',
            os_numero: osData.numero,
            os_id: osId,
            os_dados: {
                patrimonio: osData.patrimonio,
                tipo_equipamento: osData.tipo_equipamento,
                numero_serie: osData.numero_serie,
                marca: osData.marca,
                modelo: osData.modelo,
                solicitante: osData.solicitante?.nome || '-',
                solicitante_completo: osData.solicitante,
                status: osData.status,
                prioridade: osData.prioridade,
                defeito: osData.defeito,
                observacoes: osData.observacoes,
                tecnico_responsavel: osData.tecnico_responsavel,
                data_abertura: osData.data_abertura,
                aberto_por: osData.aberto_por
            },
            excluido_por: usuarioLogado,
            data_exclusao: firebase.firestore.FieldValue.serverTimestamp(),
            data_exclusao_legivel: new Date().toLocaleString('pt-BR'),
            observacao: `OS ${osData.numero} excluída pelo usuário ${usuarioLogado}`
        });
        
        // Agora sim, excluir a OS
        await ordensServicoRef.doc(osId).delete();
        
        ocultarLoading();
        mostrarSucesso(`OS ${osData.numero} excluída com sucesso!\n\nExclusão registrada nos logs do sistema.`);
        
        // Recarregar página após 2 segundos
        setTimeout(() => {
            location.reload();
        }, 2000);
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao excluir OS:', error);
        mostrarErro('Erro ao excluir OS: ' + error.message);
    }
}

// Gerar saída de material a partir da OS
async function gerarSaidaDeOS(osId) {
    try {
        mostrarLoading('Gerando saída de material...');
        
        // Buscar OS
        const osDoc = await ordensServicoRef.doc(osId).get();
        if (!osDoc.exists) {
            throw new Error('OS não encontrada');
        }
        
        const os = osDoc.data();
        
        // Obter usuário logado
        const usuarioNome = sessionStorage.getItem('stic_usuario_nome') || 'Sistema';
        const usuarioNumero = sessionStorage.getItem('stic_usuario_numero') || '';
        const usuarioLogado = `${usuarioNome}${usuarioNumero ? ' - ' + usuarioNumero : ''}`;
        
        // Criar saída automática
        const saida = {
            tipo_material: os.tipo_equipamento,
            patrimonio: os.patrimonio,
            numero_serie: os.numero_serie,
            marca: os.marca,
            modelo: os.modelo,
            estado_conservacao: 'consertado',
            
            recebedor: os.solicitante, // Quem recebe de volta é o solicitante original
            
            data_saida: new Date().toISOString().split('T')[0],
            hora_saida: new Date().toTimeString().slice(0, 5),
            motivo: 'Devolução após conserto',
            observacoes: `OS ${os.numero} finalizada. ${os.solucao || 'Conserto concluído'}`,
            
            os_vinculada: osId,
            entrada_vinculada: os.entrada_material_id || null,
            
            status: 'aguardando_assinatura',
            assinado: false,
            registrado_por: usuarioLogado,
            data_registro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Salvar saída
        const docRefSaida = await saidasRef.add(saida);
        
        // Atualizar OS com ID da saída
        await ordensServicoRef.doc(osId).update({
            saida_material_id: docRefSaida.id
        });
        
        ocultarLoading();
        mostrarSucesso('Saída gerada! Agora assine o termo.');
        
        // Redirecionar para assinatura do técnico
        setTimeout(() => {
            const linkAssinarTecnico = `${window.location.origin}/pages/assinar-tecnico.html?tipo=saida&id=${docRefSaida.id}`;
            window.location.href = linkAssinarTecnico;
        }, 1500);
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao gerar saída:', error);
        mostrarErro('Erro ao gerar saída: ' + error.message);
    }
}

// Listar todas as OS
async function listarTodasOS(limite = 100) {
    try {
        const snapshot = await ordensServicoRef.limit(limite).get();
        const lista = [];
        
        snapshot.forEach(doc => {
            lista.push({ id: doc.id, ...doc.data() });
        });
        
        return lista;
    } catch (error) {
        console.error('Erro ao listar OS:', error);
        throw error;
    }
}

console.log('✅ Gerenciador de OS carregado!');
