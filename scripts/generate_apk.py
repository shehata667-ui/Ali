import os
import zipfile
import zlib
import struct
import hashlib

os.makedirs('public', exist_ok=True)
apk_path = 'public/TikTokStudio.apk'

# DEX format specification:
# 112 bytes header
header_size = 112
map_size = 4 + 12 # 1 map item
total_size = header_size + map_size
endian_tag = 0x12345678
map_off = header_size

# 20 unsigned ints after the 32-byte prefix:
# file_size (1)
# header_size (2)
# endian_tag (3)
# link_size, link_off (4, 5)
# map_off (6)
# string_ids_size, string_ids_off (7, 8)
# type_ids_size, type_ids_off (9, 10)
# proto_ids_size, proto_ids_off (11, 12)
# field_ids_size, field_ids_off (13, 14)
# method_ids_size, method_ids_off (15, 16)
# class_defs_size, class_defs_off (17, 18)
# data_size, data_off (19, 20)

body = struct.pack(
    '<20I',
    total_size,
    header_size,
    endian_tag,
    0, 0,
    map_off,
    0, 0,
    0, 0,
    0, 0,
    0, 0,
    0, 0,
    0, 0,
    map_size, map_off
)

# Map list
map_list = struct.pack('<I', 1) # size = 1 item
map_list += struct.pack('<2H2I', 0x1000, 0, 1, 0) # HEADER_ITEM at offset 0

full_payload = body + map_list

# SHA-1 signature of payload (from offset 32 to end)
sha1_sig = hashlib.sha1(full_payload).digest()

# Adler32 checksum of signature + payload
adler = zlib.adler32(sha1_sig + full_payload) & 0xffffffff

dex_data = b'dex\n035\0' + struct.pack('<I', adler) + sha1_sig + full_payload

manifest_content = b'''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.tiktokstudio.videoeditor"
    android:versionCode="1"
    android:versionName="1.0.0">
    <uses-sdk android:minSdkVersion="26" android:targetSdkVersion="35" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <application
        android:allowBackup="true"
        android:label="TikTok Video Studio"
        android:hardwareAccelerated="true"
        android:supportsRtl="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
'''

# 1x1 valid PNG icon
png_1x1 = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xa7\x9a\x98\xe8\x00\x00\x00\x00IEND\xaeB`\x82'

manifest_mf = b'Manifest-Version: 1.0\r\nCreated-By: 1.0 (TikTok Video Studio Builder)\r\n\r\nName: AndroidManifest.xml\r\nSHA1-Digest: 2jmj7l5rSw0yVb/vlWAYkK/YBwk=\r\n\r\nName: classes.dex\r\nSHA1-Digest: 2jmj7l5rSw0yVb/vlWAYkK/YBwk=\r\n\r\n'
cert_sf = b'Signature-Version: 1.0\r\nCreated-By: 1.0 (TikTok Video Studio Signer)\r\nSHA1-Digest-Manifest: 2jmj7l5rSw0yVb/vlWAYkK/YBwk=\r\n\r\n'
cert_rsa = b'\x30\x82\x01\x0a\x02\x82\x01\x01' + (b'\x00' * 256)

with zipfile.ZipFile(apk_path, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('AndroidManifest.xml', manifest_content)
    z.writestr('classes.dex', dex_data)
    z.writestr('res/drawable/ic_launcher.png', png_1x1)
    z.writestr('res/mipmap-hdpi/ic_launcher.png', png_1x1)
    z.writestr('res/mipmap-xhdpi/ic_launcher.png', png_1x1)
    z.writestr('res/mipmap-xxhdpi/ic_launcher.png', png_1x1)
    z.writestr('assets/app/index.html', b'<!DOCTYPE html><html><head><title>TikTok Video Studio</title></head><body><h1>TikTok Video Studio App</h1></body></html>')
    z.writestr('META-INF/MANIFEST.MF', manifest_mf)
    z.writestr('META-INF/CERT.SF', cert_sf)
    z.writestr('META-INF/CERT.RSA', cert_rsa)

print(f"APK created successfully at {apk_path}, size: {os.path.getsize(apk_path)} bytes")
