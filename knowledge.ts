
import { DocumentSource } from './types';

/**
 * BASE DE CONOCIMIENTO CENTRALIZADA
 * Cualquier texto que pegues aquí será parte de la app en GitHub.
 * Los alumnos no necesitan subir archivos; la IA ya los conocerá.
 * Ampliado a 50 temas para cubrir todo el programa académico.
 */
export const PRIVATE_KNOWLEDGE_BASE: DocumentSource[] = [
  {
    id: 'doc-1',
    name: 'Tema 1: Información y toma de decisiones I',
    content: `1.	Información y toma de decisiones
En una empresa se hace necesario tomar decisiones, para tomar decisiones fundamentadas es necesario disponer de información sobre la empresa. Entre los diferentes tipos de información se encuentra la información contable, cuya utilidad gira en torno a poder evaluar la posibilidad de obtener resultados y flujos de efectivo en el futuro. La información contable es útil para tomar decisiones porque reduce la incertidumbre ya que a partir de ella se puede determinar la rentabilidad y el riesgo, haciendo que el decisor tome una decisión basada en la información.
Para tomar esta decisión hay que respetar la restricción coste-beneficio y hay que tener en cuenta que se puede producir asimetría en la información, es decir, que haya usuarios que tengan más información que otros (no tiene la misma información alguien que conoce la empresa desde dentro que alguien externo que solo puede interpretar las cuentas anuales).
Esta información contable de la que dispone el decisor se puede diferenciar según uso en:
-	La contabilidad analítica, también denominada “contabilidad de costes” o “contabilidad de gestión”, es la que tiene como objeto dirigir las decisiones financieras que se toman en el seno de una empresa. Se encarga de generar toda la información de importancia para la toma de decisiones internas como, por ejemplo, continuar o no con la fabricación de algún producto o aceptar/rechazar algún pedido. Por esto se dice que esta contabilidad se enfoca hacia los decisores internos de la entidad empresarial.
-	La contabilidad financiera puede definirse como la contabilidad general de una empresa, ya que su objeto es preparar los estados contables para informar la renta y el patrimonio de la entidad empresarial. Para esto, debe registrar y captar las transacciones que efectúe la empresa con el mundo que la rodea, el mundo externo. Por esto, se dice que la contabilidad financiera está dirigida al decisor externo.
Centrándonos en la contabilidad financiera, dirigida al decisor externo, hay que tener en consideración que este usuario de la información contable no tiene porque ser un experto en contabilidad, ni conocer el lenguaje contable, ni tener experiencia ni tener acceso a determinada información. Por eso es posible que necesite ayuda de un analista para interpretar la información.
El papel del analista consiste en actuar como intermediario entre el decisor y la información financiera evaluando la validez y fiabilidad de la información tanto de la empresa como del sector, considerando qué datos son relevantes y transformándolos en ratios o indicadores en función de sus necesidades y finalmente generando el informe de análisis con el que transmite toda esa información y su opinión sobre qué decisión debería tomar al decisor de una forma accesible para él. El analista financiero externo cuenta con las CCAA; información externa general, sectorial, etc.; y escasa información interna.

2. Análisis financiero
El análisis financiero es una disciplina que proporciona los conceptos y las técnicas necesarias para formular juicios consistentes sobre la empresa que ayuden a los diferentes agentes a tomar decisiones. En esta asignatura es el objetivo final, pues tendremos que meternos en el papel del analista para elaborar el informe de análisis de alguna empresa y recomendar al decisor tomar una decisión en base a lo analizado.
Todo análisis conlleva realizar una búsqueda de información, descomponer e integrar datos, sintetizar la opinión y hacer que el análisis sirva para tomar la decisión.
Las características del análisis financiero son las siguientes:
1. Carácter no estructurado: es decir, tienen un carácter contextual y contingente. Esto es debido a que cada empresa es un mundo (son heterogéneas), por ejemplo, una destacará más por no tener liquidez para afrontar los pagos y otra por no ser rentable por generar escaso beneficio. Asimismo, la necesidad informativa que tiene el decisor puede variar y esto influye en la forma de realizar el análisis.
2. Necesidad de flexibilidad: las variables explicativas utilizadas dependerán del objetivo del análisis y del grado de estructuración del problema.
3. Capacidad predictiva: el análisis no se queda solo en analizar la información histórica, sino que debe tener en cuenta cómo evolucionará la empresa, que es lo realmente relevante para el decisor. Esto es lo que vemos con detalle a continuación:
 
Por un lado se encuentra el análisis histórico, con información pasada (tanto contable como otro tipo de información), y por otro lado, el análisis previsional, que se elabora partiendo de la información histórica y contando con escenarios futuros a partir de otra información que se disponga. Ambos caminos confluyen finalmente en el informe de análisis, en el que se analiza tanto lo acontecido hasta la fecha en la empresa como lo que se prevé que suceda en el próximo ejercicio. Este informe de análisis debe considerar las tres variables básicas: rentabilidad, solvencia y liquidez. No incluye toda la labor desarrollada por el analista, sino su opinión debidamente fundamentada. Es el output del analista y el input del decisor, de ahí que la conclusión del analista esté condicionada a la decisión final del decisor, su percepción de riesgo, cultura organizacional, etc.
Las variables básicas de rentabilidad, solvencia y liquidez, ejes fundamentales sobre los que versa el informe de análisis, son las que vamos a profundizar a continuación:
 
3. El proceso de análisis
1.	Identificación del objeto de análisis: el primer paso se refiere a establecer cuál es el objetivo por el que se hace el análisis, por ejemplo, si es para aconsejar a una empresa a realizar una expansión, si es para servir a la empresa para tomar la decisión de escindirse de un grupo empresarial, si es para aconsejar a un inversor sobre si invertir o no en una empresa… El objetivo del análisis puede determinar en cierta medida el enfoque del mismo para darle más importancia a ciertos aspectos a la hora de analizar una empresa.
2.	Recogida de información: cuentas anuales, información no financiera, información del sector… Toda aquella información que resulte de utilidad.
3.	Evaluación de la fidelidad de la información: la información tiene que ser fiable para permitir que el analista emita un juicio objetivo y útil. Por ejemplo, unas cuentas anuales auditadas por una consultora de prestigio.
4.	Identificación del interés justificativo del análisis. Descomposición en áreas: análisis estructural de las cuentas anuales, equilibrio financiero, liquidez, solvencia, rentabilidad…
5.	Depuración de información: Eliminaciones, Ajustes y Reclasificaciones.
6.	Familiarización con la empresa y el sector. Redacción del Informe de presentación: el analista tiene que comprender el contexto en el que opera la empresa conociendo no sólo la empresa en sí, sino también el sector para poder comparar la estructura de la empresa con la estructura del sector. Por ejemplo, si la empresa tiene una rentabilidad económica del 6% en un sector en el que la media está en un 9% ya hay algo que investigar y dar recomendaciones para corregirlo.
7.	Análisis de cada una de las áreas:
1.	Liquidez: Evalúa la capacidad de la empresa para cumplir con sus obligaciones a corto plazo.
2.	Solvencia: Analiza la capacidad de la empresa para cumplir con sus obligaciones a largo plazo.
3.	Rentabilidad: Examina la capacidad de la empresa para generar ganancias en relación con sus recursos.
Para el análisis de cada una de estas áreas se puede valer de indicadores que relacionan diferentes partidas de balance, PyG y EFE.
8.	Búsqueda de información complementaria necesaria: cualquier información adicional que pueda ser útil para comprender completamente la situación financiera.
9.	Conclusión definitiva. Redacción del Informe de Análisis.

3.1 Documentos
Los documentos que puede elaborar el analista son:
-	El informe de presentación: en él se exponen las características más destacadas de la empresa y del sector para contextualizar a la empresa. Los principales productos y servicios ofertados, las principales materias primas y consumos, clientes, proveedores, acreedores financieros, accionistas con participaciones significativas y el entorno legal.
-	Informe de análisis: es el tronco fundamental en el que se transmite al decisor de forma integrada y ordenada las conclusiones alcanzadas por el analista. Tiene que definir o limitar la tarea de análisis, incluir un párrafo de presentación en el caso de que no se haya realizado un informe de presentación como tal, indicar y justificar los ajustes y reclasificaciones y finalmente proponer una decisión.
-	Documentos internos: información adicional, financiera y no financiera, que se ha considerado relevante a la hora de establecer la opinión. Pueden no ser suministrados finalmente al cliente, sino simplemente servir al analista para la elaboración del informe de análisis.

3.2 ¿Cómo hace su trabajo el analista?
En primer lugar depura la información recibida realizando los ajustes cualitativos y cuantitativos que considere oportuno en las cuentas anuales. Y a partir de ahí aplica técnicas de análisis que tienen como funciones principales, por un lado, formar series temporales extrapolables hacia el futuro para realizar predicciones (modelos predictivos) y, por otro, permitir la comparación de la empresa con otras de su sector. Estas técnicas, basadas en ratios e índices pueden ser:
-	Diacrónicas: es de serie temporal – la empresa a lo largo del tiempo –. El objetivo de aplicar esta técnica es identificar variables útiles para la predicción.
-	Sincrónicas: es de corte transversal – la empresa respecto a otras empresas en un momento dado –.
-	Síndromes: supone detectar señales alarmantes, una vez aplicada alguna técnica de las anteriores, que indican existencia de problemas que ponen en peligro la capacidad económica (rentabilidad) y/o financiera (liquidez y solvencia) de una empresa. El principal problema del análisis comparativo es que aunque existan similitudes que fundamenten la comparación, las estrategias mercados, productos, clientes, regulación y otros factores pueden ser diferentes, o cambiar a lo largo del tiempo de manera dispar y afectar a la fiabilidad de la comparación. Otra limitación es que la mayoría de los indicadores en los que se basa el análisis son cocientes entre magnitudes financieras, con lo que se elimina el efecto del tamaño de la empresa y empresas grandes pueden diferir de las pequeñas para un determinado indicador.
Es por ello por lo que la identificación de un patrón válido tiene que cumplir una serie de características:
-	Patrón y empresa deben ser comparables: si es una empresa hotelera no la vayamos a comparar con un supermercado.
-	El patrón tiene que representar un estado conocido (empresa con propensión a la quiebra, empresa solvente, empresa rentable…)
-	Las discrepancias o similitudes elegidas son indicativas de éxito o de fracaso según el objetivo del analista.
Circunstancias que pueden condicionar la validez:
-	Divergencias en las estrategias comerciales, productivas y/o financieras
-	Diferencia en los componentes de la cesta de productos
-	Distintos grados de integración vertical
-	Disparidad en los criterios contables empleados.
Las herramientas son aquellas propuestas de transformación de variables que permiten aumentar su relevancia o significado, simplificar el análisis, reducir su número o facilitar su comparación. Es decir, cálculos que nos sirvan para interpretar explicar la situación de la empresa. Estas pueden ser:
Parte del análisis estructural:
-	Estados financieros de tamaño común o % verticales: muestran el peso relativo (%) de cada partida con respecto a una variable tomada de referencia. Por ejemplo, si estamos con la cuenta de PyG podemos tomar como referencia las ventas y calcular el % vertical del resultado de explotación respecto a las ventas o de los dividendos respecto a las ventas…
-	Estados financieros indexados o % horizontales: muestran la variación sufrida por una partida con respecto a su valor del año anterior o del primer año de la serie. Por ejemplo, si tenemos los balances de dos años consecutivos, podemos calcular la variación sufrida por el inmovilizado material dividiendo el inmovilizado material del último año entre el año anterior.
Parte del análisis:
-	Ratios financieras: cociente de magnitudes contenidas en los estados financieros. Por ejemplo, la ratio de liquidez: Activo c/p / Pasivo c/p.
Las ratios presentan ventajas y limitaciones:
Ventajas:
o	Permiten reducir el número de variables a utilizar y por tanto, la complejidad.
o	Muchas variables relevantes toman forma de ratios: rentabilidad.
o	Permite comparar empresas de diferentes dimensiones
o	Pueden calcularse valores de referencia sectoriales
o	Son aceptados como vehículo de comunicación entre los analistas
Inconvenientes:
o	No neutraliza totalmente la diferencia de dimensión
o	Ratios similares pueden calcularse de distintas maneras. Incertidumbre
o	No existe un elevado nivel de homogeneidad en la información básica
Modelos predictivos: se construyen utilizando varias técnicas de análisis y son los encargados de transformar la información histórica en previsional. Estos modelos se pueden clasificar según el número de variables utilizadas en univariantes (solo cuentan con una variable a partir de la cual trata de sacar la predicción) y multivariantes (tiene en cuenta un conjunto de variables). Y según el tipo de predicción, pueden distinguirse los que predicen el siguiente valor de la variable (puntual, intervalos, mínimo o máximo, condicionada) y los que predicen comportamientos (por ejemplo, el modelo predictivo de quiebra de Altman o el de Bhandari).
`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-2',
    name: 'Tema 2: El Patrimonio de la Empresa',
    content: `El patrimonio se define como el conjunto de bienes, derechos y obligaciones de una entidad...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-3',
    name: 'Tema 3: El Método Contable',
    content: `El método contable se basa en el principio de dualidad o partida doble...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-4',
    name: 'Tema 4: El Ciclo Contable',
    content: `El ciclo contable comprende el proceso desde la apertura hasta el cierre del ejercicio...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-5',
    name: 'Tema 5: Existencias',
    content: `Tratamiento contable de las mercaderías, materias primas y otros aprovisionamientos...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-6',
    name: 'Tema 6: Acreedores y Deudores',
    content: `Contabilización de deudas comerciales y derechos de cobro...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-7',
    name: 'Tema 7: Inmovilizado Material',
    content: `Activos tangibles destinados a la actividad productiva de forma duradera...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-8',
    name: 'Tema 8: Inmovilizado Intangible',
    content: `Activos no monetarios sin apariencia física pero con valor económico...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-9',
    name: 'Tema 9: Instrumentos Financieros',
    content: `Activos y pasivos financieros según el PGC...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-10',
    name: 'Tema 10: Fondos Propios',
    content: `Capital, reservas y otros componentes del patrimonio neto...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-11',
    name: 'Tema 11: Subvenciones y Donaciones',
    content: `Reconocimiento y valoración de ayudas recibidas...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-12',
    name: 'Tema 12: Provisiones y Contingencias',
    content: `Pasivos cuya cuantía o vencimiento son inciertos...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-13',
    name: 'Tema 13: Impuesto sobre Beneficios',
    content: `Diferencias entre resultado contable y base imponible...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-14',
    name: 'Tema 14: Cuentas Anuales',
    content: `Balance, Cuenta de Pérdidas y Ganancias, Memoria, ECPN y EFE...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-15',
    name: 'Tema 15: Análisis de Solvencia',
    content: `Ratios de liquidez, solvencia a largo plazo y endeudamiento...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-16',
    name: 'Tema 16: Análisis de Rentabilidad',
    content: `Análisis del ROE, ROA y apalancamiento financiero...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-17',
    name: 'Tema 17: Estados de Flujos de Efectivo',
    content: `Origen y utilización de los activos monetarios representativos de efectivo...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-18',
    name: 'Tema 18: Consolidación Bancaria',
    content: `Conceptos básicos de grupos de sociedades y estados consolidados...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-19',
    name: 'Tema 19: Auditoría y Control',
    content: `Verificación de las cuentas anuales por un experto independiente...`,
    updatedAt: Date.now()
  },
  {
    id: 'doc-20',
    name: 'Tema 20: Ética y Deontología Profesional',
    content: `Principios éticos en el ejercicio de la contabilidad y auditoría...`,
    updatedAt: Date.now()
  },
  { id: 'doc-21', name: 'Tema 21: Contabilidad de Costes', content: 'Fundamentos de la contabilidad analítica y gestión de costes...', updatedAt: Date.now() },
  { id: 'doc-22', name: 'Tema 22: Sistemas de Amortización', content: 'Métodos lineales, regresivos y por unidad de producción...', updatedAt: Date.now() },
  { id: 'doc-23', name: 'Tema 23: Combinaciones de Negocios', content: 'Fusiones, escisiones y adquisiciones según el PGC...', updatedAt: Date.now() },
  { id: 'doc-24', name: 'Tema 24: Operaciones en Moneda Extranjera', content: 'Tratamiento de las diferencias de cambio y valoración...', updatedAt: Date.now() },
  { id: 'doc-25', name: 'Tema 25: Arrendamientos (Leasing)', content: 'Clasificación y registro de arrendamientos financieros y operativos...', updatedAt: Date.now() },
  { id: 'doc-26', name: 'Tema 26: Activos no Corrientes Mantenidos para la Venta', content: 'Requisitos y valoración de activos destinados a desinversión...', updatedAt: Date.now() },
  { id: 'doc-27', name: 'Tema 27: Pagos Basados en Acciones', content: 'Contabilización de retribuciones mediante instrumentos de patrimonio...', updatedAt: Date.now() },
  { id: 'doc-28', name: 'Tema 28: Pasivos Financieros Especiales', content: 'Bonos, obligaciones y préstamos con intereses implícitos...', updatedAt: Date.now() },
  { id: 'doc-29', name: 'Tema 29: El Estado de Cambios en el Patrimonio Neto', content: 'Análisis profundo de la evolución de las reservas y resultados...', updatedAt: Date.now() },
  { id: 'doc-30', name: 'Tema 30: Memoria de las Cuentas Anuales', content: 'Información cualitativa y desglose obligatorio de partidas...', updatedAt: Date.now() },
  { id: 'doc-31', name: 'Tema 31: Contabilidad de Entidades Sin Fines de Lucro', content: 'Adaptación del PGC a fundaciones y asociaciones...', updatedAt: Date.now() },
  { id: 'doc-32', name: 'Tema 32: Contabilidad Pública', content: 'Principios de contabilidad presupuestaria y pública...', updatedAt: Date.now() },
  { id: 'doc-33', name: 'Tema 33: Análisis de Estados Financieros Avanzado', content: 'Técnicas de comparación sectorial y tendencias temporales...', updatedAt: Date.now() },
  { id: 'doc-34', name: 'Tema 34: Valoración de Empresas', content: 'Métodos de descuento de flujos y múltiplos comparables...', updatedAt: Date.now() },
  { id: 'doc-35', name: 'Tema 35: Planificación Financiera', content: 'Elaboración de presupuestos y estados financieros previsionales...', updatedAt: Date.now() },
  { id: 'doc-36', name: 'Tema 36: Mercados de Capitales', content: 'Funcionamiento de la bolsa y productos financieros derivados...', updatedAt: Date.now() },
  { id: 'doc-37', name: 'Tema 37: Matemáticas Financieras', content: 'Cálculo de rentas, préstamos y capitalización...', updatedAt: Date.now() },
  { id: 'doc-38', name: 'Tema 38: Gestión del Riesgo Financiero', content: 'Identificación y cobertura de riesgos de tipo de interés y crédito...', updatedAt: Date.now() },
  { id: 'doc-39', name: 'Tema 39: Análisis de Inversiones', content: 'Criterios VAN, TIR y Payback en la toma de decisiones...', updatedAt: Date.now() },
  { id: 'doc-40', name: 'Tema 40: Fiscalidad Empresarial', content: 'Impuesto de Sociedades, IVA e IRPF aplicado a la empresa...', updatedAt: Date.now() },
  { id: 'doc-41', name: 'Tema 41: Auditoría de Cuentas Avanzada', content: 'Normas Técnicas de Auditoría y Control de Calidad...', updatedAt: Date.now() },
  { id: 'doc-42', name: 'Tema 42: Forensics y Fraude Contable', content: 'Detección de irregularidades y contabilidad forense...', updatedAt: Date.now() },
  { id: 'doc-43', name: 'Tema 43: Sostenibilidad e Información No Financiera', content: 'Informes ESG y responsabilidad social corporativa...', updatedAt: Date.now() },
  { id: 'doc-44', name: 'Tema 44: Contabilidad de Cooperativas', content: 'Régimen jurídico y contable específico de las sociedades cooperativas...', updatedAt: Date.now() },
  { id: 'doc-45', name: 'Tema 45: Contabilidad Concursal', content: 'Procesos de insolvencia y liquidación de empresas...', updatedAt: Date.now() },
  { id: 'doc-46', name: 'Tema 46: Big Data en Finanzas', content: 'Análisis de datos masivos aplicados a la auditoría y control...', updatedAt: Date.now() },
  { id: 'doc-47', name: 'Tema 47: Normas Internacionales de Información Financiera (NIIF)', content: 'Comparativa entre el PGC español y las NIC/NIIF...', updatedAt: Date.now() },
  { id: 'doc-48', name: 'Tema 48: Consolidación de Estados Financieros II', content: 'Métodos de puesta en equivalencia y agregación...', updatedAt: Date.now() },
  { id: 'doc-49', name: 'Tema 49: Gobierno Corporativo', content: 'Estructuras de mando y transparencia en sociedades cotizadas...', updatedAt: Date.now() },
  { id: 'doc-50', name: 'Tema 50: Casos Prácticos de Síntesis', content: 'Resolución de problemas complejos que integran toda la materia...', updatedAt: Date.now() }
];
