
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
    name: 'Tema 1: Introducción a la Contabilidad',
    content: `La contabilidad es un sistema de información que permite identificar, medir y comunicar información económica...`,
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
