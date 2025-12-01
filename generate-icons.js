#!/usr/bin/env node

// Script to help set up Aaranya app icons
console.log('Setting up Aaranya app icons...');
console.log('Please run the following commands in your project directory:');
console.log('');
console.log('1. Install capacitor assets tool:');
console.log('   npm install @capacitor/assets --save-dev');
console.log('');
console.log('2. Generate the Android icons:');
console.log('   npx capacitor-assets generate android --iconBackgroundColor FFFFFF --iconForegroundFile ./public/icons/app-icon.svg');
console.log('');
console.log('3. Sync the changes to native projects:');
console.log('   npx cap sync');
console.log('');
console.log('After this, your Android app will have the Aaranya logo as the app icon.');
console.log('');
console.log('If the above command fails, make sure your icon is square (recommended 1024x1024) and in SVG or PNG format.');