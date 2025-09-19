import { Platform } from 'react-native'
import MapScreenSimple from './MapScreenSimple'

// Temporarily use simple version for testing
export default MapScreenSimple

// Platform-specific component import (commented out for testing)
// const MapScreenComponent = Platform.OS === 'web' 
//   ? require('./MapScreen.web').default
//   : require('./MapScreen.native').default

// export default MapScreenComponent
