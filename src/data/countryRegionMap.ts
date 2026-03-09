// Maps ISO 3166-1 numeric country codes to culinary region IDs
// These codes match the `id` field in world-atlas countries-110m.json
export const countryRegionMap: Record<string, string> = {
  // East Asia
  '156': 'east-asia', // China
  '392': 'east-asia', // Japan
  '410': 'east-asia', // South Korea
  '408': 'east-asia', // North Korea
  '496': 'east-asia', // Mongolia
  '158': 'east-asia', // Taiwan

  // Southeast Asia
  '764': 'southeast-asia', // Thailand
  '704': 'southeast-asia', // Vietnam
  '360': 'southeast-asia', // Indonesia
  '458': 'southeast-asia', // Malaysia
  '608': 'southeast-asia', // Philippines
  '104': 'southeast-asia', // Myanmar
  '116': 'southeast-asia', // Cambodia
  '418': 'southeast-asia', // Laos
  '702': 'southeast-asia', // Singapore
  '096': 'southeast-asia', // Brunei
  '626': 'southeast-asia', // Timor-Leste

  // South Asia
  '356': 'south-asia', // India
  '586': 'south-asia', // Pakistan
  '050': 'south-asia', // Bangladesh
  '144': 'south-asia', // Sri Lanka
  '524': 'south-asia', // Nepal
  '064': 'south-asia', // Bhutan
  '004': 'south-asia', // Afghanistan

  // Middle East
  '792': 'middle-east', // Turkey
  '364': 'middle-east', // Iran
  '368': 'middle-east', // Iraq
  '682': 'middle-east', // Saudi Arabia
  '376': 'middle-east', // Israel
  '422': 'middle-east', // Lebanon
  '400': 'middle-east', // Jordan
  '760': 'middle-east', // Syria
  '887': 'middle-east', // Yemen
  '784': 'middle-east', // UAE
  '512': 'middle-east', // Oman
  '414': 'middle-east', // Kuwait
  '634': 'middle-east', // Qatar
  '048': 'middle-east', // Bahrain
  '196': 'middle-east', // Cyprus
  '268': 'middle-east', // Georgia
  '051': 'middle-east', // Armenia
  '031': 'middle-east', // Azerbaijan

  // Mediterranean
  '380': 'mediterranean', // Italy
  '300': 'mediterranean', // Greece
  '724': 'mediterranean', // Spain
  '620': 'mediterranean', // Portugal
  '191': 'mediterranean', // Croatia
  '705': 'mediterranean', // Slovenia
  '499': 'mediterranean', // Montenegro
  '008': 'mediterranean', // Albania
  '807': 'mediterranean', // North Macedonia

  // Western Europe
  '250': 'west-europe', // France
  '276': 'west-europe', // Germany
  '056': 'west-europe', // Belgium
  '528': 'west-europe', // Netherlands
  '040': 'west-europe', // Austria
  '756': 'west-europe', // Switzerland
  '442': 'west-europe', // Luxembourg
  '826': 'west-europe', // United Kingdom
  '372': 'west-europe', // Ireland
  '208': 'west-europe', // Denmark
  '752': 'west-europe', // Sweden
  '578': 'west-europe', // Norway
  '246': 'west-europe', // Finland
  '352': 'west-europe', // Iceland

  // Eastern Europe
  '643': 'east-europe', // Russia
  '616': 'east-europe', // Poland
  '804': 'east-europe', // Ukraine
  '348': 'east-europe', // Hungary
  '203': 'east-europe', // Czech Republic
  '642': 'east-europe', // Romania
  '688': 'east-europe', // Serbia
  '100': 'east-europe', // Bulgaria
  '703': 'east-europe', // Slovakia
  '112': 'east-europe', // Belarus
  '498': 'east-europe', // Moldova
  '440': 'east-europe', // Lithuania
  '428': 'east-europe', // Latvia
  '233': 'east-europe', // Estonia
  '070': 'east-europe', // Bosnia and Herzegovina

  // North Africa
  '504': 'north-africa', // Morocco
  '012': 'north-africa', // Algeria
  '788': 'north-africa', // Tunisia
  '434': 'north-africa', // Libya
  '818': 'north-africa', // Egypt
  '732': 'north-africa', // Western Sahara
  '729': 'north-africa', // Sudan
  '478': 'north-africa', // Mauritania

  // West Africa
  '566': 'west-africa', // Nigeria
  '288': 'west-africa', // Ghana
  '686': 'west-africa', // Senegal
  '384': 'west-africa', // Ivory Coast
  '466': 'west-africa', // Mali
  '120': 'west-africa', // Cameroon
  '854': 'west-africa', // Burkina Faso
  '562': 'west-africa', // Niger
  '324': 'west-africa', // Guinea
  '694': 'west-africa', // Sierra Leone
  '768': 'west-africa', // Togo
  '204': 'west-africa', // Benin
  '430': 'west-africa', // Liberia
  '270': 'west-africa', // Gambia
  '624': 'west-africa', // Guinea-Bissau

  // East & Southern Africa
  '231': 'east-africa', // Ethiopia
  '404': 'east-africa', // Kenya
  '834': 'east-africa', // Tanzania
  '710': 'east-africa', // South Africa
  '508': 'east-africa', // Mozambique
  '800': 'east-africa', // Uganda
  '646': 'east-africa', // Rwanda
  '180': 'east-africa', // DR Congo
  '178': 'east-africa', // Republic of Congo
  '024': 'east-africa', // Angola
  '894': 'east-africa', // Zambia
  '716': 'east-africa', // Zimbabwe
  '454': 'east-africa', // Malawi
  '516': 'east-africa', // Namibia
  '072': 'east-africa', // Botswana
  '450': 'east-africa', // Madagascar
  '706': 'east-africa', // Somalia
  '232': 'east-africa', // Eritrea
  '140': 'east-africa', // Central African Republic
  '148': 'east-africa', // Chad
  '226': 'east-africa', // Equatorial Guinea
  '266': 'east-africa', // Gabon
  '748': 'east-africa', // Eswatini
  '426': 'east-africa', // Lesotho
  '108': 'east-africa', // Burundi
  '728': 'east-africa', // South Sudan
  '262': 'east-africa', // Djibouti

  // Latin America
  '484': 'latin-america', // Mexico
  '076': 'latin-america', // Brazil
  '604': 'latin-america', // Peru
  '032': 'latin-america', // Argentina
  '170': 'latin-america', // Colombia
  '152': 'latin-america', // Chile
  '192': 'latin-america', // Cuba
  '862': 'latin-america', // Venezuela
  '218': 'latin-america', // Ecuador
  '068': 'latin-america', // Bolivia
  '600': 'latin-america', // Paraguay
  '858': 'latin-america', // Uruguay
  '591': 'latin-america', // Panama
  '188': 'latin-america', // Costa Rica
  '320': 'latin-america', // Guatemala
  '340': 'latin-america', // Honduras
  '222': 'latin-america', // El Salvador
  '558': 'latin-america', // Nicaragua
  '214': 'latin-america', // Dominican Republic
  '332': 'latin-america', // Haiti
  '328': 'latin-america', // Guyana
  '740': 'latin-america', // Suriname
  '084': 'latin-america', // Belize
  '044': 'latin-america', // Bahamas
  '388': 'latin-america', // Jamaica
  '780': 'latin-america', // Trinidad and Tobago

  // North America
  '840': 'north-america', // United States
  '124': 'north-america', // Canada

  // Oceania
  '036': 'oceania', // Australia
  '554': 'oceania', // New Zealand
  '598': 'southeast-asia', // Papua New Guinea
};
