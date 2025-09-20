# 🐠 Fishial AI Integration - SeaSure App

This document explains how the Fishial AI fish detection API is integrated into the SeaSure app and how to switch between mock and live modes.

## 🚀 Quick Start

### Current Status: MOCK MODE (Demo Data)
- ✅ Mock API fully functional for development/testing
- ✅ Real API service implemented and ready
- ✅ Image compression optimized to prevent 413 errors
- ✅ Switch between mock/real modes with 1-line change

### To Use Real Fishial AI Detection:

1. **Open the configuration file:**
   ```
   services/fishialAPI.ts
   ```

2. **Find this line (around line 47):**
   ```typescript
   public readonly MOCK_MODE = true; // Set to false to use real API
   ```

3. **Change it to:**
   ```typescript
   public readonly MOCK_MODE = false; // Set to false to use real API
   ```

4. **Save and restart your app**
   - Your camera will now use real AI fish detection!

## 🔧 API Configuration

### Credentials (Already Configured)
```typescript
// In services/realFishialAPI.ts
private readonly API_KEY = 'b7fd36488de61c6b050a7550';
private readonly SECRET_KEY = '17492a8c3a76f363cef01efb964e2f0a';
```

### API Endpoints Used
```
Authentication: https://api.fishial.ai/v1/oauth2/token/
Image Upload: https://api.fishial.ai/v1/file/signed_upload_url/
Fish Recognition: https://api.fishial.ai/v1/image/fish_recognition/
```

## 📱 Testing the API

### Method 1: Using the Built-in Tester
1. Add the FishialAPITester component to any screen:
   ```typescript
   import FishialAPITester from '../components/FishialAPITester';
   
   // In your render method:
   <FishialAPITester />
   ```

### Method 2: Manual Testing
```typescript
import { fishialAPIService } from './services/fishialAPI';

// Test API connection
const result = await fishialAPIService.testAPIConnection();
console.log(result.message);
```

## 🏗️ Architecture

### Service Structure
```
services/
├── fishialAPI.ts        # Main service (routes mock/real)
├── realFishialAPI.ts    # Real API implementation
└── [other services...]
```

### Flow Diagram
```
📱 Camera Image → 🔄 Compression → 📡 API Service → 🐠 Fish Detection Results

MOCK MODE:  📱 → 🔄 → 🎭 Mock Data → 🐠
REAL MODE:  📱 → 🔄 → 🌐 Fishial API → 🐠
```

## 📊 API Usage Details

### Real API Flow (3 Steps)
1. **OAuth Authentication** - Gets access token (10 min expiry)
2. **Signed Upload URL** - Gets secure cloud storage URL
3. **Fish Recognition** - Uploads image and gets AI results

### Image Processing
- **Compression**: Automatically resizes to 600px max, 80% quality
- **Format**: JPEG with MD5 checksum for integrity
- **Size Limit**: Optimized to stay under API limits

### Response Format
```typescript
{
  success: boolean,
  data: [
    {
      species: "King Fish",
      confidence: 0.92,
      scientificName: "Scomberomorus commerson",
      commonNames: ["Spanish Mackerel"],
      habitat: "Indo-Pacific coastal waters",
      size: "Up to 240cm",
      characteristics: ["Streamlined body", "Sharp teeth"],
      edible: true,
      conservationStatus: "Least Concern"
    }
  ],
  requestId: "unique_id",
  processingTime: 2.1,
  timestamp: 1234567890
}
```

## 🔄 Switching Between Modes

### MOCK MODE (Default)
- **Purpose**: Development, testing, offline usage
- **Data**: Predefined fish species with realistic details
- **Benefits**: No API calls, no internet required, instant results
- **Use When**: Development, demonstrations, offline scenarios

### LIVE MODE (Real API)
- **Purpose**: Production use with real AI detection
- **Data**: Live results from Fishial AI service
- **Benefits**: Actual fish recognition, up-to-date species data
- **Requirements**: Internet connection, valid API credentials

## 🛠️ Troubleshooting

### Common Issues

#### "413 Request Entity Too Large"
- ✅ **Fixed**: Automatic image compression implemented
- Images are resized to 600px max, 80% quality before upload

#### "API Connection Failed"
- Check internet connection
- Verify API credentials in `realFishialAPI.ts`
- Test with `fishialAPIService.testAPIConnection()`

#### "Fish Not Detected"
- Ensure image is clear and well-lit
- Fish should be prominently visible in frame
- Try different angles or lighting conditions

### Debug Mode
Enable console logging in `realFishialAPI.ts`:
```typescript
// Uncomment debug lines for detailed API logs
console.log('🔍 Debug: API request details...');
```

## 📝 Development Notes

### Dependencies Added
```json
{
  "expo-crypto": "^13.0.2",  // For MD5 checksums
  "expo-image-manipulator": "^12.0.5"  // For image compression
}
```

### API Rate Limits
- Standard limits apply based on your Fishial AI plan
- Token caching reduces authentication calls
- Image compression optimizes upload efficiency

### Future Enhancements
- [ ] Offline cache for detected species
- [ ] Batch processing for multiple images
- [ ] Species confidence threshold settings
- [ ] Regional fish database preferences

## 📞 Support

### API Issues
- Check Fishial AI documentation: https://api.fishial.ai/docs/
- Verify API key status and limits

### App Integration Issues
- Review service logs in React Native debugger
- Test with FishialAPITester component
- Check network connectivity

---

**Ready to use real AI fish detection? Just change `MOCK_MODE = false` in `services/fishialAPI.ts`! 🐠✨**