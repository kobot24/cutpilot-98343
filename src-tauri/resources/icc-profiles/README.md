# ICC Color Profiles

This directory contains ICC color profiles bundled with the application.

## Included Profiles

### CMYK Profiles (Print)
- **ISOcoated_v2_eci.icc** - Standard European print (Fogra39)
- **ISOcoated_v2_300.icc** - European print with 300% ink limit
- **PSO_Coated_v3.icc** - PSO Coated v3 (Fogra51)
- **Fogra39.icc** - Fogra39 CMYK profile
- **USWebCoatedSWOP.icc** - US Web Coated SWOP v2

### RGB Profiles (Input)
- **sRGB.icc** - Standard RGB color space (sRGB IEC61966-2.1)
- **AdobeRGB1998.icc** - Adobe RGB (1998) wide gamut

## Where to Download ICC Profiles

### Free Sources

1. **European Color Initiative (ECI)**
   - URL: https://www.eci.org/downloads
   - Profiles: ISOcoated_v2_eci.icc, PSO_Coated_v3.icc
   - License: Free for use

2. **Adobe ICC Profiles**
   - URL: https://www.adobe.com/support/downloads/iccprofiles/iccprofiles_win.html
   - Profiles: sRGB.icc, AdobeRGB1998.icc
   - License: Free redistribution allowed

3. **International Color Consortium (ICC)**
   - URL: https://www.color.org/registry/index.xalter
   - Various standard profiles
   - License: Varies by profile

4. **Fogra Profiles**
   - URL: https://www.fogra.org/en/fogra-color-management/fogra-profiles
   - Profiles: Fogra39, Fogra51, etc.
   - License: Free for use (registration may be required)

### Installation

1. Download ICC profile files (.icc or .icm)
2. Place them in this directory (`src-tauri/resources/icc-profiles/`)
3. Rebuild the application

### Usage in Application

Profiles are automatically detected and listed in the UI dropdown:
- Embedded at build time via Tauri's resource bundling
- Accessible at runtime through `app_handle.path_resolver().resolve_resource()`
- Used by Ghostscript for CMYK conversion

## Profile Specifications

### ISOcoated_v2_eci.icc (Fogra39)
- Color Space: CMYK
- Target: Offset printing on coated paper
- Standard: ISO 12647-2:2004
- Total Ink Limit: 330%
- Black Start: 70%

### PSO_Coated_v3.icc (Fogra51)
- Color Space: CMYK
- Target: Process Standard Offset (PSO)
- Standard: ISO 12647-2:2013
- Total Ink Limit: 300%
- More modern than Fogra39

### sRGB.icc
- Color Space: RGB
- Standard: IEC 61966-2-1:1999
- Gamma: 2.2
- White Point: D65
- Usage: Standard RGB for web and digital displays

## File Size

Typical ICC profile sizes:
- CMYK profiles: 500 KB - 2 MB
- RGB profiles: 300 KB - 1 MB

## License Notes

Most standard ICC profiles (sRGB, ISOcoated, etc.) are freely available and redistributable.
Always check the specific license terms before bundling.

## Custom Profiles

Users can also upload their own ICC profiles through the application UI:
- Stored in browser localStorage (Base64 encoded)
- Not included in application bundle
- Persist across sessions
