// Brand Mock Data for Orbit Marketing Intelligence
import type { 
  MIBrand, 
  BrandBrief, 
  BrandObjectives, 
  BuyerPersona, 
  BrandAsset,
  KPIRange 
} from './brand-types'

// Mock Brands - Real Estate focused
export const mockBrands: MIBrand[] = [
  {
    id: 'brand-1',
    clientId: 'client-1',
    name: 'Torre Central Living',
    status: 'activo',
    projectType: 'inmobiliario',
    industry: 'Real Estate',
    country: 'México',
    city: 'Ciudad de México',
    website: 'https://torrecentralliving.mx',
    socialMedia: {
      instagram: '@torrecentralliving',
      facebook: 'TorreCentralLiving',
    },
    logo: '/placeholder-logo.png',
    colors: ['#1a365d', '#e53e3e', '#ffffff'],
    toneOfVoice: 'Profesional, aspiracional, cálido',
    valueProposition: 'Vivir en el corazón de la ciudad con amenidades de primer nivel',
    differentiators: ['Ubicación premium', 'Amenidades de lujo', 'Arquitectura sustentable'],
    monthlyBudget: 150000,
    startDate: '2024-01-15',
    internalManager: 'María García',
    createdAt: '2024-01-10',
    updatedAt: '2024-04-01',
    profileCompletion: 85,
    briefCompletion: 72,
    objectivesCompletion: 90,
    personasCompletion: 60,
    assetsCompletion: 45,
    realEstate: {
      location: 'Colonia Roma Norte, CDMX',
      priceFrom: 3500000,
      priceTo: 8500000,
      totalUnits: 120,
      availableUnits: 45,
      typologies: ['Depto 1 rec', 'Depto 2 rec', 'Penthouse'],
      sqmFrom: 55,
      sqmTo: 180,
      amenities: ['Roof garden', 'Gimnasio', 'Coworking', 'Pet friendly', 'Alberca'],
      deliveryDate: '2025-12-01',
      stage: 'comercializacion',
      paymentOptions: '10% enganche, 30% durante construcción, 60% a entrega',
      financing: 'Crédito bancario e Infonavit',
      appreciation: '12% anual estimado',
      salesGoal: 15,
      reservationsGoal: 30,
      appointmentsGoal: 100,
      visitsGoal: 200,
    }
  },
  {
    id: 'brand-2',
    clientId: 'client-1',
    name: 'Residencial Bosques',
    status: 'activo',
    projectType: 'inmobiliario',
    industry: 'Real Estate',
    country: 'México',
    city: 'Querétaro',
    website: 'https://residencialbosques.mx',
    socialMedia: {
      instagram: '@residencialbosques',
      facebook: 'ResidencialBosques',
    },
    colors: ['#2d5016', '#f7fafc', '#744210'],
    toneOfVoice: 'Natural, familiar, confiable',
    valueProposition: 'Tu hogar rodeado de naturaleza',
    monthlyBudget: 80000,
    startDate: '2024-02-01',
    internalManager: 'Carlos López',
    createdAt: '2024-02-01',
    updatedAt: '2024-03-28',
    profileCompletion: 70,
    briefCompletion: 55,
    objectivesCompletion: 80,
    personasCompletion: 40,
    assetsCompletion: 30,
    realEstate: {
      location: 'Juriquilla, Querétaro',
      priceFrom: 2800000,
      priceTo: 5200000,
      totalUnits: 200,
      availableUnits: 120,
      typologies: ['Casa 3 rec', 'Casa 4 rec'],
      sqmFrom: 140,
      sqmTo: 220,
      amenities: ['Casa club', 'Áreas verdes', 'Seguridad 24/7', 'Parque para niños'],
      deliveryDate: '2026-06-01',
      stage: 'preventa',
      salesGoal: 20,
      reservationsGoal: 50,
      appointmentsGoal: 150,
      visitsGoal: 300,
    }
  },
  {
    id: 'brand-3',
    clientId: 'client-2',
    name: 'Altiva Residences',
    status: 'activo',
    projectType: 'inmobiliario',
    industry: 'Real Estate',
    country: 'México',
    city: 'Guadalajara',
    website: 'https://altivaresidences.mx',
    socialMedia: {
      instagram: '@altivaresidences',
      facebook: 'AltivaResidences',
      tiktok: '@altiva.residences',
    },
    colors: ['#553c9a', '#d69e2e', '#ffffff'],
    toneOfVoice: 'Exclusivo, sofisticado, moderno',
    valueProposition: 'El nuevo estándar de vida premium en Guadalajara',
    monthlyBudget: 200000,
    startDate: '2024-03-01',
    internalManager: 'Ana Martínez',
    createdAt: '2024-03-01',
    updatedAt: '2024-04-05',
    profileCompletion: 95,
    briefCompletion: 88,
    objectivesCompletion: 100,
    personasCompletion: 80,
    assetsCompletion: 75,
    realEstate: {
      location: 'Puerta de Hierro, Guadalajara',
      priceFrom: 8000000,
      priceTo: 25000000,
      totalUnits: 48,
      availableUnits: 18,
      typologies: ['Depto 2 rec', 'Depto 3 rec', 'Penthouse'],
      sqmFrom: 120,
      sqmTo: 400,
      amenities: ['Sky lounge', 'Spa', 'Gimnasio premium', 'Wine cellar', 'Cine', 'Concierge'],
      deliveryDate: '2025-06-01',
      stage: 'lanzamiento',
      paymentOptions: '30% enganche, 70% a entrega',
      financing: 'Crédito bancario',
      appreciation: '15% anual estimado',
      salesGoal: 8,
      reservationsGoal: 15,
      appointmentsGoal: 50,
      visitsGoal: 100,
    }
  },
  {
    id: 'brand-4',
    clientId: 'client-2',
    name: 'Horizonte Country Club',
    status: 'pausado',
    projectType: 'inmobiliario',
    industry: 'Real Estate',
    country: 'México',
    city: 'Monterrey',
    colors: ['#234e52', '#c05621', '#edf2f7'],
    toneOfVoice: 'Distinguido, tradicional, familiar',
    monthlyBudget: 100000,
    startDate: '2023-09-01',
    internalManager: 'Juan Pérez',
    createdAt: '2023-09-01',
    updatedAt: '2024-02-15',
    profileCompletion: 60,
    briefCompletion: 40,
    objectivesCompletion: 50,
    personasCompletion: 20,
    assetsCompletion: 25,
    realEstate: {
      location: 'Carretera Nacional, Monterrey',
      priceFrom: 12000000,
      priceTo: 35000000,
      totalUnits: 80,
      availableUnits: 65,
      typologies: ['Lote residencial', 'Casa 4 rec', 'Casa 5 rec'],
      sqmFrom: 300,
      sqmTo: 800,
      amenities: ['Campo de golf', 'Club house', 'Equitación', 'Tenis'],
      deliveryDate: '2027-01-01',
      stage: 'preventa',
      salesGoal: 10,
      reservationsGoal: 25,
      appointmentsGoal: 80,
      visitsGoal: 150,
    }
  },
  {
    id: 'brand-5',
    clientId: 'client-3',
    name: 'Nova Arquitectura',
    status: 'activo',
    projectType: 'servicio',
    industry: 'Arquitectura',
    country: 'México',
    city: 'Ciudad de México',
    website: 'https://novaarquitectura.mx',
    socialMedia: {
      instagram: '@nova.arquitectura',
      linkedin: 'nova-arquitectura',
    },
    colors: ['#1a202c', '#ed8936', '#f7fafc'],
    toneOfVoice: 'Innovador, minimalista, creativo',
    valueProposition: 'Diseño arquitectónico que transforma espacios y vidas',
    monthlyBudget: 50000,
    startDate: '2024-01-01',
    internalManager: 'Laura Sánchez',
    createdAt: '2024-01-01',
    updatedAt: '2024-04-02',
    profileCompletion: 80,
    briefCompletion: 65,
    objectivesCompletion: 70,
    personasCompletion: 50,
    assetsCompletion: 60,
  },
  {
    id: 'brand-6',
    clientId: 'client-3',
    name: 'Plaza Urbana',
    status: 'activo',
    projectType: 'inmobiliario',
    industry: 'Real Estate',
    country: 'México',
    city: 'Mérida',
    colors: ['#2b6cb0', '#48bb78', '#ffffff'],
    toneOfVoice: 'Fresco, dinámico, accesible',
    valueProposition: 'Comercio y oficinas en el corazón de Mérida',
    monthlyBudget: 120000,
    startDate: '2024-02-15',
    internalManager: 'María García',
    createdAt: '2024-02-15',
    updatedAt: '2024-03-30',
    profileCompletion: 75,
    briefCompletion: 60,
    objectivesCompletion: 85,
    personasCompletion: 30,
    assetsCompletion: 40,
    realEstate: {
      location: 'Altabrisa, Mérida',
      priceFrom: 1500000,
      priceTo: 8000000,
      totalUnits: 150,
      availableUnits: 100,
      typologies: ['Local comercial', 'Oficina', 'Consultorio'],
      sqmFrom: 40,
      sqmTo: 200,
      amenities: ['Estacionamiento', 'Seguridad', 'Elevadores', 'Planta de luz'],
      deliveryDate: '2025-08-01',
      stage: 'comercializacion',
      salesGoal: 25,
      reservationsGoal: 40,
      appointmentsGoal: 120,
      visitsGoal: 200,
    }
  },
  {
    id: 'brand-7',
    clientId: 'client-4',
    name: 'Distrito Capital Offices',
    status: 'activo',
    projectType: 'inmobiliario',
    industry: 'Real Estate',
    country: 'México',
    city: 'Ciudad de México',
    colors: ['#2d3748', '#3182ce', '#e2e8f0'],
    toneOfVoice: 'Corporativo, eficiente, premium',
    valueProposition: 'Oficinas AAA con la mejor conectividad',
    monthlyBudget: 180000,
    startDate: '2024-01-20',
    internalManager: 'Carlos López',
    createdAt: '2024-01-20',
    updatedAt: '2024-04-01',
    profileCompletion: 90,
    briefCompletion: 78,
    objectivesCompletion: 95,
    personasCompletion: 70,
    assetsCompletion: 55,
    realEstate: {
      location: 'Santa Fe, CDMX',
      priceFrom: 5000000,
      priceTo: 50000000,
      totalUnits: 60,
      availableUnits: 25,
      typologies: ['Oficina 100m²', 'Oficina 200m²', 'Piso completo'],
      sqmFrom: 100,
      sqmTo: 1500,
      amenities: ['Helipuerto', 'Gimnasio corporativo', 'Auditorio', 'Restaurante ejecutivo'],
      deliveryDate: '2025-03-01',
      stage: 'comercializacion',
      salesGoal: 12,
      reservationsGoal: 20,
      appointmentsGoal: 60,
      visitsGoal: 100,
    }
  },
  {
    id: 'brand-8',
    clientId: 'client-4',
    name: 'Brokers Premium Cancún',
    status: 'activo',
    projectType: 'servicio',
    industry: 'Real Estate',
    country: 'México',
    city: 'Cancún',
    website: 'https://brokerspremium.mx',
    socialMedia: {
      instagram: '@brokerspremiumcancun',
      facebook: 'BrokersPremiumCancun',
    },
    colors: ['#065f46', '#fbbf24', '#ffffff'],
    toneOfVoice: 'Experto, confiable, exclusivo',
    valueProposition: 'Tu inversión en el Caribe Mexicano con los mejores asesores',
    monthlyBudget: 90000,
    startDate: '2023-11-01',
    internalManager: 'Ana Martínez',
    createdAt: '2023-11-01',
    updatedAt: '2024-03-25',
    profileCompletion: 85,
    briefCompletion: 70,
    objectivesCompletion: 80,
    personasCompletion: 65,
    assetsCompletion: 50,
  },
  {
    id: 'brand-9',
    clientId: 'client-5',
    name: 'Realtor Group Miami',
    status: 'borrador',
    projectType: 'servicio',
    industry: 'Real Estate',
    country: 'Estados Unidos',
    city: 'Miami',
    colors: ['#0d9488', '#f97316', '#f8fafc'],
    toneOfVoice: 'Internacional, sofisticado, bilingüe',
    monthlyBudget: 250000,
    startDate: '2024-04-01',
    internalManager: 'Juan Pérez',
    createdAt: '2024-04-01',
    updatedAt: '2024-04-05',
    profileCompletion: 30,
    briefCompletion: 15,
    objectivesCompletion: 20,
    personasCompletion: 0,
    assetsCompletion: 10,
  },
  {
    id: 'brand-10',
    clientId: 'client-5',
    name: 'Habitat Norte',
    status: 'activo',
    projectType: 'inmobiliario',
    industry: 'Real Estate',
    country: 'México',
    city: 'Tijuana',
    colors: ['#7c3aed', '#10b981', '#f3f4f6'],
    toneOfVoice: 'Moderno, accesible, joven',
    valueProposition: 'Tu primer hogar con la mejor relación precio-calidad',
    monthlyBudget: 60000,
    startDate: '2024-03-15',
    internalManager: 'Laura Sánchez',
    createdAt: '2024-03-15',
    updatedAt: '2024-04-03',
    profileCompletion: 65,
    briefCompletion: 50,
    objectivesCompletion: 60,
    personasCompletion: 40,
    assetsCompletion: 35,
    realEstate: {
      location: 'Otay, Tijuana',
      priceFrom: 1200000,
      priceTo: 2500000,
      totalUnits: 300,
      availableUnits: 180,
      typologies: ['Depto 1 rec', 'Depto 2 rec'],
      sqmFrom: 45,
      sqmTo: 85,
      amenities: ['Alberca', 'Gimnasio', 'Áreas verdes', 'Seguridad'],
      deliveryDate: '2025-09-01',
      stage: 'preventa',
      paymentOptions: '5% enganche, financiamiento directo',
      financing: 'Infonavit, Fovissste, Crédito bancario',
      salesGoal: 30,
      reservationsGoal: 60,
      appointmentsGoal: 200,
      visitsGoal: 400,
    }
  },
]

// Mock Buyer Personas
export const mockBuyerPersonas: BuyerPersona[] = [
  {
    id: 'persona-1',
    brandId: 'brand-1',
    name: 'Mariana',
    image: undefined,
    imageGenerated: false,
    age: 28,
    ageRange: '25-32',
    gender: 'femenino',
    location: 'CDMX - Condesa/Roma',
    socioeconomicLevel: 'A/B',
    profession: 'Directora de Marketing Digital',
    maritalStatus: 'Soltera',
    income: '$80,000 - $120,000 MXN mensuales',
    motivations: [
      'Independencia financiera',
      'Invertir su dinero de forma inteligente',
      'Vivir cerca de su trabajo',
      'Estilo de vida urbano'
    ],
    pains: [
      'Pagar renta sin generar patrimonio',
      'Dificultad para juntar el enganche',
      'Incertidumbre sobre procesos de compra',
      'Miedo a tomar una mala decisión financiera'
    ],
    objections: [
      '¿Y si pierdo mi trabajo?',
      'Los precios están muy altos',
      'Prefiero seguir rentando y tener libertad',
      '¿Y si el desarrollador no cumple?'
    ],
    fears: [
      'Endeudarse de por vida',
      'Que el proyecto no se termine',
      'Comprar algo que pierda valor'
    ],
    desires: [
      'Tener su propio espacio',
      'Generar patrimonio',
      'Sentirse exitosa',
      'Un lugar bonito para recibir amigos'
    ],
    purchaseActivators: [
      'Promociones de temporada',
      'Facilidades de pago',
      'Ver el avance de obra',
      'Testimonios de compradores'
    ],
    purchaseBarriers: [
      'Enganche alto',
      'Ubicación no ideal',
      'Falta de estacionamiento',
      'Amenidades que no usa'
    ],
    channels: ['Digital', 'Redes sociales', 'Email', 'WhatsApp'],
    socialNetworks: ['Instagram', 'LinkedIn', 'TikTok'],
    contentTypes: ['Reels', 'Stories', 'Infografías', 'Testimoniales'],
    persuasiveMessages: [
      'Tu renta puede convertirse en tu patrimonio',
      'Invierte en ti, invierte en tu futuro',
      'Vive donde siempre soñaste'
    ],
    messagesToAvoid: [
      'Es barato',
      'Apúrate antes de que se acabe',
      'No te vas a arrepentir'
    ],
    keywords: ['departamento CDMX', 'invertir en bienes raíces', 'Roma Norte deptos'],
    interests: ['Inversiones', 'Lifestyle', 'Diseño de interiores', 'Yoga', 'Brunch'],
    hooks: [
      '¿Sabías que tu renta puede ser la mensualidad de tu depa?',
      '3 razones para invertir antes de los 30',
      'El error que cometen los jóvenes con su dinero'
    ],
    ctas: [
      'Agenda tu visita',
      'Conoce tu capacidad de compra',
      'Descarga la guía del primer comprador'
    ],
    creativeAngles: [
      'Estilo de vida aspiracional',
      'Independencia financiera',
      'Comunidad de jóvenes profesionales'
    ],
    status: 'aprobado',
    approvedBy: 'María García',
    approvedAt: '2024-03-15',
    createdAt: '2024-02-01',
    updatedAt: '2024-03-15'
  },
  {
    id: 'persona-2',
    brandId: 'brand-1',
    name: 'Carlos',
    image: undefined,
    imageGenerated: false,
    age: 42,
    ageRange: '38-48',
    gender: 'masculino',
    location: 'CDMX - Polanco/Lomas',
    socioeconomicLevel: 'A/B',
    profession: 'Director General / Empresario',
    maritalStatus: 'Casado con hijos',
    income: '$150,000 - $300,000 MXN mensuales',
    motivations: [
      'Mejorar la calidad de vida familiar',
      'Inversión segura',
      'Ubicación estratégica',
      'Status y prestigio'
    ],
    pains: [
      'Poco tiempo para buscar opciones',
      'Necesita confiar en el desarrollador',
      'Busca que todo esté resuelto',
      'No quiere sorpresas en costos'
    ],
    objections: [
      '¿Cuál es el historial del desarrollador?',
      '¿Qué garantías tengo?',
      'El precio por m² está alto',
      '¿Cuándo entregan realmente?'
    ],
    fears: [
      'Que el proyecto tenga problemas legales',
      'Que la zona se devalúe',
      'Mala calidad de construcción'
    ],
    desires: [
      'Un hogar seguro para su familia',
      'Amenidades para los niños',
      'Buena plusvalía',
      'Cercanía a colegios'
    ],
    purchaseActivators: [
      'Reunión ejecutiva personalizada',
      'Recorrido privado',
      'Referencias de otros compradores',
      'Flexibilidad en negociación'
    ],
    purchaseBarriers: [
      'Proceso burocrático',
      'Falta de personalización',
      'Tiempos de entrega largos'
    ],
    channels: ['Presencial', 'WhatsApp', 'Email', 'Llamada'],
    socialNetworks: ['LinkedIn', 'Facebook'],
    contentTypes: ['Casos de éxito', 'Tours virtuales', 'Webinars'],
    persuasiveMessages: [
      'Una inversión que protege a tu familia',
      'El hogar que tu familia merece',
      'Calidad y confianza respaldada por 20 años'
    ],
    messagesToAvoid: [
      'Oportunidad única',
      'Solo quedan 3',
      'Precio de preventa'
    ],
    keywords: ['departamentos lujo CDMX', 'inversión inmobiliaria', 'penthouse Roma'],
    interests: ['Golf', 'Vinos', 'Viajes', 'Inversiones', 'Negocios'],
    hooks: [
      'Lo que los inversionistas exitosos buscan en una propiedad',
      'Por qué Roma Norte es la mejor zona para invertir en 2024',
      '5 señales de un desarrollo confiable'
    ],
    ctas: [
      'Agenda una cita privada',
      'Solicita el brochure ejecutivo',
      'Habla con un asesor senior'
    ],
    creativeAngles: [
      'Inversión patrimonial',
      'Exclusividad y privacidad',
      'Legado familiar'
    ],
    status: 'aprobado',
    approvedBy: 'María García',
    approvedAt: '2024-03-15',
    createdAt: '2024-02-01',
    updatedAt: '2024-03-15'
  },
  {
    id: 'persona-3',
    brandId: 'brand-1',
    name: 'Laura',
    image: undefined,
    imageGenerated: false,
    age: 35,
    ageRange: '32-40',
    gender: 'femenino',
    location: 'CDMX - Del Valle/Nápoles',
    socioeconomicLevel: 'C+',
    profession: 'Gerente de Recursos Humanos',
    maritalStatus: 'Casada sin hijos',
    income: '$60,000 - $90,000 MXN mensuales',
    motivations: [
      'Formar un hogar con su pareja',
      'Dejar de rentar',
      'Espacio para home office',
      'Buena ubicación'
    ],
    pains: [
      'Decisión en pareja complica el proceso',
      'Presupuesto ajustado',
      'Necesita dos ingresos para calificar',
      'Quiere algo listo para habitar'
    ],
    objections: [
      '¿Podemos pagarlo entre los dos?',
      '¿Qué pasa si uno pierde el trabajo?',
      'Los departamentos son muy pequeños',
      '¿Las amenidades tienen costo extra?'
    ],
    fears: [
      'No poder cumplir con los pagos',
      'Que la relación no funcione',
      'Comprometerse a largo plazo'
    ],
    desires: [
      'Un espacio propio',
      'Estabilidad',
      'Amenidades compartidas',
      'Comunidad agradable'
    ],
    purchaseActivators: [
      'Planes de pago flexibles',
      'Asesoría en créditos conyugales',
      'Visita en pareja',
      'Promociones de temporada'
    ],
    purchaseBarriers: [
      'Enganche elevado',
      'Crédito insuficiente',
      'Ubicación lejos del trabajo'
    ],
    channels: ['WhatsApp', 'Facebook', 'Email'],
    socialNetworks: ['Facebook', 'Instagram', 'Pinterest'],
    contentTypes: ['Fotos', 'Videos', 'Testimoniales de parejas'],
    persuasiveMessages: [
      'El primer paso para construir su futuro juntos',
      'Un hogar pensado para parejas modernas',
      'Más que un departamento, el inicio de su historia'
    ],
    messagesToAvoid: [
      'Para solteros',
      'Espacio compacto',
      'Ideal para estudiantes'
    ],
    keywords: ['departamento para parejas', 'crédito conyugal', 'primer hogar'],
    interests: ['Decoración', 'Cocina', 'Netflix', 'Mascotas', 'Fitness'],
    hooks: [
      'Cómo comprar tu primer depa en pareja sin morir en el intento',
      'Los 5 errores que cometen las parejas al comprar',
      'Tu renta vs tu mensualidad: la verdad'
    ],
    ctas: [
      'Calcula tu crédito en pareja',
      'Agenda visita para dos',
      'Conoce nuestros planes de pago'
    ],
    creativeAngles: [
      'Vida en pareja moderna',
      'Construyendo juntos',
      'Tu primer hogar compartido'
    ],
    status: 'en_revision',
    createdAt: '2024-02-15',
    updatedAt: '2024-03-20'
  },
  {
    id: 'persona-4',
    brandId: 'brand-1',
    name: 'Roberto',
    image: undefined,
    imageGenerated: false,
    age: 55,
    ageRange: '50-62',
    gender: 'masculino',
    location: 'CDMX - Pedregal/Santa Fe',
    socioeconomicLevel: 'A/B',
    profession: 'Inversionista / Empresario retirado',
    maritalStatus: 'Casado, hijos adultos',
    income: '$200,000+ MXN mensuales (patrimonio)',
    motivations: [
      'Diversificar inversiones',
      'Generar ingresos por renta',
      'Heredar patrimonio',
      'Proteger su dinero de la inflación'
    ],
    pains: [
      'Opciones de inversión riesgosas',
      'Necesita rendimientos seguros',
      'No quiere administrar propiedades',
      'Busca proyectos probados'
    ],
    objections: [
      '¿Cuál es el rendimiento real?',
      '¿Tienen servicio de administración?',
      '¿Qué otros proyectos han hecho?',
      '¿Cómo está el mercado de renta en la zona?'
    ],
    fears: [
      'Fraudes inmobiliarios',
      'Baja liquidez',
      'Problemas con inquilinos'
    ],
    desires: [
      'Inversión segura',
      'Buenos rendimientos',
      'Mínima gestión',
      'Prestigio de la zona'
    ],
    purchaseActivators: [
      'Análisis de rendimiento',
      'Servicio de property management',
      'Historial del desarrollador',
      'Compra en preventa con descuento'
    ],
    purchaseBarriers: [
      'Falta de información financiera',
      'No conocer el track record',
      'Proceso de compra complejo'
    ],
    channels: ['Presencial', 'Llamada', 'Email'],
    socialNetworks: ['LinkedIn', 'Facebook'],
    contentTypes: ['Análisis financieros', 'Webinars', 'White papers'],
    persuasiveMessages: [
      'Inversión inmobiliaria con rendimientos comprobados',
      'Patrimonio que crece y protege',
      'La tranquilidad de invertir con expertos'
    ],
    messagesToAvoid: [
      'Oportunidad de último minuto',
      'Ganancias garantizadas',
      'Inversión sin riesgo'
    ],
    keywords: ['inversión inmobiliaria México', 'rendimiento bienes raíces', 'plusvalía CDMX'],
    interests: ['Finanzas', 'Golf', 'Viajes', 'Arte', 'Vinos'],
    hooks: [
      'Bienes raíces vs otros instrumentos: el comparativo real',
      'Cómo evaluar un proyecto inmobiliario como inversionista',
      'El secreto de los inversionistas exitosos en real estate'
    ],
    ctas: [
      'Solicita el análisis de inversión',
      'Agenda una reunión con nuestro director',
      'Descarga el prospecto de inversión'
    ],
    creativeAngles: [
      'Inversión inteligente',
      'Patrimonio generacional',
      'Rendimientos comprobados'
    ],
    status: 'aprobado',
    approvedBy: 'María García',
    approvedAt: '2024-03-18',
    createdAt: '2024-02-10',
    updatedAt: '2024-03-18'
  },
  {
    id: 'persona-5',
    brandId: 'brand-1',
    name: 'Sofía',
    image: undefined,
    imageGenerated: false,
    age: 30,
    ageRange: '28-34',
    gender: 'femenino',
    location: 'CDMX - Coyoacán/Benito Juárez',
    socioeconomicLevel: 'C+',
    profession: 'Médico Residente',
    maritalStatus: 'Soltera',
    income: '$45,000 - $65,000 MXN mensuales',
    motivations: [
      'Independizarse',
      'Vivir cerca del hospital',
      'Invertir en lugar de rentar',
      'Espacio propio para descansar'
    ],
    pains: [
      'Horarios complicados',
      'Poco tiempo para buscar',
      'Necesita proceso simple',
      'Presupuesto limitado'
    ],
    objections: [
      '¿Puedo pagarlo con mi sueldo?',
      '¿Hay opciones de 1 recámara?',
      '¿Está cerca del metro?',
      '¿Aceptan crédito Infonavit?'
    ],
    fears: [
      'No poder con la hipoteca',
      'Quedarse sin liquidez',
      'Zona insegura'
    ],
    desires: [
      'Independencia',
      'Seguridad',
      'Tranquilidad',
      'Espacio funcional'
    ],
    purchaseActivators: [
      'Facilidades Infonavit/Fovissste',
      'Enganche bajo',
      'Proceso digital',
      'Ubicación cerca de hospitales'
    ],
    purchaseBarriers: [
      'Enganche alto',
      'Proceso complicado',
      'Lejos del trabajo'
    ],
    channels: ['WhatsApp', 'Instagram', 'Digital'],
    socialNetworks: ['Instagram', 'TikTok', 'YouTube'],
    contentTypes: ['Stories', 'Reels', 'Guías rápidas'],
    persuasiveMessages: [
      'Tu primer hogar, tu primer logro',
      'Vive cerca de donde trabajas',
      'El espacio que mereces para descansar'
    ],
    messagesToAvoid: [
      'Lujo',
      'Exclusivo',
      'Para familias'
    ],
    keywords: ['departamento pequeño CDMX', 'crédito Infonavit', 'primer depa'],
    interests: ['Salud', 'Bienestar', 'Series', 'Café', 'Plantas'],
    hooks: [
      'Cómo comprar tu depa ganando menos de 70k',
      'La guía definitiva del crédito Infonavit',
      'De residente a propietaria: mi historia'
    ],
    ctas: [
      'Simula tu crédito Infonavit',
      'Conoce departamentos desde $X',
      'Agenda visita express'
    ],
    creativeAngles: [
      'Primera vivienda',
      'Jóvenes profesionales',
      'Independencia'
    ],
    status: 'borrador',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-25'
  },
]

// Mock Brand Briefs
export const mockBrandBriefs: BrandBrief[] = [
  {
    id: 'brief-1',
    brandId: 'brand-1',
    qualityScore: 72,
    lastUpdated: '2024-04-01',
    version: 3,
    generalInfo: 'Torre Central Living es un desarrollo vertical de departamentos premium ubicado en la Colonia Roma Norte, una de las zonas más cotizadas de la Ciudad de México.',
    history: 'Desarrollado por Grupo Inmobiliario XYZ con más de 20 años de experiencia en el mercado.',
    productDescription: 'Departamentos de 1, 2 y 3 recámaras con acabados de lujo, desde 55 hasta 180 m². Incluye penthouses con terraza privada.',
    valueProposition: 'Vivir en el corazón de la Roma Norte con amenidades de primer nivel, arquitectura contemporánea y la mejor conectividad de la ciudad.',
    differentiators: 'Único desarrollo en la zona con certificación LEED, amenidades pet-friendly y coworking incluido.',
    competitors: 'Roma 88, Eje Central Residences, Colonia Living, The Roma Project',
    targetAudience: 'Jóvenes profesionales de 25-40 años, parejas sin hijos, inversionistas buscando rendimientos por renta.',
    geographicZones: 'Principalmente residentes de Condesa, Roma, Del Valle, Nápoles y Polanco. También inversionistas de Monterrey y Guadalajara.',
    salesProcess: '1. Contacto digital/presencial → 2. Calificación → 3. Visita showroom → 4. Cotización personalizada → 5. Negociación → 6. Apartado → 7. Firma de contrato',
    commonObjections: 'Precio alto vs competencia, fecha de entrega, garantías del desarrollador, estacionamiento limitado.',
    faqs: [
      '¿Cuándo entregan?',
      '¿Aceptan crédito bancario?',
      '¿Puedo apartar con poco?',
      '¿Tienen opción de renta?'
    ],
    promotions: '10% de descuento en pago de contado. Meses sin intereses con tarjeta participante.',
    restrictions: 'No se permiten anuncios con precios exactos en redes. Usar "desde $X".',
    toneVoice: 'Profesional pero cercano. Aspiracional sin ser pretencioso. Informativo y transparente.',
    preferredChannels: ['Instagram', 'Facebook', 'Google Ads', 'Email marketing'],
    expectedResults: 'Generar 100 leads calificados mensuales, 30 visitas, 8-10 ventas.',
    objectives: 'Posicionar como el mejor desarrollo de la Roma Norte. Alcanzar 60% de ventas antes de entrega.',
    budget: '$150,000 MXN mensuales para pauta digital.',
    existingMaterials: 'Renders, brochure digital, video drone, recorrido virtual.',
    importantDates: 'Lanzamiento fase 2: Mayo 2024. Entrega: Diciembre 2025.',
    status: 'aprobado',
    approvedBy: 'María García',
    approvedAt: '2024-03-20'
  }
]

// Mock Brand Objectives
export const mockBrandObjectives: BrandObjectives[] = [
  {
    id: 'obj-1',
    brandId: 'brand-1',
    period: '2024-Q2',
    salesGoal: 15,
    reservationsGoal: 30,
    appointmentsGoal: 100,
    visitsGoal: 200,
    leadsGoal: 500,
    qualifiedLeadsGoal: 150,
    revenueGoal: 52500000,
    roasGoal: 5,
    conversionRateGoal: 3,
    totalBudget: 450000,
    organicBudget: 50000,
    paidBudget: 400000,
    budgetByChannel: {
      'Meta Ads': 200000,
      'Google Ads': 150000,
      'TikTok Ads': 50000,
    },
    kpis: [
      { id: 'kpi-1', name: 'Costo por Lead', code: 'CPL', minValue: 50, maxValue: 120, currentValue: 85, unit: 'currency', status: 'green' },
      { id: 'kpi-2', name: 'Costo por Clic', code: 'CPC', minValue: 5, maxValue: 15, currentValue: 12, unit: 'currency', status: 'yellow' },
      { id: 'kpi-3', name: 'CPM', code: 'CPM', minValue: 30, maxValue: 70, currentValue: 45, unit: 'currency', status: 'green' },
      { id: 'kpi-4', name: 'CTR', code: 'CTR', minValue: 1.5, maxValue: 3, currentValue: 2.1, unit: 'percentage', status: 'green' },
      { id: 'kpi-5', name: 'Costo por Cita', code: 'CPAP', minValue: 200, maxValue: 600, currentValue: 420, unit: 'currency', status: 'green' },
      { id: 'kpi-6', name: 'ROAS', code: 'ROAS', minValue: 4, maxValue: 8, currentValue: 5.2, unit: 'number', status: 'green' },
      { id: 'kpi-7', name: 'Engagement Rate', code: 'ER', minValue: 2, maxValue: 6, currentValue: 3.8, unit: 'percentage', status: 'green' },
    ]
  }
]

// Mock Brand Assets
export const mockBrandAssets: BrandAsset[] = [
  { id: 'asset-1', brandId: 'brand-1', type: 'logo', name: 'Logo principal', url: '/assets/logo-tcl.png', uploadedAt: '2024-01-15', status: 'aprobado' },
  { id: 'asset-2', brandId: 'brand-1', type: 'logo', name: 'Logo blanco', url: '/assets/logo-tcl-white.png', uploadedAt: '2024-01-15', status: 'aprobado' },
  { id: 'asset-3', brandId: 'brand-1', type: 'render', name: 'Fachada principal', url: '/assets/render-fachada.jpg', uploadedAt: '2024-02-01', status: 'aprobado' },
  { id: 'asset-4', brandId: 'brand-1', type: 'render', name: 'Amenidades', url: '/assets/render-amenidades.jpg', uploadedAt: '2024-02-01', status: 'aprobado' },
  { id: 'asset-5', brandId: 'brand-1', type: 'video', name: 'Video drone', url: '/assets/video-drone.mp4', uploadedAt: '2024-02-15', status: 'aprobado' },
  { id: 'asset-6', brandId: 'brand-1', type: 'brochure', name: 'Brochure digital', url: '/assets/brochure.pdf', uploadedAt: '2024-02-20', status: 'aprobado' },
  { id: 'asset-7', brandId: 'brand-1', type: 'typography', name: 'Tipografía Montserrat', uploadedAt: '2024-01-15', status: 'aprobado' },
  { id: 'asset-8', brandId: 'brand-1', type: 'palette', name: 'Paleta de colores', uploadedAt: '2024-01-15', status: 'aprobado' },
]

// Helper functions
export function getBrandById(id: string): MIBrand | undefined {
  return mockBrands.find(b => b.id === id)
}

export function getBrandsByClient(clientId: string): MIBrand[] {
  return mockBrands.filter(b => b.clientId === clientId)
}

export function getPersonasByBrand(brandId: string): BuyerPersona[] {
  return mockBuyerPersonas.filter(p => p.brandId === brandId)
}

export function getBriefByBrand(brandId: string): BrandBrief | undefined {
  return mockBrandBriefs.find(b => b.brandId === brandId)
}

export function getObjectivesByBrand(brandId: string): BrandObjectives | undefined {
  return mockBrandObjectives.find(o => o.brandId === brandId)
}

export function getAssetsByBrand(brandId: string): BrandAsset[] {
  return mockBrandAssets.filter(a => a.brandId === brandId)
}

export function calculateOverallCompletion(brand: MIBrand): number {
  const weights = {
    profile: 0.25,
    brief: 0.25,
    objectives: 0.2,
    personas: 0.2,
    assets: 0.1
  }
  
  return Math.round(
    brand.profileCompletion * weights.profile +
    brand.briefCompletion * weights.brief +
    brand.objectivesCompletion * weights.objectives +
    brand.personasCompletion * weights.personas +
    brand.assetsCompletion * weights.assets
  )
}
