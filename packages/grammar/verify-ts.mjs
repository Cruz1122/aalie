// Simple verification script to test TypeScript parser generation
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files that should exist
const expectedFiles = [
  './src/ts/LanguageLexer.ts',
  './src/ts/LanguageParser.ts',
  './src/ts/LanguageListener.ts',
  './src/ts/LanguageVisitor.ts'
];

console.log(' Verificando archivos TypeScript generados por ANTLR...\n');

let allFilesExist = true;

for (const file of expectedFiles) {
  const fullPath = path.resolve(__dirname, file);
  if (existsSync(fullPath)) {
    console.log(`${file} - existe`);
    
    // Check if file contains expected content
    try {
      const content = readFileSync(fullPath, 'utf8');
      const className = path.basename(file, '.ts');
      
      if (content.includes(`export class ${className}`)) {
        console.log(`   └── Contiene la clase ${className}`);
      } else {
        console.log(`   └── No contiene la clase esperada ${className}`);
      }
      
      if (content.includes('antlr4ts')) {
        console.log(`   └── Imports ANTLR4 detectados`);
      }
      
    } catch (readError) {
      console.log(`   └── Error leyendo archivo: ${readError.message}`);
    }
  } else {
    console.log(`${file} - no existe`);
    allFilesExist = false;
  }
}

// Check compiled JavaScript files
console.log('\n Verificando archivos JavaScript compilados...\n');

const compiledFiles = expectedFiles.map(f => f.replace('./src/ts/', './dist/').replace('.ts', '.js'));

for (const file of compiledFiles) {
  const fullPath = path.resolve(__dirname, file);
  if (existsSync(fullPath)) {
    console.log(`${file} - compilado correctamente`);
  } else {
    console.log(`${file} - no compilado`);
  }
}

if (allFilesExist) {
  console.log('\n Verificación exitosa: Todos los archivos TypeScript fueron generados correctamente');
  console.log('\n Para usar estos archivos en tu proyecto:');
  console.log('   - Usa import { LanguageLexer } from "@aa/grammar/src/ts/LanguageLexer" en TypeScript');
  console.log('   - O compila a JavaScript y usa los archivos en /dist/');
} else {
  console.log('\n Algunos archivos faltan. Ejecuta: npm run build');
  process.exit(1);
}