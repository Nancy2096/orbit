// Datos de ubicaciones jerárquicos: País > Estado > Ciudad > CP

export interface PostalCode {
  code: string
  neighborhood?: string
}

export interface City {
  name: string
  postalCodes: PostalCode[]
}

export interface State {
  name: string
  cities: City[]
}

export interface Country {
  code: string
  name: string
  states: State[]
}

export const locationData: Country[] = [
  {
    code: "MX",
    name: "México",
    states: [
      {
        name: "Aguascalientes",
        cities: [
          { name: "Aguascalientes", postalCodes: [{ code: "20000" }, { code: "20010" }, { code: "20020" }, { code: "20030" }, { code: "20040" }, { code: "20050" }, { code: "20100" }, { code: "20110" }, { code: "20120" }, { code: "20130" }] },
          { name: "Jesús María", postalCodes: [{ code: "20900" }, { code: "20910" }, { code: "20920" }] },
          { name: "San Francisco de los Romo", postalCodes: [{ code: "20300" }, { code: "20310" }] },
        ],
      },
      {
        name: "Baja California",
        cities: [
          { name: "Tijuana", postalCodes: [{ code: "22000" }, { code: "22010" }, { code: "22020" }, { code: "22030" }, { code: "22040" }, { code: "22100" }, { code: "22110" }, { code: "22120" }, { code: "22200" }, { code: "22210" }] },
          { name: "Mexicali", postalCodes: [{ code: "21000" }, { code: "21010" }, { code: "21020" }, { code: "21100" }, { code: "21110" }, { code: "21200" }, { code: "21210" }, { code: "21220" }, { code: "21300" }, { code: "21310" }] },
          { name: "Ensenada", postalCodes: [{ code: "22800" }, { code: "22810" }, { code: "22820" }, { code: "22830" }, { code: "22840" }, { code: "22850" }, { code: "22860" }, { code: "22870" }] },
          { name: "Rosarito", postalCodes: [{ code: "22700" }, { code: "22710" }, { code: "22720" }] },
          { name: "Tecate", postalCodes: [{ code: "21400" }, { code: "21410" }, { code: "21420" }] },
        ],
      },
      {
        name: "Baja California Sur",
        cities: [
          { name: "La Paz", postalCodes: [{ code: "23000" }, { code: "23010" }, { code: "23020" }, { code: "23030" }, { code: "23040" }, { code: "23050" }, { code: "23060" }] },
          { name: "Los Cabos", postalCodes: [{ code: "23400" }, { code: "23410" }, { code: "23420" }, { code: "23430" }, { code: "23440" }, { code: "23450" }] },
          { name: "San José del Cabo", postalCodes: [{ code: "23400" }, { code: "23405" }, { code: "23406" }] },
          { name: "Cabo San Lucas", postalCodes: [{ code: "23450" }, { code: "23453" }, { code: "23454" }] },
        ],
      },
      {
        name: "Campeche",
        cities: [
          { name: "Campeche", postalCodes: [{ code: "24000" }, { code: "24010" }, { code: "24020" }, { code: "24030" }, { code: "24040" }, { code: "24050" }] },
          { name: "Ciudad del Carmen", postalCodes: [{ code: "24100" }, { code: "24110" }, { code: "24120" }, { code: "24130" }, { code: "24140" }] },
        ],
      },
      {
        name: "Chiapas",
        cities: [
          { name: "Tuxtla Gutiérrez", postalCodes: [{ code: "29000" }, { code: "29010" }, { code: "29020" }, { code: "29030" }, { code: "29040" }, { code: "29050" }, { code: "29060" }] },
          { name: "San Cristóbal de las Casas", postalCodes: [{ code: "29200" }, { code: "29210" }, { code: "29220" }, { code: "29230" }] },
          { name: "Tapachula", postalCodes: [{ code: "30700" }, { code: "30710" }, { code: "30720" }, { code: "30730" }] },
          { name: "Comitán de Domínguez", postalCodes: [{ code: "30000" }, { code: "30010" }, { code: "30020" }] },
        ],
      },
      {
        name: "Chihuahua",
        cities: [
          { name: "Chihuahua", postalCodes: [{ code: "31000" }, { code: "31010" }, { code: "31020" }, { code: "31030" }, { code: "31040" }, { code: "31050" }, { code: "31100" }, { code: "31110" }, { code: "31200" }, { code: "31210" }] },
          { name: "Ciudad Juárez", postalCodes: [{ code: "32000" }, { code: "32010" }, { code: "32020" }, { code: "32030" }, { code: "32040" }, { code: "32050" }, { code: "32100" }, { code: "32110" }, { code: "32200" }, { code: "32210" }] },
          { name: "Delicias", postalCodes: [{ code: "33000" }, { code: "33010" }, { code: "33020" }] },
          { name: "Cuauhtémoc", postalCodes: [{ code: "31500" }, { code: "31510" }, { code: "31520" }] },
        ],
      },
      {
        name: "Ciudad de México",
        cities: [
          { name: "Álvaro Obregón", postalCodes: [{ code: "01000" }, { code: "01010" }, { code: "01020" }, { code: "01030" }, { code: "01040" }, { code: "01050" }, { code: "01060" }, { code: "01070" }, { code: "01080" }, { code: "01090" }] },
          { name: "Azcapotzalco", postalCodes: [{ code: "02000" }, { code: "02010" }, { code: "02020" }, { code: "02030" }, { code: "02040" }, { code: "02050" }, { code: "02060" }, { code: "02070" }, { code: "02080" }, { code: "02090" }] },
          { name: "Benito Juárez", postalCodes: [{ code: "03000" }, { code: "03010" }, { code: "03020" }, { code: "03100" }, { code: "03200" }, { code: "03300" }, { code: "03400" }, { code: "03500" }, { code: "03600" }, { code: "03700" }] },
          { name: "Coyoacán", postalCodes: [{ code: "04000" }, { code: "04010" }, { code: "04020" }, { code: "04030" }, { code: "04040" }, { code: "04100" }, { code: "04200" }, { code: "04300" }, { code: "04400" }, { code: "04500" }] },
          { name: "Cuajimalpa", postalCodes: [{ code: "05000" }, { code: "05010" }, { code: "05020" }, { code: "05030" }, { code: "05100" }, { code: "05200" }, { code: "05300" }] },
          { name: "Cuauhtémoc", postalCodes: [{ code: "06000" }, { code: "06010" }, { code: "06020" }, { code: "06030" }, { code: "06040" }, { code: "06050" }, { code: "06060" }, { code: "06100" }, { code: "06200" }, { code: "06300" }] },
          { name: "Gustavo A. Madero", postalCodes: [{ code: "07000" }, { code: "07010" }, { code: "07020" }, { code: "07030" }, { code: "07040" }, { code: "07050" }, { code: "07100" }, { code: "07200" }, { code: "07300" }, { code: "07400" }] },
          { name: "Iztacalco", postalCodes: [{ code: "08000" }, { code: "08010" }, { code: "08020" }, { code: "08030" }, { code: "08040" }, { code: "08100" }, { code: "08200" }, { code: "08300" }, { code: "08400" }, { code: "08500" }] },
          { name: "Iztapalapa", postalCodes: [{ code: "09000" }, { code: "09010" }, { code: "09020" }, { code: "09030" }, { code: "09040" }, { code: "09100" }, { code: "09200" }, { code: "09300" }, { code: "09400" }, { code: "09500" }] },
          { name: "Magdalena Contreras", postalCodes: [{ code: "10000" }, { code: "10010" }, { code: "10020" }, { code: "10100" }, { code: "10200" }, { code: "10300" }] },
          { name: "Miguel Hidalgo", postalCodes: [{ code: "11000" }, { code: "11010" }, { code: "11020" }, { code: "11030" }, { code: "11040" }, { code: "11100" }, { code: "11200" }, { code: "11300" }, { code: "11400" }, { code: "11500" }] },
          { name: "Milpa Alta", postalCodes: [{ code: "12000" }, { code: "12100" }, { code: "12200" }, { code: "12300" }] },
          { name: "Tláhuac", postalCodes: [{ code: "13000" }, { code: "13010" }, { code: "13020" }, { code: "13100" }, { code: "13200" }, { code: "13300" }] },
          { name: "Tlalpan", postalCodes: [{ code: "14000" }, { code: "14010" }, { code: "14020" }, { code: "14030" }, { code: "14100" }, { code: "14200" }, { code: "14300" }, { code: "14400" }, { code: "14500" }, { code: "14600" }] },
          { name: "Venustiano Carranza", postalCodes: [{ code: "15000" }, { code: "15010" }, { code: "15020" }, { code: "15030" }, { code: "15100" }, { code: "15200" }, { code: "15300" }, { code: "15400" }, { code: "15500" }, { code: "15600" }] },
          { name: "Xochimilco", postalCodes: [{ code: "16000" }, { code: "16010" }, { code: "16020" }, { code: "16030" }, { code: "16100" }, { code: "16200" }, { code: "16300" }, { code: "16400" }, { code: "16500" }, { code: "16600" }] },
        ],
      },
      {
        name: "Coahuila",
        cities: [
          { name: "Saltillo", postalCodes: [{ code: "25000" }, { code: "25010" }, { code: "25020" }, { code: "25030" }, { code: "25040" }, { code: "25050" }, { code: "25100" }, { code: "25200" }, { code: "25300" }] },
          { name: "Torreón", postalCodes: [{ code: "27000" }, { code: "27010" }, { code: "27020" }, { code: "27030" }, { code: "27040" }, { code: "27050" }, { code: "27100" }, { code: "27200" }, { code: "27300" }] },
          { name: "Monclova", postalCodes: [{ code: "25700" }, { code: "25710" }, { code: "25720" }, { code: "25730" }] },
          { name: "Piedras Negras", postalCodes: [{ code: "26000" }, { code: "26010" }, { code: "26020" }, { code: "26030" }] },
        ],
      },
      {
        name: "Colima",
        cities: [
          { name: "Colima", postalCodes: [{ code: "28000" }, { code: "28010" }, { code: "28020" }, { code: "28030" }, { code: "28040" }, { code: "28050" }] },
          { name: "Manzanillo", postalCodes: [{ code: "28200" }, { code: "28210" }, { code: "28220" }, { code: "28230" }, { code: "28240" }] },
          { name: "Tecomán", postalCodes: [{ code: "28100" }, { code: "28110" }, { code: "28120" }] },
        ],
      },
      {
        name: "Durango",
        cities: [
          { name: "Durango", postalCodes: [{ code: "34000" }, { code: "34010" }, { code: "34020" }, { code: "34030" }, { code: "34040" }, { code: "34050" }, { code: "34100" }, { code: "34200" }] },
          { name: "Gómez Palacio", postalCodes: [{ code: "35000" }, { code: "35010" }, { code: "35020" }, { code: "35030" }, { code: "35040" }] },
          { name: "Lerdo", postalCodes: [{ code: "35150" }, { code: "35160" }, { code: "35170" }] },
        ],
      },
      {
        name: "Estado de México",
        cities: [
          { name: "Toluca", postalCodes: [{ code: "50000" }, { code: "50010" }, { code: "50020" }, { code: "50030" }, { code: "50040" }, { code: "50050" }, { code: "50100" }, { code: "50200" }, { code: "50300" }] },
          { name: "Naucalpan", postalCodes: [{ code: "53000" }, { code: "53010" }, { code: "53020" }, { code: "53030" }, { code: "53040" }, { code: "53100" }, { code: "53200" }, { code: "53300" }] },
          { name: "Tlalnepantla", postalCodes: [{ code: "54000" }, { code: "54010" }, { code: "54020" }, { code: "54030" }, { code: "54040" }, { code: "54100" }, { code: "54200" }] },
          { name: "Ecatepec", postalCodes: [{ code: "55000" }, { code: "55010" }, { code: "55020" }, { code: "55030" }, { code: "55040" }, { code: "55100" }, { code: "55200" }, { code: "55300" }] },
          { name: "Nezahualcóyotl", postalCodes: [{ code: "57000" }, { code: "57010" }, { code: "57020" }, { code: "57030" }, { code: "57040" }, { code: "57100" }, { code: "57200" }] },
          { name: "Atizapán de Zaragoza", postalCodes: [{ code: "52900" }, { code: "52910" }, { code: "52920" }, { code: "52930" }, { code: "52940" }] },
          { name: "Cuautitlán Izcalli", postalCodes: [{ code: "54700" }, { code: "54710" }, { code: "54720" }, { code: "54730" }, { code: "54740" }] },
          { name: "Huixquilucan", postalCodes: [{ code: "52760" }, { code: "52770" }, { code: "52780" }, { code: "52790" }] },
          { name: "Metepec", postalCodes: [{ code: "52140" }, { code: "52150" }, { code: "52160" }, { code: "52170" }, { code: "52180" }] },
          { name: "Texcoco", postalCodes: [{ code: "56100" }, { code: "56110" }, { code: "56120" }, { code: "56130" }] },
        ],
      },
      {
        name: "Guanajuato",
        cities: [
          { name: "León", postalCodes: [{ code: "37000" }, { code: "37010" }, { code: "37020" }, { code: "37030" }, { code: "37040" }, { code: "37050" }, { code: "37100" }, { code: "37200" }, { code: "37300" }, { code: "37400" }] },
          { name: "Guanajuato", postalCodes: [{ code: "36000" }, { code: "36010" }, { code: "36020" }, { code: "36030" }, { code: "36040" }, { code: "36050" }] },
          { name: "Irapuato", postalCodes: [{ code: "36500" }, { code: "36510" }, { code: "36520" }, { code: "36530" }, { code: "36540" }, { code: "36550" }] },
          { name: "Celaya", postalCodes: [{ code: "38000" }, { code: "38010" }, { code: "38020" }, { code: "38030" }, { code: "38040" }, { code: "38050" }, { code: "38100" }] },
          { name: "Salamanca", postalCodes: [{ code: "36700" }, { code: "36710" }, { code: "36720" }, { code: "36730" }] },
          { name: "San Miguel de Allende", postalCodes: [{ code: "37700" }, { code: "37710" }, { code: "37720" }, { code: "37730" }] },
        ],
      },
      {
        name: "Guerrero",
        cities: [
          { name: "Acapulco", postalCodes: [{ code: "39300" }, { code: "39310" }, { code: "39320" }, { code: "39330" }, { code: "39340" }, { code: "39350" }, { code: "39400" }, { code: "39500" }, { code: "39600" }] },
          { name: "Chilpancingo", postalCodes: [{ code: "39000" }, { code: "39010" }, { code: "39020" }, { code: "39030" }, { code: "39040" }] },
          { name: "Zihuatanejo", postalCodes: [{ code: "40880" }, { code: "40890" }, { code: "40895" }] },
          { name: "Taxco", postalCodes: [{ code: "40200" }, { code: "40210" }, { code: "40220" }] },
        ],
      },
      {
        name: "Hidalgo",
        cities: [
          { name: "Pachuca", postalCodes: [{ code: "42000" }, { code: "42010" }, { code: "42020" }, { code: "42030" }, { code: "42040" }, { code: "42050" }, { code: "42060" }, { code: "42070" }] },
          { name: "Tulancingo", postalCodes: [{ code: "43600" }, { code: "43610" }, { code: "43620" }, { code: "43630" }] },
          { name: "Tula de Allende", postalCodes: [{ code: "42800" }, { code: "42810" }, { code: "42820" }] },
        ],
      },
      {
        name: "Jalisco",
        cities: [
          { name: "Guadalajara", postalCodes: [{ code: "44100" }, { code: "44110" }, { code: "44120" }, { code: "44130" }, { code: "44140" }, { code: "44150" }, { code: "44160" }, { code: "44200" }, { code: "44300" }, { code: "44400" }] },
          { name: "Zapopan", postalCodes: [{ code: "45000" }, { code: "45010" }, { code: "45020" }, { code: "45030" }, { code: "45040" }, { code: "45050" }, { code: "45060" }, { code: "45100" }, { code: "45200" }, { code: "45300" }] },
          { name: "Tlaquepaque", postalCodes: [{ code: "45500" }, { code: "45510" }, { code: "45520" }, { code: "45530" }, { code: "45540" }, { code: "45550" }] },
          { name: "Tonalá", postalCodes: [{ code: "45400" }, { code: "45410" }, { code: "45420" }, { code: "45430" }] },
          { name: "Puerto Vallarta", postalCodes: [{ code: "48300" }, { code: "48310" }, { code: "48320" }, { code: "48330" }, { code: "48340" }, { code: "48350" }] },
          { name: "Tlajomulco de Zúñiga", postalCodes: [{ code: "45640" }, { code: "45650" }, { code: "45660" }, { code: "45670" }] },
        ],
      },
      {
        name: "Michoacán",
        cities: [
          { name: "Morelia", postalCodes: [{ code: "58000" }, { code: "58010" }, { code: "58020" }, { code: "58030" }, { code: "58040" }, { code: "58050" }, { code: "58100" }, { code: "58200" }, { code: "58300" }] },
          { name: "Uruapan", postalCodes: [{ code: "60000" }, { code: "60010" }, { code: "60020" }, { code: "60030" }, { code: "60040" }] },
          { name: "Zamora", postalCodes: [{ code: "59600" }, { code: "59610" }, { code: "59620" }, { code: "59630" }] },
          { name: "Lázaro Cárdenas", postalCodes: [{ code: "60950" }, { code: "60960" }, { code: "60970" }] },
        ],
      },
      {
        name: "Morelos",
        cities: [
          { name: "Cuernavaca", postalCodes: [{ code: "62000" }, { code: "62010" }, { code: "62020" }, { code: "62030" }, { code: "62040" }, { code: "62050" }, { code: "62100" }, { code: "62200" }, { code: "62300" }] },
          { name: "Jiutepec", postalCodes: [{ code: "62550" }, { code: "62560" }, { code: "62570" }, { code: "62580" }] },
          { name: "Cuautla", postalCodes: [{ code: "62740" }, { code: "62750" }, { code: "62760" }, { code: "62770" }] },
          { name: "Temixco", postalCodes: [{ code: "62580" }, { code: "62590" }] },
        ],
      },
      {
        name: "Nayarit",
        cities: [
          { name: "Tepic", postalCodes: [{ code: "63000" }, { code: "63010" }, { code: "63020" }, { code: "63030" }, { code: "63040" }, { code: "63050" }] },
          { name: "Bahía de Banderas", postalCodes: [{ code: "63732" }, { code: "63733" }, { code: "63734" }] },
        ],
      },
      {
        name: "Nuevo León",
        cities: [
          { name: "Monterrey", postalCodes: [{ code: "64000" }, { code: "64010" }, { code: "64020" }, { code: "64030" }, { code: "64040" }, { code: "64050" }, { code: "64100" }, { code: "64200" }, { code: "64300" }, { code: "64400" }] },
          { name: "San Pedro Garza García", postalCodes: [{ code: "66200" }, { code: "66210" }, { code: "66220" }, { code: "66230" }, { code: "66240" }, { code: "66250" }, { code: "66260" }] },
          { name: "San Nicolás de los Garza", postalCodes: [{ code: "66400" }, { code: "66410" }, { code: "66420" }, { code: "66430" }, { code: "66440" }, { code: "66450" }] },
          { name: "Guadalupe", postalCodes: [{ code: "67100" }, { code: "67110" }, { code: "67120" }, { code: "67130" }, { code: "67140" }] },
          { name: "Apodaca", postalCodes: [{ code: "66600" }, { code: "66610" }, { code: "66620" }, { code: "66630" }, { code: "66640" }] },
          { name: "Santa Catarina", postalCodes: [{ code: "66350" }, { code: "66360" }, { code: "66370" }, { code: "66380" }] },
          { name: "General Escobedo", postalCodes: [{ code: "66050" }, { code: "66060" }, { code: "66070" }, { code: "66080" }] },
        ],
      },
      {
        name: "Oaxaca",
        cities: [
          { name: "Oaxaca de Juárez", postalCodes: [{ code: "68000" }, { code: "68010" }, { code: "68020" }, { code: "68030" }, { code: "68040" }, { code: "68050" }, { code: "68100" }] },
          { name: "Salina Cruz", postalCodes: [{ code: "70600" }, { code: "70610" }, { code: "70620" }] },
          { name: "Juchitán de Zaragoza", postalCodes: [{ code: "70000" }, { code: "70010" }, { code: "70020" }] },
          { name: "Huatulco", postalCodes: [{ code: "70980" }, { code: "70989" }] },
        ],
      },
      {
        name: "Puebla",
        cities: [
          { name: "Puebla", postalCodes: [{ code: "72000" }, { code: "72010" }, { code: "72020" }, { code: "72030" }, { code: "72040" }, { code: "72050" }, { code: "72100" }, { code: "72200" }, { code: "72300" }, { code: "72400" }] },
          { name: "Tehuacán", postalCodes: [{ code: "75700" }, { code: "75710" }, { code: "75720" }, { code: "75730" }] },
          { name: "San Andrés Cholula", postalCodes: [{ code: "72810" }, { code: "72820" }, { code: "72830" }] },
          { name: "San Pedro Cholula", postalCodes: [{ code: "72760" }, { code: "72770" }, { code: "72780" }] },
          { name: "Atlixco", postalCodes: [{ code: "74200" }, { code: "74210" }, { code: "74220" }] },
        ],
      },
      {
        name: "Querétaro",
        cities: [
          { name: "Querétaro", postalCodes: [{ code: "76000" }, { code: "76010" }, { code: "76020" }, { code: "76030" }, { code: "76040" }, { code: "76050" }, { code: "76100" }, { code: "76200" }, { code: "76300" }] },
          { name: "San Juan del Río", postalCodes: [{ code: "76800" }, { code: "76810" }, { code: "76820" }, { code: "76830" }] },
          { name: "El Marqués", postalCodes: [{ code: "76240" }, { code: "76245" }, { code: "76246" }] },
          { name: "Corregidora", postalCodes: [{ code: "76900" }, { code: "76902" }, { code: "76903" }, { code: "76904" }] },
        ],
      },
      {
        name: "Quintana Roo",
        cities: [
          { name: "Cancún", postalCodes: [{ code: "77500" }, { code: "77501" }, { code: "77502" }, { code: "77503" }, { code: "77504" }, { code: "77505" }, { code: "77506" }, { code: "77507" }, { code: "77508" }, { code: "77509" }] },
          { name: "Playa del Carmen", postalCodes: [{ code: "77710" }, { code: "77712" }, { code: "77713" }, { code: "77714" }, { code: "77715" }, { code: "77716" }, { code: "77717" }, { code: "77718" }, { code: "77719" }, { code: "77720" }] },
          { name: "Chetumal", postalCodes: [{ code: "77000" }, { code: "77010" }, { code: "77020" }, { code: "77030" }, { code: "77040" }] },
          { name: "Tulum", postalCodes: [{ code: "77780" }, { code: "77785" }, { code: "77790" }] },
          { name: "Cozumel", postalCodes: [{ code: "77600" }, { code: "77610" }, { code: "77620" }] },
        ],
      },
      {
        name: "San Luis Potosí",
        cities: [
          { name: "San Luis Potosí", postalCodes: [{ code: "78000" }, { code: "78010" }, { code: "78020" }, { code: "78030" }, { code: "78040" }, { code: "78050" }, { code: "78100" }, { code: "78200" }, { code: "78300" }] },
          { name: "Soledad de Graciano Sánchez", postalCodes: [{ code: "78430" }, { code: "78431" }, { code: "78432" }, { code: "78433" }] },
          { name: "Ciudad Valles", postalCodes: [{ code: "79000" }, { code: "79010" }, { code: "79020" }] },
        ],
      },
      {
        name: "Sinaloa",
        cities: [
          { name: "Culiacán", postalCodes: [{ code: "80000" }, { code: "80010" }, { code: "80020" }, { code: "80030" }, { code: "80040" }, { code: "80050" }, { code: "80100" }, { code: "80200" }, { code: "80300" }] },
          { name: "Mazatlán", postalCodes: [{ code: "82000" }, { code: "82010" }, { code: "82020" }, { code: "82030" }, { code: "82040" }, { code: "82100" }, { code: "82200" }] },
          { name: "Los Mochis", postalCodes: [{ code: "81200" }, { code: "81210" }, { code: "81220" }, { code: "81230" }, { code: "81240" }] },
        ],
      },
      {
        name: "Sonora",
        cities: [
          { name: "Hermosillo", postalCodes: [{ code: "83000" }, { code: "83010" }, { code: "83020" }, { code: "83030" }, { code: "83040" }, { code: "83050" }, { code: "83100" }, { code: "83200" }, { code: "83300" }] },
          { name: "Ciudad Obregón", postalCodes: [{ code: "85000" }, { code: "85010" }, { code: "85020" }, { code: "85030" }, { code: "85040" }] },
          { name: "Nogales", postalCodes: [{ code: "84000" }, { code: "84010" }, { code: "84020" }, { code: "84030" }] },
          { name: "San Luis Río Colorado", postalCodes: [{ code: "83440" }, { code: "83449" }] },
          { name: "Guaymas", postalCodes: [{ code: "85400" }, { code: "85410" }, { code: "85420" }] },
        ],
      },
      {
        name: "Tabasco",
        cities: [
          { name: "Villahermosa", postalCodes: [{ code: "86000" }, { code: "86010" }, { code: "86020" }, { code: "86030" }, { code: "86040" }, { code: "86050" }, { code: "86100" }, { code: "86200" }] },
          { name: "Cárdenas", postalCodes: [{ code: "86500" }, { code: "86510" }, { code: "86520" }] },
          { name: "Comalcalco", postalCodes: [{ code: "86300" }, { code: "86310" }, { code: "86320" }] },
        ],
      },
      {
        name: "Tamaulipas",
        cities: [
          { name: "Tampico", postalCodes: [{ code: "89000" }, { code: "89010" }, { code: "89020" }, { code: "89030" }, { code: "89040" }, { code: "89100" }, { code: "89200" }] },
          { name: "Ciudad Victoria", postalCodes: [{ code: "87000" }, { code: "87010" }, { code: "87020" }, { code: "87030" }, { code: "87040" }] },
          { name: "Reynosa", postalCodes: [{ code: "88500" }, { code: "88510" }, { code: "88520" }, { code: "88530" }, { code: "88540" }] },
          { name: "Matamoros", postalCodes: [{ code: "87300" }, { code: "87310" }, { code: "87320" }, { code: "87330" }, { code: "87340" }] },
          { name: "Nuevo Laredo", postalCodes: [{ code: "88000" }, { code: "88010" }, { code: "88020" }, { code: "88030" }] },
          { name: "Ciudad Madero", postalCodes: [{ code: "89440" }, { code: "89450" }, { code: "89460" }] },
        ],
      },
      {
        name: "Tlaxcala",
        cities: [
          { name: "Tlaxcala", postalCodes: [{ code: "90000" }, { code: "90010" }, { code: "90020" }, { code: "90030" }, { code: "90040" }] },
          { name: "Apizaco", postalCodes: [{ code: "90300" }, { code: "90310" }, { code: "90320" }] },
          { name: "Huamantla", postalCodes: [{ code: "90500" }, { code: "90510" }, { code: "90520" }] },
        ],
      },
      {
        name: "Veracruz",
        cities: [
          { name: "Veracruz", postalCodes: [{ code: "91700" }, { code: "91710" }, { code: "91720" }, { code: "91730" }, { code: "91740" }, { code: "91750" }, { code: "91800" }, { code: "91900" }] },
          { name: "Xalapa", postalCodes: [{ code: "91000" }, { code: "91010" }, { code: "91020" }, { code: "91030" }, { code: "91040" }, { code: "91050" }, { code: "91100" }] },
          { name: "Coatzacoalcos", postalCodes: [{ code: "96400" }, { code: "96410" }, { code: "96420" }, { code: "96430" }, { code: "96440" }] },
          { name: "Córdoba", postalCodes: [{ code: "94500" }, { code: "94510" }, { code: "94520" }, { code: "94530" }] },
          { name: "Orizaba", postalCodes: [{ code: "94300" }, { code: "94310" }, { code: "94320" }, { code: "94330" }] },
          { name: "Boca del Río", postalCodes: [{ code: "94290" }, { code: "94294" }, { code: "94298" }] },
          { name: "Poza Rica", postalCodes: [{ code: "93230" }, { code: "93240" }, { code: "93250" }] },
        ],
      },
      {
        name: "Yucatán",
        cities: [
          { name: "Mérida", postalCodes: [{ code: "97000" }, { code: "97010" }, { code: "97020" }, { code: "97030" }, { code: "97040" }, { code: "97050" }, { code: "97100" }, { code: "97200" }, { code: "97300" }] },
          { name: "Valladolid", postalCodes: [{ code: "97780" }, { code: "97783" }, { code: "97784" }] },
          { name: "Progreso", postalCodes: [{ code: "97320" }, { code: "97330" }] },
          { name: "Tizimín", postalCodes: [{ code: "97700" }, { code: "97710" }] },
        ],
      },
      {
        name: "Zacatecas",
        cities: [
          { name: "Zacatecas", postalCodes: [{ code: "98000" }, { code: "98010" }, { code: "98020" }, { code: "98030" }, { code: "98040" }, { code: "98050" }, { code: "98060" }] },
          { name: "Guadalupe", postalCodes: [{ code: "98600" }, { code: "98610" }, { code: "98620" }] },
          { name: "Fresnillo", postalCodes: [{ code: "99000" }, { code: "99010" }, { code: "99020" }] },
        ],
      },
    ],
  },
  {
    code: "US",
    name: "Estados Unidos",
    states: [
      {
        name: "California",
        cities: [
          { name: "Los Angeles", postalCodes: [{ code: "90001" }, { code: "90002" }, { code: "90003" }, { code: "90004" }, { code: "90005" }] },
          { name: "San Francisco", postalCodes: [{ code: "94102" }, { code: "94103" }, { code: "94104" }, { code: "94105" }] },
          { name: "San Diego", postalCodes: [{ code: "92101" }, { code: "92102" }, { code: "92103" }, { code: "92104" }] },
          { name: "San Jose", postalCodes: [{ code: "95101" }, { code: "95102" }, { code: "95103" }] },
        ],
      },
      {
        name: "Texas",
        cities: [
          { name: "Houston", postalCodes: [{ code: "77001" }, { code: "77002" }, { code: "77003" }, { code: "77004" }] },
          { name: "Dallas", postalCodes: [{ code: "75201" }, { code: "75202" }, { code: "75203" }, { code: "75204" }] },
          { name: "Austin", postalCodes: [{ code: "78701" }, { code: "78702" }, { code: "78703" }, { code: "78704" }] },
          { name: "San Antonio", postalCodes: [{ code: "78201" }, { code: "78202" }, { code: "78203" }, { code: "78204" }] },
        ],
      },
      {
        name: "Florida",
        cities: [
          { name: "Miami", postalCodes: [{ code: "33101" }, { code: "33102" }, { code: "33109" }, { code: "33125" }] },
          { name: "Orlando", postalCodes: [{ code: "32801" }, { code: "32802" }, { code: "32803" }, { code: "32804" }] },
          { name: "Tampa", postalCodes: [{ code: "33601" }, { code: "33602" }, { code: "33603" }, { code: "33604" }] },
        ],
      },
      {
        name: "New York",
        cities: [
          { name: "New York City", postalCodes: [{ code: "10001" }, { code: "10002" }, { code: "10003" }, { code: "10004" }] },
          { name: "Buffalo", postalCodes: [{ code: "14201" }, { code: "14202" }, { code: "14203" }] },
        ],
      },
      {
        name: "Arizona",
        cities: [
          { name: "Phoenix", postalCodes: [{ code: "85001" }, { code: "85002" }, { code: "85003" }, { code: "85004" }] },
          { name: "Tucson", postalCodes: [{ code: "85701" }, { code: "85702" }, { code: "85703" }, { code: "85704" }] },
        ],
      },
    ],
  },
  {
    code: "ES",
    name: "España",
    states: [
      {
        name: "Madrid",
        cities: [
          { name: "Madrid", postalCodes: [{ code: "28001" }, { code: "28002" }, { code: "28003" }, { code: "28004" }, { code: "28005" }] },
          { name: "Alcobendas", postalCodes: [{ code: "28100" }, { code: "28108" }] },
          { name: "Getafe", postalCodes: [{ code: "28901" }, { code: "28902" }, { code: "28903" }] },
        ],
      },
      {
        name: "Cataluña",
        cities: [
          { name: "Barcelona", postalCodes: [{ code: "08001" }, { code: "08002" }, { code: "08003" }, { code: "08004" }, { code: "08005" }] },
          { name: "Hospitalet de Llobregat", postalCodes: [{ code: "08901" }, { code: "08902" }, { code: "08903" }] },
        ],
      },
      {
        name: "Andalucía",
        cities: [
          { name: "Sevilla", postalCodes: [{ code: "41001" }, { code: "41002" }, { code: "41003" }, { code: "41004" }] },
          { name: "Málaga", postalCodes: [{ code: "29001" }, { code: "29002" }, { code: "29003" }, { code: "29004" }] },
        ],
      },
    ],
  },
  {
    code: "CO",
    name: "Colombia",
    states: [
      {
        name: "Cundinamarca",
        cities: [
          { name: "Bogotá", postalCodes: [{ code: "110111" }, { code: "110121" }, { code: "110131" }, { code: "110141" }] },
          { name: "Soacha", postalCodes: [{ code: "250051" }, { code: "250052" }] },
        ],
      },
      {
        name: "Antioquia",
        cities: [
          { name: "Medellín", postalCodes: [{ code: "050001" }, { code: "050002" }, { code: "050003" }, { code: "050004" }] },
          { name: "Envigado", postalCodes: [{ code: "055420" }, { code: "055421" }] },
        ],
      },
      {
        name: "Valle del Cauca",
        cities: [
          { name: "Cali", postalCodes: [{ code: "760001" }, { code: "760002" }, { code: "760003" }, { code: "760004" }] },
          { name: "Palmira", postalCodes: [{ code: "763531" }, { code: "763532" }] },
        ],
      },
    ],
  },
  {
    code: "AR",
    name: "Argentina",
    states: [
      {
        name: "Buenos Aires",
        cities: [
          { name: "Buenos Aires", postalCodes: [{ code: "C1000" }, { code: "C1001" }, { code: "C1002" }, { code: "C1003" }] },
          { name: "La Plata", postalCodes: [{ code: "B1900" }, { code: "B1902" }] },
          { name: "Mar del Plata", postalCodes: [{ code: "B7600" }, { code: "B7602" }] },
        ],
      },
      {
        name: "Córdoba",
        cities: [
          { name: "Córdoba", postalCodes: [{ code: "X5000" }, { code: "X5001" }, { code: "X5002" }] },
          { name: "Villa Carlos Paz", postalCodes: [{ code: "X5152" }] },
        ],
      },
      {
        name: "Santa Fe",
        cities: [
          { name: "Rosario", postalCodes: [{ code: "S2000" }, { code: "S2001" }, { code: "S2002" }] },
          { name: "Santa Fe", postalCodes: [{ code: "S3000" }, { code: "S3001" }] },
        ],
      },
    ],
  },
  {
    code: "CL",
    name: "Chile",
    states: [
      {
        name: "Región Metropolitana",
        cities: [
          { name: "Santiago", postalCodes: [{ code: "8320000" }, { code: "8330000" }, { code: "8340000" }] },
          { name: "Providencia", postalCodes: [{ code: "7500000" }] },
          { name: "Las Condes", postalCodes: [{ code: "7550000" }] },
        ],
      },
      {
        name: "Valparaíso",
        cities: [
          { name: "Valparaíso", postalCodes: [{ code: "2340000" }] },
          { name: "Viña del Mar", postalCodes: [{ code: "2520000" }] },
        ],
      },
    ],
  },
]

// Helper functions
export function getCountries(): { code: string; name: string }[] {
  return locationData.map((country) => ({
    code: country.code,
    name: country.name,
  }))
}

export function getStatesByCountry(countryCode: string): string[] {
  const country = locationData.find((c) => c.code === countryCode)
  if (!country) return []
  return country.states.map((state) => state.name).sort()
}

export function getCitiesByState(countryCode: string, stateName: string): string[] {
  const country = locationData.find((c) => c.code === countryCode)
  if (!country) return []
  const state = country.states.find((s) => s.name === stateName)
  if (!state) return []
  return state.cities.map((city) => city.name).sort()
}

export function getPostalCodesByCity(countryCode: string, stateName: string, cityName: string): string[] {
  const country = locationData.find((c) => c.code === countryCode)
  if (!country) return []
  const state = country.states.find((s) => s.name === stateName)
  if (!state) return []
  const city = state.cities.find((c) => c.name === cityName)
  if (!city) return []
  return city.postalCodes.map((pc) => pc.code).sort()
}

// Find country code by country name
export function getCountryCodeByName(countryName: string): string | undefined {
  const country = locationData.find((c) => c.name === countryName)
  return country?.code
}

// Find state by name in a country
export function findStateInCountry(countryCode: string, stateName: string): boolean {
  const states = getStatesByCountry(countryCode)
  return states.includes(stateName)
}

// Find city by name in a state
export function findCityInState(countryCode: string, stateName: string, cityName: string): boolean {
  const cities = getCitiesByState(countryCode, stateName)
  return cities.includes(cityName)
}
