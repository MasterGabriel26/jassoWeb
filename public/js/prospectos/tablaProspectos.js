
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

    const updateSearchInterface = () => {
        const filterType = elements.filterType.value;
        const isTextSearch = filterType === 'name' || filterType === 'telefono_prospecto';

        elements.textSearch.style.display = isTextSearch ? 'flex' : 'none';
        elements.selectValue.style.display = isTextSearch ? 'none' : 'flex';

        if (isTextSearch) {
            elements.searchInput.placeholder = `Buscar por ${filterType === 'name' ? 'nombre' : 'teléfono'}...`;
            elements.searchInput.value = ''; // Limpiar input al cambiar
        } else {
            elements.selectValue.value = ''; // Limpiar select al cambiar
            updateSelectOptions(filterType);
        }

        // Resetear la búsqueda al cambiar el tipo
        resetAndLoadProspectos();
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
                // Búsqueda por nombre con relevancia
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
                // Búsqueda por teléfono
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
                // Obtener el nombre del lugar
                const lugarDoc = await db.collection('lugares').doc(filterValue).get();
                if (lugarDoc.exists) {
                    query = query.where("pregunta_por", "==", lugarDoc.data().nombreLugar);
                }
                break;
            case 'tipo_evento':
                // Obtener el nombre del evento
                const eventoDoc = await db.collection('eventos').doc(filterValue).get();
                if (eventoDoc.exists) {
                    query = query.where("tipo_evento", "==", eventoDoc.data().evento);
                }
                break;
            case 'asesor':
                // Para asesor usamos directamente el ID
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
  
  // Coincidencia exacta tiene la mayor relevancia
  if (normalizedName === searchValue) {
      relevance += 100;
  }
  
  // Coincidencia al inicio del nombre
  if (normalizedName.startsWith(searchValue)) {
      relevance += 50;
  }
  
  // Coincidencia de términos individuales
  searchTerms.forEach(term => {
      if (normalizedName.includes(term)) {
          relevance += 25;
          
          // Bonus por coincidencia al inicio de una palabra
          const words = normalizedName.split(' ');
          if (words.some(word => word.startsWith(term))) {
              relevance += 15;
          }
      }
  });
  
  // Penalización para "Sin Nombre"
  if (name === "Sin Nombre" || name === "sin nombre") {
      relevance = Math.max(0, relevance - 50);
  }
  
  return relevance;
}

// Función para mostrar los resultados filtrados
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

// Modificar la función cargarProspectos para manejar el loader
async function cargarProspectos(query) {
    if (isLoading) return;
    
    isLoading = true;
    showLoader();
    
    try {
        console.log('Iniciando carga de prospectos');
        const snapshot = await query.limit(pageSize).get();
        
        if (snapshot.empty) {
            elements.prospectosLista.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron resultados</td></tr>';
            return;
        }

        // Limpiar explícitamente la tabla
        elements.prospectosLista.innerHTML = "";
        
        // Log para debugging
        console.log(`Número de documentos recuperados: ${snapshot.docs.length}`);
        
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

