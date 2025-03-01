
function initializeApp() {
    actualizarContadorProspectos()
    setupSearchFunctionality();
    setupScrollListener();
    setupModalListeners();
    loadInitialData();
}

// Configuración de la funcionalidad de búsqueda
function setupSearchFunctionality() {
    let searchTimeout;

    const updateSearchInterface = async () => {
        const filterType = elements.filterType.value;
        const isTextSearch = filterType === 'name' || filterType === 'telefono_prospecto';
        const isCompartidos = filterType === 'compartidos';
        const isTodos = filterType === 'todos';
        const isMisProspectos = filterType === 'mis-prospectos';
    
        // Ocultar/mostrar elementos según el tipo de filtro
        elements.textSearch.style.display = isTextSearch ? 'flex' : 'none';
        elements.selectValue.style.display = (!isTextSearch && !isCompartidos && !isTodos && !isMisProspectos) ? 'flex' : 'none';
    
        // Limpiar la tabla antes de mostrar nuevos resultados
        elements.prospectosLista.innerHTML = "";
    
        if (isTextSearch) {
            elements.searchInput.placeholder = `Buscar por ${filterType === 'name' ? 'nombre' : 'teléfono'}...`;
            elements.searchInput.value = '';
            resetAndLoadProspectos();
        } else if (isCompartidos) {
            await loadCompartidosConmigo();
        } else if (isMisProspectos) {
            await loadMisProspectos();
        } else if (isTodos) {
            resetAndLoadProspectos();
        } else {
            elements.selectValue.value = '';
            updateSelectOptions(filterType);
            resetAndLoadProspectos();
        }
    };
    
    // Función para cargar mis prospectos
    async function loadMisProspectos() {
        showLoader();
        isSearchActive = true; // Prevenir la carga automática normal
    
        try {
            const currentUser = firebase.auth().currentUser;
            if (!currentUser) {
                elements.prospectosLista.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">
                            Debe iniciar sesión para ver sus prospectos
                        </td>
                    </tr>
                `;
                hideLoader();
                return;
            }
    
            // Configurar la consulta inicial
            currentQuery = db.collection("prospectos2")
                .where("asesor", "==", currentUser.uid)
                .orderBy("fecha_create", "desc");
    
            const snapshot = await currentQuery.limit(pageSize).get();
    
            if (snapshot.empty) {
                elements.prospectosLista.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">
                            <div class="alert alert-info">
                                No tienes prospectos registrados
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
    
            // Limpiar la tabla
            elements.prospectosLista.innerHTML = "";
    
            // Agregar encabezado indicador
            const header = document.createElement('tr');
            header.innerHTML = `
                <td colspan="7" class="text-center bg-light">
                    <div class="d-flex justify-content-between align-items-center p-2">
                        <span>Mis Prospectos</span>
                        <button class="btn btn-outline-primary btn-sm" onclick="resetAndLoadProspectos()">
                            Ver todos los prospectos
                        </button>
                    </div>
                </td>
            `;
            elements.prospectosLista.appendChild(header);
    
            // Mostrar resultados
            await actualizarTabla(snapshot.docs, false);
    
            // Actualizar lastVisible para la paginación
            lastVisible = snapshot.docs[snapshot.docs.length - 1];
    
            // Configurar el scroll infinito específico para mis prospectos
            setupMisProspectosScroll();
    
        } catch (error) {
            console.error("Error al cargar mis prospectos:", error);
            elements.prospectosLista.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        Error al cargar los prospectos
                    </td>
                </tr>
            `;
        } finally {
            hideLoader();
        }
    }
    
    // Función para manejar el scroll infinito de mis prospectos
    function setupMisProspectosScroll() {
        const tableBody = elements.tableBody;
        
        // Remover listener anterior si existe
        if (window.misProspectosScrollHandler) {
            tableBody.removeEventListener('scroll', window.misProspectosScrollHandler);
        }
    
        // Crear nuevo listener
        window.misProspectosScrollHandler = async function() {
            if (isLoading || !lastVisible) return;
    
            const scrollPosition = tableBody.scrollTop + tableBody.clientHeight;
            const scrollThreshold = tableBody.scrollHeight - 100;
    
            if (scrollPosition >= scrollThreshold) {
                isLoading = true;
                showLoader();
    
                try {
                    const currentUser = firebase.auth().currentUser;
                    if (!currentUser) return;
    
                    const snapshot = await currentQuery
                        .startAfter(lastVisible)
                        .limit(pageSize)
                        .get();
    
                    if (!snapshot.empty) {
                        await actualizarTabla(snapshot.docs, true);
                        lastVisible = snapshot.docs[snapshot.docs.length - 1];
                    }
                } catch (error) {
                    console.error("Error al cargar más prospectos:", error);
                } finally {
                    isLoading = false;
                    hideLoader();
                }
            }
        };
    
        tableBody.addEventListener('scroll', window.misProspectosScrollHandler);
    }
    

// Función para normalizar texto (eliminar tildes y convertir a minúsculas)
function normalizeText(text) {
    return text.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

const handleTextSearch = () => {
    const searchValue = normalizeText(elements.searchInput.value);
    const filterType = elements.filterType.value;

    clearTimeout(searchTimeout);
    
    if (!searchValue) {
        resetAndLoadProspectos();
        return;
    }

    // Mostrar indicador de búsqueda
    elements.prospectosLista.innerHTML = `
        <tr>
            <td colspan="7" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Buscando...</span>
                </div>
                <p>Buscando "${searchValue}"...</p>
            </td>
        </tr>
    `;

    searchTimeout = setTimeout(async () => {
        showLoader();
        try {
            if (filterType === 'name') {
                // Implementar búsqueda paginada
                await searchByName(searchValue);
            } else if (filterType === 'telefono_prospecto') {
                await searchByPhone(searchValue);
            }
        } catch (error) {
            console.error("Error en la búsqueda:", error);
            elements.prospectosLista.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        Error en la búsqueda. Por favor, intente de nuevo.
                    </td>
                </tr>
            `;
        } finally {
            hideLoader();
        }
    }, 500);
};

// Variables globales para la búsqueda paginada
let searchLastDoc = null;
let currentSearchValue = '';
let isSearching = false;

async function searchByName(searchValue, loadMore = false) {
    if (!loadMore) {
        searchLastDoc = null;
        currentSearchValue = searchValue;
    }

    try {
        // Crear consulta base
        let query = db.collection("prospectos2")
            .orderBy("nameMin")
            .startAt(searchValue)
            .endAt(searchValue + '\uf8ff')
            .limit(20);

        // Si estamos cargando más resultados, usar el último documento
        if (loadMore && searchLastDoc) {
            query = query.startAfter(searchLastDoc);
        }

        const snapshot = await query.get();
        
        // Guardar el último documento para la siguiente página
        if (!snapshot.empty) {
            searchLastDoc = snapshot.docs[snapshot.docs.length - 1];
        }

        // Mostrar resultados
        await mostrarResultadosBusqueda(snapshot.docs, loadMore);

        // Configurar el scroll infinito para la búsqueda
        setupSearchScroll();

    } catch (error) {
        console.error("Error en la búsqueda por nombre:", error);
        throw error;
    }
}

async function searchByPhone(searchValue, loadMore = false) {
    if (!loadMore) {
        searchLastDoc = null;
        currentSearchValue = searchValue;
    }

    try {
        let query = db.collection("prospectos2")
            .where("telefono_prospecto", ">=", searchValue)
            .where("telefono_prospecto", "<=", searchValue + '\uf8ff')
            .orderBy("telefono_prospecto")
            .limit(20);

        if (loadMore && searchLastDoc) {
            query = query.startAfter(searchLastDoc);
        }

        const snapshot = await query.get();
        
        if (!snapshot.empty) {
            searchLastDoc = snapshot.docs[snapshot.docs.length - 1];
        }

        await mostrarResultadosBusqueda(snapshot.docs, loadMore);
        setupSearchScroll();

    } catch (error) {
        console.error("Error en la búsqueda por teléfono:", error);
        throw error;
    }
}

function setupSearchScroll() {
    const tableBody = elements.tableBody;
    
    // Remover listener anterior si existe
    if (window.searchScrollHandler) {
        tableBody.removeEventListener('scroll', window.searchScrollHandler);
    }

    // Crear nuevo listener
    window.searchScrollHandler = async function() {
        if (isSearching) return;

        const scrollPosition = tableBody.scrollTop + tableBody.clientHeight;
        const scrollThreshold = tableBody.scrollHeight - 100;

        if (scrollPosition >= scrollThreshold) {
            isSearching = true;
            
            const filterType = elements.filterType.value;
            if (filterType === 'name') {
                await searchByName(currentSearchValue, true);
            } else if (filterType === 'telefono_prospecto') {
                await searchByPhone(currentSearchValue, true);
            }
            
            isSearching = false;
        }
    };

    tableBody.addEventListener('scroll', window.searchScrollHandler);
}

    
    // Función mejorada para calcular la relevancia
    function calculateRelevance(name, searchValue) {
        if (!name || typeof name !== 'string') return 0;
        
        const normalizedName = name.toLowerCase().trim();
        const searchTerms = searchValue.toLowerCase().trim().split(' ');
        
        if (normalizedName === "sin nombre") return 0;
        
        let relevance = 0;
        
        // Coincidencia exacta
        if (normalizedName === searchValue) {
            relevance += 100;
            return relevance; // Retornar inmediatamente si hay coincidencia exacta
        }
        
        // Coincidencia al inicio del nombre
        if (normalizedName.startsWith(searchValue)) {
            relevance += 80;
        }
        
        // Coincidencia de términos completos
        const nameWords = normalizedName.split(' ');
        for (const term of searchTerms) {
            if (term.length < 2) continue; // Ignorar términos muy cortos
            
            if (nameWords.includes(term)) {
                relevance += 60;
            }
            
            // Coincidencia parcial al inicio de cualquier palabra
            if (nameWords.some(word => word.startsWith(term))) {
                relevance += 40;
            }
        }
        
        // Coincidencia en cualquier parte del nombre
        if (normalizedName.includes(searchValue)) {
            relevance += 20;
        }
        
        return relevance;
    }
    
    // Función mejorada para cargar prospectos compartidos
    const loadCompartidosConmigo = async () => {
        showLoader();
    
        try {
            const currentUser = firebase.auth().currentUser;
            if (!currentUser) {
                hideLoader();
                return;
            }
    
            // Obtener los últimos 50 prospectos compartidos
            const compartidosSnapshot = await db.collection('prospectoCompartidos')
                .where('uidDestino', 'array-contains', currentUser.uid)
                .where('activo', '==', true)
                .orderBy('fecha', 'desc')
                .limit(50)
                .get();
    
            if (compartidosSnapshot.empty) {
                elements.prospectosLista.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">
                            No se han compartido prospectos contigo.
                        </td>
                    </tr>
                `;
                return;
            }
    
            // Crear un mapa para almacenar los prospectos más recientes
            const prospectosMap = new Map();
            
            // Procesar los documentos en lotes
            const batchSize = 10;
            const prospectos = [];
            
            for (let i = 0; i < compartidosSnapshot.docs.length; i += batchSize) {
                const batch = compartidosSnapshot.docs.slice(i, i + batchSize);
                const batchPromises = batch.map(async (doc) => {
                    const data = doc.data();
                    if (!data.idProspectos) return;
    
                    for (const prospectoId of data.idProspectos) {
                        // Evitar duplicados
                        if (prospectosMap.has(prospectoId)) continue;
                        
                        const prospectoDoc = await db.collection('prospectos2').doc(prospectoId).get();
                        if (!prospectoDoc.exists) continue;
    
                        const prospectoData = prospectoDoc.data();
                        const usuarioOrigenDoc = await db.collection('usuarios')
                            .doc(data.uidOrigen)
                            .get();
    
                        prospectosMap.set(prospectoId, {
                            ...prospectoData,
                            id: prospectoId,
                            compartidoPor: usuarioOrigenDoc.data()?.name || 'Usuario',
                            fechaCompartido: data.fecha,
                            compartidoId: doc.id
                        });
                    }
                });
    
                await Promise.all(batchPromises);
            }
    
            // Convertir el mapa a array y ordenar
            const prospectosArray = Array.from(prospectosMap.values())
                .sort((a, b) => b.fechaCompartido - a.fechaCompartido);
    
            // Renderizar los resultados
            const rows = await Promise.all(prospectosArray.map(async prospecto => {
                const nAsesor = await obtenerNombreAsesor(prospecto.asesor);
                const row = crearFilaProspecto(prospecto, prospecto.id, nAsesor);
                
                const compartidoInfo = document.createElement('div');
                compartidoInfo.className = 'compartido-info';
                compartidoInfo.innerHTML = `
                    <small class="text-muted">
                        <i class="fas fa-share-alt"></i>
                        ${prospecto.compartidoPor}
                        (${formatearFecha(prospecto.fechaCompartido)})
                    </small>
                `;
                
                const lastCell = row.lastElementChild;
                lastCell.appendChild(compartidoInfo);
                
                return row;
            }));
    
            elements.prospectosLista.innerHTML = '';
            rows.forEach(row => elements.prospectosLista.appendChild(row));
    
        } catch (error) {
            console.error('Error al cargar prospectos compartidos:', error);
            elements.prospectosLista.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        Error al cargar los prospectos compartidos
                    </td>
                </tr>
            `;
        } finally {
            hideLoader();
        }
    };
    const handleSelectSearch = async () => {
        const filterType = elements.filterType.value;
        const filterValue = elements.selectValue.value;

        if (!filterValue) {
            resetAndLoadProspectos();
            return;
        }

        let query = db.collection("prospectos2");
        
        switch (filterType) {
            case 'lugar':
                const lugarDoc = await db.collection('lugares').doc(filterValue).get();
                if (lugarDoc.exists) {
                    query = query.where("pregunta_por", "==", lugarDoc.data().nombreLugar);
                }
                break;
            case 'tipo_evento':
                const eventoDoc = await db.collection('eventos').doc(filterValue).get();
                if (eventoDoc.exists) {
                    query = query.where("tipo_evento", "==", eventoDoc.data().evento);
                }
                break;
            case 'asesor':
                query = query.where("asesor", "==", filterValue);
                break;
        }

        cargarProspectos(query);
    };

    function updateSelectOptions(filterType) {
        elements.selectValue.innerHTML = '<option value="">Seleccione...</option>';

        const collectionMap = {
            'lugar': { collection: 'lugares', attribute: 'nombreLugar' },
            'tipo_evento': { collection: 'eventos', attribute: 'evento' },
            'asesor': { collection: 'usuarios', attribute: 'name' }
        };

        const config = collectionMap[filterType];
        if (config) {
            populateSelect('select-value', config.collection, config.attribute);
        }
    }

    // Event Listeners
    elements.filterType.addEventListener('change', updateSearchInterface);
    elements.searchInput.addEventListener('input', handleTextSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleTextSearch();
    });
    elements.selectValue.addEventListener('change', handleSelectSearch);

    // Inicializar interfaz
    updateSearchInterface();
}

// Función para poblar los selects
function populateSelect(selectId, collectionName, attribute) {
    const select = document.getElementById(selectId);
    db.collection(collectionName)
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const option = document.createElement("option");
                option.value = doc.id;
                option.textContent = doc.data()[attribute];
                select.appendChild(option);
            });
        })
        .catch((error) => {
            console.error("Error fetching data: ", error);
        });
}



async function mostrarResultadosFiltrados(results) {
    elements.prospectosLista.innerHTML = "";
    
    if (results.length === 0) {
        elements.prospectosLista.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron resultados</td></tr>';
        return;
    }

    for (const result of results) {
        const nombreAsesor = await obtenerNombreAsesor(result.asesor);
        const row = crearFilaProspecto(result, result.id, nombreAsesor);
        elements.prospectosLista.appendChild(row);
    }
}


// Modificar cargarProspectos
async function cargarProspectos(query) {
    if (isLoading || isSearchActive) return; // No cargar más si hay una búsqueda activa
    
    isLoading = true;
    
    
    try {
        const snapshot = await query.limit(pageSize).get();
        
        if (snapshot.empty) {
            elements.prospectosLista.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron resultados</td></tr>';
            return;
        }

        currentQuery = query;
        await actualizarTabla(snapshot.docs, false);
        lastVisible = snapshot.docs[snapshot.docs.length - 1];
       
    } catch (error) {
        console.error("Error al cargar prospectos:", error);
        elements.prospectosLista.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar los datos</td></tr>';
    } finally {
        isLoading = false;
        hideLoader();
    }
}




// Nueva función para calcular la puntuación de coincidencia
function calculateMatchScore(name, searchValue) {
    if (!name) return 0;
    
    const normalizedName = name.toLowerCase().trim();
    const searchTerms = searchValue.toLowerCase().trim().split(' ');
    
    if (normalizedName === "sin nombre") return 0;
    
    let score = 0;
    const nameWords = normalizedName.split(' ');

    // Coincidencia exacta completa
    if (normalizedName === searchValue) return 100;

    for (const term of searchTerms) {
        if (term.length < 2) continue;

        // Coincidencia exacta de palabra
        if (nameWords.includes(term)) {
            score += 50;
        }
        // Coincidencia al inicio de una palabra
        else if (nameWords.some(word => word.startsWith(term))) {
            score += 30;
        }
        // Coincidencia parcial en cualquier parte
        else if (normalizedName.includes(term)) {
            score += 10;
        }
    }

    return score;
}
async function mostrarResultadosBusqueda(docs, append = false) {
    if (!docs.length && !append) {
        elements.prospectosLista.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="alert alert-info">
                        No se encontraron resultados
                        <button class="btn btn-link" onclick="resetAndLoadProspectos()">
                            Volver a todos los prospectos
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    if (!append) {
        elements.prospectosLista.innerHTML = "";
        
        // Agregar encabezado de búsqueda
        const searchHeader = document.createElement('tr');
        searchHeader.innerHTML = `
            <td colspan="7" class="text-center bg-light sticky-top">
                <div class="d-flex justify-content-between align-items-center p-2">
                    <span>Resultados de búsqueda</span>
                    <button class="btn btn-outline-primary btn-sm" onclick="resetAndLoadProspectos()">
                        Volver a todos los prospectos
                    </button>
                </div>
            </td>
        `;
        elements.prospectosLista.appendChild(searchHeader);
    }

    // Agregar nuevos resultados
    const rows = await Promise.all(docs.map(async doc => {
        const prospecto = doc.data();
        const nombreAsesor = await obtenerNombreAsesor(prospecto.asesor);
        return crearFilaProspecto(prospecto, doc.id, nombreAsesor);
    }));

    rows.forEach(row => elements.prospectosLista.appendChild(row));
}


// Modificar resetAndLoadProspectos
// Modificar la función resetAndLoadProspectos para limpiar los listeners
function resetAndLoadProspectos() {
    resetProspectosTracking();
    // Limpiar listeners de scroll
    if (window.searchScrollHandler) {
        elements.tableBody.removeEventListener('scroll', window.searchScrollHandler);
    }
    if (window.misProspectosScrollHandler) {
        elements.tableBody.removeEventListener('scroll', window.misProspectosScrollHandler);
    }

    // Resetear variables
    searchLastDoc = null;
    currentSearchValue = '';
    isSearchActive = false;
    isLoading = false;
    lastVisible = null;

    // Limpiar tabla y cargar datos iniciales
    elements.prospectosLista.innerHTML = "";
    currentQuery = db.collection("prospectos2").orderBy("fecha_create", "desc");
    cargarProspectos(currentQuery);
}



// Modificar setupScrollListener
function setupScrollListener() {
    elements.tableBody.addEventListener("scroll", () => {
        if (!isSearchActive && // No cargar más durante una búsqueda
            elements.tableBody.scrollTop + elements.tableBody.clientHeight >= elements.tableBody.scrollHeight - 100) {
            cargarMasProspectos();
        }
    });
}
const loaderContainer = document.getElementById('loader');
  

function showLoader() {
    if (elements.loader) {
        elements.loader.style.display = 'block';
    }
}

function hideLoader() {
    if (elements.loader) {
        elements.loader.style.display = 'none';
 
    }
}


async function actualizarContadorProspectos() {
  try {
      const contadorDoc = await db.collection("contador")
          .where("nombreColeccion", "==", "prospectos")
          .get();

      if (!contadorDoc.empty) {
          const contador = contadorDoc.docs[0].data().contador;
          const elementoContador = document.getElementById('total-prospectos');
          
          // Animación del contador
          const duracion = 1000; // 1 segundo
          const incremento = contador / (duracion / 16); // 60 FPS
          let valorActual = 0;

          const animacion = setInterval(() => {
              valorActual = Math.min(valorActual + incremento, contador);
              elementoContador.textContent = Math.round(valorActual).toLocaleString();

              if (valorActual >= contador) {
                  clearInterval(animacion);
              }
          }, 16);
      }
  } catch (error) {
      console.error("Error al obtener el contador:", error);
  }
}



async function cargarMasProspectos() {
    if (!lastVisible || !currentQuery || isLoading) return;

    isLoading = true;
    showLoader();
    try {
        const snapshot = await currentQuery
            .startAfter(lastVisible)
            .limit(pageSize)
            .get();

        if (!snapshot.empty) {
            // Verificar duplicados antes de actualizar
            const newDocs = snapshot.docs.filter(doc => !prospectosIds.has(doc.id));
            if (newDocs.length > 0) {
                await actualizarTabla(newDocs, true);
                lastVisible = snapshot.docs[snapshot.docs.length - 1];
            }
        }
    } catch (error) {
        console.error("Error al cargar más prospectos:", error);
    } finally {
        isLoading = false;
        hideLoader();
    }
}


// Variable global para trackear IDs
let prospectosIds = new Set();

// Función para resetear el tracking cuando sea necesario
function resetProspectosTracking() {
    prospectosIds = new Set();
}


// Asegurarse de que actualizarTabla sea async
async function actualizarTabla(docs, append = false) {
    // Limpiar la tabla y el tracking si no es append
    if (!append) {
        elements.prospectosLista.innerHTML = "";
        resetProspectosTracking();
    }
    
    const fragmento = document.createDocumentFragment(); // Usar fragmento para mejor rendimiento
    
    for (const doc of docs) {
        // Verificar si este documento ya fue agregado
        if (!prospectosIds.has(doc.id)) {
            const prospecto = doc.data();
            const nombreAsesor = await obtenerNombreAsesor(prospecto.asesor);
            const row = crearFilaProspecto(prospecto, doc.id, nombreAsesor);
            fragmento.appendChild(row);
            prospectosIds.add(doc.id);
        }
    }
    
    elements.prospectosLista.appendChild(fragmento);
}

function crearFilaProspecto(prospecto, id, nombreAsesor) {
    const row = document.createElement("tr");
    row.style.cursor = "pointer";
    row.addEventListener("click", () => mostrarModalProspecto(prospecto, id, nombreAsesor));

    const createCell = (content, defaultText) => {
        const isDefault = content === defaultText || !content;
        return `<td class="${isDefault ? 'text-muted' : ''}">${content || defaultText}</td>`;
    };

    row.innerHTML = `
        ${createCell(prospecto.folio, "Sin folio")}
        ${createCell(prospecto.name, "Sin Nombre")}
        ${createCell(prospecto.telefono_prospecto, "Sin teléfono")}
        ${createCell(prospecto.pregunta_por, "Sin preguntar")}
        ${createCell(prospecto.tipo_evento, "Sin evento")}
        <td>${nombreAsesor}</td>
        <td>${formatearFecha(prospecto.fecha_create)}</td>
    `;
    return row;
}


async function obtenerNombreAsesor(asesorId) {
    if (!asesorId) return "Sin asesor";
    try {
        const doc = await db.collection("usuarios").doc(asesorId).get();
        return doc.exists ? doc.data().name || "Sin nombre" : "Sin asesor";
    } catch (error) {
        console.error("Error al obtener el nombre del asesor:", error);
        return "Error al obtener asesor";
    }
}

function formatearFecha(timestamp) {
    if (!timestamp) return "Fecha no disponible";
    const fecha = new Date(timestamp);
    return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}



// Función para cargar datos iniciales
function loadInitialData() {
    resetAndLoadProspectos();
    loaderContainer.classList.add("hidden");

}


// Inicialización cuando el DOM está cargado
document.addEventListener("DOMContentLoaded", initializeApp);
