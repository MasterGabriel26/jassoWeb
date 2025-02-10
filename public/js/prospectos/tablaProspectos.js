
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

        // Ocultar/mostrar elementos según el tipo de filtro
        elements.textSearch.style.display = isTextSearch ? 'flex' : 'none';
        elements.selectValue.style.display = (!isTextSearch && !isCompartidos && !isTodos) ? 'flex' : 'none';

        // Limpiar la tabla antes de mostrar nuevos resultados
        elements.prospectosLista.innerHTML = "";

        if (isTextSearch) {
            elements.searchInput.placeholder = `Buscar por ${filterType === 'name' ? 'nombre' : 'teléfono'}...`;
            elements.searchInput.value = '';
            resetAndLoadProspectos();
        } else if (isCompartidos) {
            await loadCompartidosConmigo();
        } else if (isTodos) {
            resetAndLoadProspectos();
        } else {
            elements.selectValue.value = '';
            updateSelectOptions(filterType);
            resetAndLoadProspectos();
        }
    };

    const loadCompartidosConmigo = async () => {
        showLoader();

        try {
            const currentUser = firebase.auth().currentUser;
            if (!currentUser) {
                hideLoader();
                return;
            }

            const compartidosSnapshot = await db.collection('prospectoCompartidos')
                .where('uidDestino', 'array-contains', currentUser.uid)
                .where('activo', '==', true)
                .orderBy('fecha', 'desc')
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

            const prospectosIds = new Set();
            compartidosSnapshot.docs.forEach(doc => {
                const data = doc.data();
                data.idProspectos?.forEach(id => prospectosIds.add(id));
            });

            const prospectos = [];
            for (const prospectoId of prospectosIds) {
                const prospectoDoc = await db.collection('prospectos2').doc(prospectoId).get();
                if (prospectoDoc.exists) {
                    const prospectoData = prospectoDoc.data();
                    const compartidoInfo = compartidosSnapshot.docs.find(doc => 
                        doc.data().idProspectos.includes(prospectoId)
                    );
                    
                    if (compartidoInfo) {
                        const compartidoData = compartidoInfo.data();
                        const usuarioOrigenDoc = await db.collection('usuarios')
                            .doc(compartidoData.uidOrigen)
                            .get();
                        const usuarioOrigen = usuarioOrigenDoc.data();

                        prospectos.push({
                            ...prospectoData,
                            id: prospectoDoc.id,
                            compartidoPor: usuarioOrigen?.name || 'Usuario',
                            fechaCompartido: compartidoData.fecha,
                            compartidoId: compartidoInfo.id
                        });
                    }
                }
            }

            prospectos.sort((a, b) => b.fechaCompartido - a.fechaCompartido);

            const rows = await Promise.all(prospectos.map(async prospecto => {
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

    const handleTextSearch = () => {
        const searchValue = elements.searchInput.value.trim().toLowerCase();
        const filterType = elements.filterType.value;

        if (searchValue.length < 3) {
            resetAndLoadProspectos();
            return;
        }

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            let query = db.collection("prospectos2");

            if (filterType === 'name') {
                const snapshot = await query.get();
                const results = snapshot.docs
                    .map(doc => ({
                        ...doc.data(),
                        id: doc.id,
                        relevance: calculateRelevance(doc.data().name, searchValue)
                    }))
                    .filter(doc => doc.relevance > 0)
                    .sort((a, b) => b.relevance - a.relevance);

                await mostrarResultadosFiltrados(results);
            } else if (filterType === 'telefono_prospecto') {
                query = query
                    .orderBy("telefono_prospecto")
                    .startAt(searchValue)
                    .endAt(searchValue + "\uf8ff");
                cargarProspectos(query);
            }
        }, 300);
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

// Función para calcular la relevancia de un resultado
function calculateRelevance(name, searchValue) {
    if (!name) return 0;
    
    const normalizedName = name.toLowerCase();
    const searchTerms = searchValue.toLowerCase().split(' ');
    
    let relevance = 0;
    
    if (normalizedName === searchValue) {
        relevance += 100;
    }
    
    if (normalizedName.startsWith(searchValue)) {
        relevance += 50;
    }
    
    searchTerms.forEach(term => {
        if (normalizedName.includes(term)) {
            relevance += 25;
            
            const words = normalizedName.split(' ');
            if (words.some(word => word.startsWith(term))) {
                relevance += 15;
            }
        }
    });
    
    if (name === "Sin Nombre" || name === "sin nombre") {
        relevance = Math.max(0, relevance - 50);
    }
    
    return relevance;
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

// Modificar la función cargarProspectos para manejar el loader
async function cargarProspectos(query) {
    if (isLoading) return;
    
    isLoading = true;
    showLoader();
    
    try {
        const snapshot = await query.limit(pageSize).get();
        
        if (snapshot.empty) {
            elements.prospectosLista.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron resultados</td></tr>';
            return;
        }

        elements.prospectosLista.innerHTML = "";
        
        currentQuery = query;
        await actualizarTabla(snapshot.docs, false);
        loaderContainer.classList.add('hidden');
        lastVisible = snapshot.docs[snapshot.docs.length - 1];
       
    } catch (error) {
        console.error("Error al cargar prospectos:", error);
        elements.prospectosLista.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar los datos</td></tr>';
    } finally {
        isLoading = false;
        hideLoader();
    }
}
// Configuración del scroll infinito
function setupScrollListener() {
    elements.tableBody.addEventListener("scroll", () => {
        if (elements.tableBody.scrollTop + elements.tableBody.clientHeight >= elements.tableBody.scrollHeight - 100) {
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



// Modificar cargarMasProspectos también
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

// Asegurarse de que actualizarTabla sea async
async function actualizarTabla(docs, append = false) {
  // Asegurarse de limpiar la tabla si no es append
  if (!append) {
      elements.prospectosLista.innerHTML = "";
  }
  
  // Crear un Set para trackear IDs únicos
  const addedIds = new Set();
  
  for (const doc of docs) {
      // Verificar si este documento ya fue agregado
      if (!addedIds.has(doc.id)) {
          const prospecto = doc.data();
          const nombreAsesor = await obtenerNombreAsesor(prospecto.asesor);
          const row = crearFilaProspecto(prospecto, doc.id, nombreAsesor);
          elements.prospectosLista.appendChild(row);
          addedIds.add(doc.id);
      }
  }
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

function resetAndLoadProspectos() {
    elements.prospectosLista.innerHTML = "";
    lastVisible = null;
    currentQuery = db.collection("prospectos2").orderBy("fecha_create", "desc");
    cargarProspectos(currentQuery);
}



// Función para cargar datos iniciales
function loadInitialData() {
    resetAndLoadProspectos();
}


// Inicialización cuando el DOM está cargado
document.addEventListener("DOMContentLoaded", initializeApp);

